/**
 * TIME MANAGEMENT MODULE
 * Handles the temporal logic of denial using the local system clock.
 */
const TimeManager = {
    /**
     * Retrieves the current timestamp from the device.
     */
    getVerifiedTime() {
        return Date.now();
    },

    /**
     * Formats milliseconds into a clean, authoritative HH:MM:SS string.
     * @param {number} ms - The duration remaining.
     */
    formatTime(ms) {
        if (ms <= 0) return "00:00:00";
        
        let seconds = Math.floor(ms / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);

        // Pad values to maintain the high-end terminal look
        const h = hours.toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');

        return `${h}:${m}:${s}`;
    },

    /**
     * Compatibility bridge for the App orchestrator.
     */
    async sync() {
        console.log("Internal Chronometer: Active.");
        return Promise.resolve();
    }
};
