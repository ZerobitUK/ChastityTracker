/**
 * LOCAL TIME MODULE
 * High-performance time management using the device's internal clock.
 */
const TimeManager = {
    /**
     * Instantly returns the current local timestamp.
     * Replaces the previous API-based consensus for zero-latency start-up.
     */
    getVerifiedTime() {
        return Date.now();
    },

    /**
     * Formats milliseconds into a premium HH:MM:SS string.
     * @param {number} ms - The duration in milliseconds.
     */
    formatTime(ms) {
        if (ms <= 0) return "00:00:00";
        
        let seconds = Math.floor(ms / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);

        // Ensures two-digit padding for a professional terminal look
        const h = hours.toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');

        return `${h}:${m}:${s}`;
    },

    /**
     * Dummy sync function to maintain compatibility with the App orchestrator.
     */
    async sync() {
        console.log("Local Time Mode: Synchronisation bypassed for performance.");
        return Promise.resolve();
    }
};
