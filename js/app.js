const App = {
    state: null,
    updateInterval: null,

    async init() {
        await TimeManager.sync();
        this.state = StorageManager.load();

        if (!this.state) {
            this.showScreen('setup-screen');
        } else if (this.state.unlocked) {
            this.showUnlocked();
        } else {
            this.startLockCycle();
        }

        this.attachGlobalListeners();
    },

    attachGlobalListeners() {
        document.getElementById('start-lock-btn').onclick = () => this.handleSetup();
        document.getElementById('request-unlock-btn').onclick = () => this.launchChallenge();
        document.getElementById('recovery-btn').onclick = () => this.handleRecovery();
        document.getElementById('reset-app-btn').onclick = () => {
            StorageManager.clear();
            location.reload();
        };
    },

    handleSetup() {
        const pin = document.getElementById('pin-input').value;
        const maxHours = parseInt(document.getElementById('max-time-input').value);
        if (pin.length !== 4) return alert("Please enter a 4-digit PIN.");

        const initialMins = Math.floor(Math.random() * (maxHours * 60)) + 1;
        const recoveryKey = StorageManager.generateRecoveryKey();

        this.state = {
            pin,
            startTime: TimeManager.getVerifiedTime(),
            initialMins,
            penaltyMins: 0,
            unlocked: false,
            recoveryKey
        };

        StorageManager.save(this.state);
        alert(`MASTER RECOVERY KEY:\n${recoveryKey}\nKeep this safe!`);
        this.startLockCycle();
    },

    startLockCycle() {
        this.showScreen('lock-screen');
        if (this.updateInterval) clearInterval(this.updateInterval);

        this.updateInterval = setInterval(() => {
            const threshold = this.state.startTime + (this.state.initialMins + this.state.penaltyMins) * 60000;
            const remaining = threshold - TimeManager.getVerifiedTime();

            document.getElementById('main-countdown').innerText = TimeManager.formatTime(remaining);
            document.getElementById('penalty-timer').innerText = `+${TimeManager.formatTime(this.state.penaltyMins * 60000)}`;

            const btn = document.getElementById('request-unlock-btn');
            if (remaining <= 0) btn.classList.remove('hidden');
            else btn.classList.add('hidden');
        }, 1000);
    },

    launchChallenge() {
        clearInterval(this.updateInterval);
        this.showScreen('game-screen');
        document.getElementById('game-feedback').innerText = "";
        
        const gameType = Math.random() > 0.5 ? 'ttt' : 'guess';
        if (gameType === 'ttt') {
            document.getElementById('game-title').innerText = "Tic-Tac-Toe: Win to Unlock";
            GamesManager.initTicTacToe(document.getElementById('game-container'), (win) => this.handleGameResult(win));
        } else {
            document.getElementById('game-title').innerText = "Guess the Number";
            GamesManager.initGuessNumber(document.getElementById('game-container'), (win) => this.handleGameResult(win));
        }
    },

    handleGameResult(win) {
        if (win) {
            this.state.unlocked = true;
            StorageManager.save(this.state);
            this.showUnlocked();
        } else {
            const penalty = Math.floor(Math.random() * 180) + 60; // 1-4 Hours
            this.state.penaltyMins += penalty;
            StorageManager.save(this.state);
            alert(`Challenge failed. ${penalty} minutes added to penalty.`);
            this.startLockCycle();
        }
    },

    handleRecovery() {
        const input = document.getElementById('recovery-input').value.trim().toUpperCase();
        if (this.state && input === this.state.recoveryKey) {
            this.state.unlocked = true;
            StorageManager.save(this.state);
            this.showUnlocked();
        } else {
            alert("Invalid Recovery Key.");
        }
    },

    showUnlocked() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.showScreen('unlock-screen');
        document.getElementById('revealed-pin').innerText = this.state.pin;
    },

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    }
};

window.onload = () => App.init();
