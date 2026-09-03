const socket = io();

// UI Elements
const screens = {
    lobby: document.getElementById('lobby'),
    waiting: document.getElementById('waiting'),
    game: document.getElementById('game'),
    results: document.getElementById('results')
};

const soloModeBtn = document.getElementById('solo-mode-btn');
const multiplayerModeBtn = document.getElementById('multiplayer-mode-btn');
const multiplayerSetup = document.getElementById('multiplayer-setup');
const modeSelection = document.getElementById('mode-selection');
const playerCapacity = document.getElementById('player-capacity');
const createMultiplayerBtn = document.getElementById('create-multiplayer-btn');
const backToModesBtn = document.getElementById('back-to-modes-btn');
const readyBtn = document.getElementById('ready-btn');
const startGameBtnHost = document.getElementById('start-game-btn-host');
const soloBtn = document.getElementById('solo-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const soloResultActions = document.getElementById('solo-result-actions');
const retrySoloTextBtn = document.getElementById('retry-solo-text-btn');
const changeSoloTextBtn = document.getElementById('change-solo-text-btn');
const copyLinkBtn = document.getElementById('copy-link');
const roomIdDisplay = document.querySelector('#room-id-display span');
const typingInput = document.getElementById('typing-input');
const textDisplay = document.getElementById('text-display');
const timerDisplay = document.getElementById('timer');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const wpmDisplay = document.getElementById('current-wpm');
const accDisplay = document.getElementById('current-accuracy');
const textScroller = document.getElementById('text-scroller');
const roomInfo = document.getElementById('room-info');
const multiplayerLobby = document.getElementById('multiplayer-lobby');
const waitingStatus = document.getElementById('waiting-status');
const readinessMessage = document.getElementById('lobby-readiness-message');
const durationSelection = document.getElementById('duration-selection');
const durationButtons = document.querySelectorAll('.duration-btn');
const selectedDurationDisplay = document.getElementById('selected-duration-display');
const activeDurationValue = document.getElementById('active-duration-value');

// Game State
let currentRoomId = null;
let currentMode = null;
let roomMaxPlayers = 1;
let selectedDuration = 30;
let targetText = "";
let words = [];
let currentWordIndex = 0;
let startTime = null;
let gameActive = false;
let myLastRank = 1;
let activePlayers = [];
let availableThemes = [];
let selectedTheme = null;
let lastEmitTime = 0;
let ghostRecord = null;
let ghostPlayer = null;
let ghostReplayTimers = [];
const throttleMs = 150;

// Audio Context for notification
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playAlertSound() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High A
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

// Initialize
function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    if (roomId) {
        joinRoom(roomId);
    }
}

// Socket Events
socket.on('roomData', (data) => {
    activePlayers = data.players;
    availableThemes = data.themes;
    selectedTheme = data.currentTheme;
    targetText = data.text || '';
    currentMode = data.mode;
    roomMaxPlayers = data.maxPlayers;
    ghostRecord = data.ghost || null;
    resetGameState();
    ghostPlayer = ghostRecord ? createGhostCompetitor(ghostRecord) : null;
    showScreen('waiting');

    const selectedThemeDisplay = document.getElementById('selected-theme-display');

    if (data.currentTheme) {
        setupTextDisplay(targetText);
        selectedThemeDisplay.classList.remove('hidden');
        document.getElementById('active-theme-name').textContent = data.currentTheme;
    } else {
        words = [];
        textScroller.innerHTML = '';
        selectedThemeDisplay.classList.add('hidden');
    }

    updatePlayerList(data.players);
    roomInfo.classList.toggle('hidden', currentMode !== 'multiplayer');
    if (currentMode === 'multiplayer') roomIdDisplay.textContent = currentRoomId;

    selectedDuration = data.duration || 30;
    updateDurationButtons(selectedDuration);
    if (activeDurationValue) activeDurationValue.textContent = selectedDuration;
    if (timerDisplay) timerDisplay.textContent = selectedDuration;
});

socket.on('roomError', (message) => {
    clearRoomContext();
    const errorDisplay = document.getElementById('connection-error');
    errorDisplay.textContent = message;
    errorDisplay.classList.remove('hidden');
    showScreen('lobby');
});

socket.on('removedFromRoom', (message) => {
    clearRoomContext();
    const errorDisplay = document.getElementById('connection-error');
    errorDisplay.textContent = message || 'L’hôte vous a retiré de la partie';
    errorDisplay.classList.remove('hidden');
    showScreen('lobby');
});

socket.on('themeUpdated', (data) => {
    selectedTheme = data.theme;
    targetText = data.text;
    setupTextDisplay(targetText);
    
    const selectedThemeDisplay = document.getElementById('selected-theme-display');
    selectedThemeDisplay.classList.remove('hidden');
    document.getElementById('active-theme-name').textContent = data.theme;
    
    // Update button states if P1
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === data.theme);
    });

    updatePlayerList(activePlayers);
});

socket.on('durationUpdated', (data) => {
    selectedDuration = data.duration;
    updateDurationButtons(selectedDuration);
    if (activeDurationValue) activeDurationValue.textContent = selectedDuration;
    if (timerDisplay) timerDisplay.textContent = selectedDuration;
});

function renderThemeButtons(themes, currentTheme) {
    const container = document.querySelector('.theme-buttons');
    container.innerHTML = '';
    themes.forEach(t => {
        const btn = document.createElement('button');
        btn.className = `theme-btn ${t === currentTheme ? 'active' : ''}`;
        btn.dataset.theme = t;
        btn.textContent = t;
        btn.addEventListener('click', () => {
            socket.emit('chooseTheme', t);
        });
        container.appendChild(btn);
    });
}

function updateDurationButtons(duration) {
    durationButtons.forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.duration) === Number(duration));
    });
}

socket.on('playerJoined', (players) => {
    activePlayers = players;
    updatePlayerList(players);
});

socket.on('playerReady', (players) => {
    activePlayers = players;
    updatePlayerList(players);
});

socket.on('playerLeft', (players) => {
    activePlayers = players;
    updatePlayerList(players);
});

socket.on('countdown', (count) => {
    showScreen('game');
    countdownOverlay.classList.remove('hidden');
    countdownNumber.textContent = count > 0 ? count : "GO!";
    
    // Initialize racetrack lanes once
    if (count === 3) {
        const racetrack = document.getElementById('racetrack-lanes');
        racetrack.innerHTML = '';
        const competitors = ghostPlayer ? [...activePlayers, ghostPlayer] : activePlayers;
        competitors.forEach(p => {
            const lane = document.createElement('div');
            lane.className = 'racetrack-lane';
            lane.id = `lane-${p.id}`;
            if (p.id === socket.id) lane.classList.add('me');
            if (p.isGhost) lane.classList.add('ghost');
            
            const label = document.createElement('div');
            label.className = 'lane-label';
            label.textContent = getCompetitorName(p);
            
            const track = document.createElement('div');
            track.className = 'lane-track';
            
            const car = document.createElement('div');
            car.className = 'lane-car';
            car.textContent = p.isGhost ? '👻' : p.role;
            
            track.appendChild(car);
            
            const stats = document.createElement('div');
            stats.className = 'lane-stats';
            stats.textContent = '0 WPM';
            
            lane.appendChild(label);
            lane.appendChild(track);
            lane.appendChild(stats);
            racetrack.appendChild(lane);
        });
    }
});

socket.on('gameStarted', () => {
    countdownOverlay.classList.add('hidden');
    typingInput.disabled = false;
    typingInput.focus();
    startTime = Date.now();
    gameActive = true;
    startGhostReplay();
});

socket.on('timerUpdate', (time) => {
    timerDisplay.textContent = time;
});

socket.on('opponentUpdate', (player) => {
    const lane = document.getElementById(`lane-${player.id}`);
    if (lane) {
        const car = lane.querySelector('.lane-car');
        if (car) car.style.left = player.progress + '%';
        const stats = lane.querySelector('.lane-stats');
        if (stats) stats.textContent = `${player.wpm} WPM`;
    }
    
    const activeP = activePlayers.find(p => p.id === player.id);
    if (activeP) {
        activeP.progress = player.progress;
        activeP.wpm = player.wpm;
        activeP.accuracy = player.accuracy;
    }
    updateLeaderboard();
});

socket.on('gameFinished', (result) => {
    gameActive = false;
    clearGhostReplayTimers();
    typingInput.disabled = true;
    showScreen('results');
    const players = Array.isArray(result) ? result : result.players;
    const resultPlayers = [...players];
    if (!Array.isArray(result) && result.ghost) resultPlayers.push(result.ghost);
    renderPodiumAndStandings(resultPlayers);
    renderGhostResult(Array.isArray(result) ? null : result.ghostResult);
    const isSoloResult = currentMode === 'solo';
    soloResultActions.classList.toggle('hidden', !isSoloResult);
    playAgainBtn.classList.toggle('hidden', isSoloResult);
});

// UI Actions
soloModeBtn.addEventListener('click', () => {
    createRoom('solo', 1);
});

multiplayerModeBtn.addEventListener('click', () => {
    modeSelection.classList.add('hidden');
    multiplayerSetup.classList.remove('hidden');
    playerCapacity.focus();
});

backToModesBtn.addEventListener('click', () => {
    multiplayerSetup.classList.add('hidden');
    modeSelection.classList.remove('hidden');
});

createMultiplayerBtn.addEventListener('click', () => {
    createRoom('multiplayer', Number(playerCapacity.value));
});

readyBtn.addEventListener('click', () => {
    socket.emit('setReady');
    readyBtn.classList.add('hidden');
    soloBtn.classList.add('hidden');
});

startGameBtnHost.addEventListener('click', () => {
    socket.emit('startGame');
});

soloBtn.addEventListener('click', () => {
    socket.emit('playSolo');
    readyBtn.classList.add('hidden');
    soloBtn.classList.add('hidden');
});

copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href);
    copyLinkBtn.textContent = "Copié !";
    setTimeout(() => copyLinkBtn.textContent = "Copier le lien", 2000);
});

playAgainBtn.addEventListener('click', () => {
    socket.emit('playAgain');
});

retrySoloTextBtn.addEventListener('click', () => {
    socket.emit('retrySoloText');
});

changeSoloTextBtn.addEventListener('click', () => {
    socket.emit('changeSoloText');
});

durationButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const d = Number(btn.dataset.duration);
        if ([15, 30, 45, 60].includes(d)) {
            selectedDuration = d;
            if (currentMode === 'solo') {
                ghostRecord = null;
                ghostPlayer = null;
            }
            updateDurationButtons(d);
            if (activeDurationValue) activeDurationValue.textContent = d;
            if (timerDisplay) timerDisplay.textContent = d;
            socket.emit('chooseDuration', d);
        }
    });
});

function resetGameState() {
    clearGhostReplayTimers();
    currentWordIndex = 0;
    gameActive = false;
    startTime = null;
    myLastRank = 1;
    lastEmitTime = 0;
    
    const badge = document.getElementById('leader-badge');
    if (badge) {
        badge.textContent = "Égalité";
        badge.className = "badge";
    }

    typingInput.value = '';
    typingInput.disabled = true;
    wpmDisplay.textContent = '0';
    accDisplay.textContent = '0';
    timerDisplay.textContent = selectedDuration;
    
    // Reset scroller position
    if (textScroller) {
        textScroller.style.transform = 'translateY(0)';
    }
}

typingInput.addEventListener('input', (e) => {
    if (!gameActive) return;

    const input = typingInput.value;
    const currentWord = words[currentWordIndex];
    
    const wordEl = textScroller.children[currentWordIndex];
    if (wordEl) {
        if (input.trim() !== currentWord.substring(0, input.trim().length)) {
            wordEl.classList.add('incorrect');
        } else {
            wordEl.classList.remove('incorrect');
        }
    }

    // Check for space to move to next word
    if (input.endsWith(' ')) {
        const typedWord = input.trim();
        
        if (wordEl) {
            wordEl.classList.remove('current');
            if (typedWord === currentWord) {
                wordEl.className = 'word correct';
            } else {
                wordEl.className = 'word incorrect';
            }
        }
        
        currentWordIndex++;
        
        if (currentWordIndex < words.length) {
            const nextWordEl = textScroller.children[currentWordIndex];
            if (nextWordEl) {
                nextWordEl.classList.add('current');
            }
            scrollCurrentLineToTop();
        }
        
        typingInput.value = '';
        updateStats();
    }
});

// Helper Functions
function joinRoom(id) {
    currentRoomId = id;
    socket.emit('joinRoom', id);
}

function createRoom(mode, maxPlayers) {
    const randomPart = window.crypto?.randomUUID
        ? window.crypto.randomUUID().replaceAll('-', '').slice(0, 8)
        : Math.random().toString(36).substring(2, 10);

    currentRoomId = randomPart;
    currentMode = mode;
    roomMaxPlayers = maxPlayers;
    document.getElementById('connection-error').classList.add('hidden');

    if (mode === 'multiplayer') {
        window.history.pushState({}, '', `?room=${currentRoomId}`);
    } else {
        window.history.replaceState({}, '', window.location.pathname);
    }

    socket.emit('createRoom', { roomId: currentRoomId, mode, maxPlayers });
}

function clearRoomContext() {
    clearGhostReplayTimers();
    currentRoomId = null;
    currentMode = null;
    roomMaxPlayers = 1;
    selectedDuration = 30;
    updateDurationButtons(30);
    if (activeDurationValue) activeDurationValue.textContent = '30';
    activePlayers = [];
    availableThemes = [];
    selectedTheme = null;
    targetText = '';
    ghostRecord = null;
    ghostPlayer = null;
    roomInfo.classList.add('hidden');
    multiplayerSetup.classList.add('hidden');
    modeSelection.classList.remove('hidden');
    window.history.replaceState({}, '', window.location.pathname);
}

function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenId].classList.remove('hidden');
}

function updatePlayerList(players) {
    const me = players.find(p => p.id === socket.id);
    const slotsContainer = document.getElementById('player-slots');
    slotsContainer.innerHTML = '';

    const themeSection = document.getElementById('theme-selection');
    if (me?.role === 'P1') {
        themeSection.classList.remove('hidden');
        renderThemeButtons(availableThemes, selectedTheme);
        if (durationSelection) durationSelection.classList.remove('hidden');
        if (selectedDurationDisplay) selectedDurationDisplay.classList.add('hidden');
        updateDurationButtons(selectedDuration);
    } else {
        themeSection.classList.add('hidden');
        if (durationSelection) durationSelection.classList.add('hidden');
        if (selectedDurationDisplay) selectedDurationDisplay.classList.remove('hidden');
        if (activeDurationValue) activeDurationValue.textContent = selectedDuration;
    }

    if (currentMode === 'solo') {
        waitingStatus.textContent = 'Partie solo';
        multiplayerLobby.classList.add('hidden');
        readyBtn.classList.add('hidden');
        startGameBtnHost.classList.add('hidden');
        soloBtn.classList.toggle('hidden', !targetText);
        return;
    }

    multiplayerLobby.classList.remove('hidden');
    waitingStatus.textContent = `${players.length}/${roomMaxPlayers} joueurs dans le salon`;

    for (let i = 0; i < roomMaxPlayers; i++) {
        const p = players[i];
        const card = document.createElement('div');
        card.className = 'lobby-card';
        
        if (p) {
            if (p.role === 'P1') card.classList.add('host');
            
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.textContent = p.role;
            card.appendChild(avatar);

            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = p.id === socket.id ? 'Vous' : `Joueur ${p.role.replace('P', '')}`;
            card.appendChild(name);

            const badge = document.createElement('span');
            badge.className = `status-badge ${p.ready ? 'ready' : 'not-ready'}`;
            badge.textContent = p.ready ? 'Prêt' : 'Attente';
            card.appendChild(badge);

            if (p.role === 'P1') {
                const hostBadge = document.createElement('span');
                hostBadge.className = 'host-badge';
                hostBadge.textContent = 'Hôte';
                card.appendChild(hostBadge);
            }

            if (me?.role === 'P1' && p.id !== me.id) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-player-btn';
                removeBtn.type = 'button';
                removeBtn.textContent = 'Retirer';
                removeBtn.setAttribute('aria-label', `Retirer Joueur ${p.role.replace('P', '')}`);
                removeBtn.addEventListener('click', () => socket.emit('removePlayer', p.id));
                card.appendChild(removeBtn);
            }
        } else {
            card.classList.add('empty');
            
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.textContent = '?';
            card.appendChild(avatar);

            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = 'En attente...';
            card.appendChild(name);
        }
        slotsContainer.appendChild(card);
    }

    // Toggle button visibility based on role and player counts
    if (me) {
        const isHost = me.role === 'P1';
        const everyoneReady = players.length >= 2 && players.every(player => player.ready);

        if (!targetText) {
            readinessMessage.textContent = isHost
                ? 'Choisissez une thématique pour préparer la course.'
                : 'L’hôte choisit la thématique.';
        } else if (players.length < 2) {
            readinessMessage.textContent = 'Invitez au moins un autre joueur pour commencer.';
        } else if (!everyoneReady) {
            const waitingCount = players.filter(player => !player.ready).length;
            readinessMessage.textContent = `En attente de ${waitingCount} joueur${waitingCount > 1 ? 's' : ''}.`;
        } else {
            readinessMessage.textContent = 'Tout le monde est prêt. La course peut commencer !';
        }
        
        if (targetText) {
            if (isHost) {
                readyBtn.classList.toggle('hidden', me.ready);
                startGameBtnHost.classList.toggle('hidden', !me.ready);
                startGameBtnHost.disabled = !everyoneReady;
            } else {
                startGameBtnHost.classList.add('hidden');
                
                if (me.ready) {
                    readyBtn.classList.add('hidden');
                } else {
                    readyBtn.classList.remove('hidden');
                }
            }
        } else {
            readyBtn.classList.add('hidden');
            startGameBtnHost.classList.add('hidden');
        }
    }
    soloBtn.classList.add('hidden');
}

function setupTextDisplay(text) {
    words = text.split(' ');
    textScroller.innerHTML = words.map(w => `<span class="word">${w}</span>`).join('');
    if (textScroller.children[0]) textScroller.children[0].classList.add('current');
    scrollCurrentLineToTop();
}

function scrollCurrentLineToTop() {
    const currentWordEl = textScroller.children[currentWordIndex];
    if (!currentWordEl) return;
    const offset = currentWordEl.offsetTop;
    textScroller.style.transform = `translateY(-${offset - 16}px)`;
}

function updateStats() {
    const correctWords = Array.from(textScroller.children).filter(el => el.classList.contains('correct')).length;
    const totalTyped = currentWordIndex;
    
    const timeElapsed = (Date.now() - startTime) / 60000; 
    const wpm = Math.round(correctWords / Math.max(timeElapsed, 0.01)) || 0;
    const accuracy = totalTyped > 0 ? Math.round((correctWords / totalTyped) * 100) : 100;
    const progress = (currentWordIndex / words.length) * 100;

    wpmDisplay.textContent = wpm;
    accDisplay.textContent = accuracy;

    // Update local racetrack lane car
    const myLane = document.getElementById(`lane-${socket.id}`);
    if (myLane) {
        const myCar = myLane.querySelector('.lane-car');
        if (myCar) myCar.style.left = progress + '%';
        const myStats = myLane.querySelector('.lane-stats');
        if (myStats) myStats.textContent = `${wpm} WPM`;
    }

    const myActive = activePlayers.find(p => p.id === socket.id);
    if (myActive) {
        myActive.progress = progress;
        myActive.wpm = wpm;
        myActive.accuracy = accuracy;
    }

    updateLeaderboard();

    // Throttled WebSocket update
    const now = Date.now();
    if (now - lastEmitTime >= throttleMs || progress === 100) {
        socket.emit('updateProgress', { progress, wpm, accuracy, currentWordIndex, correctWords });
        lastEmitTime = now;
    }
}

function createGhostCompetitor(record) {
    return {
        ...record,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        score: 0,
        isGhost: true
    };
}

function clearGhostReplayTimers() {
    ghostReplayTimers.forEach(timer => clearTimeout(timer));
    ghostReplayTimers = [];
}

function startGhostReplay() {
    clearGhostReplayTimers();
    if (!ghostPlayer || !Array.isArray(ghostRecord?.snapshots)) return;

    ghostRecord.snapshots.forEach(snapshot => {
        const timer = setTimeout(() => {
            if (!gameActive || !ghostPlayer) return;
            applyGhostSnapshot(snapshot);
        }, Math.max(0, Number(snapshot.elapsedMs) || 0));
        ghostReplayTimers.push(timer);
    });
}

function applyGhostSnapshot(snapshot) {
    ghostPlayer.progress = snapshot.progress;
    ghostPlayer.wpm = snapshot.wpm;
    ghostPlayer.accuracy = snapshot.accuracy;

    const lane = document.getElementById(`lane-${ghostPlayer.id}`);
    if (lane) {
        const car = lane.querySelector('.lane-car');
        if (car) car.style.left = `${ghostPlayer.progress}%`;
        const stats = lane.querySelector('.lane-stats');
        if (stats) stats.textContent = `${ghostPlayer.wpm} WPM`;
    }

    updateLeaderboard();
}

function updateLeaderboard() {
    const myWpm = parseInt(wpmDisplay.textContent) || 0;
    const myAcc = parseInt(accDisplay.textContent) || 100;
    const myScore = Math.round(myWpm * (myAcc / 100));
    
    const competitors = ghostPlayer ? [...activePlayers, ghostPlayer] : activePlayers;
    const standings = competitors.map(p => {
        if (p.id === socket.id) {
            return { id: p.id, score: myScore };
        } else {
            return { id: p.id, score: calculateScore(p) };
        }
    });
    
    standings.sort((a, b) => b.score - a.score);
    
    const myCurrentRankIndex = standings.findIndex(p => p.id === socket.id);
    const myCurrentRank = myCurrentRankIndex !== -1 ? myCurrentRankIndex + 1 : 1;
    
    const badge = document.getElementById('leader-badge');
    if (badge) {
        if (myCurrentRank === 1) {
            badge.textContent = "1er";
            badge.className = "badge leading";
        } else {
            badge.textContent = `${myCurrentRank}e`;
            badge.className = "badge trailing";
        }
    }
    
    if (myCurrentRank > myLastRank && gameActive) {
        playAlertSound();
    }
    
    myLastRank = myCurrentRank;
}

function getCompetitorName(player) {
    if (player.isGhost) return 'Votre record';
    if (player.id === socket.id) return 'Vous';
    return player.role === 'P1' ? 'Hôte' : `Joueur ${player.role.replace('P', '')}`;
}

function calculateScore(player) {
    return Math.round(player.wpm * (player.accuracy / 100));
}

function renderPodiumAndStandings(players) {
    const sorted = players.map(p => ({
        ...p,
        score: calculateScore(p)
    })).sort((a, b) => b.score - a.score);

    // Dynamic result title
    const myRank = sorted.findIndex(p => p.id === socket.id) + 1;
    if (myRank === 1) {
        document.getElementById('result-title').textContent = "Victoire ! 🏆";
    } else {
        document.getElementById('result-title').textContent = `Fini ! Rang: ${myRank}`;
    }

    const podiumContainer = document.getElementById('podium-container');
    podiumContainer.innerHTML = '';

    const top3 = sorted.slice(0, 3);
    const podiumOrder = [];
    if (top3[1]) podiumOrder.push({ spot: 'second', player: top3[1], rank: 2 });
    if (top3[0]) podiumOrder.push({ spot: 'first', player: top3[0], rank: 1 });
    if (top3[2]) podiumOrder.push({ spot: 'third', player: top3[2], rank: 3 });

    podiumOrder.forEach(item => {
        const p = item.player;
        
        const spotDiv = document.createElement('div');
        spotDiv.className = `podium-spot ${item.spot}`;
        if (p.isGhost) spotDiv.classList.add('ghost');

        const playerDiv = document.createElement('div');
        playerDiv.className = 'podium-player';

        const avatar = document.createElement('div');
        avatar.className = 'podium-avatar';
        avatar.textContent = p.isGhost ? '👻' : (item.rank === 1 ? '🥇' : (item.rank === 2 ? '🥈' : '🥉'));

        const name = document.createElement('div');
        name.className = 'podium-name';
        name.textContent = getResultCompetitorName(p);

        const wpm = document.createElement('div');
        wpm.className = 'podium-wpm';
        wpm.textContent = `${p.wpm} WPM - ${p.accuracy}%`;

        playerDiv.appendChild(avatar);
        playerDiv.appendChild(name);
        playerDiv.appendChild(wpm);

        const column = document.createElement('div');
        column.className = 'podium-column';
        column.textContent = item.rank;

        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'podium-score';
        scoreSpan.textContent = `${p.score} pts`;
        column.appendChild(scoreSpan);

        spotDiv.appendChild(playerDiv);
        spotDiv.appendChild(column);
        podiumContainer.appendChild(spotDiv);
    });

    const standingsContainer = document.getElementById('standings-table-container');
    const tbody = document.getElementById('standings-tbody');
    tbody.innerHTML = '';

    if (sorted.length > 3) {
        standingsContainer.classList.remove('hidden');
        const rest = sorted.slice(3);
        rest.forEach((p, idx) => {
            const rank = idx + 4;
            const tr = document.createElement('tr');

            const tdRank = document.createElement('td');
            tdRank.textContent = `${rank}e`;

            const tdName = document.createElement('td');
            tdName.textContent = getResultCompetitorName(p);

            const tdScore = document.createElement('td');
            tdScore.textContent = `${p.score} pts`;

            const tdWpm = document.createElement('td');
            tdWpm.textContent = `${p.wpm}`;

            const tdAcc = document.createElement('td');
            tdAcc.textContent = `${p.accuracy}%`;

            tr.appendChild(tdRank);
            tr.appendChild(tdName);
            tr.appendChild(tdScore);
            tr.appendChild(tdWpm);
            tr.appendChild(tdAcc);
            tbody.appendChild(tr);
        });
    } else {
        standingsContainer.classList.add('hidden');
    }
}

function renderGhostResult(ghostResult) {
    const feedback = document.getElementById('ghost-result-feedback');
    if (!ghostResult) {
        feedback.classList.add('hidden');
        feedback.classList.remove('new-best', 'not-beaten');
        return;
    }

    const isNewBest = ghostResult.outcome === 'new-best';
    feedback.classList.remove('hidden', 'new-best', 'not-beaten');
    feedback.classList.add(isNewBest ? 'new-best' : 'not-beaten');
    document.getElementById('ghost-result-heading').textContent = isNewBest
        ? 'Nouveau meilleur score'
        : 'Record non battu';

    const differences = ghostResult.differences;
    document.getElementById('ghost-diff-score').textContent = formatDifference(differences.score);
    document.getElementById('ghost-diff-wpm').textContent = formatDifference(differences.wpm);
    document.getElementById('ghost-diff-accuracy').textContent = formatDifference(differences.accuracy, '%');
    document.getElementById('ghost-diff-progress').textContent = formatDifference(differences.progress, '%');
}

function formatDifference(value, suffix = '') {
    const rounded = Math.round(Number(value) * 10) / 10;
    const prefix = rounded > 0 ? '+' : '';
    return `${prefix}${rounded}${suffix}`;
}

function getResultCompetitorName(player) {
    if (player.isGhost) return 'Votre record';
    if (player.id === socket.id) return 'Vous';
    return `Joueur ${player.role.replace('P', '')}`;
}

init();
