const test = require('node:test');
const assert = require('node:assert/strict');
const { io: createClient } = require('socket.io-client');

process.env.GAME_TICK_MS = '10';

const { rooms, startServer, stopServer } = require('../server');

function waitFor(socket, event, predicate = () => true, timeoutMs = 2000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.off(event, handler);
            reject(new Error(`Timed out waiting for ${event}`));
        }, timeoutMs);

        function handler(payload) {
            if (!predicate(payload)) return;
            clearTimeout(timeout);
            socket.off(event, handler);
            resolve(payload);
        }

        socket.on(event, handler);
    });
}

function wait(timeoutMs) {
    return new Promise(resolve => setTimeout(resolve, timeoutMs));
}

async function connectClient(url) {
    const client = createClient(url, {
        autoConnect: false,
        forceNew: true,
        transports: ['websocket']
    });
    const connected = waitFor(client, 'connect');
    client.connect();
    await connected;
    return client;
}

async function createFixture(t) {
    const address = await startServer(0, '127.0.0.1');
    const url = `http://127.0.0.1:${address.port}`;
    const clients = [];

    t.after(async () => {
        clients.forEach(client => client.close());
        await stopServer();
    });

    return {
        url,
        async connect() {
            const client = await connectClient(url);
            clients.push(client);
            return client;
        }
    };
}

async function createRoom(client, roomId, mode, maxPlayers) {
    const roomData = waitFor(client, 'roomData');
    client.emit('createRoom', { roomId, mode, maxPlayers });
    return roomData;
}

async function joinRoom(client, roomId) {
    const roomData = waitFor(client, 'roomData');
    client.emit('joinRoom', roomId);
    return roomData;
}

async function selectFirstTheme(client, themes) {
    const updated = waitFor(client, 'themeUpdated');
    client.emit('chooseTheme', themes[0]);
    return updated;
}

test('health check and configured multiplayer lifecycle', async (t) => {
    const fixture = await createFixture(t);
    const healthResponse = await fetch(`${fixture.url}/health`);
    assert.equal(healthResponse.status, 200);
    assert.deepEqual(await healthResponse.json(), { status: 'ok' });

    const host = await fixture.connect();
    const guest = await fixture.connect();
    const hostData = await createRoom(host, 'integration-room', 'multiplayer', 4);

    assert.equal(hostData.mode, 'multiplayer');
    assert.equal(hostData.maxPlayers, 4);
    assert.ok(hostData.themes.length > 0);
    assert.equal(rooms['integration-room'].players[0].role, 'P1');

    await selectFirstTheme(host, hostData.themes);
    await joinRoom(guest, 'integration-room');

    const originalTheme = rooms['integration-room'].theme;
    guest.emit('chooseTheme', hostData.themes.find(theme => theme !== originalTheme));
    await wait(20);
    assert.equal(rooms['integration-room'].theme, originalTheme);

    const duplicateJoinError = waitFor(host, 'roomError');
    host.emit('joinRoom', 'another-room');
    assert.equal(await duplicateJoinError, 'Vous avez déjà rejoint un salon');
    assert.equal(rooms['another-room'], undefined);

    const everyoneReady = waitFor(
        host,
        'playerReady',
        players => players.length === 2 && players.every(player => player.ready)
    );
    host.emit('setReady');
    guest.emit('setReady');
    await everyoneReady;

    guest.emit('startGame');
    await wait(20);
    assert.equal(rooms['integration-room'].gameState, 'waiting');

    const hostStarted = waitFor(host, 'gameStarted');
    const guestStarted = waitFor(guest, 'gameStarted');
    const finished = waitFor(host, 'gameFinished');
    host.emit('startGame');
    await Promise.all([hostStarted, guestStarted]);
    assert.equal(rooms['integration-room'].gameState, 'playing');

    host.emit('updateProgress', null);
    host.emit('updateProgress', { progress: 'invalid', wpm: 80, accuracy: 100, currentWordIndex: 1 });
    host.emit('updateProgress', { progress: 50, wpm: 301, accuracy: 100, currentWordIndex: 1 });
    await wait(20);
    assert.equal(rooms['integration-room'].players[0].progress, 0);

    host.emit('updateProgress', { progress: 50, wpm: 80, accuracy: 98, currentWordIndex: 1 });
    await wait(20);
    assert.equal(rooms['integration-room'].players[0].progress, 50);

    assert.equal((await finished).length, 2);
    assert.equal(rooms['integration-room'].gameState, 'finished');

    const replayData = waitFor(guest, 'roomData');
    host.emit('playAgain');
    const replay = await replayData;
    assert.equal(replay.mode, 'multiplayer');
    assert.equal(replay.maxPlayers, 4);
    assert.equal(replay.text, null);
    assert.equal(replay.currentTheme, null);

    const hostPromoted = waitFor(
        guest,
        'playerLeft',
        players => players.length === 1 && players[0].role === 'P1'
    );
    host.close();
    await hostPromoted;

    const promotedHostTheme = waitFor(guest, 'themeUpdated');
    guest.emit('chooseTheme', hostData.themes[0]);
    assert.equal((await promotedHostTheme).theme, hostData.themes[0]);
});

test('room creation validates configuration and join intent', async (t) => {
    const fixture = await createFixture(t);
    const creator = await fixture.connect();

    const invalidConfigurations = [
        { roomId: 'invalid-a', mode: 'multiplayer' },
        { roomId: 'invalid-b', mode: 'multiplayer', maxPlayers: 2.5 },
        { roomId: 'invalid-c', mode: 'multiplayer', maxPlayers: 1 },
        { roomId: 'invalid-d', mode: 'multiplayer', maxPlayers: 7 },
        { roomId: 'invalid-e', mode: 'solo', maxPlayers: 2 }
    ];

    for (const configuration of invalidConfigurations) {
        const error = waitFor(creator, 'roomError');
        creator.emit('createRoom', configuration);
        assert.equal(await error, 'Configuration de partie non valide');
        assert.equal(rooms[configuration.roomId], undefined);
    }

    const soloData = await createRoom(creator, 'private-solo', 'solo', 1);
    assert.equal(soloData.mode, 'solo');
    assert.equal(soloData.maxPlayers, 1);

    const collisionClient = await fixture.connect();
    const collisionError = waitFor(collisionClient, 'roomError');
    collisionClient.emit('createRoom', {
        roomId: 'private-solo',
        mode: 'multiplayer',
        maxPlayers: 2
    });
    assert.equal(await collisionError, 'Ce salon existe déjà');

    const expiredClient = await fixture.connect();
    const expiredError = waitFor(expiredClient, 'roomError');
    expiredClient.emit('joinRoom', 'missing-room');
    assert.equal(await expiredError, 'Ce salon n’existe plus');
    assert.equal(rooms['missing-room'], undefined);

    const soloGuest = await fixture.connect();
    const soloPrivateError = waitFor(soloGuest, 'roomError');
    soloGuest.emit('joinRoom', 'private-solo');
    assert.equal(await soloPrivateError, 'Cette partie solo est privée');
    assert.equal(rooms['private-solo'].players.length, 1);
});

test('each multiplayer capacity from two through six is enforced', async (t) => {
    const fixture = await createFixture(t);

    for (let capacity = 2; capacity <= 6; capacity += 1) {
        const roomId = `capacity-${capacity}`;
        const host = await fixture.connect();
        const data = await createRoom(host, roomId, 'multiplayer', capacity);
        assert.equal(data.maxPlayers, capacity);

        for (let index = 1; index < capacity; index += 1) {
            const participant = await fixture.connect();
            await joinRoom(participant, roomId);
        }

        const overflow = await fixture.connect();
        const fullError = waitFor(overflow, 'roomError');
        overflow.emit('joinRoom', roomId);
        assert.equal(await fullError, 'Le salon est complet');
        assert.equal(rooms[roomId].players.length, capacity);
    }
});

test('multiplayer start requires minimum attendance and unanimous readiness', async (t) => {
    const fixture = await createFixture(t);

    const singleHost = await fixture.connect();
    const singleData = await createRoom(singleHost, 'minimum-room', 'multiplayer', 2);
    await selectFirstTheme(singleHost, singleData.themes);
    const singleReady = waitFor(singleHost, 'playerReady', players => players[0]?.ready);
    singleHost.emit('setReady');
    await singleReady;
    singleHost.emit('startGame');
    await wait(20);
    assert.equal(rooms['minimum-room'].gameState, 'waiting');

    const host = await fixture.connect();
    const guest = await fixture.connect();
    const lateReadyPlayer = await fixture.connect();
    const lateJoiner = await fixture.connect();
    const roomData = await createRoom(host, 'readiness-room', 'multiplayer', 4);
    await selectFirstTheme(host, roomData.themes);
    await joinRoom(guest, 'readiness-room');

    const initiallyReady = waitFor(host, 'playerReady', players => players.length === 2 && players.every(player => player.ready));
    host.emit('setReady');
    guest.emit('setReady');
    await initiallyReady;

    const joinedData = await joinRoom(lateReadyPlayer, 'readiness-room');
    assert.equal(joinedData.players.length, 3);
    assert.equal(joinedData.players[2].ready, false);

    host.emit('startGame');
    await wait(20);
    assert.equal(rooms['readiness-room'].gameState, 'waiting');

    const allReady = waitFor(host, 'playerReady', players => players.length === 3 && players.every(player => player.ready));
    lateReadyPlayer.emit('setReady');
    await allReady;

    guest.emit('startGame');
    await wait(20);
    assert.equal(rooms['readiness-room'].gameState, 'waiting');

    const countdown = waitFor(host, 'countdown', count => count === 3);
    host.emit('startGame');
    await countdown;
    assert.equal(rooms['readiness-room'].gameState, 'countdown');

    const startedError = waitFor(lateJoiner, 'roomError');
    lateJoiner.emit('joinRoom', 'readiness-room');
    assert.equal(await startedError, 'Cette partie a déjà commencé');
    assert.equal(rooms['readiness-room'].players.length, 3);
});

test('only the host can remove another player while waiting', async (t) => {
    const fixture = await createFixture(t);
    const host = await fixture.connect();
    const guest = await fixture.connect();
    const otherGuest = await fixture.connect();
    const replacement = await fixture.connect();

    const roomData = await createRoom(host, 'removal-room', 'multiplayer', 3);
    await selectFirstTheme(host, roomData.themes);
    await joinRoom(guest, 'removal-room');
    await joinRoom(otherGuest, 'removal-room');

    guest.emit('removePlayer', otherGuest.id);
    host.emit('removePlayer', host.id);
    host.emit('removePlayer', 'unknown-player');
    await wait(20);
    assert.equal(rooms['removal-room'].players.length, 3);

    const removed = waitFor(guest, 'removedFromRoom');
    const updatedPlayers = waitFor(host, 'playerLeft', players => players.length === 2);
    host.emit('removePlayer', guest.id);
    assert.equal(await removed, 'L’hôte vous a retiré de la partie');
    await updatedPlayers;
    assert.equal(rooms['removal-room'].players.length, 2);

    await joinRoom(replacement, 'removal-room');
    assert.equal(rooms['removal-room'].players.length, 3);

    const everyoneReady = waitFor(host, 'playerReady', players => players.every(player => player.ready));
    host.emit('setReady');
    otherGuest.emit('setReady');
    replacement.emit('setReady');
    await everyoneReady;

    const countdown = waitFor(host, 'countdown', count => count === 3);
    host.emit('startGame');
    await countdown;
    host.emit('removePlayer', otherGuest.id);
    await wait(20);
    assert.equal(rooms['removal-room'].players.length, 3);
});

test('solo starts with one player and replay preserves its configuration', async (t) => {
    const fixture = await createFixture(t);
    const soloPlayer = await fixture.connect();
    const data = await createRoom(soloPlayer, 'solo-game', 'solo', 1);

    assert.equal(data.mode, 'solo');
    assert.equal(data.maxPlayers, 1);
    assert.equal(data.players.length, 1);

    await selectFirstTheme(soloPlayer, data.themes);
    const started = waitFor(soloPlayer, 'gameStarted');
    const finished = waitFor(soloPlayer, 'gameFinished');
    soloPlayer.emit('playSolo');
    await started;
    assert.equal(rooms['solo-game'].gameState, 'playing');
    assert.equal((await finished).length, 1);

    const replayData = waitFor(soloPlayer, 'roomData');
    soloPlayer.emit('playAgain');
    const replay = await replayData;
    assert.equal(replay.mode, 'solo');
    assert.equal(replay.maxPlayers, 1);
    assert.equal(replay.players.length, 1);
    assert.equal(replay.players[0].ready, false);
    assert.equal(replay.text, null);
});
