const gridEl = document.getElementById('minefield-grid');
const TILE_COUNT = 12;
const MINE_COUNT = 3;
let onWin, onLose;
let canClick = true;

function handleTileClick(event) {
    if (!canClick) return;

    const tile = event.currentTarget;
    const isMine = tile.dataset.mine === 'true';

    canClick = false;

    tile.classList.add('is-flipped');
    tile.innerHTML = isMine ? '💣' : '✔️';

    setTimeout(() => {
        gridEl.querySelectorAll('.minefield-tile').forEach(t => {
            if (t !== tile) {
                t.classList.add('is-flipped');
                t.innerHTML = t.dataset.mine === 'true' ? '💣' : '✔️';
            }
        });
    }, 1000);

    setTimeout(() => {
        if (isMine) {
            onLose();
        } else {
            onWin();
        }
    }, 2500);
}

export function initMinefield(winCallback, loseCallback) {
    onWin = winCallback;
    onLose = loseCallback;
    canClick = true;

    document.getElementById('game-title').textContent = "Minefield";
    document.getElementById('game-description').textContent = "Click a tile. Avoid the mines to win your freedom.";
    gridEl.style.display = 'grid';
    gridEl.innerHTML = '';

    let mines = new Set();
    while (mines.size < MINE_COUNT) {
        mines.add(Math.floor(Math.random() * TILE_COUNT));
    }

    for (let i = 0; i < TILE_COUNT; i++) {
        const tile = document.createElement('div');
        tile.classList.add('minefield-tile');
        if (mines.has(i)) {
            tile.dataset.mine = 'true';
            tile.classList.add('mine');
        } else {
            tile.dataset.mine = 'false';
            tile.classList.add('safe');
        }
        tile.addEventListener('click', handleTileClick);
        gridEl.appendChild(tile);
    }
}
