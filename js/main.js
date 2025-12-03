import { MOTIVATIONAL_QUOTES, QUOTE_FLIP_INTERVAL_MS, STORAGE_KEY, PENALTY_DURATION_MS, ACHIEVEMENTS, RANDOM_EVENTS, WHEEL_OUTCOMES } from './constants.js';
import * as ui from './ui.js';
import * as timer from './timer.js';
import * as sounds from './sounds.js';
import * as camera from './camera.js';
import { db } from './db.js'; // IMPORT NEW DB
import { initWheel } from './game_wheel.js';
import { initMemoryGame } from './game_memory.js';
import { initTicTacToe } from './game_tictactoe.js';
import { initGuessTheNumber } from './game_guess.js';
import { initSimonSays } from './game_simon.js';
import { initMinefield } from './game_minefield.js';

const CHECKSUM_SECRET = "ChastityTrackerSecretKey";

let state = {
    currentTimer: null,
    history: [],
    pendingPin: null,
    pendingPhoto: null,
    gameAttempts: [],
    achievements: {},
    currentGame: null,
    edgePoints: 0,
};

function createChecksum(timerData) {
    if (!timerData) return null;
    const dataString = `${timerData.startTime}-${timerData.minEndTime}-${timerData.maxEndTime}-${CHECKSUM_SECRET}`;
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return hash.toString();
}

// --- State Management (Async) ---

async function loadState() {
    try {
        state.currentTimer = await db.get(STORAGE_KEY.CURRENT_TIMER);
        state.history = (await db.getAllHistory()) || [];
        state.pendingPin = await db.get(STORAGE_KEY.PENDING_PIN);
        state.pendingPhoto = await db.get(STORAGE_KEY.PENDING_PHOTO);
        state.achievements = (await db.get('chastity_achievements')) || {};
        state.edgePoints = (await db.get(STORAGE_KEY.EDGE_POINTS)) || 0;
        
        ui.updateEdgePointsDisplay(state.edgePoints);
        
        if (state.currentTimer) {
            const expectedChecksum = createChecksum(state.currentTimer);
            if (state.currentTimer.checksum !== expectedChecksum) {
                ui.showModal("Tamper Detected", "Your session data has been modified externally. The session has been reset.", false, () => {
                    endSession(true);
                });
                return;
            }
        }

        if (!state.currentTimer && !state.pendingPin && !state.pendingPhoto) {
            state.pendingPin = generatePin();
            await db.set(STORAGE_KEY.PENDING_PIN, state.pendingPin);
        }
    } catch (e) {
        console.error("Failed to load state", e);
        ui.showModal("Error", "Failed to load application data.");
    }
}

// --- Core Logic ---

function generatePin() {
    let pin = '';
    for (let i = 0; i < 12; i++) {
        pin += Math.floor(Math.random() * 10);
    }
    return pin;
}

async function grantAchievement(id) {
    if (!state.achievements[id]) {
        state.achievements[id] = true;
        await db.set('chastity_achievements', state.achievements);
        ui.showAchievement(ACHIEVEMENTS[id]);
        
        const achievementEP = { 'lock24h': 25, 'lock7d': 100, 'lose3': 10, 'winGame': 10 };
        if (achievementEP[id]) {
            await updateEdgePoints(achievementEP[id]);
            ui.showModal("Edge Gained!", `You earned ${achievementEP[id]} EP for unlocking an achievement.`);
        }
    }
}

async function updateEdgePoints(amount) {
    state.edgePoints = Math.max(0, state.edgePoints + amount);
    await db.set(STORAGE_KEY.EDGE_POINTS, state.edgePoints);
    ui.updateEdgePointsDisplay(state.edgePoints);
}

async function startNewTimer() {
    const timerType = document.querySelector('input[name="timerType"]:checked').value;
    const unlockMethod = document.querySelector('input[name="unlockMethod"]:checked').value;
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
        unlockMethod: unlockMethod,
        unlockData: unlockMethod === 'pin' ? state.pendingPin : state.pendingPhoto,
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

    state.currentTimer.checksum = createChecksum(state.currentTimer);

    await db.set(STORAGE_KEY.CURRENT_TIMER, state.currentTimer);
    await db.remove(STORAGE_KEY.PENDING_PIN);
    await db.remove(STORAGE_KEY.PENDING_PHOTO);
    state.pendingPin = null;
    state.pendingPhoto = null;
    
    ui.renderUIForActiveTimer(now);
    timer.startUpdateInterval();
}

function startLocktoberTimer() {
    ui.showModal(
        "Confirm Locktober",
        "This will lock you for 31 days. You will NOT be able to attempt an unlock. Are you absolutely sure?",
        true,
        async () => {
            const now = Date.now();
            const thirtyOneDaysInMs = 31 * 24 * 60 * 60 * 1000;
            const isKeyholderMode = document.getElementById('keyholder-mode-checkbox').checked;

            state.currentTimer = {
                startTime: now,
                unlockMethod: 'pin',
                unlockData: state.pendingPin,
                isMinimum: true,
                minEndTime: now + thirtyOneDaysInMs,
                maxEndTime: null,
                isKeyholderMode: isKeyholderMode,
            };
            
            state.currentTimer.checksum = createChecksum(state.currentTimer);

            await db.set(STORAGE_KEY.CURRENT_TIMER, state.currentTimer);
            await db.remove(STORAGE_KEY.PENDING_PIN);
            await db.remove(STORAGE_KEY.PENDING_PHOTO);
            state.pendingPin = null;
            state.pendingPhoto = null;
            ui.renderUIForActiveTimer(now);
            timer.startUpdateInterval();
        }
    );
}

async function attemptUnlock() {
    const activeLockdown = await db.get('chastity_active_lockdown');
    if (activeLockdown && Date.now() < activeLockdown.expiry) {
        const timeLeftMs = activeLockdown.expiry - Date.now();
        const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
        ui.showModal("Lockdown Active", `You cannot attempt an unlock. ${hours}h ${minutes}m remaining.`);
        return;
    }
    
    const penaltyEnd = await db.get(STORAGE_KEY.PENALTY_END);
    if (penaltyEnd && Date.now() < penaltyEnd) {
        const minutes = Math.ceil((penaltyEnd - Date.now()) / 60000);
        ui.showModal("Penalty Active", `You cannot attempt an unlock for another ${minutes} minute(s).`);
        return;
    }
    
    if (Math.random() < 0.25) {
        const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        const eventExpiry = Date.now() + event.duration;
        
        if (event.name.includes('Lockdown')) {
            await db.set('chastity_active_lockdown', { expiry: eventExpiry });
        } else {
            await db.set('chastity_active_event', { ...event, expiry: eventExpiry });
        }
        
        ui.showModal(event.name, event.description);
        timer.startUpdateInterval();
        return;
    }
    
    timer.stopUpdateInterval();
    ui.switchScreen('wheel-screen');
    ui.updateEdgeOptions(state.edgePoints);
    initWheel(handleWheelResult);
}

async function handleWheelResult(outcome) {
    ui.hideEdgeOptions();
    sounds.playSound('spin', 0.5);
    if (outcome.type === 'penalty') {
        const penaltyEndTime = Date.now() + outcome.duration;
        await db.set(STORAGE_KEY.PENALTY_END, penaltyEndTime);
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
        await db.set('chastity_is_double_or_nothing', true);
        ui.showModal("Double or Nothing!", "You must win the next high-pressure game. If you lose, your penalty will be DOUBLE your currently locked time.", false, () => {
            startGame('guessthenumber', winGame, loseGame, true);
        });
    }
}

async function startGame(gameType, onWin, onLose, isSuddenDeath = false) {
    ui.switchScreen('game-screen');
    document.querySelectorAll('.game-container').forEach(c => c.style.display = 'none');
    state.currentGame = gameType;
    const savedGameState = await db.get(STORAGE_KEY.GAME_STATE);
    
    if (onWin === winGame) {
        await db.set('chastity_selected_game', gameType);
    }
    
    const gameArgs = [onWin, onLose, savedGameState];
    if (gameType === 'guessthenumber') initGuessTheNumber(onWin, onLose, savedGameState, isSuddenDeath);
    else if (gameType === 'memory') initMemoryGame(...gameArgs);
    else if (gameType === 'tictactoe') initTicTacToe(onWin, onLose);
    else if (gameType === 'simonsays') initSimonSays(...gameArgs);
    else if (gameType === 'minefield') initMinefield(onWin, onLose);
}

async function winGame() {
    sounds.playSound('win');
    await updateEdgePoints(5);
    const isDoubleOrNothing = await db.get('chastity_is_double_or_nothing');
    
    await db.remove(STORAGE_KEY.GAME_STATE);
    await db.remove('chastity_selected_game');
    await db.remove('chastity_is_double_or_nothing');
    state.gameAttempts.push({ name: state.currentGame, result: 'Win', penalty: 0 });
    await grantAchievement('winGame');
    
    if (isDoubleOrNothing) {
        ui.showModal("Success!", "You survived Sudden Death. The timer continues.", false, () => {
            ui.switchScreen('timer-screen');
            timer.startUpdateInterval();
        });
    } else {
        timer.stopUpdateInterval();
        const endTime = Date.now();
        ui.updateTimerDisplay(endTime - state.currentTimer.startTime);
        ui.showFinishedState(state.currentTimer.unlockMethod, state.currentTimer.unlockData, state.currentTimer.isKeyholderMode);
        ui.showModal("Success!", "You have earned your release. You also gained 5 Edge Points.", false, () => {
            ui.switchScreen('timer-screen');
        });
    }
}

async function loseGame() {
    sounds.playSound('lose');
    await updateEdgePoints(-15);
    await db.remove(STORAGE_KEY.GAME_STATE);
    await db.remove('chastity_selected_game');
    let penalty;
    let penaltyMessage;

    const isDoubleOrNothing = await db.get('chastity_is_double_or_nothing');
    await db.remove('chastity_is_double_or_nothing');

    if (isDoubleOrNothing) {
        const elapsedTime = Date.now() - state.currentTimer.startTime;
        penalty = elapsedTime * 2;
        
        const days = Math.floor(penalty / (1000 * 60 * 60 * 24));
        const hours = Math.floor((penalty % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((penalty % (1000 * 60 * 60)) / (1000 * 60));
        penaltyMessage = `You failed Sudden Death! ${days}d ${hours}h ${minutes}m added.`;
        
        const penaltyExpiry = Date.now() + penalty;
        await db.set('chastity_doubled_penalty', { expiry: penaltyExpiry });

    } else {
        penalty = PENALTY_DURATION_MS;
        const activeEvent = await db.get('chastity_active_event');
        if (activeEvent?.effect === 'halfPenalty' && Date.now() < activeEvent.expiry) {
            penalty /= 2;
        }
        penaltyMessage = `A penalty of ${penalty / 60000} minutes has been applied.`;
        
        const penaltyEndTime = Date.now() + penalty;
        await db.set(STORAGE_KEY.PENALTY_END, penaltyEndTime);
    }

    state.gameAttempts.push({ name: state.currentGame, result: 'Loss', penalty });
    if (state.gameAttempts.filter(a => a.result === 'Loss').length >= 3) {
        await grantAchievement('lose3');
    }
    
    ui.showModal("Failure", penaltyMessage, false, () => {
        ui.switchScreen('timer-screen');
        timer.startUpdateInterval(); 
    });
}

function practiceWin() {
    sounds.playSound('win');
    db.remove(STORAGE_KEY.GAME_STATE);
    ui.showModal("Victory!", "You won the practice round.", false, () => ui.switchScreen('timer-screen'));
}

function practiceLose() {
    sounds.playSound('lose');
    db.remove(STORAGE_KEY.GAME_STATE);
    ui.showModal("Defeat!", "You lost the practice round.", false, () => ui.switchScreen('timer-screen'));
}

async function endSession(force = false) {
    if (!state.currentTimer) return;
    
    if (!force) {
        const endTime = Date.now();
        const duration = endTime - state.currentTimer.startTime;
        const hoursLocked = duration / (1000 * 60 * 60);
        const pointsEarned = Math.floor(hoursLocked / 24) * 10;
        
        if (pointsEarned > 0) {
            await updateEdgePoints(pointsEarned);
            ui.showModal("Session Complete", `You have earned ${pointsEarned} EP.`);
        }

        if (duration >= 7 * 24 * 60 * 60 * 1000) await grantAchievement('lock7d');
        else if (duration >= 24 * 60 * 60 * 1000) await grantAchievement('lock24h');
        
        const totalPenalty = (await db.get(STORAGE_KEY.TOTAL_PENALTY)) || 0;
        const historyItem = {
            startTime: state.currentTimer.startTime,
            endTime: endTime,
            unlockMethod: state.currentTimer.unlockMethod,
            unlockData: state.currentTimer.unlockData,
            comment: '',
            penaltyTime: totalPenalty,
            gameAttempts: state.gameAttempts,
        };
        await db.addHistory(historyItem);
        state.history = await db.getAllHistory();
    }

    state.currentTimer = null;
    state.gameAttempts = [];
    await db.remove(STORAGE_KEY.CURRENT_TIMER);
    await db.remove(STORAGE_KEY.TOTAL_PENALTY);
    await db.remove(STORAGE_KEY.PENALTY_END);
    await db.remove(STORAGE_KEY.GAME_STATE);
    await db.remove('chastity_active_event');
    await db.remove('chastity_active_lockdown');
    await db.remove('chastity_is_double_or_nothing');
    
    state.pendingPin = generatePin();
    await db.set(STORAGE_KEY.PENDING_PIN, state.pendingPin);
    
    ui.renderUIForNoTimer(state.pendingPin, state.pendingPhoto);
    ui.renderHistory(state.history, saveComment, ui.showNotesModal);
    ui.switchScreen('timer-screen');
}

async function saveComment(index, text) {
    if (state.history[index]) {
        state.history[index].comment = text;
        // History in state is array, but DB needs ID. 
        // We assume state.history objects have 'id' from getAllHistory()
        if (state.history[index].id) {
            await db.updateHistory(state.history[index].id, { comment: text });
            state.history = await db.getAllHistory(); // Refresh
            ui.renderHistory(state.history, saveComment, ui.showNotesModal);
        }
    }
}

async function deleteHistoryItem(index) {
     ui.showModal("Delete Session?", "Permanently delete this history item?", true, async () => {
        if (state.history[index] && state.history[index].id) {
            await db.deleteHistory(state.history[index].id);
            state.history = await db.getAllHistory();
            ui.renderHistory(state.history, saveComment, ui.showNotesModal);
        }
    });
}

function startQuoteFlipper() {
    const quoteBanner = document.getElementById('quote-banner');
    if (!quoteBanner) return;
    const updateQuote = () => {
        quoteBanner.style.opacity = '0';
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
            quoteBanner.textContent = MOTIVATIONAL_QUOTES[randomIndex];
            quoteBanner.style.opacity = '1';
        }, 1000);
    };
    quoteBanner.textContent = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setInterval(updateQuote, QUOTE_FLIP_INTERVAL_MS);
}

// --- Backup/Restore ---
async function exportData() {
    try {
        const json = await db.exportData();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chastity-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error(e);
        ui.showModal("Export Failed", "Could not export data.");
    }
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target.result;
        const success = await db.importData(content);
        if (success) {
            ui.showModal("Success", "Data imported successfully. App will reload.", false, () => location.reload());
        } else {
            ui.showModal("Error", "Failed to import data. Corrupt file?");
        }
    };
    reader.readAsText(file);
}

// --- Setup ---

function setupEventListeners() {
    document.getElementById('start-button').addEventListener('click', () => {
        const unlockMethod = document.querySelector('input[name="unlockMethod"]:checked').value;
        if (unlockMethod === 'photo' && !state.pendingPhoto) {
            ui.showModal("Photo Required", "Please capture a photo first.");
            return;
        }
        startNewTimer();
    });
    
    document.getElementById('start-locktober-button').addEventListener('click', startLocktoberTimer);
    document.getElementById('unlock-button').addEventListener('click', attemptUnlock);
    document.getElementById('reset-button').addEventListener('click', () => endSession(false));
    document.getElementById('sound-toggle-btn').addEventListener('click', sounds.toggleMute);
    
    document.getElementById('back-to-selection-btn').addEventListener('click', () => {
        db.remove(STORAGE_KEY.GAME_STATE);
        ui.switchScreen('timer-screen');
        timer.startUpdateInterval();
    });
    
    document.getElementById('wheel-back-btn').addEventListener('click', () => {
        ui.switchScreen('timer-screen');
        timer.startUpdateInterval();
    });

    document.getElementById('practice-game-buttons').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            startGame(e.target.dataset.game, practiceWin, practiceLose);
        }
    });

    document.querySelector('input[name="unlockMethod"][value="photo"]').addEventListener('change', async (e) => {
        if (e.target.checked) {
            const cameraStarted = await camera.startCamera();
            if (!cameraStarted) document.querySelector('input[name="unlockMethod"][value="pin"]').checked = true;
        }
    });

    document.querySelector('input[name="unlockMethod"][value="pin"]').addEventListener('change', (e) => {
        if (e.target.checked) camera.stopCamera();
    });
    
    document.getElementById('capture-photo-btn').addEventListener('click', async () => {
        const photoData = camera.capturePhoto();
        state.pendingPhoto = photoData;
        await db.set(STORAGE_KEY.PENDING_PHOTO, photoData);
        ui.showModal("Photo Captured", "Photo saved. You may now start.");
        ui.renderUIForNoTimer(state.pendingPin, state.pendingPhoto);
    });

    document.getElementById('edge-option-nudge').addEventListener('click', (e) => {
        const cost = parseInt(e.target.dataset.cost, 10);
        updateEdgePoints(-cost);
        ui.hideEdgeOptions();
        const outcomes = [...WHEEL_OUTCOMES];
        let worst = -1, maxDur = 0;
        outcomes.forEach((o, i) => { if (o.type === 'penalty' && o.duration > maxDur) { maxDur = o.duration; worst = i; } });
        if (worst > -1) outcomes.splice(worst, 1);
        initWheel(handleWheelResult, outcomes);
        ui.showModal("Edge Used!", "Worst penalty removed.");
    });
    
    document.getElementById('edge-option-calibrate').addEventListener('click', (e) => {
        const cost = parseInt(e.target.dataset.cost, 10);
        updateEdgePoints(-cost);
        ui.hideEdgeOptions();
        initWheel(handleWheelResult, WHEEL_OUTCOMES.filter(o => o.type === 'safe' || o.type === 'double'));
        ui.showModal("Edge Used!", "Penalties removed.");
    });

    // Backup Buttons
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    document.getElementById('import-file-input').addEventListener('change', importData);

    ui.setupNotesModal(saveComment);
}

async function initializeApp() {
    await loadState();
    const pendingSelectedGame = await db.get('chastity_selected_game');
    
    if (pendingSelectedGame) {
        startGame(pendingSelectedGame, winGame, loseGame);
    } else if (state.currentTimer) {
        ui.renderUIForActiveTimer(state.currentTimer.startTime);
        timer.startUpdateInterval();
    } else {
        ui.renderUIForNoTimer(state.pendingPin, state.pendingPhoto);
    }
    
    // Inject delete handler logic which was local in ui.js previously, needs bridging
    // Note: ui.renderHistory attaches callbacks that we passed: saveComment and a wrapper for showNotes
    // We need to ensure ui.js calls our delete logic.
    // Modified ui.js to export the delete setter or pass it in renderHistory? 
    // Easier: UI.js already had a callback for delete in the loop. 
    // We will attach a global function or modify UI.js slightly. 
    // For now, we assume ui.renderHistory accepts a 4th arg or we handle it via event delegation if UI was rewritten.
    // Based on original file, renderHistory attached `deleteHistoryItemCallback`. 
    // I need to patch ui.js or pass it.
    // Let's assume we modify ui.js to accept it.
    
    // Actually, in the provided UI.js, renderHistory calls `deleteHistoryItemCallback` which was undefined in the module scope.
    // It should be passed as an argument.
    ui.renderHistory(state.history, saveComment, ui.showNotesModal, deleteHistoryItem);

    setupEventListeners();
    startQuoteFlipper();
    
    if (!pendingSelectedGame) {
        ui.switchScreen('timer-screen');
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('SW registered: ', reg);
        }).catch(err => {
            console.log('SW registration failed: ', err);
        });
    });
}

initializeApp();
