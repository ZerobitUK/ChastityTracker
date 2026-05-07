/**
 * CONTROL VAULT MODULE
 * Manages the persistent state of denial, obedience metrics, and bypass keys.
 */
const StorageManager = {
    KEY: 'kink_tech_vault',
    STATS_KEY: 'kink_tech_stats',

    /**
     * Obfuscates and secures the current state of denial.
     */
    save(state) {
        const encoded = btoa(JSON.stringify(state));
        localStorage.setItem(this.KEY, encoded);
    },

    /**
     * Retrieves and decodes the current vault state.
     */
    load() {
        const data = localStorage.getItem(this.KEY);
        if (!data) return null;
        try {
            return JSON.parse(atob(data));
        } catch (e) {
            console.error("Vault Access Error: Integrity Compromised.");
            return null;
        }
    },

    /**
     * OBEDIENCE METRICS
     * Tracks trials won and lost to calculate the Obedience Tier.
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
     * STATE PORTABILITY
     * Generates a string to transfer the current state of denial to another device.
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
     * MASTER OVERRIDE GENERATOR
     * Creates a high-entropy alphanumeric key for emergency release.
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
