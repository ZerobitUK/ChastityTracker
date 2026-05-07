const TimeManager = {
    offset: 0,
    // Primary source (Faster than WorldTimeAPI)
    PRIMARY_API: 'https://www.timeapi.io/api/Time/current/zone?timeZone=UTC',

    /**
     * Synchronises with a high-speed server
     */
    async sync() {
        const startFetch = Date.now();
        
        try {
            // Attempt 1: Fast dedicated Time API
            const response = await fetch(this.PRIMARY_API);
            if (!response.ok) throw new Error("Primary API Down");
            
            const data = await response.json();
            // timeapi.io returns a 'dateTime' string
            const serverTime = new Date(data.dateTime).getTime();
            this.calculateOffset(serverTime, startFetch);
            
        } catch (error) {
            console.warn("Primary API failed, attempting Header Sync...");
            
            try {
                // Attempt 2: Header Sync (Fastest fallback)
                // We fetch the current page itself - very low latency
                const response = await fetch(window.location.href, { method: 'HEAD' });
                const serverDateStr = response.headers.get('Date');
                if (!serverDateStr) throw new Error("No Date Header");
                
                const serverTime = new Date(serverDateStr).getTime();
                this.calculateOffset(serverTime, startFetch);
            } catch (fallbackError) {
                console.error("All time syncs failed. Defaulting to system time.");
                this.offset = 0;
            }
        }
    },

    calculateOffset(serverTime, startFetch) {
        const endFetch = Date.now();
        const latency = (endFetch - startFetch) / 2;
        this.offset = (serverTime + latency) - Date.now();
        console.log(`Sync complete. Network Latency: ${latency}ms, System Offset: ${this.offset}ms`);
    },

    getVerifiedTime() {
        return Date.now() + this.offset;
    },

    formatTime(ms) {
        if (ms <= 0) return "00:00:00";
        let s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
        return [h, m % 60, s % 60].map(v => v.toString().padStart(2, '0')).join(':');
    }
};
