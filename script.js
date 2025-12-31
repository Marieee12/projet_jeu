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
const winPlayerEl = document.getElementById("win-player");
const winScoreEl = document.getElementById("win-score");
const winTimeEl = document.getElementById("win-time");
const winRankEl = document.getElementById("win-rank");
const winTbody = document.getElementById("win-leaderboard-body");
const winRestartBtn = document.getElementById("win-restart");
const winQuitBtn = document.getElementById("win-quit");

// PLAYER PSEUDO UI
const playerInput = document.getElementById("player-input");
const playerSave = document.getElementById("player-save");
const playerChange = document.getElementById("player-change");
const playerHello = document.getElementById("player-hello");

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

// --- LOCAL STORAGE KEYS ---
const LS_PLAYER = "bubbleShooter.playerName";
const LS_LEADERBOARD = "bubbleShooter.leaderboard";

// --- HELPERS ---
function getPlayerName() {
  return localStorage.getItem(LS_PLAYER) || "";
}
function setPlayerName(name) {
  localStorage.setItem(LS_PLAYER, name.trim());
}
function clearPlayerName() {
  localStorage.removeItem(LS_PLAYER);
}
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// --- PLAYER UI ---
function refreshPlayerUI() {
  const name = getPlayerName();

  if (!name) {
    if (playerHello) playerHello.textContent = "Choisis un pseudo pour jouer.";
    playerInput?.classList.remove("hidden");
    playerSave?.classList.remove("hidden");
    playerChange?.classList.add("hidden");
    startButton?.classList.add("hidden");
  } else {
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

// --- LEADERBOARD (seed depuis le tableau landing) ---
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
      timeSec: null,
      createdAt: Date.now(),
    });
  });

  return data;
}

function saveLeaderboard(lb) {
  localStorage.setItem(LS_LEADERBOARD, JSON.stringify(lb));
}

function loadLeaderboard() {
  const raw = localStorage.getItem(LS_LEADERBOARD);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore -> reseed
    }
  }
  const seeded = seedLeaderboardFromLandingTable();
  saveLeaderboard(seeded);
  return seeded;
}

function sortLeaderboard(lb) {
  // score desc, puis temps asc (temps manquant => après)
  return lb.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const at = a.timeSec ?? Number.POSITIVE_INFINITY;
    const bt = b.timeSec ?? Number.POSITIVE_INFINITY;
    return at - bt;
  });
}

function recordWinAndGetRank({ pseudo, score, timeSec }) {
  const lb = loadLeaderboard();
  const entry = { pseudo, score, timeSec, createdAt: Date.now() };

  lb.push(entry);
  sortLeaderboard(lb);

  const trimmed = lb.slice(0, 200);
  saveLeaderboard(trimmed);

  const idx = trimmed.findIndex(
    (x) =>
      x.pseudo === entry.pseudo &&
      x.score === entry.score &&
      x.timeSec === entry.timeSec &&
      x.createdAt === entry.createdAt
  );

  return { lb: trimmed, index: idx === -1 ? 0 : idx };
}

function renderWinLeaderboardCentered(lb, playerIndex) {
  if (!winTbody) return;

  const windowSize = 9;
  const half = Math.floor(windowSize / 2);
  const start = Math.max(0, playerIndex - half);
  const end = Math.min(lb.length, start + windowSize);
  const slice = lb.slice(start, end);

  winTbody.innerHTML = "";

  slice.forEach((row, i) => {
    const absoluteRank = start + i + 1;
    const tr = document.createElement("tr");

    if (start + i === playerIndex) {
      tr.classList.add("win-player-row");
      tr.dataset.playerRow = "1";
    }

    const timeText = row.timeSec == null ? "-" : formatTime(row.timeSec);

    tr.innerHTML = `
      <td style="padding:10px 12px; color:#ffffff;">${absoluteRank}</td>
      <td style="padding:10px 12px; color:#ffffff;">${row.pseudo}</td>
      <td style="padding:10px 12px; color:#ffffff; text-align:right;">${row.score}</td>
      <td style="padding:10px 12px; color:#ffffff; text-align:right;">${timeText}</td>
    `;

    winTbody.appendChild(tr);
  });

  const playerRow = winTbody.querySelector('tr[data-player-row="1"]');
  if (playerRow) playerRow.scrollIntoView({ block: "center" });
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

// --- MODAL RÈGLES ---
rulesButton?.addEventListener("click", () => {
  rulesModal?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
});
function closeRulesModal() {
  rulesModal?.classList.add("hidden");
  document.body.style.overflow = "auto";
}
closeModalButton?.addEventListener("click", closeRulesModal);
rulesModal?.querySelector(".modal-overlay")?.addEventListener("click", closeRulesModal);

startFromModalButton?.addEventListener("click", () => {
  closeRulesModal();
  if (!getPlayerName()) return; // sécurité (si tu veux pouvoir jouer depuis règles)
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
  gameOverModal?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeGameOverModal() {
  gameOverModal?.classList.add("hidden");
  document.body.style.overflow = "auto";
}
restartGameBtn?.addEventListener("click", () => {
  closeGameOverModal();
  initializeGame();
});
quitGameBtn?.addEventListener("click", () => {
  closeGameOverModal();
  stopGame();
  gameScreen.classList.add("hidden");
  landingPage.classList.remove("hidden");
});
gameOverModal?.querySelector(".modal-overlay")?.addEventListener("click", closeGameOverModal);

// --- MODAL WIN ---
function openWinModal() {
  winModal?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeWinModal() {
  winModal?.classList.add("hidden");
  document.body.style.overflow = "auto";
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

// --- HUD ---
function updateScoreDisplay() {
  scoreDisplay.textContent = String(gameScore);
}
function updateTimeDisplay() {
  timeDisplay.textContent = formatTime(gameTime);
}

// --- PREVIEW (SUIVANTE) ---
function updateNextBubblePreview() {
  if (!game) return;

  const hex = game.nextColor; // doit exister dans Game
  const name = COLOR_HEX_TO_NAME[hex];
  if (!name) return;

  colorButtons.forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.color === name);
  });
}

// --- INIT ---
function initializeGame() {
  closeGameOverModal();
  closeWinModal();

  stopGame();
  gameScore = 0;
  gameTime = 0;
  updateScoreDisplay();
  updateTimeDisplay();

  game = new Game(canvas, ctx, {
    radius: 20,
    initialFilledRows: 6,
    turnsPerDrop: 10,
  });

  updateNextBubblePreview();

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

  if (game.isOver) {
    stopGame();

    if (game.isWin) {
      const pseudo = getPlayerName() || "Joueur";

      winPlayerEl && (winPlayerEl.textContent = pseudo);
      winScoreEl && (winScoreEl.textContent = String(gameScore));
      winTimeEl && (winTimeEl.textContent = formatTime(gameTime));

      const { lb, index } = recordWinAndGetRank({
        pseudo,
        score: gameScore,
        timeSec: gameTime,
      });

      winRankEl && (winRankEl.textContent = `#${index + 1}`);
      renderWinLeaderboardCentered(lb, index);

      openWinModal();
    } else {
      openGameOverModal();
    }
  }
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






