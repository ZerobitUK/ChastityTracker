import { showFinishedState, updateTimerDisplay, updateTimerMessage, toggleUnlockButton, updateLockdownTimer, updateDoubledPenaltyTimer } from './ui.js';
import { STORAGE_KEY } from './constants.js';

let timerInterval = null;

function getLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Failed to read from localStorage", e);
        return null;
    }
}

export function startUpdateInterval() {
    const update = () => {
        const currentTimer = getLocalStorage(STORAGE_KEY.CURRENT_TIMER);
        if (!currentTimer || !currentTimer.startTime) {
            clearInterval(timerInterval);
            return;
        }

        const now = Date.now();
        
        // *** NEW: Check for max duration override FIRST ***
        if (currentTimer.maxEndTime && now >= currentTimer.maxEndTime) {
            // Use the UI function to show the end state, which reveals the 'End Session' button.
            showFinishedState(currentTimer.pin); 
            // Ensure the timer display doesn't exceed the max time.
            updateTimerDisplay(currentTimer.maxEndTime - currentTimer.startTime); 
            // Override any other message to show the max time was reached.
            updateTimerMessage('Maximum session time reached.'); 
            // Stop further processing to bypass all penalties and lockdowns.
            return; 
        }

        updateTimerDisplay(now - currentTimer.startTime);
        
        const doubledPenalty = getLocalStorage('chastity_doubled_penalty');
        if (doubledPenalty && now < doubledPenalty.expiry) {
            const timeLeft = doubledPenalty.expiry - now;
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            updateDoubledPenaltyTimer(`Doubled Penalty: ${days}d ${hours}h ${minutes}m remaining.`);
            toggleUnlockButton(false);
            updateLockdownTimer('');
            updateTimerMessage('');
            return;
        } else {
            updateDoubledPenaltyTimer('');
        }

        const activeLockdown = getLocalStorage('chastity_active_lockdown');
        if (activeLockdown && now < activeLockdown.expiry) {
            const timeLeft = activeLockdown.expiry - now;
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            updateLockdownTimer(`Lockdown Active: ${hours}h ${minutes}m remaining.`);
            toggleUnlockButton(false);
            updateTimerMessage('');
            return;
        } else {
             updateLockdownTimer('');
        }

        const penaltyEnd = getLocalStorage(STORAGE_KEY.PENALTY_END);
        if (penaltyEnd && now < penaltyEnd) {
            const timeLeft = penaltyEnd - now;
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            updateTimerMessage(`Penalty: Cannot unlock for ${days}d ${hours}h ${minutes}m ${seconds}s.`);
            toggleUnlockButton(false);
            return;
        }

        if (currentTimer.minEndTime && now < currentTimer.minEndTime) {
            const timeLeft = currentTimer.minEndTime - now;
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            updateTimerMessage(`Minimum Time Remaining: ${days}d ${hours}h ${minutes}m ${seconds}s`);
            toggleUnlockButton(false);
            return;
        }
        
        updateTimerMessage(currentTimer.minEndTime ? 'Minimum time has been met.' : '');
        toggleUnlockButton(true);
    };

    clearInterval(timerInterval);
    update();
    timerInterval = setInterval(update, 1000);
}

export function stopUpdateInterval() {
    clearInterval(timerInterval);
}
