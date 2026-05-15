const socket = io();

// UI Elements
const screens = {
    lobby: document.getElementById('lobby'),
    waiting: document.getElementById('waiting'),
    game: document.getElementById('game'),
    results: document.getElementById('results')
};

const startBtn = document.getElementById('start-game-btn');
const readyBtn = document.getElementById('ready-btn');
const soloBtn = document.getElementById('solo-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const copyLinkBtn = document.getElementById('copy-link');
const roomIdDisplay = document.querySelector('#room-id-display span');
const typingInput = document.getElementById('typing-input');
const textDisplay = document.getElementById('text-display');
const timerDisplay = document.getElementById('timer');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const p1Progress = document.getElementById('player-progress');
const p2Progress = document.getElementById('opponent-progress');
const wpmDisplay = document.getElementById('current-wpm');
const accDisplay = document.getElementById('current-accuracy');

// Game State
let currentRoomId = null;
let targetText = "";
let words = [];
let currentWordIndex = 0;
let startTime = null;
let gameActive = false;
let lastLeader = null; // 'me', 'opponent', or null
let opponentScore = 0;

// Audio Context for notification
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playAlertSound() {
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
    updatePlayerList(data.players);
    resetGameState();
    showScreen('waiting');
    
    // Theme setup
    const me = data.players.find(p => p.id === socket.id);
    const themeSection = document.getElementById('theme-selection');
    const selectedThemeDisplay = document.getElementById('selected-theme-display');
    
    if (me && me.role === 'P1') {
        themeSection.classList.remove('hidden');
        renderThemeButtons(data.themes, data.currentTheme);
    } else {
        themeSection.classList.add('hidden');
    }

    if (data.currentTheme) {
        targetText = data.text;
        setupTextDisplay(targetText);
        selectedThemeDisplay.classList.remove('hidden');
        document.getElementById('active-theme-name').textContent = data.currentTheme;
        readyBtn.classList.remove('hidden');
        if (data.players.length === 1) soloBtn.classList.remove('hidden');
    } else {
        selectedThemeDisplay.classList.add('hidden');
        readyBtn.classList.add('hidden');
        if (soloBtn) soloBtn.classList.add('hidden');
    }

    document.getElementById('room-info').classList.remove('hidden');
    roomIdDisplay.textContent = currentRoomId;
});

socket.on('themeUpdated', (data) => {
    targetText = data.text;
    setupTextDisplay(targetText);
    
    const selectedThemeDisplay = document.getElementById('selected-theme-display');
    selectedThemeDisplay.classList.remove('hidden');
    document.getElementById('active-theme-name').textContent = data.theme;
    
    // Update button states if P1
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === data.theme);
    });

    readyBtn.classList.remove('hidden');
    const player2 = document.getElementById('player-2').querySelector('.name').textContent !== "Adversaire";
    if (player2) {
        soloBtn.classList.remove('hidden');
    }
});

function renderThemeButtons(themes, currentTheme) {
    const container = document.querySelector('.theme-buttons');
    container.innerHTML = themes.map(t => `
        <button class="theme-btn ${t === currentTheme ? 'active' : ''}" data-theme="${t}">
            ${t}
        </button>
    `).join('');

    container.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            socket.emit('chooseTheme', btn.dataset.theme);
        });
    });
}

socket.on('playerJoined', (players) => {
    updatePlayerList(players);
});

socket.on('playerReady', (players) => {
    updatePlayerList(players);
});

socket.on('countdown', (count) => {
    showScreen('game');
    countdownOverlay.classList.remove('hidden');
    countdownNumber.textContent = count > 0 ? count : "GO!";
});

socket.on('gameStarted', () => {
    countdownOverlay.classList.add('hidden');
    typingInput.disabled = false;
    typingInput.focus();
    startTime = Date.now();
    gameActive = true;
});

socket.on('timerUpdate', (time) => {
    timerDisplay.textContent = time;
});

socket.on('opponentUpdate', (player) => {
    p2Progress.style.width = player.progress + '%';
    opponentScore = calculateScore(player);
    updateLeaderboard();
    
    // Update opponent cursor
    const oldCursor = document.querySelector('.word.opponent-current');
    if (oldCursor) oldCursor.classList.remove('opponent-current');
    
    const newCursor = textScroller.children[player.currentWordIndex];
    if (newCursor) newCursor.classList.add('opponent-current');
});

socket.on('gameFinished', (players) => {
    gameActive = false;
    typingInput.disabled = true;
    showScreen('results');
    
    const p1 = players.find(p => p.id === socket.id);
    const p2 = players.find(p => p.id !== socket.id);

    displayResults('p1', p1);
    
    const p1Score = calculateScore(p1);
    const p2Score = p2 ? calculateScore(p2) : 0;
    
    if (p2) {
        displayResults('p2', p2);
        document.querySelector('.result-card.opponent').classList.remove('hidden');
        document.getElementById('result-title').textContent = 
            (p1Score >= p2Score) ? "Victoire !" : "Défaite...";
    } else {
        document.querySelector('.result-card.opponent').classList.add('hidden');
        
        let bestScore = parseInt(localStorage.getItem('bestSoloScore') || '0');
        
        if (p1Score > bestScore) {
            document.getElementById('result-title').textContent = `Nouveau Record ! (${p1Score} pts)`;
            localStorage.setItem('bestSoloScore', p1Score.toString());
        } else {
            document.getElementById('result-title').textContent = `Partie terminée. (Record: ${bestScore} pts)`;
        }
    }
});

// UI Actions
startBtn.addEventListener('click', () => {
    const id = Math.random().toString(36).substring(2, 8);
    window.history.pushState({}, '', `?room=${id}`);
    joinRoom(id);
});

readyBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    socket.emit('setReady');
    readyBtn.classList.add('hidden');
    soloBtn.classList.add('hidden');
});

soloBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
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

function resetGameState() {
    currentWordIndex = 0;
    gameActive = false;
    startTime = null;
    lastLeader = null;
    opponentScore = 0;
    
    const badge = document.getElementById('leader-badge');
    if (badge) {
        badge.textContent = "Égalité";
        badge.className = "badge";
    }

    typingInput.value = '';
    typingInput.disabled = true;
    p1Progress.style.width = '0%';
    p2Progress.style.width = '0%';
    wpmDisplay.textContent = '0';
    accDisplay.textContent = '0';
    timerDisplay.textContent = '60';
    
    // Clear opponent cursor
    const oldCursor = document.querySelector('.word.opponent-current');
    if (oldCursor) oldCursor.classList.remove('opponent-current');
    
    // Reset scroller position
    if (typeof textScroller !== 'undefined') {
        textScroller.style.transform = 'translateY(0)';
    }
}

// v0.4: Backspace is now allowed. Remove the old v0.1 penalty.
typingInput.addEventListener('keydown', (e) => {
    // No longer marking word as error on backspace
});

typingInput.addEventListener('input', (e) => {
    if (!gameActive) return;

    const input = typingInput.value;
    const currentWord = words[currentWordIndex];
    
    // Visual feedback while typing (optional but good for UX)
    const wordEl = textScroller.children[currentWordIndex];
    if (input.trim() !== currentWord.substring(0, input.trim().length)) {
        wordEl.classList.add('incorrect');
    } else {
        wordEl.classList.remove('incorrect');
    }

    // Check for space to move to next word
    if (input.endsWith(' ')) {
        const typedWord = input.trim();
        
        wordEl.classList.remove('current');
        
        if (typedWord === currentWord) {
            wordEl.className = 'word correct';
        } else {
            wordEl.className = 'word incorrect';
        }
        
        currentWordIndex++;
        
        if (currentWordIndex < words.length) {
            const nextWordEl = textScroller.children[currentWordIndex];
            nextWordEl.classList.add('current');
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

function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenId].classList.remove('hidden');
}

function updatePlayerList(players) {
    const me = players.find(p => p.id === socket.id);
    const other = players.find(p => p.id !== socket.id);

    const p1Slot = document.getElementById('player-1');
    const p2Slot = document.getElementById('player-2');

    if (me) p1Slot.querySelector('.status').textContent = me.ready ? "Prêt" : "Pas prêt";
    
    if (other) {
        p2Slot.querySelector('.avatar').textContent = "P2";
        p2Slot.querySelector('.name').textContent = "Adversaire";
        p2Slot.querySelector('.status').textContent = other.ready ? "Prêt" : "Pas prêt";
        if (targetText) readyBtn.classList.remove('hidden');
        soloBtn.classList.add('hidden');
    } else {
        p2Slot.querySelector('.avatar').textContent = "?";
        p2Slot.querySelector('.name').textContent = "En attente...";
        p2Slot.querySelector('.status').textContent = "";
        if (!targetText) {
            readyBtn.classList.add('hidden');
            soloBtn.classList.add('hidden');
        } else {
            soloBtn.classList.remove('hidden');
        }
    }

    if (me && me.ready) {
        readyBtn.classList.add('hidden');
        soloBtn.classList.add('hidden');
    }
}

const textScroller = document.getElementById('text-scroller');

function setupTextDisplay(text) {
    words = text.split(' ');
    textScroller.innerHTML = words.map(w => `<span class="word">${w}</span>`).join('');
    if (textScroller.children[0]) textScroller.children[0].classList.add('current');
    scrollCurrentLineToTop();
}

function scrollCurrentLineToTop() {
    const currentWordEl = textScroller.children[currentWordIndex];
    if (!currentWordEl) return;
    
    // We want the current word's line to be at the top of the display.
    const offset = currentWordEl.offsetTop;
    // We adjust for the container padding (16px = 1rem)
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
    p1Progress.style.width = progress + '%';

    updateLeaderboard();

    socket.emit('updateProgress', { progress, wpm, accuracy, currentWordIndex });
}

function updateLeaderboard() {
    const myWpm = parseInt(wpmDisplay.textContent);
    const myAcc = parseInt(accDisplay.textContent);
    const myScore = Math.round(myWpm * (myAcc / 100));
    
    const badge = document.getElementById('leader-badge');
    let currentLeader = null;

    if (myScore > opponentScore) {
        currentLeader = 'me';
        badge.textContent = "Vous menez";
        badge.className = "badge leading";
    } else if (opponentScore > myScore) {
        currentLeader = 'opponent';
        badge.textContent = "Adversaire mène";
        badge.className = "badge trailing";
    } else {
        badge.textContent = "Égalité";
        badge.className = "badge";
    }

    if (currentLeader === 'opponent' && lastLeader !== 'opponent' && gameActive) {
        playAlertSound();
    }
    
    lastLeader = currentLeader;
}

function calculateScore(player) {
    return Math.round(player.wpm * (player.accuracy / 100));
}

function displayResults(prefix, player) {
    const score = calculateScore(player);
    document.getElementById(`res-${prefix}-score`).textContent = score;
    document.getElementById(`res-${prefix}-wpm`).textContent = player.wpm;
    document.getElementById(`res-${prefix}-acc`).textContent = player.accuracy;
}

init();
