import { KINKY_QUOTES, QUOTE_FLIP_INTERVAL_MS, STORAGE_KEY, PENALTY_DURATION_MS } from './constants.js';
import * as ui from './ui.js';
import * as timer from './timer.js';

// Import game initializers
import { initMemoryGame } from './game_memory.js';
// Note: You would import the other game files here once you create them.
// import { initTicTacToe } from './game_tictactoe.js'; 
// import { initGuessTheNumber } from './game_guess.js';
// import { initSimonSays } from './game_simon.js';

// --- State Management ---
let state = {
    currentTimer: null,
    history: [],
    pendingPin: null,
    gameAttempts: [],
};

function getLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        ui.showModal("Storage Error", "Could not read data. Your browser's local storage might be disabled or full.");
        return null;
    }
}

function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        ui.showModal("Storage Error", "Could not save data. Your browser's local storage might be disabled or full.");
    }
}

function loadState() {
    state.currentTimer = getLocalStorage(STORAGE_KEY.CURRENT_TIMER);
    state.history = getLocalStorage(STORAGE_KEY.HISTORY) || [];
    state.pendingPin = getLocalStorage(STORAGE_KEY.PENDING_PIN);

    if (!state.currentTimer && !state.pendingPin) {
        state.pendingPin = generatePin();
        setLocalStorage(STORAGE_KEY.PENDING_PIN, state.pendingPin);
    }
}

function saveHistory() {
    setLocalStorage(STORAGE_KEY.HISTORY, state.history);
}

function generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// --- Application Logic ---

function startNewTimer() {
    const timerType = document.querySelector('input[name="timerType"]:checked').value;
    const now = Date.now();

    state.currentTimer = {
        startTime: now,
        pin: state.pendingPin,
        isMinimum: timerType === 'random',
        minEndTime: null,
    };

    if (timerType === 'random') {
        const minHours = 12;
        const maxHours = 72;
        const randomHours = Math.floor(Math.random() * (maxHours - minHours + 1)) + minHours;
        state.currentTimer.minEndTime = now + (randomHours * 60 * 60 * 1000);
    }

    setLocalStorage(STORAGE_KEY.CURRENT_TIMER, state.currentTimer);
    localStorage.removeItem(STORAGE_KEY.PENDING_PIN);
    state.pendingPin = null;

    ui.renderUIForActiveTimer(now);
    timer.startUpdateInterval();
}

function attemptUnlock() {
    const penaltyEnd = getLocalStorage(STORAGE_KEY.PENALTY_END);
    if (penaltyEnd && Date.now() < penaltyEnd) {
        const minutes = Math.ceil((penaltyEnd - Date.now()) / 60000);
        ui.showModal("Penalty Active", `You cannot attempt an unlock for another ${minutes} minute(s).`);
        return;
    }
    ui.switchScreen('game-selection-screen');
}

// js/main.js

function startGame(gameType) {
    ui.switchScreen('game-screen');
    document.querySelectorAll('.game-container').forEach(c => c.style.display = 'none');

    // Store the name of the game we are about to play
    state.currentGame = gameType;

    const savedGameState = getLocalStorage(STORAGE_KEY.GAME_STATE);

    if (gameType === 'memory') {
        initMemoryGame(winGame, loseGame, savedGameState);
    } else {
        ui.showModal("Game Not Implemented", "This game is not ready yet.");
        ui.switchScreen('game-selection-screen');
    }
}

function winGame() {
    timer.stopUpdateInterval();
    localStorage.removeItem(STORAGE_KEY.GAME_STATE);
    
    // Log the winning game attempt
    state.gameAttempts.push({ name: state.currentGame, result: 'Win', penalty: 0 });

    const endTime = Date.now();
    const duration = endTime - state.currentTimer.startTime;
    ui.updateTimerDisplay(duration);
    ui.showFinishedState(state.currentTimer.pin, endTime);
    
    ui.showModal("Success!", "You may now end your session.", false, () => {
        ui.switchScreen('timer-screen');
    });
}

function loseGame() {
    localStorage.removeItem(STORAGE_KEY.GAME_STATE);

    // Log the losing game attempt with the penalty
    state.gameAttempts.push({ name: state.currentGame, result: 'Loss', penalty: PENALTY_DURATION_MS });

    const penaltyEndTime = Date.now() + PENALTY_DURATION_MS;
    setLocalStorage(STORAGE_KEY.PENALTY_END, penaltyEndTime);

    let totalPenalty = getLocalStorage(STORAGE_KEY.TOTAL_PENALTY) || 0;
    totalPenalty += PENALTY_DURATION_MS;
    setLocalStorage(STORAGE_KEY.TOTAL_PENALTY, totalPenalty);

    ui.showModal("Failure", "A 30-minute penalty has been applied.", false, () => {
        ui.switchScreen('timer-screen');
        timer.startUpdateInterval(); 
    });
}

function endSession() {
    if (!state.currentTimer) return;
    
    const endTime = Date.now();
    const totalPenalty = getLocalStorage(STORAGE_KEY.TOTAL_PENALTY) || 0;

    const historyItem = {
        startTime: state.currentTimer.startTime,
        endTime: endTime,
        pin: state.currentTimer.pin,
        comment: '',
        penaltyTime: totalPenalty,
        gameAttempts: state.gameAttempts, // <-- Add the logged games to the history item
    };

    state.history.unshift(historyItem);
    saveHistory();

    // Clear the current session data
    state.currentTimer = null;
    state.gameAttempts = []; // <-- Reset game attempts for the next session
    localStorage.removeItem(STORAGE_KEY.CURRENT_TIMER);
    localStorage.removeItem(STORAGE_KEY.TOTAL_PENALTY);
    localStorage.removeItem(STORAGE_KEY.PENALTY_END);
    localStorage.removeItem(STORAGE_KEY.GAME_STATE);

    state.pendingPin = generatePin();
    setLocalStorage(STORAGE_KEY.PENDING_PIN, state.pendingPin);

    loadState();
    ui.renderUIForNoTimer(state.pendingPin);
    ui.renderHistory(state.history, saveComment, deleteHistoryItem);
    ui.switchScreen('timer-screen');
}

function resetApp() {
    ui.showModal(
        "Reset All Data?",
        "This will permanently delete all timer and history data. This cannot be undone.",
        true, // Show confirm button
        () => {
            localStorage.clear();
            loadState(); // Reload the initial state
            initializeApp(); // Re-initialize the app view
            ui.showModal("Success", "All application data has been reset.");
        }
    );
}

function saveComment(index, text) {
    if (state.history[index]) {
        state.history[index].comment = text;
        saveHistory();
    }
}

function deleteHistoryItem(index) {
     ui.showModal(
        "Delete Session?",
        "Are you sure you want to delete this history item permanently?",
        true,
        () => {
            state.history.splice(index, 1);
            saveHistory();
            ui.renderHistory(state.history, saveComment, deleteHistoryItem);
        }
    );
}

// --- Quote Flipper ---
function startQuoteFlipper() {
    const quoteBanner = document.getElementById('quote-banner');
    if (!quoteBanner) return;

    setInterval(() => {
        quoteBanner.style.opacity = '0';
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * KINKY_QUOTES.length);
            quoteBanner.textContent = KINKY_QUOTES[randomIndex];
            quoteBanner.style.opacity = '1';
        }, 1000);
    }, QUOTE_FLIP_INTERVAL_MS);
}

// --- Event Listeners ---
function setupEventListeners() {
    document.getElementById('start-button').addEventListener('click', startNewTimer);
    document.getElementById('unlock-button').addEventListener('click', attemptUnlock);
    document.getElementById('reset-button').addEventListener('click', endSession);
    document.getElementById('reset-app-button').addEventListener('click', resetApp);
    document.getElementById('back-to-timer-btn').addEventListener('click', () => ui.switchScreen('timer-screen'));

    document.getElementById('game-selection-buttons').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const gameType = e.target.dataset.game;
            startGame(gameType);
        }
    });
}

// --- Initial Load ---
function initializeApp() {
    loadState();

    if (getLocalStorage(STORAGE_KEY.GAME_STATE)?.won) {
        // If game was won but session not ended, show finished state
        const endTime = Date.now();
        const duration = endTime - state.currentTimer.startTime;
        ui.updateTimerDisplay(duration);
        ui.showFinishedState(state.currentTimer.pin, endTime);
    } else if (state.currentTimer) {
        ui.renderUIForActiveTimer(state.currentTimer.startTime);
        timer.startUpdateInterval();
    } else {
        ui.renderUIForNoTimer(state.pendingPin);
    }
    
    ui.renderHistory(state.history, saveComment, deleteHistoryItem);
    setupEventListeners();
    startQuoteFlipper();
    ui.switchScreen('timer-screen'); // Ensure timer screen is always the default on load
}

// Start the application
initializeApp();
