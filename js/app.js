/**
 * TERMINAL CORE ENGINE
 * Orchestrates state transitions, difficulty scaling, and UI logic.
 */
const App = {
    state: null,
    heartbeat: null,
    hapticsEnabled: true,

    /**
     * Initialises the application state and synchronises timing.
     */
    async init() {
        console.log("Terminal V2.1: Initialising...");
        
        // 1. Initialise Time (Local Mode)
        await TimeManager.sync();

        // 2. Load Vault Data from Storage
        this.state = StorageManager.load();

        // 3. Setup Global UI Listeners
        this.attachListeners();

        // 4. Initialise UI State based on Vault
        if (!this.state) {
            console.log("No active lock found. Showing setup.");
            this.showScreen('setup-screen');
        } else if (this.state.unlocked) {
            console.log("Lock already cleared. Showing PIN.");
            this.showUnlocked();
        } else {
            console.log("Active lock detected. Resuming cycle.");
            this.updateDifficulty();
            this.startLockCycle();
        }
        
        this.updateStatsDisplay();
    },

    /**
     * Attaches persistent listeners to UI elements.
     * Uses explicit 'App' referencing to prevent 'this' context loss.
     */
    attachListeners() {
        const startBtn = document.getElementById('start-lock-btn');
        const unlockBtn = document.getElementById('request-unlock-btn');
        const recoverBtn = document.getElementById('recovery-btn');
        const hapticBtn = document.getElementById('haptic-toggle');
        const exportBtn = document.getElementById('export-btn');
        const resetBtn = document.getElementById('reset-app-btn');

        if (startBtn) startBtn.onclick = () => App.commenceLockdown();
        
        if (unlockBtn) {
            unlockBtn.onclick = () => {
                console.log("Unlock Request Triggered.");
                App.launchChallenge();
            };
        }
        
        if (recoverBtn) recoverBtn.onclick = () => App.handleRecovery();

        if (hapticBtn) {
            hapticBtn.onclick = (e) => {
                App.hapticsEnabled = !App.hapticsEnabled;
                e.currentTarget.classList.toggle('active', App.hapticsEnabled);
                GamesManager.triggerFeedback('click');
            };
        }

        if (exportBtn) {
            exportBtn.onclick = () => {
                const bundle = StorageManager.exportSession();
                if (bundle) {
                    navigator.clipboard.writeText(bundle);
                    alert("SESSION DATA ENCRYPTED & COPIED TO CLIPBOARD");
                }
            };
        }

        if (resetBtn) {
            resetBtn.onclick = () => {
                if (confirm("TERMINATE ALL DATA? THIS ACTION IS PERMANENT.")) {
                    StorageManager.clear();
                    location.reload();
                }
            };
        }
    },

    /**
     * Sets game difficulty Tier (1-3) based on historic win rate.
     */
    updateDifficulty() {
        const stats = StorageManager.getStats();
        const totalGames = stats.wins + stats.losses;
        
        if (totalGames < 3) {
            GamesManager.difficulty = 1;
        } else {
            const winRate = (stats.wins / totalGames) * 100;
            if (winRate > 75) GamesManager.difficulty = 3;
            else if (winRate > 50) GamesManager.difficulty = 2;
            else GamesManager.difficulty = 1;
        }
        console.log(`Difficulty Tier Set: ${GamesManager.difficulty}`);
    },

    /**
     * Captures setup parameters and initiates the lock.
     */
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
        
        alert(`BYPASS KEY GENERATED:\n${recoveryKey}\nSAVE THIS EXTERNALLY.`);
        this.startLockCycle();
    },

    /**
     * Manages the active countdown and progress bar.
     */
    startLockCycle() {
        console.log("Starting Heartbeat Cycle...");
        this.showScreen('lock-screen');
        if (this.heartbeat) clearInterval(this.heartbeat);

        const timerText = document.getElementById('main-countdown');
        const overlay = document.getElementById('mystery-overlay');
        const requestBtn = document.getElementById('request-unlock-btn');
        
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
            
            // Progress Bar Logic
            const totalLockTime = (this.state.initialMins + this.state.penaltyMins) * 60000;
            const progress = Math.min(100, Math.max(0, 100 - (remaining / totalLockTime * 100)));
            document.getElementById('penalty-progress').style.width = `${progress}%`;

            // Reveal Challenge Button if ready
            if (remaining <= 0) {
                if (requestBtn.classList.contains('hidden')) {
                    console.log("Timer expired. Revealing Access Button.");
                    requestBtn.classList.remove('hidden');
                    if (this.state.mysteryMode) {
                        timerText.classList.remove('hidden');
                        overlay.classList.add('hidden');
                    }
                }
            } else {
                requestBtn.classList.add('hidden');
            }
        }, 1000);
    },

    /**
     * Switches to game mode and randomly selects a tier-appropriate trial.
     */
    launchChallenge() {
        console.log("Switching to Challenge Mode...");
        if (this.heartbeat) clearInterval(this.heartbeat);
        
        this.showScreen('game-screen');
        
        const container = document.getElementById('game-container');
        document.getElementById('game-feedback').innerText = "";

        const pool = ['guess', 'ttt'];
        if (GamesManager.difficulty >= 2) pool.push('pattern');
        if (GamesManager.difficulty >= 3) pool.push('logic');

        const selection = pool[Math.floor(Math.random() * pool.length)];
        console.log(`Selected Challenge: ${selection}`);

        switch(selection) {
            case 'ttt': GamesManager.initTicTacToe(container, (w) => App.processResult(w)); break;
            case 'guess': GamesManager.initGuessNumber(container, (w) => App.processResult(w)); break;
            case 'pattern': GamesManager.initPatternRecall(container, (w) => App.processResult(w)); break;
            case 'logic': GamesManager.initLogicGates(container, (w) => App.processResult(w)); break;
        }
    },

    /**
     * Handles win/loss results and calculates penalties.
     */
    processResult(success) {
        if (success) {
            console.log("Challenge Won.");
            StorageManager.updateStats('win');
            this.state.unlocked = true;
            StorageManager.save(this.state);
            this.showUnlocked();
        } else {
            console.log("Challenge Failed. Applying Penalty.");
            StorageManager.updateStats('loss');
            
            const basePenalty = GamesManager.difficulty * 60; 
            const variance = Math.floor(Math.random() * 120);
            const totalPenalty = basePenalty + variance;

            this.state.penaltyMins += totalPenalty;
            StorageManager.save(this.state);
            
            alert(`SECURITY BREACH: LOCK EXTENDED BY ${totalPenalty} MINUTES.`);
            this.updateDifficulty();
            this.startLockCycle();
        }
        this.updateStatsDisplay();
    },

    handleRecovery() {
        const input = document.getElementById('recovery-input').value.trim().toUpperCase();
        if (input === this.state.recoveryKey) {
            console.log("Recovery Bypass Accepted.");
            this.state.unlocked = true;
            StorageManager.save(this.state);
            this.showUnlocked();
        } else {
            alert("ACCESS DENIED: INVALID BYPASS KEY");
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

    /**
     * Utility to manage screen visibility.
     */
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(id);
        if (target) {
            target.classList.remove('hidden');
        } else {
            console.error(`FATAL: Screen ID '${id}' not found in DOM.`);
        }
    }
};

// INITIALISE TERMINAL
window.onload = () => App.init();
