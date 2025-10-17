// Dark/Light Mode Logic
(function() {
    const root = document.body;
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const icon = document.getElementById('theme-toggle-icon');
    // Detect initial theme
    const userPref = localStorage.getItem('sl-theme');
    const sysPrefDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    function setTheme(isDark) {
        if (isDark) {
            root.classList.add('dark');
            toggleBtn.setAttribute('aria-pressed', 'true');
            icon.textContent = "☀️";
        } else {
            root.classList.remove('dark');
            toggleBtn.setAttribute('aria-pressed', 'false');
            icon.textContent = "🌙";
        }
    }
    let isDark = userPref === 'dark' || (userPref === null && sysPrefDark);
    setTheme(isDark);

    toggleBtn.addEventListener('click', function() {
        isDark = !root.classList.contains('dark');
        setTheme(isDark);
        localStorage.setItem('sl-theme', isDark ? 'dark' : 'light');
    });
})();

const BOARD_SIZE = 10;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

// Snakes & Ladders positions
// key=start, value=end
const SNAKES = {
    99: 80, // 🐍
    95: 75, // 🐍
    92: 88, // 🐍
    89: 68, // 🐍
    74: 53,
    62: 19,
    64: 60,
    49: 11,
    46: 25,
    16: 6
};

const LADDERS = {
    2: 38,   // 🪜
    7: 14,
    8: 31,
    15: 26,
    21: 42,
    28: 84,
    36: 44,
    51: 67,
    71: 91,
    78: 98,
    87: 94
};

// Cell emoji map
function getEmoji(idx) {
    if (SNAKES[idx]) return '🐍';
    if (LADDERS[idx]) return '🪜';
    return '';
}

function getCellClass(idx) {
    return idx % 2 === 0 ? 'even' : 'odd';
}

// Game state
let players, currPlayer, playerEmojis, playerColors, gameOver;

function getPlayerEmoji(playerIdx) {
    return playerIdx === 0 ? "🟢" : "🔴";
}

function getPlayerName(playerIdx) {
    return playerIdx === 0 ? "Player 1" : "Player 2";
}

function resetGame() {
    players = [
        { pos: 1, emoji: '🟢', name: 'Player 1', class: 'player1', won: false },
        { pos: 1, emoji: '🔴', name: 'Player 2', class: 'player2', won: false }
    ];
    currPlayer = 0;
    gameOver = false;
    renderBoard();
    updateStatus();
    document.getElementById("turn-indicator").textContent = `${players[currPlayer].emoji} ${players[currPlayer].name}'s Turn`;
    document.getElementById("dice-result").textContent = '';
    document.getElementById("roll-btn").disabled = false;
    document.getElementById("restart-btn").style.display = "none";
}

// Render board
function renderBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    let rowReverse = false;
    let cells = Array(TOTAL_CELLS + 1).fill(0).map((_, i) => i);
    let rows = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        let rowCells = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            let idx = row * BOARD_SIZE + col + 1;
            rowCells.push(idx);
        }
        if (row % 2 === 1) rowCells.reverse();
        rows.unshift(rowCells); // Top row is index 100
    }
    let flatCells = rows.flat();
    for (let i = 0; i < flatCells.length; i++) {
        let cellIdx = flatCells[i];
        let cellDiv = document.createElement('div');
        cellDiv.className = 'cell ' + getCellClass(cellIdx);
        cellDiv.dataset.idx = cellIdx;
        // Display cell number
        let idxSpan = document.createElement('span');
        idxSpan.className = 'cell-idx';
        idxSpan.textContent = cellIdx;
        cellDiv.appendChild(idxSpan);
        // Emoji for snake/ladder
        let emoji = getEmoji(cellIdx);
        if (emoji) {
            let emojiSpan = document.createElement('span');
            emojiSpan.className = 'sn-ladder-emoji';
            emojiSpan.textContent = emoji;
            cellDiv.appendChild(emojiSpan);
        }
        // Place player(s) if any:
        let piecesHere = players
            .map((p, idx) => (p.pos === cellIdx ? `<span class="piece ${players[idx].class}" title="${p.name}">${p.emoji}</span>` : ''))
            .filter(Boolean)
            .join('');
        if (piecesHere) {
            let wrap = document.createElement('div');
            wrap.innerHTML = piecesHere;
            cellDiv.appendChild(wrap);
        }
        board.appendChild(cellDiv);
    }
}

// Dice roll animation/result
function showDice(roll) {
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    document.getElementById('dice-result').textContent = diceEmojis[roll-1] + `  (${roll})`;
}

// Update status
function updateStatus() {
    const statusDiv = document.getElementById('players-status');
    statusDiv.innerHTML = players.map((p, idx) =>
        `<span class="player-stat ${p.class}">${p.emoji} ${p.name} : ${p.pos}</span>`
    ).join('');
}

// Play turn
function movePlayer(playerIdx, steps) {
    let player = players[playerIdx];
    let origPos = player.pos;
    let newPos = origPos + steps;
    if (newPos > 100) {
        newPos = origPos; // stay if overshoots
    }
    // Snake or ladder?
    if (SNAKES[newPos]) {
        newPos = SNAKES[newPos];
    } else if (LADDERS[newPos]) {
        newPos = LADDERS[newPos];
    }
    player.pos = newPos;
    renderBoard();
    updateStatus();
    if (player.pos === 100) {
        player.won = true;
        setTimeout(() => handleWin(playerIdx), 300);
        return true;
    }
    return false;
}

// Roll dice logic
function rollDice() {
    if (gameOver) return;
    let roll = Math.floor(Math.random() * 6) + 1;
    showDice(roll);
    const hadExtraTurn = roll === 6;
    let winNow = movePlayer(currPlayer, roll);

    if (!winNow) {
        if (hadExtraTurn) {
            document.getElementById("turn-indicator").textContent = `🎉 ${players[currPlayer].emoji} ${players[currPlayer].name} rolled a 6! Go again`;
        } else {
            currPlayer = 1 - currPlayer;
            document.getElementById("turn-indicator").textContent = `${players[currPlayer].emoji} ${players[currPlayer].name}'s Turn`;
        }
    }
    document.getElementById("roll-btn").disabled = winNow;
}

// Handle win
function handleWin(playerIdx) {
    let msg = `🏆 ${players[playerIdx].emoji} ${players[playerIdx].name} Wins!`;
    document.getElementById("turn-indicator").textContent = msg;
    document.getElementById("dice-result").textContent = '🎉';
    document.getElementById("roll-btn").disabled = true;
    document.getElementById("restart-btn").style.display = "inline-block";
    gameOver = true;
}

// UI events
document.getElementById("roll-btn").onclick = rollDice;
document.getElementById("restart-btn").onclick = () => resetGame();

// Initial render
resetGame();