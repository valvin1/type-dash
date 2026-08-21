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

test('health check and two-player game lifecycle', async (t) => {
    const address = await startServer(0, '127.0.0.1');
    const url = `http://127.0.0.1:${address.port}`;
    const clients = [];

    t.after(async () => {
        clients.forEach(client => client.close());
        await stopServer();
    });

    const healthResponse = await fetch(`${url}/health`);
    assert.equal(healthResponse.status, 200);
    assert.deepEqual(await healthResponse.json(), { status: 'ok' });

    const host = await connectClient(url);
    const guest = await connectClient(url);
    clients.push(host, guest);

    const hostRoomData = waitFor(host, 'roomData');
    host.emit('joinRoom', 'integration-room');
    const { themes } = await hostRoomData;
    assert.ok(themes.length > 0);

    const themeSelected = waitFor(host, 'themeUpdated');
    host.emit('chooseTheme', themes[0]);
    await themeSelected;

    const guestRoomData = waitFor(guest, 'roomData');
    guest.emit('joinRoom', 'integration-room');
    await guestRoomData;

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

    const hostStarted = waitFor(host, 'gameStarted');
    const guestStarted = waitFor(guest, 'gameStarted');
    host.emit('startGame');
    await Promise.all([hostStarted, guestStarted]);
    assert.equal(rooms['integration-room'].gameState, 'playing');

    const finished = waitFor(host, 'gameFinished');
    const finalPlayers = await finished;
    assert.equal(finalPlayers.length, 2);
    assert.equal(rooms['integration-room'].gameState, 'finished');

    const replayData = waitFor(guest, 'roomData');
    host.emit('playAgain');
    const replay = await replayData;
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
    guest.emit('chooseTheme', themes[0]);
    assert.equal((await promotedHostTheme).theme, themes[0]);
});
