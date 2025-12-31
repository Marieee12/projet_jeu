// script.js
import { Game } from "./game.js";

// --- RÉFÉRENCES DOM ---
const loaderScreen = document.getElementById("loader-screen");
const landingPage = document.getElementById("landing-page");
const gameScreen = document.getElementById("game-screen");
const startButton = document.getElementById("start-button");
const rulesButton = document.getElementById("rules-button");
const pauseButton = document.getElementById("pause-button");
const backToMenuButton = document.getElementById("back-to-menu");
const colorButtons = document.querySelectorAll(".color-select");
const scoreDisplay = document.getElementById("score-display");
const timeDisplay = document.getElementById("time-display");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Modal règles
const rulesModal = document.getElementById("rules-modal");
const closeModalButton = document.getElementById("close-rules-modal");
const startFromModalButton = document.getElementById("start-from-modal");

// Modal game over
const gameOverModal = document.getElementById("gameover-modal");
const restartGameBtn = document.getElementById("restart-game");
const quitGameBtn = document.getElementById("quit-game");

// Modal win
const winModal = document.getElementById("win-modal");
const winScoreEl = document.getElementById("win-score");
const winTimeEl = document.getElementById("win-time");
const winRestartBtn = document.getElementById("win-restart");
const winQuitBtn = document.getElementById("win-quit");

// --- VARIABLES ---
let game = null;
let gameScore = 0;
let gameTime = 0;
let gameTimeInterval = null;
let gameIsRunning = false;

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// mapping hex -> nom (data-color des boutons)
const COLOR_HEX_TO_NAME = {
  "#ff4d4d": "red",
  "#4d94ff": "blue",
  "#4dff4d": "green",
  "#ffff4d": "yellow",
};

// PLAYER PSEUDO
const playerInput = document.getElementById("player-input");
const playerSave = document.getElementById("player-save");
const playerChange = document.getElementById("player-change");
const playerHello = document.getElementById("player-hello");


// PLAYER SESSION
const LS_PLAYER = "bubbleShooter.playerName";

function getPlayerName() {
  return localStorage.getItem(LS_PLAYER) || "";
}

function setPlayerName(name) {
  localStorage.setItem(LS_PLAYER, name.trim());
}

function clearPlayerName() {
  localStorage.removeItem(LS_PLAYER);
}

function refreshPlayerUI() {
  const name = getPlayerName();

  if (!name) {
    // pas de pseudo => on montre input + OK, on cache JOUER
    if (playerHello) playerHello.textContent = "Choisis un pseudo pour jouer.";
    playerInput?.classList.remove("hidden");
    playerSave?.classList.remove("hidden");
    playerChange?.classList.add("hidden");
    startButton?.classList.add("hidden");
  } else {
    // pseudo ok => on cache input, on montre JOUER
    if (playerHello) playerHello.textContent = `Salut, ${name} 👋`;
    playerInput?.classList.add("hidden");
    playerSave?.classList.add("hidden");
    playerChange?.classList.remove("hidden");
    startButton?.classList.remove("hidden");
  }
}

playerSave?.addEventListener("click", () => {
  const v = (playerInput?.value || "").trim();
  if (v.length < 2) {
    if (playerHello) playerHello.textContent = "Pseudo trop court 🙂 (min 2 caractères)";
    return;
  }
  setPlayerName(v);
  refreshPlayerUI();
});

playerInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") playerSave?.click();
});

playerChange?.addEventListener("click", () => {
  clearPlayerName();
  if (playerInput) playerInput.value = "";
  refreshPlayerUI();
});


// LEADERBOARD
const LS_LEADERBOARD = "bubbleShooter.leaderboard";

// Lit le tableau HTML existant (fake) et le convertit en JSON
function seedLeaderboardFromLandingTable() {
  const rows = document.querySelectorAll("#leaderboard tbody tr");
  const data = [];

  rows.forEach((tr) => {
    const tds = tr.querySelectorAll("td");
    if (tds.length < 3) return;

    const pseudo = (tds[1]?.textContent || "").trim();
    const score = parseInt((tds[2]?.textContent || "0").trim(), 10) || 0;

    data.push({
      pseudo,
      score,
      timeSec: null, // les fake n'ont pas forcément le temps
      createdAt: Date.now(),
    });
  });

  return data;
}

function loadLeaderboard() {
  const raw = localStorage.getItem(LS_LEADERBOARD);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // si corrompu, on repart de la seed
    }
  }
  const seeded = seedLeaderboardFromLandingTable();
  saveLeaderboard(seeded);
  return seeded;
}

function saveLeaderboard(lb) {
  localStorage.setItem(LS_LEADERBOARD, JSON.stringify(lb));
}


// --- GESTION DES ÉCRANS ---
function hideLoader() {
  loaderScreen.classList.add("hidden");
  landingPage.classList.remove("hidden");

  setTimeout(() => {
    const left = document.querySelector(".panel-left");
    const right = document.querySelector(".panel-right");
    if (left) left.style.opacity = "1";
    if (right) right.style.opacity = "1";
  }, 100);
  refreshPlayerUI();
}

function stopGame() {
  gameIsRunning = false;
  if (gameTimeInterval) clearInterval(gameTimeInterval);
  gameTimeInterval = null;
}

startButton?.addEventListener("click", () => {
  if (!getPlayerName()) return;

  landingPage.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  initializeGame();
});


backToMenuButton?.addEventListener("click", () => {
  stopGame();
  gameScreen.classList.add("hidden");
  landingPage.classList.remove("hidden");
});

pauseButton?.addEventListener("click", () => {
  gameIsRunning = !gameIsRunning;
  pauseButton.innerHTML = gameIsRunning
    ? '<i class="fa-solid fa-pause" style="color: #ffffff;"></i>'
    : '<i class="fa-solid fa-play" style="color: #ffffff;"></i>';

  if (gameIsRunning) gameLoop();
});

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// --- MODAL RÈGLES ---
rulesButton?.addEventListener("click", () => {
  rulesModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
});

function closeRulesModal() {
  rulesModal.classList.add("hidden");
  document.body.style.overflow = "auto";
}

closeModalButton?.addEventListener("click", closeRulesModal);
rulesModal?.querySelector(".modal-overlay")?.addEventListener("click", closeRulesModal);

startFromModalButton?.addEventListener("click", () => {
  closeRulesModal();
  landingPage.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  initializeGame();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && rulesModal && !rulesModal.classList.contains("hidden")) {
    closeRulesModal();
  }
});

// --- MODAL GAME OVER ---
function openGameOverModal() {
  if (!gameOverModal) return;
  gameOverModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeGameOverModal() {
  if (!gameOverModal) return;
  gameOverModal.classList.add("hidden");
  document.body.style.overflow = "auto";
}

restartGameBtn?.addEventListener("click", () => {
  closeGameOverModal();
  initializeGame(); // relance direct
});

quitGameBtn?.addEventListener("click", () => {
  closeGameOverModal();
  stopGame();
  gameScreen.classList.add("hidden");
  landingPage.classList.remove("hidden");
});

gameOverModal?.querySelector(".modal-overlay")?.addEventListener("click", closeGameOverModal);

// Modal win
function openWinModal() {
  if (!winModal) return;
  winModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeWinModal() {
  if (!winModal) return;
  winModal.classList.add("hidden");
  document.body.style.overflow = "auto";
}


// --- HUD ---
function updateScoreDisplay() {
  scoreDisplay.textContent = String(gameScore);
}

function updateTimeDisplay() {
  const minutes = Math.floor(gameTime / 60);
  const seconds = gameTime % 60;
  timeDisplay.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// --- PREVIEW (affiche la SUIVANTE) ---
function updateNextBubblePreview() {
  if (!game) return;

  const hex = game.nextColor; // SUIVANTE
  const name = COLOR_HEX_TO_NAME[hex];
  if (!name) return;

  colorButtons.forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.color === name);
  });
}

// --- INIT ---
function initializeGame() {
  // ferme modal si ouvert
  closeGameOverModal();
  closeWinModal();

  // reset
  stopGame();
  gameScore = 0;
  gameTime = 0;
  updateScoreDisplay();
  updateTimeDisplay();

  // instanciation moteur
  game = new Game(canvas, ctx, {
    radius: 20,
    initialFilledRows: 6,
    turnsPerDrop: 10,
  });

  // preview
  updateNextBubblePreview();

  // timer
  gameIsRunning = true;
  gameTimeInterval = setInterval(() => {
    if (!gameIsRunning) return;
    gameTime++;
    updateTimeDisplay();
  }, 1000);

  pauseButton.innerHTML = '<i class="fa-solid fa-pause" style="color: #ffffff;"></i>';
  gameLoop();
}

// --- LOOP ---
function update() {
  if (!gameIsRunning || !game) return;

  const { removed, fallen } = game.update();

  if (removed > 0) gameScore += removed * 10;
  if (fallen > 0) gameScore += fallen * 20;

  if (removed > 0 || fallen > 0) updateScoreDisplay();

  updateNextBubblePreview();

  // fin de partie
  if (game.isOver) {
  stopGame();

  if (game.isWin) {
    const pseudo = getPlayerName() || "Joueur";
    // on enregistre le résultat
    addResultToLeaderboard({ pseudo, score: gameScore, timeSec: gameTime });

    // affiche la win popup (score/temps)
    if (winScoreEl) winScoreEl.textContent = String(gameScore);
    if (winTimeEl) winTimeEl.textContent = formatTime(gameTime);
    openWinModal();
  } else {
    openGameOverModal();
  }
}
}

winRestartBtn?.addEventListener("click", () => {
  closeWinModal();
  initializeGame();
});

winQuitBtn?.addEventListener("click", () => {
  closeWinModal();
  stopGame();
  gameScreen.classList.add("hidden");
  landingPage.classList.remove("hidden");
});

winModal?.querySelector(".modal-overlay")?.addEventListener("click", closeWinModal);

function addResultToLeaderboard({ pseudo, score, timeSec }) {
  const lb = loadLeaderboard();

  lb.push({
    pseudo,
    score,
    timeSec,
    createdAt: Date.now(),
  });

  // Tri: score desc, puis temps asc (si timeSec présent)
  lb.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    // si un temps manque, on le met "après"
    const at = a.timeSec ?? Number.POSITIVE_INFINITY;
    const bt = b.timeSec ?? Number.POSITIVE_INFINITY;
    return at - bt;
  });

  // (option) limiter à 100 entrées
  const trimmed = lb.slice(0, 100);

  saveLeaderboard(trimmed);
  return trimmed;
}


function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (game) game.draw();
}

function gameLoop() {
  update();
  draw();
  if (gameIsRunning) requestAnimationFrame(gameLoop);
}



// --- AIM + SHOOT ---
function calculateAngle(mouseX, mouseY) {
  const cannonX = game ? game.startX : CANVAS_WIDTH / 2;
  const cannonY = game ? game.shooterY : CANVAS_HEIGHT - 60;

  const dx = mouseX - cannonX;
  const dy = mouseY - cannonY;

  let angle = Math.atan2(dy, dx);

  // limiter : ne pas tirer vers le bas
  const minAngle = (-160 * Math.PI) / 180;
  const maxAngle = (-20 * Math.PI) / 180;

  if (angle < minAngle) angle = minAngle;
  if (angle > maxAngle) angle = maxAngle;

  return angle;
}

canvas.addEventListener("click", (e) => {
  if (!gameIsRunning || !game) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (mouseY > CANVAS_HEIGHT - 50) return;

  const angle = calculateAngle(mouseX, mouseY);
  game.shoot(angle);
});

document.addEventListener("keydown", (e) => {
  if (!gameIsRunning || !game) return;

  if (e.code === "Space" || e.code === "ArrowUp") {
    const angle = -Math.PI / 2;
    game.shoot(angle);
  }
});

// --- START loader ---
setTimeout(hideLoader, 2000);





