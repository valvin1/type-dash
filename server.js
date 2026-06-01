const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');

// Helper to get all categories (directories in data/)
function getCategories() {
    return fs.readdirSync(DATA_DIR).filter(file => {
        return fs.statSync(path.join(DATA_DIR, file)).isDirectory();
    });
}

// Helper to get a random text from a category
function getRandomTextFromCategory(category) {
    if (typeof category !== 'string') return null;
    const safeCategory = path.basename(category);
    const categoryDir = path.join(DATA_DIR, safeCategory);
    if (!fs.existsSync(categoryDir)) return null;
    
    const files = fs.readdirSync(categoryDir).filter(file => file.endsWith('.txt'));
    if (files.length === 0) return null;
    
    const randomFile = files[Math.floor(Math.random() * files.length)];
    return fs.readFileSync(path.join(categoryDir, randomFile), 'utf8');
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', (roomId) => {
        if (typeof roomId !== 'string' || !roomId) {
            return socket.emit('error', 'Room ID non valide');
        }
        socket.join(roomId);
        
        if (!rooms[roomId]) {
            rooms[roomId] = {
                players: [],
                text: null,
                theme: null,
                gameState: 'waiting'
            };
        }

        const room = rooms[roomId];
        const categories = getCategories();
        
        if (room.players.length < 10) {
            const role = room.players.length === 0 ? 'P1' : 'P' + (room.players.length + 1);
            room.players.push({
                id: socket.id,
                ready: false,
                wpm: 0,
                accuracy: 0,
                progress: 0,
                currentWordIndex: 0,
                role: role
            });
            
            socket.emit('roomData', {
                text: room.text,
                players: room.players,
                gameState: room.gameState,
                themes: categories,
                currentTheme: room.theme
            });

            io.to(roomId).emit('playerJoined', room.players);
        } else {
            socket.emit('error', 'Room is full');
        }

        socket.on('chooseTheme', (theme) => {
            if (typeof theme !== 'string') return;
            const room = rooms[roomId];
            if (!room || room.gameState !== 'waiting') return;

            const player = room.players.find(p => p.id === socket.id);
            if (player && player.role === 'P1') {
                const safeTheme = path.basename(theme);
                const randomText = getRandomTextFromCategory(safeTheme);
                if (randomText) {
                    room.theme = safeTheme;
                    room.text = randomText;
                    io.to(roomId).emit('themeUpdated', { theme: safeTheme, text: room.text });
                }
            }
        });

        socket.on('setReady', () => {
            const room = rooms[roomId];
            if (!room || room.gameState !== 'waiting') return;

            const player = room.players.find(p => p.id === socket.id);
            if (player && room.text) { // Ensure theme is chosen
                player.ready = true;
                io.to(roomId).emit('playerReady', room.players);
            }
        });

        socket.on('startGame', () => {
            const room = rooms[roomId];
            if (!room || room.gameState !== 'waiting') return;

            const player = room.players.find(p => p.id === socket.id);
            if (player && player.role === 'P1') {
                const readyCount = room.players.filter(p => p.ready).length;
                if (readyCount >= 2) {
                    startCountdown(roomId);
                }
            }
        });

        socket.on('playSolo', () => {
            const room = rooms[roomId];
            if (!room || room.gameState !== 'waiting') return;

            const player = room.players.find(p => p.id === socket.id);
            if (player && room.text && room.players.length === 1) {
                player.ready = true;
                io.to(roomId).emit('playerReady', room.players);
                startCountdown(roomId);
            }
        });

        socket.on('playAgain', () => {
            const room = rooms[roomId];
            if (!room || room.gameState !== 'finished') return;

            room.gameState = 'waiting';
            room.theme = null;
            room.text = null;
            room.players.forEach(p => {
                p.ready = false;
                p.progress = 0;
                p.wpm = 0;
                p.accuracy = 0;
                p.currentWordIndex = 0;
            });
            io.to(roomId).emit('roomData', {
                text: room.text,
                players: room.players,
                gameState: room.gameState,
                themes: getCategories(),
                currentTheme: room.theme
            });
        });

        socket.on('updateProgress', (data) => {
            if (!data || typeof data !== 'object') return;
            const room = rooms[roomId];
            if (!room || room.gameState !== 'playing') return;

            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                const progress = Number(data.progress);
                const wpm = Number(data.wpm);
                const accuracy = Number(data.accuracy);
                const currentWordIndex = Number(data.currentWordIndex);

                if (isNaN(progress) || isNaN(wpm) || isNaN(accuracy) || isNaN(currentWordIndex)) return;
                if (wpm < 0 || wpm > 300 || progress < 0 || progress > 100 || accuracy < 0 || accuracy > 100 || currentWordIndex < 0) return;

                player.progress = progress;
                player.wpm = wpm;
                player.accuracy = accuracy;
                player.currentWordIndex = currentWordIndex;
                socket.to(roomId).emit('opponentUpdate', player);
            }
        });

        socket.on('disconnect', () => {
            const room = rooms[roomId];
            if (!room) return;
            room.players = room.players.filter(p => p.id !== socket.id);
            // Re-assign roles if P1 left, and adjust roles of other players to be sequential
            if (room.players.length > 0) {
                room.players.forEach((p, idx) => {
                    p.role = idx === 0 ? 'P1' : 'P' + (idx + 1);
                });
            }
            io.to(roomId).emit('playerLeft', room.players);
            if (room.players.length === 0) {
                delete rooms[roomId];
            }
        });
    });
});

function startCountdown(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    room.gameState = 'countdown';
    let count = 3;
    
    const interval = setInterval(() => {
        io.to(roomId).emit('countdown', count);
        if (count === 0) {
            clearInterval(interval);
            startGame(roomId);
        }
        count--;
    }, 1000);
}

function startGame(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    room.gameState = 'playing';
    io.to(roomId).emit('gameStarted');

    let timeLeft = 60;
    const interval = setInterval(() => {
        io.to(roomId).emit('timerUpdate', timeLeft);
        if (timeLeft === 0) {
            clearInterval(interval);
            endGame(roomId);
        }
        timeLeft--;
    }, 1000);
}

function endGame(roomId) {
    const room = rooms[roomId];
    if (room) {
        room.gameState = 'finished';
        io.to(roomId).emit('gameFinished', room.players);
    }
}

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
