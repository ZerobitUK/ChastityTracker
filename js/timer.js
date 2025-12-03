import { showFinishedState, updateTimerDisplay, updateTimerMessage, toggleUnlockButton, updateLockdownTimer, updateDoubledPenaltyTimer } from './ui.js';
import { STORAGE_KEY } from './constants.js';
import { db } from './db.js';

let timerInterval = null;
let lastTimeCheck = 0;
let timeCheckInterval = 60000;
let isTimeDesynced = false;
let lastKnownRealTime = 0;

async function verifyTime() {
    try {
        // Simple fetch to a public time API (or your own server)
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000); // 5s timeout
        const response = await fetch('https://worldtimeapi.org/api/ip', { signal: controller.signal });
        clearTimeout(id);
        
        if (!response.ok) throw new Error('Time API Error');
        const data = await response.json();
        const serverTime = new Date(data.utc_datetime).getTime();
        const localTime = Date.now();

        // Allow 2 minutes drift
        if (Math.abs(localTime - serverTime) > 120000) {
            isTimeDesynced = true;
        } else {
            isTimeDesynced = false;
            lastKnownRealTime = serverTime;
        }
        return true;
    } catch (error) {
        console.warn("Time verification failed (Offline?)", error);
        // Strict Mode: If we haven't verified in 2 hours, flag it.
        if (Date.now() - lastKnownRealTime > 2 * 60 * 60 * 1000 && lastKnownRealTime !== 0) {
            isTimeDesynced = true;
        }
        return false;
    }
}

export function startUpdateInterval() {
    const update = async () => {
        const currentTimer = await db.get(STORAGE_KEY.CURRENT_TIMER);
        if (!currentTimer || !currentTimer.startTime) {
            clearInterval(timerInterval);
            return;
        }

        const now = Date.now();

        if (now > lastTimeCheck + timeCheckInterval) {
            await verifyTime();
            lastTimeCheck = now;
        }

        if (isTimeDesynced) {
            updateTimerDisplay(now - currentTimer.startTime);
            updateTimerMessage('System clock unverified or desynced. Timer paused.', true);
            toggleUnlockButton(false);
            return;
        }

        // Logic below remains similar but using data from async fetch if needed
        // Note: currentTimer is already fetched async above.
        
        if (currentTimer.maxEndTime && now >= currentTimer.maxEndTime) {
            showFinishedState(currentTimer.pin, currentTimer.isKeyholderMode);
            updateTimerDisplay(currentTimer.maxEndTime - currentTimer.startTime);
            updateTimerMessage('Maximum session time reached.');
            return;
        }

        updateTimerDisplay(now - currentTimer.startTime);

        const doubledPenalty = await db.get('chastity_doubled_penalty');
        if (doubledPenalty && now < doubledPenalty.expiry) {
            const timeLeft = doubledPenalty.expiry - now;
            // ... (rest of logic same as original, just use vars)
             updateDoubledPenaltyTimer(`Penalty Active (Doubled): ${Math.floor(timeLeft/60000)}m remaining`);
             toggleUnlockButton(false);
             return;
        } else {
            updateDoubledPenaltyTimer('');
        }

        const activeLockdown = await db.get('chastity_active_lockdown');
        if (activeLockdown && now < activeLockdown.expiry) {
             const timeLeft = activeLockdown.expiry - now;
             updateLockdownTimer(`Lockdown: ${Math.floor(timeLeft/60000)}m remaining`);
             toggleUnlockButton(false);
             return;
        } else {
             updateLockdownTimer('');
        }
        
        const penaltyEnd = await db.get(STORAGE_KEY.PENALTY_END);
        if (penaltyEnd && now < penaltyEnd) {
             const timeLeft = penaltyEnd - now;
             const minutes = Math.floor(timeLeft / 60000);
             const seconds = Math.floor((timeLeft % 60000) / 1000);
             updateTimerMessage(`Penalty: ${minutes}m ${seconds}s`, true);
             toggleUnlockButton(false);
             return;
        }

        if (currentTimer.minEndTime && now < currentTimer.minEndTime) {
             const timeLeft = currentTimer.minEndTime - now;
             const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
             const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
             const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
             updateTimerMessage(`Minimum Time: ${days}d ${hours}h ${minutes}m`);
             toggleUnlockButton(false);
             return;
        }

        updateTimerMessage(currentTimer.minEndTime ? 'Minimum time met.' : '');
        toggleUnlockButton(true);
    };

    clearInterval(timerInterval);
    verifyTime();
    update(); // Run once immediately
    timerInterval = setInterval(update, 1000);
}

export function stopUpdateInterval() {
    clearInterval(timerInterval);
}
