import { showFinishedState, updateTimerDisplay, updateTimerMessage, toggleUnlockButton, updateLockdownTimer, updateDoubledPenaltyTimer } from './ui.js';
import { STORAGE_KEY } from './constants.js';
import { db } from './db.js';

let timerInterval = null;
let lastTimeCheck = 0;
let timeCheckInterval = 60000;
let isTimeDesynced = false;
let lastKnownRealTime = 0;

// Helper to fetch time with a timeout
async function fetchTime(url, timeExtractor) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // 5s timeout
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        return timeExtractor(data);
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

async function verifyTime() {
    let serverTime = null;

    try {
        // Primary API
        serverTime = await fetchTime('https://worldtimeapi.org/api/ip', data => new Date(data.utc_datetime).getTime());
    } catch (e1) {
        console.warn("Primary Time API failed, trying fallback...", e1);
        try {
            // Fallback API
            serverTime = await fetchTime('https://timeapi.io/api/Time/current/zone?timeZone=UTC', data => new Date(data.dateTime).getTime());
        } catch (e2) {
            console.warn("Fallback Time API failed. User might be offline.", e2);
        }
    }

    const localTime = Date.now();

    if (serverTime) {
        // Allow 5 minutes drift for natural PC/Phone clock inaccuracies
        if (Math.abs(localTime - serverTime) > 300000) {
            isTimeDesynced = true;
        } else {
            isTimeDesynced = false;
            lastKnownRealTime = serverTime;
        }
        await db.set('last_local_heartbeat', localTime);
        return true;
    } else {
        // Offline tampering check: Strict Mode (2 hours without verification)
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

        // 1. Check for manual local clock adjustments while offline
        const lastHeartbeat = await db.get('last_local_heartbeat') || now;
        
        // FIX: Only flag if local time goes BACKWARDS by more than 10 seconds.
        // Forward jumps are natural (e.g. locking the phone, background tab sleeping).
        if (lastHeartbeat - now > 10000 && lastKnownRealTime !== 0) {
            isTimeDesynced = true;
        }
        await db.set('last_local_heartbeat', now);

        // 2. Perform regular online time verification
        if (now > lastTimeCheck + timeCheckInterval) {
            await verifyTime();
            lastTimeCheck = now;
        }

        if (isTimeDesynced) {
            updateTimerDisplay(now - currentTimer.startTime);
            updateTimerMessage('System clock unverified or tampered. Timer paused.', true);
            toggleUnlockButton(false);
            return;
        }

        // Logic continues as normal below
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
