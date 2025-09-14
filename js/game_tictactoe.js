let board;
const PLAYER = 'X';
const AI = 'O';
let onWin, onLose;

const gameContainer = document.getElementById('tictactoe-game-container');

function lockBoard() {
    const cells = gameContainer.querySelectorAll('.tictactoe-cell');
    cells.forEach(cell => {
        const newCell = cell.cloneNode(true);
        cell.parentNode.replaceChild(newCell, cell);
    });
}

function handleCellClick(event) {
    const index = event.target.dataset.index;
    if (board[index] !== '') return;
    board[index] = PLAYER;
    renderBoard();
    if (checkWin(PLAYER)) {
        lockBoard();
        setTimeout(() => onWin(), 100);
        return;
    }
    if (board.every(cell => cell !== '')) {
        lockBoard();
        setTimeout(() => onWin(), 100);
        return;
    }
    setTimeout(aiMove, 500);
}

function aiMove() {
    let move = findBestMove(AI);
    if (move !== -1) {
        board[move] = AI;
        renderBoard();
        if (checkWin(AI)) {
            lockBoard();
            setTimeout(() => onLose(), 100);
        }
        return;
    }
    move = findBestMove(PLAYER);
    if (move !== -1) {
        board[move] = AI;
        renderBoard();
        return;
    }
    if (board[4] === '') {
        board[4] = AI;
        renderBoard();
        return;
    }
    const corners = [0, 2, 6, 8].filter(i => board[i] === '');
    if (corners.length > 0) {
        board[corners[Math.floor(Math.random() * corners.length)]] = AI;
        renderBoard();
        return;
    }
    const openSpots = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    if (openSpots.length > 0) {
        board[openSpots[0]] = AI;
        renderBoard();
    }
}

function findBestMove(symbol) {
    const winConditions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] === symbol && board[b] === symbol && board[c] === '') return c;
        if (board[a] === symbol && board[c] === symbol && board[b] === '') return b;
        if (board[b] === symbol && board[c] === symbol && board[a] === '') return a;
    }
    return -1;
}

function checkWin(symbol) {
    const winConditions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    return winConditions.some(c => c.every(i => board[i] === symbol));
}

function renderBoard() {
    gameContainer.innerHTML = '';
    board.forEach((value, index) => {
        const cell = document.createElement('div');
        cell.classList.add('tictactoe-cell');
        cell.dataset.index = index;
        cell.textContent = value;
        if (value === '') {
            cell.addEventListener('click', handleCellClick);
        }
        gameContainer.appendChild(cell);
    });
}

export function initTicTacToe(winCallback, loseCallback) {
    onWin = winCallback;
    onLose = loseCallback;
    document.getElementById('game-title').textContent = "Tic-Tac-Toe";
    document.getElementById('game-description').textContent = "Beat the Keyholder to earn your freedom. A draw is a reprieve.";
    gameContainer.style.display = 'grid';
    board = ['', '', '', '', '', '', '', '', ''];
    renderBoard();
}
