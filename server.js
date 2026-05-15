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

// Structured texts by theme (v0.5)
const sampleTexts = {
    "histoire": [
        "Au cours des siècles passés, les grandes civilisations ont façonné le monde que nous connaissons aujourd'hui. De la construction des premières cités-états à l'invention de l'écriture, chaque étape a marqué un tournant décisif. Les historiens étudient les vestiges du passé pour comprendre les motivations des peuples anciens et les causes des grands conflits. La maîtrise du feu et le développement de l'agriculture ont permis aux premières sociétés de se sédentariser et de prospérer. Les échanges commerciaux entre les continents ont favorisé la diffusion des idées et des techniques, créant des ponts entre des cultures pourtant très éloignées. Malgré les épreuves et les bouleversements, l'humanité a toujours su se relever et innover, laissant derrière elle un héritage riche et complexe qui continue d'influencer notre présent et de guider notre vision collective de l'avenir."
    ],
    "culture": [
        "La curiosité intellectuelle est le moteur essentiel de la connaissance humaine. S'intéresser à des domaines variés, de la philosophie à l'astronomie, permet d'élargir son horizon et de mieux appréhender les enjeux du monde moderne. Lire des ouvrages classiques ou découvrir de nouveaux courants artistiques enrichit notre perception de la réalité et stimule notre créativité. La culture n'est pas seulement un ensemble de faits à mémoriser, mais une manière d'interroger notre environnement et de développer un esprit critique. En apprenant à écouter différents points de vue, nous renforçons notre capacité de compréhension et d'empathie. Chaque découverte est une fenêtre ouverte sur une nouvelle compréhension de nous-mêmes et des autres, contribuant ainsi à bâtir une société plus ouverte, tolérante et consciente de sa propre diversité."
    ],
    "sport": [
        "La pratique régulière d'une activité physique est fondamentale pour maintenir un équilibre entre le corps et l'esprit. Au-delà de la simple performance athlétique, l'exercice favorise la persévérance et le dépassement de soi. Les disciplines collectives enseignent l'importance de la coopération et du respect mutuel, tandis que les efforts individuels renforcent la discipline personnelle. Le mouvement constant permet de libérer les tensions quotidiennes et d'améliorer la concentration. Que ce soit en pleine nature ou dans une salle spécialisée, chaque séance est l'occasion de tester ses limites et de savourer le plaisir de l'effort. Le bien-être ressenti après un entraînement intensif témoigne de la capacité du corps humain à s'adapter et à se renforcer. En adoptant un mode de vie actif, chacun peut améliorer sa qualité de vie et découvrir des ressources intérieures insoupçonnées."
    ],
    "gastronomie": [
        "L'art culinaire est une célébration des sens qui unit les traditions ancestrales et les innovations contemporaines. La sélection de produits frais et de saison est la base de toute préparation réussie. Mélanger les saveurs, équilibrer les textures et soigner la présentation transforment un simple repas en une expérience mémorable. La cuisine est aussi un langage universel qui favorise le partage et la convivialité entre les convives. Chaque région du monde possède ses propres spécialités, reflets de son terroir et de son climat. Transmettre les recettes de génération en génération permet de préserver un patrimoine culturel vivant et savoureux. En prenant le temps de cuisiner avec passion, nous redécouvrons le plaisir des choses simples et authentiques, tout en honorant la richesse infinie des ingrédients que la nature nous offre généreusement chaque jour."
    ],
    "cinema": [
        "Le septième art possède le pouvoir unique de nous transporter dans des univers imaginaires et de nous faire vivre des émotions intenses. Par le biais du montage et de la mise en scène, les réalisateurs créent des récits qui résonnent en nous bien après la fin du générique. La musique, les décors et le jeu des acteurs se conjuguent pour donner vie à des personnages inoubliables. Le cinéma est à la fois un divertissement populaire et un miroir tendu vers notre société, capable de dénoncer les injustices ou de célébrer la beauté du monde. Chaque film est le résultat d'un travail collectif immense où chaque technicien apporte son savoir-faire précieux. En s'asseyant dans l'obscurité d'une salle, nous acceptons de suspendre notre incrédulité pour nous laisser porter par la magie des images en mouvement et la force des histoires bien racontées."
    ],
    "repliques": [
        "On ne peut pas changer le passé, mais on peut choisir de construire un avenir meilleur dès aujourd'hui. Parfois, le plus grand courage consiste à admettre ses propres faiblesses pour mieux les surmonter. La vie est une aventure imprévisible où chaque rencontre peut bouleverser notre destin de manière inattendue. Rien n'est jamais perdu tant que l'on garde l'espoir de réussir ce que l'on entreprend avec passion. Il faut savoir écouter son cœur pour trouver sa véritable voie dans ce monde si complexe. La persévérance est la clé qui ouvre toutes les portes, même celles qui semblent les plus solidement verrouillées. N'oubliez jamais que la plus belle des victoires est celle que l'on remporte sur soi-même chaque jour. Restez fidèles à vos principes et ne laissez personne éteindre la flamme qui vous anime car votre force intérieure est votre plus précieux trésor."
    ]
};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', (roomId) => {
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
        
        if (room.players.length < 2) {
            room.players.push({
                id: socket.id,
                ready: false,
                wpm: 0,
                accuracy: 0,
                progress: 0,
                currentWordIndex: 0,
                role: room.players.length === 0 ? 'P1' : 'P2'
            });
            
            socket.emit('roomData', {
                text: room.text,
                players: room.players,
                gameState: room.gameState,
                themes: Object.keys(sampleTexts),
                currentTheme: room.theme
            });

            io.to(roomId).emit('playerJoined', room.players);
        } else {
            socket.emit('error', 'Room is full');
        }

        socket.on('chooseTheme', (theme) => {
            const player = room.players.find(p => p.id === socket.id);
            if (player && player.role === 'P1' && sampleTexts[theme]) {
                room.theme = theme;
                room.text = sampleTexts[theme][Math.floor(Math.random() * sampleTexts[theme].length)];
                io.to(roomId).emit('themeUpdated', { theme, text: room.text });
            }
        });

        socket.on('setReady', () => {
            const player = room.players.find(p => p.id === socket.id);
            if (player && room.text) { // Ensure theme is chosen
                player.ready = true;
                io.to(roomId).emit('playerReady', room.players);

                if (room.players.length === 2 && room.players.every(p => p.ready)) {
                    startCountdown(roomId);
                }
            }
        });

        socket.on('playAgain', () => {
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
                themes: Object.keys(sampleTexts),
                currentTheme: room.theme
            });
        });

        socket.on('updateProgress', (data) => {
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                player.progress = data.progress;
                player.wpm = data.wpm;
                player.accuracy = data.accuracy;
                player.currentWordIndex = data.currentWordIndex;
                socket.to(roomId).emit('opponentUpdate', player);
            }
        });

        socket.on('disconnect', () => {
            room.players = room.players.filter(p => p.id !== socket.id);
            // Re-assign roles if P1 left
            if (room.players.length > 0) {
                room.players[0].role = 'P1';
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
