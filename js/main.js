import { KINKY_QUOTES, QUOTE_FLIP_INTERVAL_MS, STORAGE_KEY, PENALTY_DURATION_MS } from './constants.js';
import * as ui from './ui.js';
import * as timer from './timer.js';
import { ACHIEVEMENTS, RANDOM_EVENTS, WHEEL_OUTCOMES } from './constants.js';
import { initWheel } from './game_wheel.js';

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
    achievements: {},
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
    state.achievements = getLocalStorage('chastity_achievements') || {}; // Load achievements

    if (!state.currentTimer && !state.pendingPin) {
        state.pendingPin = generatePin();
        setLocalStorage(STORAGE_KEY.PENDING_PIN, state.pendingPin);
    }
}

function grantAchievement(id) {
    if (!state.achievements[id]) {
        state.achievements[id] = true;
        setLocalStorage('chastity_achievements', state.achievements);
        ui.showAchievement(ACHIEVEMENTS[id]);
    }
}

function saveHistory() {
    setLocalStorage(STORAGE_KEY.HISTORY, state.history);
}

function generatePin() {
    let pin = '';
    for (let i = 0; i < 12; i++) {
        pin += Math.floor(Math.random() * 10);
    }
    return pin;
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
    // Random Event Trigger (e.g., 25% chance on each attempt)
    if (Math.random() < 0.25) {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        setLocalStorage('chastity_active_event', { ...event, expiry: Date.now() + event.duration });
        ui.showModal(event.name, event.description);
        return; // Stop the unlock process
    }

    const activeEvent = getLocalStorage('chastity_active_event');
    if (activeEvent && Date.now() < activeEvent.expiry && activeEvent.name.includes('Lockdown')) {
         ui.showModal(activeEvent.name, "You cannot attempt an unlock during a lockdown event.");
         return;
    }
    
    // Previous penalty check
    const penaltyEnd = getLocalStorage(STORAGE_KEY.PENALTY_END);
    if (penaltyEnd && Date.now() < penaltyEnd) {
        const minutes = Math.ceil((penaltyEnd - Date.now()) / 60000);
        ui.showModal("Penalty Active", `You cannot attempt an unlock for another ${minutes} minute(s).`);
        return;
    }
    
    // Show the Wheel of Fortune screen
    ui.switchScreen('wheel-screen');
    initWheel(handleWheelResult);
}

function handleWheelResult(outcome) {
    ui.showModal("Wheel Result", `The wheel landed on: ${outcome.text}`);
    setLocalStorage('chastity_wheel_modifier', outcome.effect || null);

    switch(outcome.type) {
        case 'addTime':
            state.currentTimer.startTime -= outcome.value; // Effectively adds time
            setLocalStorage(STORAGE_KEY.CURRENT_TIMER, state.currentTimer);
            break;
        case 'subtractTime':
            state.currentTimer.startTime += outcome.value; // Effectively subtracts time
            setLocalStorage(STORAGE_KEY.CURRENT_TIMER, state.currentTimer);
            break;
        case 'play':
            setTimeout(() => ui.switchScreen('game-selection-screen'), 1500);
            break;
        case 'nothing':
            setTimeout(() => ui.switchScreen('timer-screen'), 1500);
            break;
        case 'modifier':
            setTimeout(() => ui.switchScreen('game-selection-screen'), 1500);
            break;
    }
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

    let penalty = PENALTY_DURATION_MS;
    const wheelModifier = getLocalStorage('chastity_wheel_modifier');
    const activeEvent = getLocalStorage('chastity_active_event');

    if (wheelModifier === 'doublePenalty') penalty *= 2;
    if (activeEvent?.effect === 'halfPenalty' && Date.now() < activeEvent.expiry) penalty /= 2;
    
    state.gameAttempts.push({ name: state.currentGame, result: 'Loss', penalty });
    
    if (state.gameAttempts.filter(a => a.result === 'Loss').length >= 3) {
        grantAchievement('lose3');
    }

    const penaltyEndTime = Date.now() + penalty;
    setLocalStorage(STORAGE_KEY.PENALTY_END, penaltyEndTime);

    let totalPenalty = getLocalStorage(STORAGE_KEY.TOTAL_PENALTY) || 0;
    totalPenalty += penalty;
    setLocalStorage(STORAGE_KEY.TOTAL_PENALTY, totalPenalty);

    ui.showModal("Failure", `A penalty of ${penalty / 60000} minutes has been applied.`, false, () => {
        ui.switchScreen('timer-screen');
        timer.startUpdateInterval(); 
    });
}

function endSession() {
    if (!state.currentTimer) return;
    
    const endTime = Date.now();
    const duration = endTime - state.currentTimer.startTime;
    
    // Check for duration-based achievements
    if (duration >= 7 * 24 * 60 * 60 * 1000) grantAchievement('lock7d');
    else if (duration >= 24 * 60 * 60 * 1000) grantAchievement('lock24h');

    const totalPenalty = getLocalStorage(STORAGE_KEY.TOTAL_PENALTY) || 0;

    const historyItem = {
        startTime: state.currentTimer.startTime,
        endTime: endTime,
        pin: state.currentTimer.pin,
        comment: '',
        penaltyTime: totalPenalty,
        gameAttempts: state.gameAttempts,
    };

    state.history.unshift(historyItem);
    saveHistory();

    // Clear the current session data
    state.currentTimer = null;
    state.gameAttempts = [];
    localStorage.removeItem(STORAGE_KEY.CURRENT_TIMER);
    localStorage.removeItem(STORAGE_KEY.TOTAL_PENALTY);
    localStorage.removeItem(STORAGE_KEY.PENALTY_END);
    localStorage.removeItem(STORAGE_KEY.GAME_STATE);
    localStorage.removeItem('chastity_wheel_modifier');
    localStorage.removeItem('chastity_active_event');


    state.pendingPin = generatePin();
    setLocalStorage(STORAGE_KEY.PENDING_PIN, state.pendingPin);

    loadState();
    ui.renderUIForNoTimer(state.pendingPin);
    ui.renderHistory(state.history, saveComment, deleteHistoryItem);
    ui.switchScreen('timer-screen');
}

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
    document.getElementById('back-to-selection-btn').addEventListener('click', () => ui.switchScreen('game-selection-screen'));

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

    // Clear any stale game state if no timer is active
    if (!state.currentTimer) {
        localStorage.removeItem(STORAGE_KEY.GAME_STATE);
    }
    
    const savedGameState = getLocalStorage(STORAGE_KEY.GAME_STATE);
    
    // Scenario 1: Game was won but session not ended
    if (state.currentTimer && savedGameState?.won) {
        const endTime = Date.now();
        ui.updateTimerDisplay(endTime - state.currentTimer.startTime);
        ui.showFinishedState(state.currentTimer.pin, endTime);

    // Scenario 2: A timer is actively running
    } else if (state.currentTimer) {
        ui.renderUIForActiveTimer(state.currentTimer.startTime);
        timer.startUpdateInterval();

    // Scenario 3: No active timer, ready to start
    } else {
        ui.renderUIForNoTimer(state.pendingPin);
    }
    
    ui.renderHistory(state.history, saveComment, deleteHistoryItem);
    setupEventListeners();
    startQuoteFlipper();
    ui.switchScreen('timer-screen');
}

// Start the application
initializeApp();
