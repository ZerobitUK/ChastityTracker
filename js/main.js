import { MOTIVATIONAL_QUOTES, QUOTE_FLIP_INTERVAL_MS, STORAGE_KEY, PENALTY_DURATION_MS, ACHIEVEMENTS, RANDOM_EVENTS } from './constants.js';
import * as ui from './ui.js';
import * as timer from './timer.js';
import * as sounds from './sounds.js';
import { initWheel } from './game_wheel.js';
import { initMemoryGame } from './game_memory.js';
import { initTicTacToe } from './game_tictactoe.js';
import { initGuessTheNumber } from './game_guess.js';
import { initSimonSays } from './game_simon.js';
import { initMinefield } from './game_minefield.js';

// A simple secret key for the checksum. In a real application, this should be more complex.
const CHECKSUM_SECRET = "ChastityTrackerSecretKey";

let state = {
    currentTimer: null,
    history: [],
    pendingPin: null,
    gameAttempts: [],
    achievements: {},
    currentGame: null,
};

// --- Security / Checksum ---

/**
 * Creates a simple checksum from the timer data to detect tampering.
 * @param {object} timerData - The current timer object.
 * @returns {string} A simple hash string.
 */
function createChecksum(timerData) {
    if (!timerData) return null;
    const dataString = `${timerData.startTime}-${timerData.minEndTime}-${timerData.maxEndTime}-${CHECKSUM_SECRET}`;
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

// --- Local Storage Management ---

function getLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Error reading from local storage:", e);
        ui.showModal("Storage Error", "Could not read data. Your browser's local storage might be disabled or full.");
        return null;
    }
}

function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error("Error writing to local storage:", e);
        ui.showModal("Storage Error", "Could not save data. Your browser's local storage might be disabled or full.");
    }
}

// --- State Management ---

function loadState() {
    state.currentTimer = getLocalStorage(STORAGE_KEY.CURRENT_TIMER);
    state.history = getLocalStorage(STORAGE_KEY.HISTORY) || [];
    state.pendingPin = getLocalStorage(STORAGE_KEY.PENDING_PIN);
    state.achievements = getLocalStorage('chastity_achievements') || {};
    
    // Verify checksum if a timer is active
    if (state.currentTimer) {
        const expectedChecksum = createChecksum(state.currentTimer);
        if (state.currentTimer.checksum !== expectedChecksum) {
            ui.showModal("Tamper Detected", "Your session data has been modified externally. The session has been reset.", false, () => {
                endSession(true); // Force end session without saving
            });
            return;
        }
    }


    if (!state.currentTimer && !state.pendingPin) {
        state.pendingPin = generatePin();
        setLocalStorage(STORAGE_KEY.PENDING_PIN, state.pendingPin);
    }
}

function saveHistory() {
    setLocalStorage(STORAGE_KEY.HISTORY, state.history);
}

// --- Core Logic ---

function generatePin() {
    let pin = '';
    for (let i = 0; i < 12; i++) {
        pin += Math.floor(Math.random() * 10);
    }
    return pin;
}

function grantAchievement(id) {
    if (!state.achievements[id]) {
        state.achievements[id] = true;
        setLocalStorage('chastity_achievements', state.achievements);
        ui.showAchievement(ACHIEVEMENTS[id]);
    }
}

function startNewTimer() {
    const timerType = document.querySelector('input[name="timerType"]:checked').value;
    const now = Date.now();
    
    const maxDurationInput = document.getElementById('maxDurationInput');
    const maxHours = parseInt(maxDurationInput.value, 10);
    let maxEndTime = null;
    if (!isNaN(maxHours) && maxHours > 0) {
        maxEndTime = now + (maxHours * 60 * 60 * 1000);
    }
    
    const isKeyholderMode = document.getElementById('keyholder-mode-checkbox').checked;

    state.currentTimer = {
        startTime: now,
        pin: state.pendingPin,
        isMinimum: timerType === 'random',
        minEndTime: null,
        maxEndTime: maxEndTime,
        isKeyholderMode: isKeyholderMode,
    };

    if (timerType === 'random') {
        const minHours = 12;
        const maxHours = 72;
        const randomHours = Math.floor(Math.random() * (maxHours - minHours + 1)) + minHours;
        state.currentTimer.minEndTime = now + (randomHours * 60 * 60 * 1000);
    }

    // Add checksum to the timer data before saving
    state.currentTimer.checksum = createChecksum(state.currentTimer);

    setLocalStorage(STORAGE_KEY.CURRENT_TIMER, state.currentTimer);
    localStorage.removeItem(STORAGE_KEY.PENDING_PIN);
    state.pendingPin = null;
    ui.renderUIForActiveTimer(now);
    timer.startUpdateInterval();
}

function startLocktoberTimer() {
    ui.showModal(
        "Confirm Locktober",
        "This will lock you for 31 days. You will NOT be able to attempt an unlock. Are you absolutely sure?",
        true,
        () => {
            const now = Date.now();
            const thirtyOneDaysInMs = 31 * 24 * 60 * 60 * 1000;
            const isKeyholderMode = document.getElementById('keyholder-mode-checkbox').checked;

            state.currentTimer = {
                startTime: now,
                pin: state.pendingPin,
                isMinimum: true,
                minEndTime: now + thirtyOneDaysInMs,
                maxEndTime: null,
                isKeyholderMode: isKeyholderMode,
            };
            
            state.currentTimer.checksum = createChecksum(state.currentTimer);

            setLocalStorage(STORAGE_KEY.CURRENT_TIMER, state.currentTimer);
            localStorage.removeItem(STORAGE_KEY.PENDING_PIN);
            state.pendingPin = null;
            ui.renderUIForActiveTimer(now);
            timer.startUpdateInterval();
        }
    );
}

function attemptUnlock() {
    const activeLockdown = getLocalStorage('chastity_active_lockdown');
    if (activeLockdown && Date.now() < activeLockdown.expiry) {
        const timeLeftMs = activeLockdown.expiry - Date.now();
        const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
        ui.showModal("Lockdown Active", `You cannot attempt an unlock. ${hours}h ${minutes}m remaining.`);
        return;
    }
    
    const penaltyEnd = getLocalStorage(STORAGE_KEY.PENALTY_END);
    if (penaltyEnd && Date.now() < penaltyEnd) {
        const minutes = Math.ceil((penaltyEnd - Date.now()) / 60000);
        ui.showModal("Penalty Active", `You cannot attempt an unlock for another ${minutes} minute(s).`);
        return;
    }
    
    if (Math.random() < 0.25) {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        const eventExpiry = Date.now() + event.duration;
        
        if (event.name.includes('Lockdown')) {
            setLocalStorage('chastity_active_lockdown', { expiry: eventExpiry });
        } else {
            setLocalStorage('chastity_active_event', { ...event, expiry: eventExpiry });
        }
        
        ui.showModal(event.name, event.description);
        timer.startUpdateInterval();
        return;
    }
    
    timer.stopUpdateInterval();
    ui.switchScreen('wheel-screen');
    initWheel(handleWheelResult);
}

function handleWheelResult(outcome) {
    sounds.playSound('spin', 0.5);
    if (outcome.type === 'penalty') {
        const penaltyEndTime = Date.now() + outcome.duration;
        setLocalStorage(STORAGE_KEY.PENALTY_END, penaltyEndTime);
        ui.showModal("Penalty!", `The wheel has spoken. A ${outcome.duration / 60000}-minute penalty has been applied.`, false, () => {
            ui.switchScreen('timer-screen');
            timer.startUpdateInterval();
        });
    } else if (outcome.type === 'safe') {
        const games = ['memory', 'tictactoe', 'guessthenumber', 'simonsays', 'minefield'];
        const randomGame = games[Math.floor(Math.random() * games.length)];
        const gameName = randomGame.charAt(0).toUpperCase() + randomGame.slice(1);

        ui.showModal("Challenge Issued!", `You must now face a random challenge: ${gameName}.`, false, () => {
            startGame(randomGame, winGame, loseGame);
        });

    } else {
        setLocalStorage('chastity_is_double_or_nothing', true);
        ui.showModal("Double or Nothing!", "You must win the next high-pressure game. If you lose, your penalty will be DOUBLE your currently locked time.", false, () => {
            startGame('guessthenumber', winGame, loseGame, true);
        });
    }
}

function startGame(gameType, onWin, onLose, isSuddenDeath = false) {
    ui.switchScreen('game-screen');
    document.querySelectorAll('.game-container').forEach(c => c.style.display = 'none');
    state.currentGame = gameType;
    const savedGameState = getLocalStorage(STORAGE_KEY.GAME_STATE);
    
    // Set the selected game unless it's a practice round
    if (onWin === winGame) {
        setLocalStorage('chastity_selected_game', gameType);
    }
    
    if (gameType === 'guessthenumber') {
        initGuessTheNumber(onWin, onLose, savedGameState, isSuddenDeath);
    } else if (gameType === 'memory') {
        initMemoryGame(onWin, onLose, savedGameState);
    } else if (gameType === 'tictactoe') {
        initTicTacToe(onWin, onLose);
    } else if (gameType === 'simonsays') {
        initSimonSays(onWin, onLose, savedGameState);
    } else if (gameType === 'minefield') {
        initMinefield(onWin, onLose);
    }
}

// --- "Real" Game Callbacks ---
function winGame() {
    sounds.playSound('win');
    const isDoubleOrNothing = getLocalStorage('chastity_is_double_or_nothing');
    
    localStorage.removeItem(STORAGE_KEY.GAME_STATE);
    localStorage.removeItem('chastity_selected_game');
    localStorage.removeItem('chastity_is_double_or_nothing');
    state.gameAttempts.push({ name: state.currentGame, result: 'Win', penalty: 0 });
    grantAchievement('winGame');
    
    if (isDoubleOrNothing) {
        ui.showModal("Success!", "You survived Sudden Death. The timer continues.", false, () => {
            ui.switchScreen('timer-screen');
            timer.startUpdateInterval();
        });
    } else {
        timer.stopUpdateInterval();
        const endTime = Date.now();
        ui.updateTimerDisplay(endTime - state.currentTimer.startTime);
        ui.showFinishedState(state.currentTimer.pin, state.currentTimer.isKeyholderMode);
        ui.showModal("Success!", "You have earned your release.", false, () => {
            ui.switchScreen('timer-screen');
        });
    }
}

function loseGame() {
    sounds.playSound('lose');
    localStorage.removeItem(STORAGE_KEY.GAME_STATE);
    localStorage.removeItem('chastity_selected_game');
    let penalty;
    let penaltyMessage;

    const isDoubleOrNothing = getLocalStorage('chastity_is_double_or_nothing');
    localStorage.removeItem('chastity_is_double_or_nothing');

    if (isDoubleOrNothing) {
        const elapsedTime = Date.now() - state.currentTimer.startTime;
        penalty = elapsedTime * 2;
        
        const days = Math.floor(penalty / (1000 * 60 * 60 * 24));
        const hours = Math.floor((penalty % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((penalty % (1000 * 60 * 60)) / (1000 * 60));
        penaltyMessage = `You failed Sudden Death! A massive penalty of ${days}d ${hours}h ${minutes}m has been applied.`;
        
        const penaltyExpiry = Date.now() + penalty;
        setLocalStorage('chastity_doubled_penalty', { expiry: penaltyExpiry });

    } else {
        penalty = PENALTY_DURATION_MS;
        const activeEvent = getLocalStorage('chastity_active_event');
        if (activeEvent?.effect === 'halfPenalty' && Date.now() < activeEvent.expiry) {
            penalty /= 2;
        }
        penaltyMessage = `A penalty of ${penalty / 60000} minutes has been applied.`;
        
        const penaltyEndTime = Date.now() + penalty;
        setLocalStorage(STORAGE_KEY.PENALTY_END, penaltyEndTime);
    }

    state.gameAttempts.push({ name: state.currentGame, result: 'Loss', penalty });
    if (state.gameAttempts.filter(a => a.result === 'Loss').length >= 3) {
        grantAchievement('lose3');
    }
    
    ui.showModal("Failure", penaltyMessage, false, () => {
        ui.switchScreen('timer-screen');
        timer.startUpdateInterval(); 
    });
}

// --- "Practice" Game Callbacks ---
function practiceWin() {
    sounds.playSound('win');
    localStorage.removeItem(STORAGE_KEY.GAME_STATE);
    ui.showModal("Victory!", "You won the practice round. Well done!", false, () => {
        ui.switchScreen('timer-screen');
    });
}

function practiceLose() {
    sounds.playSound('lose');
    localStorage.removeItem(STORAGE_KEY.GAME_STATE);
    ui.showModal("Defeat!", "You lost the practice round. Try again!", false, () => {
        ui.switchScreen('timer-screen');
    });
}

function endSession(force = false) {
    if (!state.currentTimer) return;
    
    if (!force) {
        const endTime = Date.now();
        const duration = endTime - state.currentTimer.startTime;
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
    }

    state.currentTimer = null;
    state.gameAttempts = [];
    localStorage.removeItem(STORAGE_KEY.CURRENT_TIMER);
    localStorage.removeItem(STORAGE_KEY.TOTAL_PENALTY);
    localStorage.removeItem(STORAGE_KEY.PENALTY_END);
    localStorage.removeItem(STORAGE_KEY.GAME_STATE);
    localStorage.removeItem('chastity_active_event');
    localStorage.removeItem('chastity_active_lockdown');
    localStorage.removeItem('chastity_is_double_or_nothing');
    state.pendingPin = generatePin();
    setLocalStorage(STORAGE_KEY.PENDING_PIN, state.pendingPin);
    ui.renderUIForNoTimer(state.pendingPin);
    ui.renderHistory(state.history, saveComment, ui.showNotesModal);
    ui.switchScreen('timer-screen');
}

function resetApp() {
    ui.showModal( "Reset All Data?", "This will permanently delete all timer and history data. This cannot be undone.", true, () => {
        localStorage.clear();
        loadState();
        initializeApp();
        ui.showModal("Success", "All application data has been reset.");
    });
}

function saveComment(index, text) {
    if (state.history[index]) {
        state.history[index].comment = text;
        saveHistory();
        ui.renderHistory(state.history, saveComment, ui.showNotesModal);
    }
}

function deleteHistoryItem(index) {
     ui.showModal( "Delete Session?", "Are you sure you want to delete this history item permanently?", true, () => {
        state.history.splice(index, 1);
        saveHistory();
        ui.renderHistory(state.history, saveComment, ui.showNotesModal);
    });
}

function startQuoteFlipper() {
    const quoteBanner = document.getElementById('quote-banner');
    if (!quoteBanner) return;
    const initialIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    quoteBanner.textContent = MOTIVATIONAL_QUOTES[initialIndex];
    setInterval(() => {
        quoteBanner.style.opacity = '0';
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
            quoteBanner.textContent = MOTIVATIONAL_QUOTES[randomIndex];
            quoteBanner.style.opacity = '1';
        }, 1000);
    }, QUOTE_FLIP_INTERVAL_MS);
}

function setupEventListeners() {
    document.getElementById('start-button').addEventListener('click', startNewTimer);
    document.getElementById('start-locktober-button').addEventListener('click', startLocktoberTimer);
    document.getElementById('unlock-button').addEventListener('click', attemptUnlock);
    document.getElementById('reset-button').addEventListener('click', () => endSession(false));
    document.getElementById('reset-app-button').addEventListener('click', resetApp);
    document.getElementById('sound-toggle-btn').addEventListener('click', sounds.toggleMute);
    
    document.getElementById('back-to-selection-btn').addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY.GAME_STATE);
        ui.switchScreen('timer-screen');
        timer.startUpdateInterval();
    });
    
    document.getElementById('wheel-back-btn').addEventListener('click', () => {
        ui.switchScreen('timer-screen');
        timer.startUpdateInterval();
    });

    document.getElementById('practice-game-buttons').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const gameType = e.target.dataset.game;
            startGame(gameType, practiceWin, practiceLose);
        }
    });
    
    ui.setupNotesModal(saveComment);
}

function initializeApp() {
    loadState();
    if (!state.currentTimer) {
        localStorage.removeItem(STORAGE_KEY.GAME_STATE);
        localStorage.removeItem('chastity_selected_game');
    }
    const pendingSelectedGame = getLocalStorage('chastity_selected_game');
    const savedGameState = getLocalStorage(STORAGE_KEY.GAME_STATE);
    
    if (pendingSelectedGame) {
        startGame(pendingSelectedGame, winGame, loseGame);
    } else if (state.currentTimer) {
        ui.renderUIForActiveTimer(state.currentTimer.startTime);
        timer.startUpdateInterval();
    } else {
        ui.renderUIForNoTimer(state.pendingPin);
    }
    
    ui.renderHistory(state.history, saveComment, ui.showNotesModal);
    setupEventListeners();
    startQuoteFlipper();
    
    if (!pendingSelectedGame) {
        ui.switchScreen('timer-screen');
    }
}

initializeApp();
