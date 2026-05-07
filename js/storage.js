/**
 * STORAGE & ENCRYPTION MODULE
 * Manages persistence, statistical tracking, and data portability.
 */
const StorageManager = {
    KEY: 'terminal_v2_vault',
    STATS_KEY: 'terminal_v2_stats',

    /**
     * Obfuscates and saves the primary lock state.
     */
    save(state) {
        // Simple obfuscation to prevent casual data peeking
        const encoded = btoa(JSON.stringify(state));
        localStorage.setItem(this.KEY, encoded);
    },

    /**
     * Loads and decrypts the primary lock state.
     */
    load() {
        const data = localStorage.getItem(this.KEY);
        if (!data) return null;
        try {
            return JSON.parse(atob(data));
        } catch (e) {
            console.error("Vault Decryption Error:", e);
            return null;
        }
    },

    /**
     * STATS ENGINE
     * Tracks performance metrics for the Premium Dashboard.
     */
    updateStats(type) {
        let stats = this.getStats();
        if (type === 'win') stats.wins++;
        if (type === 'loss') stats.losses++;
        if (type === 'session') stats.sessions++;
        
        localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
        return stats;
    },

    getStats() {
        const data = localStorage.getItem(this.STATS_KEY);
        return data ? JSON.parse(data) : { wins: 0, losses: 0, sessions: 0 };
    },

    /**
     * DATA PORTABILITY
     * Generates an obfuscated string for session migration across browsers.
     */
    exportSession() {
        const state = this.load();
        if (!state) return null;
        const bundle = { state, stats: this.getStats(), timestamp: Date.now() };
        return btoa(JSON.stringify(bundle));
    },

    importSession(bundleString) {
        try {
            const bundle = JSON.parse(atob(bundleString));
            if (bundle.state) this.save(bundle.state);
            if (bundle.stats) localStorage.setItem(this.STATS_KEY, JSON.stringify(bundle.stats));
            return true;
        } catch (e) {
            return false;
        }
    },

    clear() {
        localStorage.removeItem(this.KEY);
    },

    /**
     * SECURITY: RECOVERY KEY GENERATION
     * Generates a 2-segment alphanumeric bypass key.
     */
    generateRecoveryKey() {
        const segments = [];
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        for (let i = 0; i < 2; i++) {
            let seg = "";
            for (let j = 0; j < 4; j++) {
                seg += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            segments.push(seg);
        }
        return `RECOVER-${segments[0]}-${segments[1]}`;
    }
};
