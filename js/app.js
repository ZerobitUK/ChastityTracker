const App = {
    state: null,
    updateInterval: null,

    async init() {
        // Load existing state
        this.state = StorageManager.getState();
        
        if (!this.state) {
            this.showScreen('setup-screen');
            this.setupListeners();
        } else if (this.state.isUnlocked) {
            this.showUnlockScreen();
        } else {
            this.startLockCycle();
        }
    },

    setupListeners() {
        document.getElementById('start-lock-btn').onclick = () => {
            const pin = document.getElementById('pin-input').value;
            const maxH = parseInt(document.getElementById('max-time-input').value);

            if (pin.length === 4 && !isNaN(maxH)) {
                this.state = StorageManager.saveInitialState(pin, maxH);
                alert(`IMPORTANT: Your Recovery Key is ${this.state.recoveryKey}\nWrite this down!`);
                this.startLockCycle();
            } else {
                alert("Please enter a 4-digit PIN and a valid maximum time.");
            }
        };

        document.getElementById('request-unlock-btn').onclick = () => {
            this.startChallenge();
        };
    },

    async startLockCycle() {
        this.showScreen('lock-screen');
        
        // Start the heart-beat timer
        if (this.updateInterval) clearInterval(this.updateInterval);
        
        this.updateInterval = setInterval(async () => {
            const now = await TimeManager.getCurrentTime();
            const status = TimeManager.calculateRemaining(this.state, now);

            // Update UI
            document.getElementById('main-countdown').innerText = TimeManager.formatTime(status.totalMs);
            document.getElementById('penalty-timer').innerText = `+${TimeManager.formatTime(status.penaltyMs)}`;

            // Toggle Request Button
            const requestBtn = document.getElementById('request-unlock-btn');
            if (status.isReady) {
                requestBtn.classList.remove('hidden');
            } else {
                requestBtn.classList.add('hidden');
            }
        }, 1000);
    },

    startChallenge() {
        this.showScreen('game-screen');
        const container = document.getElementById('game-container');
        
        // Randomly pick between the two games
        const gameChoice = Math.random() > 0.5 ? 'ttt' : 'guess';
        
        if (gameChoice === 'ttt') {
            document.getElementById('game-title').innerText = "Tic-Tac-Toe: Win to Unlock";
            GamesManager.initTicTacToe(container, (win) => this.handleGameResult(win));
        } else {
            document.getElementById('game-title').innerText = "Guess the Number";
            GamesManager.initGuessNumber(container, (win) => this.handleGameResult(win));
        }
    },

    handleGameResult(didWin) {
        if (didWin) {
            StorageManager.setUnlocked();
            this.showUnlockScreen();
        } else {
            // Add a random penalty between 1 and 4 hours (in minutes)
            const penalty = Math.floor(Math.random() * (4 * 60 - 60 + 1)) + 60;
            this.state = StorageManager.addPenalty(penalty);
            
            alert(`Challenge Failed. ${penalty} minutes added to penalty.`);
            this.startLockCycle();
        }
    },

    showUnlockScreen() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.showScreen('unlock-screen');
        document.getElementById('revealed-pin').innerText = this.state.pin;
        
        // Option to reset app after reveal
        const resetBtn = document.createElement('button');
        resetBtn.innerText = "Full Reset";
        resetBtn.onclick = () => {
            StorageManager.clearAll();
            location.reload();
        };
        document.getElementById('unlock-screen').appendChild(resetBtn);
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(screenId).classList.remove('hidden');
    }
};

// Initialise the app on load
window.onload = () => App.init();
