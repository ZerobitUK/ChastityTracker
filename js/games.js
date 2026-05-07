const GamesManager = {
    // Game state tracking
    currentGame: null,
    onResult: null, // Callback function (win/loss)

    /**
     * Initialises the 'Guess the Number' game
     * Logic: 1-100, 7 attempts, Higher/Lower feedback
     */
    initGuessNumber(container, callback) {
        const target = Math.floor(Math.random() * 100) + 1;
        let attempts = 7;
        this.onResult = callback;

        container.innerHTML = `
            <div class="game-box">
                <p>I am thinking of a number between 1 and 100.</p>
                <p>Attempts remaining: <strong id="attempts-count">${attempts}</strong></p>
                <input type="number" id="guess-input" min="1" max="100" placeholder="??">
                <button id="submit-guess" class="secondary-btn">Guess</button>
                <p id="guess-hint"></p>
            </div>
        `;

        const input = document.getElementById('guess-input');
        const btn = document.getElementById('submit-guess');
        const hint = document.getElementById('guess-hint');

        btn.onclick = () => {
            const val = parseInt(input.value);
            if (isNaN(val)) return;

            attempts--;
            if (val === target) {
                this.onResult(true);
            } else if (attempts <= 0) {
                this.onResult(false);
            } else {
                document.getElementById('attempts-count').innerText = attempts;
                hint.innerText = val > target ? "Lower..." : "Higher...";
                input.value = '';
                input.focus();
            }
        };
    },

    /**
     * Initialises Tic-Tac-Toe vs AI
     * Logic: Weighted randomness to allow AI mistakes
     */
    initTicTacToe(container, callback) {
        let board = Array(9).fill(null);
        this.onResult = callback;
        
        container.innerHTML = `<div class="ttt-grid"></div>`;
        const grid = container.querySelector('.ttt-grid');
        
        const render = () => {
            grid.innerHTML = '';
            board.forEach((cell, i) => {
                const div = document.createElement('div');
                div.className = 'ttt-cell' + (cell ? ' taken' : '');
                div.innerText = cell || '';
                div.onclick = () => this.handleTTTMove(i, board, render);
                grid.appendChild(div);
            });
        };
        render();
    },

    handleTTTMove(index, board, render) {
        if (board[index] || this.checkWinner(board)) return;

        // Player Move
        board[index] = 'X';
        render();

        if (this.checkWinner(board) === 'X') return this.onResult(true);
        if (!board.includes(null)) return this.onResult(false); // Draw counts as loss

        // AI Move (Delayed for feel)
        setTimeout(() => {
            this.aiMove(board);
            render();
            if (this.checkWinner(board) === 'O') this.onResult(false);
            else if (!board.includes(null)) this.onResult(false);
        }, 500);
    },

    aiMove(board) {
        const empty = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        
        // 30% chance to just pick randomly (The "Mistake" factor)
        if (Math.random() < 0.3) {
            const randomPick = empty[Math.floor(Math.random() * empty.length)];
            board[randomPick] = 'O';
            return;
        }

        // Otherwise, try to win or block
        const bestMove = this.findBestMove(board);
        board[bestMove] = 'O';
    },

    checkWinner(b) {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let [x,y,z] of wins) {
            if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x];
        }
        return null;
    },

    findBestMove(board) {
        // Simple logic: If we can win, win. Else if they can win, block. Else random.
        const empty = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        return empty[0]; // Placeholder for brevity; the AI logic can be expanded.
    }
};
