const test = require('node:test');
const assert = require('node:assert/strict');
const { io: createClient } = require('socket.io-client');

process.env.GAME_TICK_MS = '10';

const { CURATED_FRENCH_SURNAMES, rooms, startServer, stopServer } = require('../server');

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

async function completeSoloRun(client, startEvent, updates) {
    const started = waitFor(client, 'gameStarted');
    const finished = waitFor(client, 'gameFinished');
    client.emit(startEvent);
    await started;

    for (const { delayMs = 0, ...update } of updates) {
        if (delayMs > 0) await wait(delayMs);
        client.emit('updateProgress', update);
    }

    return finished;
}

function soloUpdate({ progress, wpm, accuracy, currentWordIndex, correctWords, delayMs = 0 }) {
    return { progress, wpm, accuracy, currentWordIndex, correctWords, delayMs };
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

test('multiplayer surname suggestions are synchronized, validated, and locked after countdown', async (t) => {
    const fixture = await createFixture(t);
    const host = await fixture.connect();
    const guest = await fixture.connect();
    const hostData = await createRoom(host, 'username-room', 'multiplayer', 2);

    assert.ok(Object.isFrozen(CURATED_FRENCH_SURNAMES));
    assert.ok(CURATED_FRENCH_SURNAMES.length >= 10);
    assert.equal(new Set(CURATED_FRENCH_SURNAMES).size, CURATED_FRENCH_SURNAMES.length);
    CURATED_FRENCH_SURNAMES.forEach(surname => {
        assert.ok(Array.from(surname).length >= 1 && Array.from(surname).length <= 10);
    });
    assert.ok(CURATED_FRENCH_SURNAMES.includes(hostData.players[0].username));
    assert.ok(Array.from(hostData.players[0].username).length <= 10);

    const hostSawGuest = waitFor(host, 'playerJoined', players => players.length === 2);
    const guestData = await joinRoom(guest, 'username-room');
    const joinedPlayers = await hostSawGuest;
    assert.ok(CURATED_FRENCH_SURNAMES.includes(guestData.players[1].username));
    assert.ok(Array.from(guestData.players[1].username).length <= 10);
    assert.equal(joinedPlayers[1].username, guestData.players[1].username);

    const hostRename = waitFor(host, 'usernameUpdated', players => players[1]?.username === 'Léa');
    const guestRename = waitFor(guest, 'usernameUpdated', players => players[1]?.username === 'Léa');
    guest.emit('changeUsername', '  Léa  ');
    await Promise.all([hostRename, guestRename]);
    assert.equal(rooms['username-room'].players[1].username, 'Léa');

    const originalName = rooms['username-room'].players[1].username;
    let usernameUpdates = 0;
    host.on('usernameUpdated', () => { usernameUpdates += 1; });
    for (const invalidName of ['', '   ', 123, 'abcdefghijk']) {
        const error = waitFor(guest, 'usernameError');
        guest.emit('changeUsername', invalidName);
        assert.match(await error, /pseudo/i);
        assert.equal(rooms['username-room'].players[1].username, originalName);
    }
    await wait(20);
    assert.equal(usernameUpdates, 0);
    host.off('usernameUpdated');

    await selectFirstTheme(host, hostData.themes);
    const everyoneReady = waitFor(host, 'playerReady', players => players.every(player => player.ready));
    host.emit('setReady');
    guest.emit('setReady');
    await everyoneReady;
    const countdown = waitFor(host, 'countdown', count => count === 3);
    host.emit('startGame');
    await countdown;

    guest.emit('changeUsername', 'Changed');
    await wait(20);
    assert.equal(rooms['username-room'].players[1].username, originalName);
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

test('solo ghost eligibility, recorded timing, and best-run selection', async (t) => {
    const fixture = await createFixture(t);
    const soloPlayer = await fixture.connect();
    const data = await createRoom(soloPlayer, 'solo-game', 'solo', 1);

    assert.equal(data.mode, 'solo');
    assert.equal(data.maxPlayers, 1);
    assert.equal(data.players.length, 1);

    const theme = await selectFirstTheme(soloPlayer, data.themes);
    const shortResult = await completeSoloRun(soloPlayer, 'playSolo', [
        soloUpdate({ progress: 20, wpm: 40, accuracy: 100, currentWordIndex: 2, correctWords: 2 })
    ]);
    assert.equal(shortResult.ghostResult, null);
    assert.equal(rooms['solo-game'].ghost, null);

    const eligibleReplayData = waitFor(soloPlayer, 'roomData');
    const firstEligibleResultPromise = completeSoloRun(soloPlayer, 'retrySoloText', [
        soloUpdate({ progress: 10, wpm: 45, accuracy: 100, currentWordIndex: 1, correctWords: 1, delayMs: 10 }),
        soloUpdate({ progress: 30, wpm: 60, accuracy: 96, currentWordIndex: 3, correctWords: 3, delayMs: 35 })
    ]);
    const eligibleReplay = await eligibleReplayData;
    assert.equal(eligibleReplay.text, theme.text);
    assert.equal(eligibleReplay.ghost, null);

    const firstEligibleResult = await firstEligibleResultPromise;
    assert.equal(firstEligibleResult.ghostResult.outcome, 'new-best');
    assert.equal(firstEligibleResult.ghost, null);
    assert.equal(rooms['solo-game'].players.length, 1);
    assert.equal(rooms['solo-game'].ghost.score, 58);
    assert.equal(rooms['solo-game'].ghost.correctWords, 3);
    assert.equal(rooms['solo-game'].ghost.snapshots.length, 2);
    assert.ok(rooms['solo-game'].ghost.snapshots[1].elapsedMs > rooms['solo-game'].ghost.snapshots[0].elapsedMs);

    const originalGhost = structuredClone(rooms['solo-game'].ghost);
    const tiedReplayData = waitFor(soloPlayer, 'roomData');
    const tiedResultPromise = completeSoloRun(soloPlayer, 'retrySoloText', [
        soloUpdate({ progress: 30, wpm: 60, accuracy: 96, currentWordIndex: 3, correctWords: 3 })
    ]);
    const tiedReplay = await tiedReplayData;
    assert.deepEqual(tiedReplay.ghost.snapshots, originalGhost.snapshots);
    const tiedResult = await tiedResultPromise;
    assert.equal(tiedResult.ghostResult.outcome, 'not-beaten');
    assert.deepEqual(rooms['solo-game'].ghost, originalGhost);

    const progressResult = await completeSoloRun(soloPlayer, 'retrySoloText', [
        soloUpdate({ progress: 40, wpm: 60, accuracy: 96, currentWordIndex: 4, correctWords: 4 })
    ]);
    assert.equal(progressResult.ghostResult.outcome, 'new-best');
    assert.equal(progressResult.ghostResult.differences.score, 0);
    assert.equal(progressResult.ghostResult.differences.progress, 10);
    assert.equal(rooms['solo-game'].ghost.progress, 40);

    const accuracyResult = await completeSoloRun(soloPlayer, 'retrySoloText', [
        soloUpdate({ progress: 40, wpm: 59, accuracy: 98, currentWordIndex: 4, correctWords: 4 })
    ]);
    assert.equal(accuracyResult.ghostResult.outcome, 'new-best');
    assert.equal(accuracyResult.ghostResult.differences.score, 0);
    assert.equal(accuracyResult.ghostResult.differences.accuracy, 2);
    assert.equal(rooms['solo-game'].ghost.accuracy, 98);
});

test('solo ghosts clear with text changes and stay isolated to their room', async (t) => {
    const fixture = await createFixture(t);
    const firstPlayer = await fixture.connect();
    const secondPlayer = await fixture.connect();
    const firstData = await createRoom(firstPlayer, 'solo-isolation-a', 'solo', 1);
    const secondData = await createRoom(secondPlayer, 'solo-isolation-b', 'solo', 1);

    await selectFirstTheme(firstPlayer, firstData.themes);
    await selectFirstTheme(secondPlayer, secondData.themes);

    await Promise.all([
        completeSoloRun(firstPlayer, 'playSolo', [
            soloUpdate({ progress: 35, wpm: 55, accuracy: 100, currentWordIndex: 3, correctWords: 3 })
        ]),
        completeSoloRun(secondPlayer, 'playSolo', [
            soloUpdate({ progress: 45, wpm: 70, accuracy: 95, currentWordIndex: 4, correctWords: 4 })
        ])
    ]);

    assert.equal(rooms['solo-isolation-a'].ghost.wpm, 55);
    assert.equal(rooms['solo-isolation-b'].ghost.wpm, 70);
    assert.notDeepEqual(rooms['solo-isolation-a'].ghost, rooms['solo-isolation-b'].ghost);

    const textSelection = waitFor(firstPlayer, 'roomData');
    firstPlayer.emit('changeSoloText');
    const reset = await textSelection;
    assert.equal(reset.text, null);
    assert.equal(reset.currentTheme, null);
    assert.equal(reset.ghost, null);
    assert.equal(rooms['solo-isolation-a'].ghost, null);
    assert.equal(rooms['solo-isolation-b'].ghost.wpm, 70);

    secondPlayer.close();
    await wait(20);
    assert.equal(rooms['solo-isolation-b'], undefined);
});

test('dynamic game duration: defaults to 30s, validates presets, allows host selection and syncs peers', async (t) => {
    const fixture = await createFixture(t);
    const host = await fixture.connect();
    const guest = await fixture.connect();
    const hostData = await createRoom(host, 'duration-test-room', 'multiplayer', 3);

    // Initial default duration is 30s
    assert.equal(hostData.duration, 30);
    assert.equal(rooms['duration-test-room'].duration, 30);

    const guestData = await joinRoom(guest, 'duration-test-room');
    assert.equal(guestData.duration, 30);

    // Invalid durations are rejected
    host.emit('chooseDuration', 20);
    host.emit('chooseDuration', 'invalid');
    host.emit('chooseDuration', 100);
    await wait(20);
    assert.equal(rooms['duration-test-room'].duration, 30);

    // Non-host attempts to choose duration
    guest.emit('chooseDuration', 45);
    await wait(20);
    assert.equal(rooms['duration-test-room'].duration, 30);

    // Host selects valid preset 45s
    const hostUpdated = waitFor(host, 'durationUpdated');
    const guestUpdated = waitFor(guest, 'durationUpdated');
    host.emit('chooseDuration', 45);

    const [hostRes, guestRes] = await Promise.all([hostUpdated, guestUpdated]);
    assert.equal(hostRes.duration, 45);
    assert.equal(guestRes.duration, 45);
    assert.equal(rooms['duration-test-room'].duration, 45);

    // Host changes to 15s
    const hostUpdated15 = waitFor(host, 'durationUpdated');
    const guestUpdated15 = waitFor(guest, 'durationUpdated');
    host.emit('chooseDuration', 15);
    const [h15, g15] = await Promise.all([hostUpdated15, guestUpdated15]);
    assert.equal(h15.duration, 15);
    assert.equal(g15.duration, 15);
    assert.equal(rooms['duration-test-room'].duration, 15);
});

test('dynamic game duration: timer countdown starts from configured duration and solo ghost resets on duration change', async (t) => {
    const fixture = await createFixture(t);
    const soloPlayer = await fixture.connect();
    const soloData = await createRoom(soloPlayer, 'solo-duration-room', 'solo', 1);

    assert.equal(soloData.duration, 30);
    await selectFirstTheme(soloPlayer, soloData.themes);

    // Set duration to 45s before starting
    const durationUpdated45 = waitFor(soloPlayer, 'durationUpdated');
    soloPlayer.emit('chooseDuration', 45);
    const d45 = await durationUpdated45;
    assert.equal(d45.duration, 45);
    assert.equal(rooms['solo-duration-room'].duration, 45);

    // Complete run with 45s duration to establish a ghost
    const initialRunPromise = completeSoloRun(soloPlayer, 'playSolo', [
        soloUpdate({ progress: 50, wpm: 80, accuracy: 100, currentWordIndex: 5, correctWords: 5 })
    ]);
    const firstTimerUpdate = await waitFor(soloPlayer, 'timerUpdate');
    assert.equal(firstTimerUpdate, 45); // Started at 45s
    await initialRunPromise;

    assert.ok(rooms['solo-duration-room'].ghost);
    assert.equal(rooms['solo-duration-room'].ghost.wpm, 80);

    // Retry preserves text, ghost, and duration
    const retryRoomData = waitFor(soloPlayer, 'roomData');
    soloPlayer.emit('retrySoloText');
    const retryData = await retryRoomData;
    assert.equal(retryData.duration, 45);
    assert.ok(retryData.ghost);
    assert.equal(rooms['solo-duration-room'].duration, 45);
    assert.ok(rooms['solo-duration-room'].ghost);

    // Wait for retry run to complete
    await waitFor(soloPlayer, 'gameFinished');

    // Return to waiting state
    rooms['solo-duration-room'].gameState = 'waiting';

    // Changing duration resets ghost
    const changeDurationPromise = waitFor(soloPlayer, 'durationUpdated');
    soloPlayer.emit('chooseDuration', 15);
    const d15 = await changeDurationPromise;
    assert.equal(d15.duration, 15);
    assert.equal(rooms['solo-duration-room'].duration, 15);
    assert.equal(rooms['solo-duration-room'].ghost, null);
});
