const TimeManager = {
    // Public API for reliable network time
    TIME_API_URL: 'https://worldtimeapi.org/api/timezone/Etc/UTC',

    /**
     * Fetches the current UTC time from the network
     * Falls back to system time only if the API is unreachable
     */
    async getCurrentTime() {
        try {
            const response = await fetch(this.TIME_API_URL);
            if (!response.ok) throw new Error('API Unreachable');
            const data = await response.json();
            // Convert ISO string to Unix timestamp (milliseconds)
            return new Date(data.utc_datetime).getTime();
        } catch (error) {
            console.error("Time API Error:", error);
            // In a strict build, you might want to return null to block the app
            // For now, we return system time but could flag it as "unverified"
            return Date.now();
        }
    },

    /**
     * Calculates the remaining time for the initial lock and the penalties
     * @param {Object} state - The current state from StorageManager
     * @param {number} networkTime - The current verified timestamp
     */
    calculateRemaining(state, networkTime) {
        const initialDurationMs = state.initialDurationMinutes * 60000;
        const penaltyMs = state.penaltyMinutes * 60000;
        
        // The timestamp when the user is allowed to 'Request Unlock'
        const unlockThreshold = state.startTime + initialDurationMs + penaltyMs;
        
        const totalRemainingMs = unlockThreshold - networkTime;
        
        return {
            totalMs: Math.max(0, totalRemainingMs),
            isReady: totalRemainingMs <= 0,
            // Track penalty separately for the UI display
            penaltyMs: penaltyMs
        };
    },

    /**
     * Formats milliseconds into a readable HH:MM:SS string
     */
    formatTime(ms) {
        if (ms <= 0) return "00:00:00";
        
        let seconds = Math.floor(ms / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);

        seconds = seconds % 60;
        minutes = minutes % 60;

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }
};
