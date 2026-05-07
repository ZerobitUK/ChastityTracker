/**
 * TERMINAL CORE ENGINE
 * Orchestrates state transitions, difficulty scaling, and PWA integration.
 */
const App = {
    state: null,
    heartbeat: null,
    hapticsEnabled: true,

    async init() {
        // 1. Synchronise with Time Consensus Engine
        await TimeManager.sync();

        // 2. Load Vault Data
        this.state = StorageManager.load();

        // 3. Setup Global UI Listeners
        this.attachListeners();

        // 4. Initialise State
        if (!this.state) {
            this.showScreen('setup-screen');
        } else if (this.state.unlocked) {
            this.showUnlocked();
        } else {
            this.updateDifficulty();
            this.startLockCycle();
        }
        
        this.updateStatsDisplay();
    },

    attachListeners() {
        // Setup Logic
        document.getElementById('start-lock-btn').onclick = () => this.commenceLockdown();
        
        // Active Lock Logic - FIXED FUNCTION NAME
        document.getElementById('request-unlock-btn').onclick = () => this.launchChallenge();
        document.getElementById('recovery-btn').onclick = () => this.handleRecovery();
        
        // Utility Drawer
        document.getElementById('haptic-toggle').onclick = (e) => {
            this.hapticsEnabled = !this.hapticsEnabled;
            e.currentTarget.classList.toggle('active', this.hapticsEnabled);
        };

        document.getElementById('export-btn').onclick = () => {
            const bundle = StorageManager.exportSession();
            if (bundle) {
                navigator.clipboard.writeText(bundle);
                alert("SESSION DATA COPIED TO CLIPBOARD");
            }
        };

        // Termination
        document.getElementById('reset-app-btn').onclick = () => {
            if(confirm("TERMINATE ALL DATA? THIS CANNOT BE UNDONE.")) {
                StorageManager.clear();
                location.reload();
            }
        };
    },

    /**
     * DIFFICULTY SCALING ENGINE
     */
    updateDifficulty() {
        const stats = StorageManager.getStats();
        const totalGames = stats.wins + stats.losses;
        if (totalGames < 5) {
            GamesManager.difficulty = 1;
        } else {
            const winRate = (stats.wins / totalGames) * 100;
            if (winRate > 75) GamesManager.difficulty = 3;
            else if (winRate > 50) GamesManager.difficulty = 2;
            else GamesManager.difficulty = 1;
        }
    },

    commenceLockdown() {
        const pin = document.getElementById('pin-input').value;
        const maxH = parseInt(document.getElementById('max-time-input').value);
        
        if (pin.length !== 4 || isNaN(maxH)) {
            return alert("PROTOCOL ERROR: INVALID PARAMETERS");
        }

        const initialMins = Math.floor(Math.random() * (maxH * 60)) + 1;
        const recoveryKey = StorageManager.generateRecoveryKey();

        this.state = {
            pin,
            startTime: TimeManager.getVerifiedTime(),
            initialMins,
            penaltyMins: 0,
            unlocked: false,
            mysteryMode: document.getElementById('mystery-toggle').checked,
            scaling: document.getElementById('difficulty-toggle').checked,
            recoveryKey
        };

        StorageManager.save(this.state);
        StorageManager.updateStats('session');
        
        alert(`ENCRYPTION KEY GENERATED:\n${recoveryKey}\nSTORE MANUALLY.`);
        this.startLockCycle();
    },

    startLockCycle() {
        this.showScreen('lock-screen');
        if (this.heartbeat) clearInterval(this.heartbeat);

        const timerText = document.getElementById('main-countdown');
        const overlay = document.getElementById('mystery-overlay');
        
        if (this.state.mysteryMode) {
            timerText.classList.add('hidden');
            overlay.classList.remove('hidden');
        }

        this.heartbeat = setInterval(() => {
            const now = TimeManager.getVerifiedTime();
            const threshold = this.state.startTime + (this.state.initialMins + this.state.penaltyMins) * 60000;
            const remaining = threshold - now;

            timerText.innerText = TimeManager.formatTime(remaining);
            document.getElementById('penalty-timer').innerText = `+${TimeManager.formatTime(this.state.penaltyMins * 60000)}`;
            
            const totalLockTime = (this.state.initialMins + this.state.penaltyMins) * 60000;
            const progress = Math.min(100, Math.max(0, 100 - (remaining / totalLockTime * 100)));
            document.getElementById('penalty-progress').style.width = `${progress}%`;

            const requestBtn = document.getElementById('request-unlock-btn');
            if (remaining <= 0) {
                requestBtn.classList.remove('hidden');
                if (this.state.mysteryMode) {
                    timerText.classList.remove('hidden');
                    overlay.classList.add('hidden');
                }
            } else {
                requestBtn.classList.add('hidden');
            }
        }, 1000);
    },

    launchChallenge() {
        clearInterval(this.heartbeat);
        this.showScreen('game-screen');
        
        const container = document.getElementById('game-container');
        document.getElementById('game-feedback').innerText = "";

        const pool = ['guess', 'ttt'];
        if (GamesManager.difficulty >= 2) pool.push('pattern');
        if (GamesManager.difficulty >= 3) pool.push('logic');

        const selection = pool[Math.floor(Math.random() * pool.length)];

        switch(selection) {
            case 'ttt': GamesManager.initTicTacToe(container, (w) => this.processResult(w)); break;
            case 'guess': GamesManager.initGuessNumber(container, (w) => this.processResult(w)); break;
            case 'pattern': GamesManager.initPatternRecall(container, (w) => this.processResult(w)); break;
            case 'logic': GamesManager.initLogicGates(container, (w) => this.processResult(w)); break;
        }
    },

    processResult(success) {
        if (success) {
            StorageManager.updateStats('win');
            this.state.unlocked = true;
            StorageManager.save(this.state);
            this.showUnlocked();
        } else {
            StorageManager.updateStats('loss');
            const basePenalty = GamesManager.difficulty * 60; 
            const variance = Math.floor(Math.random() * 120);
            const totalPenalty = basePenalty + variance;

            this.state.penaltyMins += totalPenalty;
            StorageManager.save(this.state);
            
            alert(`PROTOCOL BREACH: SECURITY LOCK EXTENDED BY ${totalPenalty} MINUTES.`);
            this.updateDifficulty();
            this.startLockCycle();
        }
        this.updateStatsDisplay();
    },

    handleRecovery() {
        const input = document.getElementById('recovery-input').value.trim().toUpperCase();
        if (input === this.state.recoveryKey) {
            this.state.unlocked = true;
            StorageManager.save(this.state);
            this.showUnlocked();
        } else {
            alert("BYPASS DENIED: INVALID KEY");
            GamesManager.triggerFeedback('fail');
        }
    },

    showUnlocked() {
        if (this.heartbeat) clearInterval(this.heartbeat);
        this.showScreen('unlock-screen');
        document.getElementById('revealed-pin').innerText = this.state.pin;
        GamesManager.triggerFeedback('success');
    },

    updateStatsDisplay() {
        const stats = StorageManager.getStats();
        const total = stats.wins + stats.losses;
        const rate = total === 0 ? 0 : Math.round((stats.wins / total) * 100);
        
        document.getElementById('stat-winrate').innerText = `${rate}%`;
        document.getElementById('stat-sessions').innerText = stats.sessions;
    },

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    }
};

window.onload = () => App.init();
