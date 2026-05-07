const StorageManager = {
    KEY_NAME: 'chastity_lock_data',

    /**
     * Initialise a new lock state
     */
    saveInitialState(pin, maxHours) {
        // Generate a random initial duration between 1 and maxHours
        const randomInitialMinutes = Math.floor(Math.random() * (maxHours * 60)) + 1;
        const startTime = Date.now();
        const recoveryKey = this.generateRecoveryKey();

        const state = {
            isActive: true,
            pin: pin,
            startTime: startTime,
            initialDurationMinutes: randomInitialMinutes,
            penaltyMinutes: 0,
            recoveryKey: recoveryKey,
            isUnlocked: false
        };

        localStorage.setItem(this.KEY_NAME, JSON.stringify(state));
        return state;
    },

    /**
     * Retrieves the current state from localStorage
     */
    getState() {
        const data = localStorage.getItem(this.KEY_NAME);
        return data ? JSON.parse(data) : null;
    },

    /**
     * Adds time to the penalty accumulator
     */
    addPenalty(minutes) {
        const state = this.getState();
        if (state && state.isActive) {
            state.penaltyMinutes += minutes;
            localStorage.setItem(this.KEY_NAME, JSON.stringify(state));
        }
        return state;
    },

    /**
     * Sets the lock to an unlocked state (reveals PIN)
     */
    setUnlocked() {
        const state = this.getState();
        if (state) {
            state.isActive = false;
            state.isUnlocked = true;
            localStorage.setItem(this.KEY_NAME, JSON.stringify(state));
        }
    },

    /**
     * Clears all data (Reset)
     */
    clearAll() {
        localStorage.removeItem(this.KEY_NAME);
    },

    /**
     * Generates a unique recovery key for the master bypass
     */
    generateRecoveryKey() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars like 0, O, I, 1
        let key = 'RECOVER-';
        for (let i = 0; i < 8; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
            if (i === 3) key += '-';
        }
        return key;
    },

    /**
     * Validates a recovery key attempt
     */
    checkRecoveryKey(input) {
        const state = this.getState();
        return state && input.trim().toUpperCase() === state.recoveryKey;
    }
};
