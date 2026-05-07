const StorageManager = {
    KEY: 'lock_state_v1',

    save(state) {
        localStorage.setItem(this.KEY, JSON.stringify(state));
    },

    load() {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : null;
    },

    clear() {
        localStorage.removeItem(this.KEY);
    },

    generateRecoveryKey() {
        // Random 8-character string for master bypass
        return "RECOVER-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
};
