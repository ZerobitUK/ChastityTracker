import { showFinishedState, updateTimerDisplay, updateTimerMessage, toggleUnlockButton, updateLockdownTimer, updateDoubledPenaltyTimer } from './ui.js';
import { STORAGE_KEY } from './constants.js';

let timerInterval = null;
let lastTimeCheck = 0;
let timeCheckInterval = 60000; // Check every 60 seconds
let isTimeDesynced = false;

function getLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Failed to read from localStorage", e);
        return null;
    }
}

/**
 * Fetches the current world time to compare against the local system clock.
 */
async function verifyTime() {
    try {
        const response = await fetch('https://worldtimeapi.org/api/ip');
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();
        const serverTime = new Date(data.utc_datetime).getTime();
        const localTime = Date.now();
        
        // If the local time is more than 60 seconds ahead of server time, flag it.
        if (localTime > serverTime + 60000) {
            isTimeDesynced = true;
        } else {
            isTimeDesynced = false;
        }
    } catch (error) {
        console.warn("Could not verify world time. The user might be offline.", error);
        // If we can't check, assume it's fine.
        isTimeDesynced = false;
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

        // Periodically check the real time
        if (now > lastTimeCheck + timeCheckInterval) {
            verifyTime();
            lastTimeCheck = now;
        }

        // If time is out of sync, pause everything and show a message
        if (isTimeDesynced) {
            updateTimerDisplay(now - currentTimer.startTime);
            updateTimerMessage('System clock is incorrect. Timer paused.');
            toggleUnlockButton(false);
            return;
        }
        
        // Check for max duration override FIRST
        if (currentTimer.maxEndTime && now >= currentTimer.maxEndTime) {
            showFinishedState(currentTimer.pin, currentTimer.isKeyholderMode); 
            updateTimerDisplay(currentTimer.maxEndTime - currentTimer.startTime); 
            updateTimerMessage('Maximum session time reached.'); 
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
    verifyTime(); // Initial check
    update();
    timerInterval = setInterval(update, 1000);
}

export function stopUpdateInterval() {
    clearInterval(timerInterval);
}
