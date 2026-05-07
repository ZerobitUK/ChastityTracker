/**
 * MULTI-SOURCE TIME CONSENSUS ENGINE
 * Prevents clock manipulation via network-validated timestamps.
 */
const TimeManager = {
    offset: 0,
    isSynced: false,
    
    // High-availability endpoints for consensus
    SOURCES: [
        { url: 'https://www.timeapi.io/api/Time/current/zone?timeZone=UTC', type: 'JSON_TIMEAPI' },
        { url: 'https://worldtimeapi.org/api/timezone/Etc/UTC', type: 'JSON_WORLDTIME' },
        { url: window.location.href, type: 'HEAD_ORIGIN' } 
    ],

    /**
     * Pings multiple sources and calculates a consensus offset.
     */
    async sync() {
        const results = [];
        
        // Execute all pings in parallel for maximum speed
        const pings = this.SOURCES.map(async (source) => {
            const start = Date.now();
            try {
                const options = source.type === 'HEAD_ORIGIN' ? { method: 'HEAD', cache: 'no-store' } : {};
                const response = await fetch(source.url, options);
                
                if (!response.ok) return null;

                let serverTime;
                if (source.type === 'HEAD_ORIGIN') {
                    const dateHeader = response.headers.get('Date');
                    serverTime = new Date(dateHeader).getTime();
                } else {
                    const data = await response.json();
                    serverTime = new Date(data.dateTime || data.utc_datetime).getTime();
                }

                const latency = (Date.now() - start) / 2;
                return (serverTime + latency) - Date.now();
            } catch (e) {
                return null;
            }
        });

        const offsets = (await Promise.all(pings)).filter(val => val !== null);

        if (offsets.length > 0) {
            // Consensus Logic: Average the available offsets
            this.offset = offsets.reduce((a, b) => a + b, 0) / offsets.length;
            this.isSynced = true;
            this.updateConnectionStatus(true);
        } else {
            console.error("Consensus Failed: No reliable time sources reachable.");
            this.updateConnectionStatus(false);
        }
    },

    /**
     * Returns the 'Absolute Truth' time instantly.
     */
    getVerifiedTime() {
        return Date.now() + this.offset;
    },

    /**
     * Formats milliseconds into a premium HH:MM:SS string.
     */
    formatTime(ms) {
        if (ms <= 0) return "00:00:00";
        
        let seconds = Math.floor(ms / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);

        return [
            hours.toString().padStart(2, '0'),
            (minutes % 60).toString().padStart(2, '0'),
            (seconds % 60).toString().padStart(2, '0')
        ].join(':');
    },

    updateConnectionStatus(success) {
        const indicator = document.getElementById('connection-status');
        if (!indicator) return;
        
        if (success) {
            indicator.innerText = "SECURE SYNC ACTIVE";
            indicator.style.color = "var(--neon-cyan)";
        } else {
            indicator.innerText = "UNVERIFIED (OFFLINE)";
            indicator.style.color = "var(--neon-red)";
        }
    }
};
