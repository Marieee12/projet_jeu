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

// Modal
const rulesModal = document.getElementById("rules-modal");
const closeModalButton = document.getElementById("close-rules-modal");
const startFromModalButton = document.getElementById("start-from-modal");

// --- VARIABLES ---
let game = null;
let gameScore = 0;
let gameTime = 0;
let gameTimeInterval = null;
let gameIsRunning = false;

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// Palette : data-color = red/blue/green/yellow -> hex
const COLOR_NAME_TO_HEX = {
  red: "#ff4d4d",
  blue: "#4d94ff",
  green: "#4dff4d",
  yellow: "#ffff4d",
};

const COLOR_HEX_TO_NAME = {
  "#ff4d4d": "red",
  "#4d94ff": "blue",
  "#4dff4d": "green",
  "#ffff4d": "yellow",
};

let selectedColorHex = "#4dff4d"; // défaut

// --- UI SCREENS ---
function hideLoader() {
  loaderScreen.classList.add("hidden");
  landingPage.classList.remove("hidden");

  setTimeout(() => {
    const left = document.querySelector(".panel-left");
    const right = document.querySelector(".panel-right");
    if (left) left.style.opacity = "1";
    if (right) right.style.opacity = "1";
  }, 100);
}

function closeRulesModal() {
  rulesModal.classList.add("hidden");
  document.body.style.overflow = "auto";
}

startButton?.addEventListener("click", () => {
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

rulesButton?.addEventListener("click", () => {
  rulesModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
});

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

// --- PALETTE ---
colorButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.color; // red/blue/green/yellow
    if (name && COLOR_NAME_TO_HEX[name]) {
      selectedColorHex = COLOR_NAME_TO_HEX[name];
    }

    // feedback visuel : selected
    colorButtons.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

function updateNextBubblePreview() {
  if (!game) return;

  // on affiche la couleur SUIVANTE (preview)
  const hex = game.nextColor;
  const name = COLOR_HEX_TO_NAME[hex];

  if (!name) return;

  colorButtons.forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.color === name);
  });
}


// --- GAME INIT / STOP ---
function initializeGame() {
  stopGame(); // nettoie si on relance

  gameScore = 0;
  gameTime = 0;
  updateScoreDisplay();
  updateTimeDisplay();

  gameTimeInterval = setInterval(() => {
    if (!gameIsRunning) return;
    gameTime++;
    updateTimeDisplay();
  }, 1000);

  game = new Game(canvas, ctx, {
    radius: 20,
    initialFilledRows: 6,
    turnsPerDrop: 10,
  });

  // mettre la palette en cohérence au lancement
  updateNextBubblePreview();

  gameIsRunning = true;
  pauseButton.innerHTML = '<i class="fa-solid fa-pause" style="color: #ffffff;"></i>';
  gameLoop();
}

function stopGame() {
  gameIsRunning = false;
  if (gameTimeInterval) clearInterval(gameTimeInterval);
  gameTimeInterval = null;
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

// --- LOOP ---
function update() {
  if (!gameIsRunning || !game) return;

  const { removed, fallen } = game.update();

  if (removed > 0) {
    gameScore += removed * 10;
  }
  if (fallen > 0) {
    // bonus chute (tu peux ajuster)
    gameScore += fallen * 20;
  }
  if (removed > 0 || fallen > 0) updateScoreDisplay();

  updateNextBubblePreview();

  // fin de partie
  if (game.isOver) {
    gameIsRunning = false;
    if (game.isWin) {
      // tu peux remplacer par une vraie modal
      setTimeout(() => alert("🎉 Victoire !"), 50);
    } else {
      setTimeout(() => alert("💥 Game Over !"), 50);
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

  // éviter clic en bas sur la palette
  if (mouseY > CANVAS_HEIGHT - 50) return;

  const angle = calculateAngle(mouseX, mouseY);

  // tir avec couleur choisie
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




