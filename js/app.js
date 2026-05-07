/**
 * KINK-TECH CORE ENGINE
 * Orchestrates submission states, obedience scaling, and interface transitions.
 */
const App = {
    state: null,
    heartbeat: null,
    hapticsEnabled: true,

    /**
     * Initialises the interface and resumes any active denial session.
     */
    async init() {
        console.log("Kink-Tech V2.1: System Online.");
        
        // 1. Initialise Time (Internal Mode)
        await TimeManager.sync();

        // 2. Access the Control Vault
        this.state = StorageManager.load();

        // 3. Bind Interface Listeners
        this.attachListeners();

        // 4. Determine Initial State
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

    /**
     * Binds persistent event listeners to the interface.
     */
    attachListeners() {
        const startBtn = document.getElementById('start-lock-btn');
        const requestBtn = document.getElementById('request-unlock-btn');
        const recoverBtn = document.getElementById('recovery-btn');
        const hapticBtn = document.getElementById('haptic-toggle');
        const exportBtn = document.getElementById('export-btn');
        const resetBtn = document.getElementById('reset-app-btn');

        if (startBtn) startBtn.onclick = () => App.commenceLockdown();
        
        if (requestBtn) {
            requestBtn.onclick = () => {
                console.log("Release request detected. Initiating trial.");
                App.launchTrial();
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
                    alert("DENIAL STATE COPIED TO CLIPBOARD");
                }
            };
        }

        if (resetBtn) {
            resetBtn.onclick = () => {
                if (confirm("TERMINATE SESSION? DATA WILL BE WIPED.")) {
                    StorageManager.clear();
                    location.reload();
                }
            };
        }
    },

    /**
     * Calculates the Obedience Tier based on success/failure ratio.
     */
    updateDifficulty() {
        const stats = StorageManager.getStats();
        const totalTrials = stats.wins + stats.losses;
        
        if (totalTrials < 3) {
            GamesManager.difficulty = 1;
        } else {
            const winRate = (stats.wins / totalTrials) * 100;
            if (winRate > 75) GamesManager.difficulty = 3;
            else if (winRate > 50) GamesManager.difficulty = 2;
            else GamesManager.difficulty = 1;
        }
        console.log(`Obedience Tier: ${GamesManager.difficulty}`);
    },

    /**
     * Sets the parameters for the current sentence and locks the interface.
     */
    commenceLockdown() {
        const pin = document.getElementById('pin-input').value;
        const maxH = parseInt(document.getElementById('max-time-input').value);
        
        if (pin.length !== 4 || isNaN(maxH)) {
            return alert("INPUT ERROR: INVALID PARAMETERS");
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
        
        alert(`MASTER OVERRIDE KEY:\n${recoveryKey}\nSAVE THIS OR REMAIN LOCKED.`);
        this.startLockCycle();
    },

    /**
     * Runs the active denial heartbeat and manages the 'Beg' button visibility.
     */
    startLockCycle() {
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
            
            // Manage Progress Visuals
            const totalSentence = (this.state.initialMins + this.state.penaltyMins) * 60000;
            const progress = Math.min(100, Math.max(0, 100 - (remaining / totalSentence * 100)));
            document.getElementById('penalty-progress').style.width = `${progress}%`;

            // Reveal Trial Button when sentence is served
            if (remaining <= 0) {
                if (requestBtn.classList.contains('hidden')) {
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
     * Transitions to the Trial Screen and selects a challenge.
     */
    launchTrial() {
        if (this.heartbeat) clearInterval(this.heartbeat);
        this.showScreen('game-screen');
        
        const container = document.getElementById('game-container');
        document.getElementById('game-feedback').innerText = "";

        const pool = ['guess', 'ttt'];
        if (GamesManager.difficulty >= 2) pool.push('pattern');
        if (GamesManager.difficulty >= 3) pool.push('logic');

        const selection = pool[Math.floor(Math.random() * pool.length)];

        switch(selection) {
            case 'ttt': GamesManager.initTicTacToe(container, (w) => App.processResult(w)); break;
            case 'guess': GamesManager.initGuessNumber(container, (w) => App.processResult(w)); break;
            case 'pattern': GamesManager.initPatternRecall(container, (w) => App.processResult(w)); break;
            case 'logic': GamesManager.initLogicGates(container, (w) => App.processResult(w)); break;
        }
    },

    /**
     * Evaluates Trial results and applies disciplinary time for failures.
     */
    processResult(success) {
        if (success) {
            StorageManager.updateStats('win');
            this.state.unlocked = true;
            StorageManager.save(this.state);
            this.showUnlocked();
        } else {
            StorageManager.updateStats('loss');
            
            // Disciplinary time scales with Obedience Tier
            const basePenalty = GamesManager.difficulty * 60; 
            const variance = Math.floor(Math.random() * 120);
            const totalPenalty = basePenalty + variance;

            this.state.penaltyMins += totalPenalty;
            StorageManager.save(this.state);
            
            alert(`DISCIPLINE EXTENDED: ${totalPenalty} MINUTES ADDED TO YOUR SENTENCE.`);
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
            alert("OVERRIDE DENIED: INVALID KEY");
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
        const target = document.getElementById(id);
        if (target) target.classList.remove('hidden');
    }
};

window.onload = () => App.init();
