let board;
const PLAYER = 'X';
const AI = 'O';
let onWin, onLose;

const gameContainer = document.getElementById('tictactoe-game-container');
const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
];

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

    lockBoard(); 
    board[index] = PLAYER;
    renderBoard();

    if (checkWin(PLAYER)) {
        setTimeout(() => onWin(), 100);
        return;
    }
    if (getEmptyCells().length === 0) {
        setTimeout(() => onWin(), 100); // Draw is a reprieve
        return;
    }
    
    setTimeout(aiMove, 500);
}

function checkWin(symbol, currentBoard = board) {
    return winConditions.some(c => c.every(i => currentBoard[i] === symbol));
}

function getEmptyCells(currentBoard = board) {
    return currentBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
}

// *** NEW: Unbeatable Minimax AI ***
function aiMove() {
    let bestScore = -Infinity;
    let move;
    const emptyCells = getEmptyCells();

    for (const cellIndex of emptyCells) {
        board[cellIndex] = AI;
        let score = minimax(board, 0, false);
        board[cellIndex] = ''; // backtrack
        if (score > bestScore) {
            bestScore = score;
            move = cellIndex;
        }
    }

    if (move !== undefined) {
        board[move] = AI;
        renderBoard();
        if (checkWin(AI)) {
            lockBoard();
            setTimeout(() => onLose(), 100);
        } else if (getEmptyCells().length === 0) {
            lockBoard();
            setTimeout(() => onWin(), 100); // Draw is a reprieve
        }
    }
}

const scores = { [AI]: 10, [PLAYER]: -10, draw: 0 };

function minimax(currentBoard, depth, isMaximizing) {
    if (checkWin(AI, currentBoard)) return scores[AI] - depth;
    if (checkWin(PLAYER, currentBoard)) return scores[PLAYER] + depth;
    if (getEmptyCells(currentBoard).length === 0) return scores.draw;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (const cellIndex of getEmptyCells(currentBoard)) {
            currentBoard[cellIndex] = AI;
            let score = minimax(currentBoard, depth + 1, false);
            currentBoard[cellIndex] = '';
            bestScore = Math.max(score, bestScore);
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (const cellIndex of getEmptyCells(currentBoard)) {
            currentBoard[cellIndex] = PLAYER;
            let score = minimax(currentBoard, depth + 1, true);
            currentBoard[cellIndex] = '';
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
    }
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
