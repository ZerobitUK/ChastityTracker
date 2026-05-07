const GamesManager = {
    initGuessNumber(container, onResult) {
        const target = Math.floor(Math.random() * 100) + 1;
        let attempts = 7;
        container.innerHTML = `
            <p>I am thinking of 1-100. Attempts: <b id="attempts">${attempts}</b></p>
            <input type="number" id="g-input" style="width:100px; text-align:center; font-size:1.5rem;">
            <button id="g-submit" class="primary-btn">Guess</button>`;
        
        const input = document.getElementById('g-input');
        document.getElementById('g-submit').onclick = () => {
            const val = parseInt(input.value);
            if (val === target) return onResult(true);
            attempts--;
            if (attempts <= 0) return onResult(false);
            document.getElementById('attempts').innerText = attempts;
            document.getElementById('game-feedback').innerText = val > target ? "Lower..." : "Higher...";
            input.value = "";
            input.focus();
        };
    },

    initTicTacToe(container, onResult) {
        let board = Array(9).fill(null);
        container.innerHTML = `<div class="ttt-grid"></div>`;
        const grid = container.querySelector('.ttt-grid');

        const render = () => {
            grid.innerHTML = '';
            board.forEach((cell, i) => {
                const d = document.createElement('div');
                d.className = 'ttt-cell' + (cell ? ' taken' : '');
                d.innerText = cell || '';
                d.onclick = () => {
                    if (board[i] || this.checkTTTWinner(board)) return;
                    board[i] = 'X';
                    render();
                    if (this.checkTTTWinner(board) === 'X') return onResult(true);
                    if (!board.includes(null)) return onResult(false);
                    
                    // AI Move
                    setTimeout(() => {
                        const empty = board.map((v, idx) => v === null ? idx : null).filter(v => v !== null);
                        // 30% chance for random move (Mistake)
                        const move = (Math.random() < 0.3) ? empty[Math.floor(Math.random() * empty.length)] : empty[0];
                        board[move] = 'O';
                        render();
                        if (this.checkTTTWinner(board) === 'O' || !board.includes(null)) onResult(false);
                    }, 500);
                };
                grid.appendChild(d);
            });
        };
        render();
    },

    checkTTTWinner(b) {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (let [x,y,z] of wins) if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x];
        return null;
    }
};
