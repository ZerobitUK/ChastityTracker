/**
 * OBEDIENCE TRIALS ENGINE
 * Manages the psychological and logical tests required for release.
 */
const GamesManager = {
    difficulty: 1, // Scales from 1 (Novice) to 3 (Absolute)
    onResult: null,

    /**
     * TRIAL: PATTERN RECALL (Memory Training)
     * Replicate the sequence to prove mental focus.
     */
    initPatternRecall(container, onResult) {
        this.onResult = onResult;
        const sequence = [];
        const length = 4 + this.difficulty;
        
        container.innerHTML = `
            <p class="trial-desc">REPLICATE THE SEQUENCE</p>
            <div class="ttt-grid" id="pattern-grid">
                <div class="ttt-cell" data-id="0"></div><div class="ttt-cell" data-id="1"></div>
                <div class="ttt-cell" data-id="2"></div><div class="ttt-cell" data-id="3"></div>
            </div>
        `;

        for(let i=0; i<length; i++) sequence.push(Math.floor(Math.random() * 4));

        let step = 0;
        const interval = setInterval(() => {
            const cell = container.querySelector(`[data-id="${sequence[step]}"]`);
            cell.style.background = "var(--neon-accent)";
            this.triggerFeedback('click');
            setTimeout(() => cell.style.background = "", 400);
            step++;
            if(step >= sequence.length) {
                clearInterval(interval);
                this.enablePatternInput(container, sequence);
            }
        }, 800 - (this.difficulty * 100));
    },

    /**
     * TRIAL: LOGIC GATES (The Binary Sum)
     * Balance the logic bridge to match the target sum.
     */
    initLogicGates(container, onResult) {
        this.onResult = onResult;
        const target = Math.floor(Math.random() * 15) + 1;
        let current = 0;

        container.innerHTML = `
            <p class="trial-desc">STABILISE LOGIC: TARGET ${target}</p>
            <div class="utility-drawer">
                <button class="bit-btn icon-btn" data-bit="8">0</button>
                <button class="bit-btn icon-btn" data-bit="4">0</button>
                <button class="bit-btn icon-btn" data-bit="2">0</button>
                <button class="bit-btn icon-btn" data-bit="1">0</button>
            </div>
            <p style="margin-top:15px; font-size: 0.8rem;">CURRENT BALANCE: <span id="bit-sum" style="color:var(--neon-accent)">0</span></p>
            <button id="bit-submit" class="primary-btn">SUBMIT LOGIC</button>
        `;

        container.querySelectorAll('.bit-btn').forEach(btn => {
            btn.onclick = () => {
                const bit = parseInt(btn.dataset.bit);
                const isActive = btn.innerText === "1";
                btn.innerText = isActive ? "0" : "1";
                btn.classList.toggle('active');
                current += isActive ? -bit : bit;
                document.getElementById('bit-sum').innerText = current;
                this.triggerFeedback('click');
            };
        });

        document.getElementById('bit-submit').onclick = () => {
            this.complete(current === target);
        };
    },

    /**
     * TRIAL: GUESS THE VALUE
     * Find the hidden value within 7 attempts.
     */
    initGuessNumber(container, onResult) {
        this.onResult = onResult;
        const range = this.difficulty === 3 ? 500 : (this.difficulty === 2 ? 250 : 100);
        const target = Math.floor(Math.random() * range) + 1;
        let attempts = 7;

        container.innerHTML = `
            <div class="game-box">
                <p class="trial-desc">LOCATE VALUE: 1 - ${range}</p>
                <p>REMAINING: <span id="g-lives" style="color:var(--neon-error)">${attempts}</span></p>
                <input type="number" id="g-input" placeholder="???">
                <button id="g-submit" class="primary-btn">VALIDATE</button>
            </div>
        `;

        document.getElementById('g-submit').onclick = () => {
            const val = parseInt(document.getElementById('g-input').value);
            if (val === target) return this.complete(true);
            
            attempts--;
            this.triggerFeedback('fail');
            if (attempts <= 0) return this.complete(false);

            document.getElementById('g-lives').innerText = attempts;
            document.getElementById('game-feedback').innerText = val > target ? "TOO HIGH" : "TOO LOW";
            document.getElementById('g-input').value = "";
            document.getElementById('g-input').focus();
        };
    },

    /**
     * TRIAL: GRID DOMINANCE (Tic-Tac-Toe)
     * Win against the system. Draws are considered failures.
     */
    initTicTacToe(container, onResult) {
        this.onResult = onResult;
        let board = Array(9).fill(null);
        container.innerHTML = `<div class="ttt-grid"></div>`;
        const grid = container.querySelector('.ttt-grid');

        const render = () => {
            grid.innerHTML = '';
            board.forEach((cell, i) => {
                const div = document.createElement('div');
                div.className = 'ttt-cell' + (cell ? ' taken' : '');
                div.innerText = cell || '';
                div.onclick = () => {
                    if (board[i] || this.checkTTT(board)) return;
                    this.triggerFeedback('click');
                    board[i] = 'X';
                    render();

                    if (this.checkTTT(board) === 'X') return this.complete(true);
                    if (!board.includes(null)) return this.complete(false);

                    setTimeout(() => {
                        this.tttAIMove(board);
                        render();
                        if (this.checkTTT(board) === 'O' || !board.includes(null)) this.complete(false);
                    }, 400);
                };
                grid.appendChild(div);
            });
        };
        render();
    },

    /* --- INTERNAL ENGINE LOGIC --- */

    tttAIMove(board) {
        const empty = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        const move = (this.difficulty === 3) ? empty[0] : empty[Math.floor(Math.random() * empty.length)];
        board[move] = 'O';
    },

    checkTTT(b) {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let [x,y,z] of wins) if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x];
        return null;
    },

    enablePatternInput(container, sequence) {
        let playerStep = 0;
        container.querySelectorAll('.ttt-cell').forEach(cell => {
            cell.onclick = () => {
                const id = parseInt(cell.dataset.id);
                if (id === sequence[playerStep]) {
                    cell.style.background = "var(--neon-secondary)";
                    setTimeout(() => cell.style.background = "", 200);
                    this.triggerFeedback('click');
                    playerStep++;
                    if (playerStep === sequence.length) this.complete(true);
                } else {
                    this.complete(false);
                }
            };
        });
    },

    complete(success) {
        this.triggerFeedback(success ? 'success' : 'fail');
        this.onResult(success);
    },

    triggerFeedback(type) {
        if ("vibrate" in navigator && App.hapticsEnabled) {
            if (type === 'click') navigator.vibrate(20);
            if (type === 'fail') navigator.vibrate([100, 50, 100]);
            if (type === 'success') navigator.vibrate([50, 25, 200]);
        }
        const snd = document.getElementById(`snd-${type}`);
        if (snd) {
            snd.currentTime = 0;
            snd.play().catch(() => {}); 
        }
    }
};
