const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = Number(process.env.PORT) || 3000;
const TICK_MS = Number(process.env.GAME_TICK_MS) || 1000;
const MAX_MULTIPLAYER_PLAYERS = 6;
const MIN_GHOST_CORRECT_WORDS = 3;
const GHOST_ID = '__solo_ghost__';
const GAME_MODES = new Set(['solo', 'multiplayer']);
const ALLOWED_DURATIONS = new Set([15, 30, 45, 60]);
const DEFAULT_DURATION = 30;
const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const DATA_DIR = path.join(__dirname, 'data');
const DEFAULT_USERNAMES_PATH = path.join(DATA_DIR, 'default-usernames.txt');

function defaultUsernameConfigurationError(reason) {
    return new Error(`Configuration de data/default-usernames.txt invalide : ${reason}`);
}

function parseDefaultUsernames(contents, onWarning = console.warn) {
    let text;
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(contents);
    } catch {
        throw defaultUsernameConfigurationError('le fichier doit être encodé en UTF-8 valide');
    }

    if (text.startsWith('\uFEFF')) text = text.slice(1);

    const usernames = [];
    const seen = new Set();
    text.split(/\r?\n/).forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        if (trimmed.includes('\uFEFF') || Array.from(trimmed).length > 10) {
            onWarning(`data/default-usernames.txt ligne ${lineNumber} ignorée : pseudo invalide (1 à 10 caractères Unicode requis)`);
            return;
        }
        if (seen.has(trimmed)) {
            onWarning(`data/default-usernames.txt ligne ${lineNumber} ignorée : pseudo en double`);
            return;
        }

        seen.add(trimmed);
        usernames.push(trimmed);
    });

    if (usernames.length === 0) {
        throw defaultUsernameConfigurationError('aucun pseudo valide n’a été trouvé');
    }
    return Object.freeze(usernames);
}

function loadDefaultUsernames(filePath = DEFAULT_USERNAMES_PATH) {
    let contents;
    try {
        contents = fs.readFileSync(filePath);
    } catch (error) {
        throw defaultUsernameConfigurationError(`lecture impossible (${error.code || error.message})`);
    }
    return parseDefaultUsernames(contents);
}

const DEFAULT_USERNAMES = loadDefaultUsernames();

// A null prototype prevents special keys such as "__proto__" from altering
// room lookup behavior.
const rooms = Object.create(null);

app.disable('x-powered-by');
app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
});
app.use(express.static(path.join(__dirname, 'public')));

function getCategories() {
    return fs.readdirSync(DATA_DIR).filter(file => {
        return fs.statSync(path.join(DATA_DIR, file)).isDirectory();
    });
}

function getRandomTextFromCategory(category) {
    if (typeof category !== 'string' || path.basename(category) !== category) return null;
    if (!getCategories().includes(category)) return null;

    const categoryDir = path.join(DATA_DIR, category);
    const files = fs.readdirSync(categoryDir).filter(file => file.endsWith('.txt'));
    if (files.length === 0) return null;

    const randomFile = files[Math.floor(Math.random() * files.length)];
    return fs.readFileSync(path.join(categoryDir, randomFile), 'utf8');
}

function emitRoomError(socket, message) {
    socket.emit('roomError', message);
}

function getSocketRoom(socket) {
    const roomId = socket.data.roomId;
    return roomId ? rooms[roomId] : null;
}

function calculateScore(stats) {
    return Math.round(stats.wpm * stats.accuracy / 100);
}

function isBetterRun(candidate, incumbent) {
    if (!incumbent) return true;

    return candidate.score > incumbent.score
        || (candidate.score === incumbent.score && candidate.progress > incumbent.progress)
        || (candidate.score === incumbent.score
            && candidate.progress === incumbent.progress
            && candidate.accuracy > incumbent.accuracy);
}

function calculateDifferences(candidate, incumbent) {
    const baseline = incumbent || { score: 0, wpm: 0, accuracy: 0, progress: 0 };
    return {
        score: candidate.score - baseline.score,
        wpm: candidate.wpm - baseline.wpm,
        accuracy: candidate.accuracy - baseline.accuracy,
        progress: candidate.progress - baseline.progress
    };
}

function buildCompletedSoloRun(room) {
    const player = room.players[0];
    const run = room.currentRun;
    if (!player || !run || player.correctWords < MIN_GHOST_CORRECT_WORDS) return null;

    return {
        id: GHOST_ID,
        role: 'GHOST',
        isGhost: true,
        label: 'Votre record',
        text: room.text,
        score: calculateScore(player),
        wpm: player.wpm,
        accuracy: player.accuracy,
        progress: player.progress,
        correctWords: player.correctWords,
        snapshots: run.snapshots.map(snapshot => ({ ...snapshot }))
    };
}

function finishSoloRun(room) {
    const previousGhost = room.currentRun?.racedGhost?.text === room.text
        ? room.currentRun.racedGhost
        : null;
    const candidate = buildCompletedSoloRun(room);

    if (!candidate) {
        return { players: room.players, ghost: previousGhost, ghostResult: null };
    }

    const beaten = isBetterRun(candidate, previousGhost);
    const ghostResult = {
        outcome: beaten ? 'new-best' : 'not-beaten',
        current: {
            score: candidate.score,
            wpm: candidate.wpm,
            accuracy: candidate.accuracy,
            progress: candidate.progress,
            correctWords: candidate.correctWords
        },
        previousGhost,
        differences: calculateDifferences(candidate, previousGhost)
    };

    const result = { players: room.players, ghost: previousGhost, ghostResult };
    if (beaten) room.ghost = candidate;
    return result;
}

function serializeRoom(room) {
    const data = {
        text: room.text,
        players: room.players,
        gameState: room.gameState,
        themes: getCategories(),
        currentTheme: room.theme,
        mode: room.mode,
        maxPlayers: room.maxPlayers,
        duration: room.duration || DEFAULT_DURATION
    };

    if (room.mode === 'solo') data.ghost = room.ghost;
    return data;
}

function createSuggestedUsername() {
    return DEFAULT_USERNAMES[Math.floor(Math.random() * DEFAULT_USERNAMES.length)];
}

function addPlayerToRoom(socket, roomId, room) {
    socket.data.roomId = roomId;
    socket.join(roomId);

    const player = {
        id: socket.id,
        ready: false,
        wpm: 0,
        accuracy: 0,
        progress: 0,
        currentWordIndex: 0,
        correctWords: 0,
        role: `P${room.players.length + 1}`
    };
    if (room.mode === 'multiplayer') player.username = createSuggestedUsername();
    room.players.push(player);

    socket.emit('roomData', serializeRoom(room));
    io.to(roomId).emit('playerJoined', room.players);
}

function removePlayerFromRoom(roomId, playerId) {
    const room = rooms[roomId];
    if (!room) return false;

    const previousLength = room.players.length;
    room.players = room.players.filter(player => player.id !== playerId);
    if (room.players.length === previousLength) return false;

    room.players.forEach((player, index) => {
        player.role = `P${index + 1}`;
    });

    if (room.players.length === 0) {
        deleteRoom(roomId);
    } else {
        io.to(roomId).emit('playerLeft', room.players);
    }
    return true;
}

function clearRoomTimers(room) {
    if (room.countdownTimer) clearInterval(room.countdownTimer);
    if (room.gameTimer) clearInterval(room.gameTimer);
    room.countdownTimer = null;
    room.gameTimer = null;
}

function resetPlayers(room) {
    room.players.forEach(player => {
        player.ready = false;
        player.progress = 0;
        player.wpm = 0;
        player.accuracy = 0;
        player.currentWordIndex = 0;
        player.correctWords = 0;
    });
}

function resetForTextSelection(room) {
    clearRoomTimers(room);
    room.gameState = 'waiting';
    room.theme = null;
    room.text = null;
    room.currentRun = null;
    if (room.mode === 'solo') room.ghost = null;
    resetPlayers(room);
}

function deleteRoom(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    clearRoomTimers(room);
    delete rooms[roomId];
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('createRoom', (data) => {
        if (socket.data.roomId) {
            return emitRoomError(socket, 'Vous avez déjà rejoint un salon');
        }
        if (!data || typeof data !== 'object') {
            return emitRoomError(socket, 'Configuration de partie non valide');
        }

        const { roomId, mode, maxPlayers } = data;
        if (typeof roomId !== 'string' || !ROOM_ID_PATTERN.test(roomId)) {
            return emitRoomError(socket, 'Identifiant de salon non valide');
        }
        if (!GAME_MODES.has(mode) || !Number.isInteger(maxPlayers)) {
            return emitRoomError(socket, 'Configuration de partie non valide');
        }
        if (mode === 'solo' && maxPlayers !== 1) {
            return emitRoomError(socket, 'Configuration de partie non valide');
        }
        if (mode === 'multiplayer' && (maxPlayers < 2 || maxPlayers > MAX_MULTIPLAYER_PLAYERS)) {
            return emitRoomError(socket, 'Configuration de partie non valide');
        }
        if (rooms[roomId]) {
            return emitRoomError(socket, 'Ce salon existe déjà');
        }

        const room = rooms[roomId] = {
            mode,
            maxPlayers,
            duration: DEFAULT_DURATION,
            players: [],
            text: null,
            theme: null,
            gameState: 'waiting',
            countdownTimer: null,
            gameTimer: null,
            ghost: null,
            currentRun: null
        };

        addPlayerToRoom(socket, roomId, room);
    });

    socket.on('joinRoom', (roomId) => {
        if (socket.data.roomId) {
            return emitRoomError(socket, 'Vous avez déjà rejoint un salon');
        }
        if (typeof roomId !== 'string' || !ROOM_ID_PATTERN.test(roomId)) {
            return emitRoomError(socket, 'Identifiant de salon non valide');
        }

        const room = rooms[roomId];
        if (!room) {
            return emitRoomError(socket, 'Ce salon n’existe plus');
        }
        if (room.mode !== 'multiplayer') {
            return emitRoomError(socket, 'Cette partie solo est privée');
        }
        if (room.gameState !== 'waiting') {
            return emitRoomError(socket, 'Cette partie a déjà commencé');
        }
        if (room.players.length >= room.maxPlayers) {
            return emitRoomError(socket, 'Le salon est complet');
        }

        addPlayerToRoom(socket, roomId, room);
    });

    socket.on('changeUsername', (username) => {
        const room = getSocketRoom(socket);
        if (!room || room.mode !== 'multiplayer' || room.gameState !== 'waiting') return;

        const player = room.players.find(candidate => candidate.id === socket.id);
        if (!player) return;

        if (typeof username !== 'string') {
            return socket.emit('usernameError', 'Le pseudo doit être un texte de 1 à 10 caractères.');
        }

        const trimmedUsername = username.trim();
        if (trimmedUsername.length === 0 || Array.from(trimmedUsername).length > 10) {
            return socket.emit('usernameError', 'Le pseudo doit contenir de 1 à 10 caractères.');
        }

        player.username = trimmedUsername;
        io.to(socket.data.roomId).emit('usernameUpdated', room.players);
    });

    socket.on('chooseTheme', (theme) => {
        if (typeof theme !== 'string') return;
        const room = getSocketRoom(socket);
        if (!room || room.gameState !== 'waiting') return;

        const player = room.players.find(candidate => candidate.id === socket.id);
        if (!player || player.role !== 'P1') return;

        const randomText = getRandomTextFromCategory(theme);
        if (!randomText) return;

        if (room.mode === 'solo') {
            room.ghost = null;
            room.currentRun = null;
        }
        room.theme = theme;
        room.text = randomText;
        io.to(socket.data.roomId).emit('themeUpdated', { theme, text: room.text });
    });

    socket.on('chooseDuration', (duration) => {
        const durationNum = Number(duration);
        if (!ALLOWED_DURATIONS.has(durationNum)) return;

        const room = getSocketRoom(socket);
        if (!room || room.gameState !== 'waiting') return;

        const player = room.players.find(candidate => candidate.id === socket.id);
        if (!player || player.role !== 'P1') return;

        room.duration = durationNum;
        if (room.mode === 'solo') {
            room.ghost = null;
            room.currentRun = null;
        }

        io.to(socket.data.roomId).emit('durationUpdated', { duration: durationNum });
    });

    socket.on('setReady', () => {
        const room = getSocketRoom(socket);
        if (!room || room.gameState !== 'waiting' || !room.text) return;

        const player = room.players.find(candidate => candidate.id === socket.id);
        if (!player || player.ready) return;

        player.ready = true;
        io.to(socket.data.roomId).emit('playerReady', room.players);
    });

    socket.on('startGame', () => {
        const room = getSocketRoom(socket);
        if (!room || room.mode !== 'multiplayer' || room.gameState !== 'waiting') return;

        const player = room.players.find(candidate => candidate.id === socket.id);
        const everyoneReady = room.players.length >= 2 && room.players.every(candidate => candidate.ready);
        if (player?.role === 'P1' && everyoneReady) {
            startCountdown(socket.data.roomId);
        }
    });

    socket.on('removePlayer', (targetPlayerId) => {
        if (typeof targetPlayerId !== 'string') return;

        const room = getSocketRoom(socket);
        if (!room || room.mode !== 'multiplayer' || room.gameState !== 'waiting') return;

        const host = room.players.find(player => player.id === socket.id);
        const target = room.players.find(player => player.id === targetPlayerId);
        if (host?.role !== 'P1' || !target || target.id === host.id) return;

        const roomId = socket.data.roomId;
        const targetSocket = io.sockets.sockets.get(target.id);
        if (targetSocket) {
            targetSocket.leave(roomId);
            targetSocket.data.roomId = null;
            targetSocket.emit('removedFromRoom', 'L’hôte vous a retiré de la partie');
        }
        removePlayerFromRoom(roomId, target.id);
    });

    socket.on('playSolo', () => {
        const room = getSocketRoom(socket);
        if (!room || room.mode !== 'solo' || room.gameState !== 'waiting' || !room.text || room.players.length !== 1) return;

        const player = room.players.find(candidate => candidate.id === socket.id);
        if (player?.role === 'P1') {
            player.ready = true;
            io.to(socket.data.roomId).emit('playerReady', room.players);
            startCountdown(socket.data.roomId);
        }
    });

    socket.on('playAgain', () => {
        const room = getSocketRoom(socket);
        if (!room || room.gameState !== 'finished') return;

        resetForTextSelection(room);
        io.to(socket.data.roomId).emit('roomData', serializeRoom(room));
    });

    socket.on('retrySoloText', () => {
        const room = getSocketRoom(socket);
        if (!room || room.mode !== 'solo' || room.gameState !== 'finished' || !room.text || room.players.length !== 1) return;

        clearRoomTimers(room);
        room.gameState = 'waiting';
        room.currentRun = null;
        resetPlayers(room);

        const player = room.players[0];
        io.to(socket.data.roomId).emit('roomData', serializeRoom(room));
        player.ready = true;
        io.to(socket.data.roomId).emit('playerReady', room.players);
        startCountdown(socket.data.roomId);
    });

    socket.on('changeSoloText', () => {
        const room = getSocketRoom(socket);
        if (!room || room.mode !== 'solo' || room.gameState !== 'finished') return;

        resetForTextSelection(room);
        io.to(socket.data.roomId).emit('roomData', serializeRoom(room));
    });

    socket.on('updateProgress', (data) => {
        if (!data || typeof data !== 'object') return;
        const room = getSocketRoom(socket);
        if (!room || room.gameState !== 'playing') return;

        const player = room.players.find(candidate => candidate.id === socket.id);
        if (!player) return;

        const progress = Number(data.progress);
        const wpm = Number(data.wpm);
        const accuracy = Number(data.accuracy);
        const currentWordIndex = Number(data.currentWordIndex);
        const wordCount = room.text.trim().split(/\s+/).length;

        if (![progress, wpm, accuracy, currentWordIndex].every(Number.isFinite)) return;
        if (wpm < 0 || wpm > 300 || progress < 0 || progress > 100) return;
        if (accuracy < 0 || accuracy > 100 || currentWordIndex < 0 || currentWordIndex > wordCount) return;

        let correctWords = player.correctWords;
        if (room.mode === 'solo') {
            correctWords = Number(data.correctWords);
            if (!Number.isInteger(correctWords) || correctWords < 0 || correctWords > currentWordIndex || correctWords > wordCount) return;
        }

        player.progress = progress;
        player.wpm = wpm;
        player.accuracy = accuracy;
        player.currentWordIndex = currentWordIndex;
        player.correctWords = correctWords;

        if (room.mode === 'solo' && room.currentRun) {
            const snapshotLimit = wordCount + 5;
            if (room.currentRun.snapshots.length < snapshotLimit) {
                room.currentRun.snapshots.push({
                    elapsedMs: Math.max(0, Date.now() - room.currentRun.startedAt),
                    progress,
                    wpm,
                    accuracy
                });
            }
        }
        socket.to(socket.data.roomId).emit('opponentUpdate', player);
    });

    socket.on('disconnect', () => {
        const roomId = socket.data.roomId;
        if (roomId) removePlayerFromRoom(roomId, socket.id);
    });
});

function startCountdown(roomId) {
    const room = rooms[roomId];
    if (!room || room.gameState !== 'waiting') return;

    room.gameState = 'countdown';
    let count = 3;
    io.to(roomId).emit('countdown', count);

    room.countdownTimer = setInterval(() => {
        count -= 1;
        io.to(roomId).emit('countdown', count);
        if (count === 0) {
            clearInterval(room.countdownTimer);
            room.countdownTimer = null;
            startGame(roomId);
        }
    }, TICK_MS);
}

function startGame(roomId) {
    const room = rooms[roomId];
    if (!room || room.gameState !== 'countdown') return;

    room.gameState = 'playing';
    if (room.mode === 'solo') {
        room.currentRun = {
            startedAt: Date.now(),
            snapshots: [],
            racedGhost: room.ghost
        };
    }
    io.to(roomId).emit('gameStarted');

    let timeLeft = room.duration || DEFAULT_DURATION;
    io.to(roomId).emit('timerUpdate', timeLeft);
    room.gameTimer = setInterval(() => {
        timeLeft -= 1;
        io.to(roomId).emit('timerUpdate', timeLeft);
        if (timeLeft === 0) {
            clearInterval(room.gameTimer);
            room.gameTimer = null;
            endGame(roomId);
        }
    }, TICK_MS);
}

function endGame(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    room.gameState = 'finished';
    const result = room.mode === 'solo' ? finishSoloRun(room) : room.players;
    io.to(roomId).emit('gameFinished', result);
}

function startServer(port = PORT, host = '0.0.0.0') {
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
            server.off('error', reject);
            resolve(server.address());
        });
    });
}

function stopServer() {
    Object.keys(rooms).forEach(deleteRoom);
    return new Promise(resolve => {
        io.close(() => resolve());
    });
}

if (require.main === module) {
    startServer().then(() => {
        console.log(`Server running on http://localhost:${PORT}`);
    }).catch(error => {
        console.error('Unable to start server:', error);
        process.exitCode = 1;
    });
}

module.exports = {
    app,
    io,
    rooms,
    server,
    startServer,
    stopServer,
    DEFAULT_USERNAMES,
    DEFAULT_USERNAMES_PATH,
    loadDefaultUsernames,
    parseDefaultUsernames
};
