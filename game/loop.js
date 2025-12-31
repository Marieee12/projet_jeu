// game/loop.js
import { Game } from "./game.js";
import { getPlayerName } from "../player/session.js";
import { formatTime, recordWinAndGetRank, renderWinLeaderboardCentered } from "../leaderboard/leaderboard.js";

const COLOR_HEX_TO_NAME = {
  "#ff4d4d": "red",
  "#4d94ff": "blue",
  "#4dff4d": "green",
  "#ffff4d": "yellow",
};

export function createGameController(dom, modals) {
  let game = null;
  let gameScore = 0;
  let gameTime = 0;
  let gameTimeInterval = null;
  let gameIsRunning = false;

  const CANVAS_WIDTH = dom.canvas.width;
  const CANVAS_HEIGHT = dom.canvas.height;

  function stopGame() {
    gameIsRunning = false;
    if (gameTimeInterval) clearInterval(gameTimeInterval);
    gameTimeInterval = null;
  }

  function updateScoreDisplay() {
    dom.scoreDisplay.textContent = String(gameScore);
  }
  function updateTimeDisplay() {
    dom.timeDisplay.textContent = formatTime(gameTime);
  }

  function updateNextBubblePreview() {
    if (!game) return;
    const hex = game.nextColor;
    const name = COLOR_HEX_TO_NAME[hex];
    if (!name) return;

    dom.colorButtons.forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.color === name);
    });
  }

  function initializeGame() {
    modals.closeGameOver?.();
    modals.closeWin?.();

    stopGame();
    gameScore = 0;
    gameTime = 0;
    updateScoreDisplay();
    updateTimeDisplay();

    game = new Game(dom.canvas, dom.ctx, { radius: 20, initialFilledRows: 6, turnsPerDrop: 10 });
    updateNextBubblePreview();

    gameIsRunning = true;
    gameTimeInterval = setInterval(() => {
      if (!gameIsRunning) return;
      gameTime++;
      updateTimeDisplay();
    }, 1000);

    dom.pauseButton.innerHTML = '<i class="fa-solid fa-pause" style="color: #ffffff;"></i>';
    gameLoop();
  }

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

        dom.winPlayerEl && (dom.winPlayerEl.textContent = pseudo);
        dom.winScoreEl && (dom.winScoreEl.textContent = String(gameScore));
        dom.winTimeEl && (dom.winTimeEl.textContent = formatTime(gameTime));

        const { lb, index } = recordWinAndGetRank({ pseudo, score: gameScore, timeSec: gameTime });
        dom.winRankEl && (dom.winRankEl.textContent = `#${index + 1}`);
        renderWinLeaderboardCentered(dom, lb, index);

        modals.openWin();
      } else {
        modals.openGameOver();
      }
    }
  }

  function draw() {
    dom.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    game?.draw();
  }

  function gameLoop() {
    update();
    draw();
    if (gameIsRunning) requestAnimationFrame(gameLoop);
  }

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

  function bindInputs() {
    dom.canvas.addEventListener("click", (e) => {
      if (!gameIsRunning || !game) return;

      const rect = dom.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (mouseY > CANVAS_HEIGHT - 50) return;

      const angle = calculateAngle(mouseX, mouseY);
      game.shoot(angle);
    });

    document.addEventListener("keydown", (e) => {
      if (!gameIsRunning || !game) return;
      if (e.code === "Space" || e.code === "ArrowUp") game.shoot(-Math.PI / 2);
    });

    dom.pauseButton?.addEventListener("click", () => {
      gameIsRunning = !gameIsRunning;
      dom.pauseButton.innerHTML = gameIsRunning
        ? '<i class="fa-solid fa-pause" style="color: #ffffff;"></i>'
        : '<i class="fa-solid fa-play" style="color: #ffffff;"></i>';
      if (gameIsRunning) gameLoop();
    });

    dom.backToMenuButton?.addEventListener("click", () => {
      stopGame();
      dom.gameScreen.classList.add("hidden");
      dom.landingPage.classList.remove("hidden");
    });
  }

  return {
    initializeGame,
    stopGame,
    bindInputs,
  };
}
