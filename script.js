const cells = [...document.querySelectorAll(".cell")];

const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const scoreDrawEl = document.getElementById("scoreDraw");

const xCard = document.getElementById("xCard");
const oCard = document.getElementById("oCard");

const turnSymbol = document.getElementById("turnSymbol");
const turnTitle = document.getElementById("turnTitle");
const turnSubtitle = document.getElementById("turnSubtitle");
const turnBanner = document.getElementById("turnBanner");

const gameMessage = document.getElementById("gameMessage");
const roundNumberEl = document.getElementById("roundNumber");

const restartBtn = document.getElementById("restartBtn");
const newGameBtn = document.getElementById("newGameBtn");
const soundBtn = document.getElementById("soundBtn");
const soundIcon = document.getElementById("soundIcon");

// Every possible winning combination
const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

// Game state
let board = Array(9).fill("");
let currentPlayer = "X";
let gameOver = false;
let roundNumber = 1;

let scores = {
  X: 0,
  O: 0,
  draws: 0
};

let soundEnabled = false;
let audioContext = null;

// Get the winning combination, if any
function getWinningCombination() {
  return WINNING_COMBINATIONS.find(([a, b, c]) =>
    board[a] &&
    board[a] === board[b] &&
    board[a] === board[c]
  );
}

// Optional sound effects using the Web Audio API
function playSound(type) {
  if (!soundEnabled) return;

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    const settings = {
      move: { frequency: 440, duration: 0.07 },
      win: { frequency: 660, duration: 0.18 },
      draw: { frequency: 300, duration: 0.12 }
    };

    const sound = settings[type] || settings.move;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      sound.frequency,
      audioContext.currentTime
    );

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.08,
      audioContext.currentTime + 0.01
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + sound.duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + sound.duration);
  } catch {
    // The game remains fully playable if audio is unavailable.
  }
}

// Update the turn indicator and active scoreboard
function updateTurnUI() {
  const isX = currentPlayer === "X";

  turnSymbol.textContent = currentPlayer;
  turnSymbol.className =
    `turn-symbol ${isX ? "x-symbol" : "o-symbol"}`;

  turnTitle.textContent = isX
    ? "Player One's turn"
    : "Player Two's turn";

  turnSubtitle.textContent = "Choose a square to play";

  turnBanner.style.borderColor = isX
    ? "#ac91ff35"
    : "#75c5ff35";

  xCard.classList.toggle("active", isX);
  oCard.classList.toggle("active", !isX);
}

// Display scores
function updateScores() {
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreDrawEl.textContent = scores.draws;
}

// Render a player's move
function renderCell(index) {
  const cell = cells[index];
  const value = board[index];

  cell.textContent = value;
  cell.classList.toggle("x", value === "X");
  cell.classList.toggle("o", value === "O");

  const row = Math.floor(index / 3) + 1;
  const column = (index % 3) + 1;

  cell.setAttribute(
    "aria-label",
    `Row ${row}, column ${column}, ${value}`
  );
}

// Highlight all winning cells
function highlightWinner(combination) {
  combination.forEach((index) => {
    cells[index].classList.add("winning");
  });
}

// Lock the board after a result
function lockBoard() {
  cells.forEach((cell) => {
    cell.disabled = true;
  });
}

// Handle a winning round
function finishWithWin(combination) {
  gameOver = true;
  scores[currentPlayer]++;

  highlightWinner(combination);
  lockBoard();
  updateScores();

  const playerName = currentPlayer === "X"
    ? "Player One"
    : "Player Two";

  turnSymbol.textContent = "★";
  turnSymbol.className = "turn-symbol";
  turnSymbol.style.color = "#79e3b8";

  turnTitle.textContent = `${playerName} wins!`;
  turnSubtitle.textContent = "Brilliant move. Well played!";
  turnBanner.style.borderColor = "#79e3b855";

  xCard.classList.toggle("active", currentPlayer === "X");
  oCard.classList.toggle("active", currentPlayer === "O");

  gameMessage.replaceChildren();

  const sparkle = document.createElement("span");
  sparkle.className = "message-sparkle";
  sparkle.textContent = "✦";

  gameMessage.append(
    sparkle,
    document.createTextNode(`${playerName} takes the round!`)
  );

  playSound("win");
}

// Handle a draw
function finishWithDraw() {
  gameOver = true;
  scores.draws++;

  lockBoard();
  updateScores();

  turnSymbol.textContent = "＝";
  turnSymbol.className = "turn-symbol";
  turnSymbol.style.color = "#b5afca";

  turnTitle.textContent = "It's a draw!";
  turnSubtitle.textContent = "A perfect match. Try again!";
  turnBanner.style.borderColor = "#ffffff20";

  xCard.classList.remove("active");
  oCard.classList.remove("active");

  gameMessage.replaceChildren();

  const sparkle = document.createElement("span");
  sparkle.className = "message-sparkle";
  sparkle.textContent = "✧";

  gameMessage.append(
    sparkle,
    document.createTextNode("Nobody wins this round!")
  );

  playSound("draw");
}

// Process a square selection
function handleMove(index) {
  if (gameOver || board[index] !== "") return;

  board[index] = currentPlayer;

  renderCell(index);
  playSound("move");

  const winningCombination = getWinningCombination();

  if (winningCombination) {
    finishWithWin(winningCombination);
    return;
  }

  if (board.every((cell) => cell !== "")) {
    finishWithDraw();
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";

  updateTurnUI();

  gameMessage.replaceChildren();

  const sparkle = document.createElement("span");
  sparkle.className = "message-sparkle";
  sparkle.textContent = "✦";

  gameMessage.append(
    sparkle,
    document.createTextNode("Your next move could change everything.")
  );
}

// Start a new round while retaining the scores
function restartRound() {
  board = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;

  roundNumber++;
  roundNumberEl.textContent = String(roundNumber).padStart(2, "0");

  cells.forEach((cell, index) => {
    cell.textContent = "";
    cell.disabled = false;
    cell.classList.remove("x", "o", "winning");

    cell.setAttribute(
      "aria-label",
      `Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}, empty`
    );
  });

  turnSymbol.style.color = "";
  turnBanner.style.borderColor = "";

  gameMessage.replaceChildren();

  const sparkle = document.createElement("span");
  sparkle.className = "message-sparkle";
  sparkle.textContent = "✦";

  gameMessage.append(
    sparkle,
    document.createTextNode("A fresh round. Make your move!")
  );

  updateTurnUI();
}

// Reset the whole match, including scores
function newGame() {
  scores = {
    X: 0,
    O: 0,
    draws: 0
  };

  roundNumber = 0;
  updateScores();
  restartRound();
}

// Board events
cells.forEach((cell) => {
  cell.addEventListener("click", () => {
    handleMove(Number(cell.dataset.index));
  });
});

// Game controls
restartBtn.addEventListener("click", restartRound);
newGameBtn.addEventListener("click", newGame);

// Toggle optional game sounds
soundBtn.addEventListener("click", async () => {
  soundEnabled = !soundEnabled;

  soundBtn.setAttribute("aria-pressed", String(soundEnabled));

  soundBtn.setAttribute(
    "aria-label",
    soundEnabled ? "Disable game sounds" : "Enable game sounds"
  );

  soundIcon.textContent = soundEnabled ? "♫" : "♪";

  if (soundEnabled) {
    playSound("move");
  }
});

// Initial setup
updateScores();
updateTurnUI();
restartRound();