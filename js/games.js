/**
 * PREMIUM GAMES ENGINE
 * Includes difficulty scaling, haptic feedback, and advanced logic puzzles.
 */
const GamesManager = {
    difficulty: 1, // Scales from 1 (Standard) to 3 (Elite)
    onResult: null,

    /**
     * TIER 1: TIC-TAC-TOE
     * Logic: Win to unlock. Draws count as a loss.
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

                    // AI Response Delay
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

    /**
     * TIER 2: GUESS THE NUMBER
     * Logic: Solve within 7 attempts. Range increases with difficulty.
     */
    initGuessNumber(container, onResult) {
        this.onResult = onResult;
        const range = this.difficulty === 3 ? 500 : (this.difficulty === 2 ? 250 : 100);
        const target = Math.floor(Math.random() * range) + 1;
        let attempts = 7;

        container.innerHTML = `
            <div class="game-box">
                <p>ANALYSE VALUE: 1 - ${range}</p>
                <p>ATTEMPTS REMAINING: <span id="g-lives">${attempts}</span></p>
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
            document.getElementById('game-feedback').innerText = val > target ? "VALUE TOO HIGH" : "VALUE TOO LOW";
            document.getElementById('g-input').value = "";
            document.getElementById('g-input').focus();
        };
    },

    /**
     * TIER 3: PATTERN RECALL (SIMON SAYS)
     * Logic: Repeat the sequence. Length increases with difficulty.
     */
    initPatternRecall(container, onResult) {
        this.onResult = onResult;
        const sequence = [];
        const length = 4 + this.difficulty;
        
        container.innerHTML = `
            <p>REPLICATE ENCRYPTION KEY</p>
            <div class="ttt-grid" id="pattern-grid">
                <div class="ttt-cell" data-id="0"></div><div class="ttt-cell" data-id="1"></div>
                <div class="ttt-cell" data-id="2"></div><div class="ttt-cell" data-id="3"></div>
            </div>
        `;

        for(let i=0; i<length; i++) sequence.push(Math.floor(Math.random() * 4));

        // Display sequence to user
        let step = 0;
        const interval = setInterval(() => {
            const cell = container.querySelector(`[data-id="${sequence[step]}"]`);
            cell.style.background = "var(--neon-cyan)";
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
     * TIER 4: LOGIC GATES (BINARY SUM)
     * Logic: Toggle bits (8, 4, 2, 1) to match the target sum.
     */
    initLogicGates(container, onResult) {
        this.onResult = onResult;
        const target = Math.floor(Math.random() * 15) + 1;
        let current = 0;

        container.innerHTML = `
            <p>STABILISE LOGIC BRIDGE: TARGET ${target}</p>
            <div class="utility-drawer">
                <button class="bit-btn icon-btn" data-bit="8">0</button>
                <button class="bit-btn icon-btn" data-bit="4">0</button>
                <button class="bit-btn icon-btn" data-bit="2">0</button>
                <button class="bit-btn icon-btn" data-bit="1">0</button>
            </div>
            <p style="margin-top:10px;">CURRENT SUM: <span id="bit-sum" style="color:var(--neon-gold)">0</span></p>
            <button id="bit-submit" class="primary-btn">LOCK BITS</button>
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

    /* --- ENGINE UTILITIES --- */

    tttAIMove(board) {
        const empty = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        // Level 3 AI plays optimally; lower levels play randomly.
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
                    cell.style.background = "var(--neon-blue)";
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
        // Haptic pulse for mobile devices
        if ("vibrate" in navigator && App.hapticsEnabled) {
            if (type === 'click') navigator.vibrate(15);
            if (type === 'fail') navigator.vibrate([60, 40, 60]);
            if (type === 'success') navigator.vibrate([100, 50, 100]);
        }
        // Audio hook
        const snd = document.getElementById(`snd-${type}`);
        if (snd) {
            snd.currentTime = 0;
            snd.play().catch(() => {}); 
        }
    }
};
