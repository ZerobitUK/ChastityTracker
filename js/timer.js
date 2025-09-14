import { updateTimerDisplay, updateTimerMessage, toggleUnlockButton, updateLockdownTimer, updateDoubledPenaltyTimer } from './ui.js';
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

const update = () => {
    const currentTimer = getLocalStorage(STORAGE_KEY.CURRENT_TIMER);
    if (!currentTimer || !currentTimer.startTime) {
        clearInterval(timerInterval);
        return;
    }

    const now = Date.now();
    updateTimerDisplay(now - currentTimer.startTime);
    
    // --- PRIORITY CHECKS ---
    // 1. Check for Doubled or Nothing Penalty first
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
        return; // Stop further checks
    } else {
        updateDoubledPenaltyTimer('');
    }

    // 2. Check for Lockdown
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

    // 3. Check for standard penalty
    const penaltyEnd = getLocalStorage(STORAGE_KEY.PENALTY_END);
    if (penaltyEnd && now < penaltyEnd) {
        const timeLeft = penaltyEnd - now;
        const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        updateTimerMessage(`Penalty: Cannot unlock for ${minutes}m ${seconds}s.`);
        toggleUnlockButton(false);
        return;
    }

    // 4. Check for Minimum Time
    if (currentTimer.minEndTime && now < currentTimer.minEndTime) {
        const timeLeft = currentTimer.minEndTime - now;
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        updateTimerMessage(`Minimum Time: ${days}d ${hours}h remaining.`);
        toggleUnlockButton(false);
        return;
    }
    
    // Default state: Can unlock
    updateTimerMessage(currentTimer.minEndTime ? 'Minimum time has been met.' : '');
    toggleUnlockButton(true);
};

export function stopUpdateInterval() {
    clearInterval(timerInterval);
}
