import { updateTimerDisplay, updateTimerMessage, toggleUnlockButton } from './ui.js';
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
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const currentTimer = getLocalStorage(STORAGE_KEY.CURRENT_TIMER);
        if (!currentTimer || !currentTimer.startTime) {
            clearInterval(timerInterval);
            return;
        }

        const now = Date.now();
        updateTimerDisplay(now - currentTimer.startTime);

        const penaltyEnd = getLocalStorage(STORAGE_KEY.PENALTY_END);
        if (penaltyEnd && now < penaltyEnd) {
            const timeLeft = penaltyEnd - now;
            const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
            const seconds = Math.floor((timeLeft / 1000) % 60);
            updateTimerMessage(`Penalty: Cannot unlock for ${minutes}m ${seconds}s.`);
            toggleUnlockButton(false);
            return;
        }

        if (currentTimer.minEndTime && now < currentTimer.minEndTime) {
            const timeLeft = currentTimer.minEndTime - now;
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            updateTimerMessage(`Minimum Time: ${days}d ${hours}h remaining.`);
            toggleUnlockButton(false);
            return;
        }
        
        updateTimerMessage(currentTimer.minEndTime ? 'Minimum time has been met.' : '');
        toggleUnlockButton(true);

    }, 1000);
}

export function stopUpdateInterval() {
    clearInterval(timerInterval);
}
