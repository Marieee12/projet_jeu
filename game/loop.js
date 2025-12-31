import { Game } from "./game.js";
import { loadLevel } from "../levels/loader-levels.js";
import { showLevelIntro } from "../ui/levelIntro.js";

export function createGameController(dom, modals) {
  const { canvas, ctx, scoreDisplay, timeDisplay, pauseButton } = dom;

  let game = null;
  let running = false;
  let levelId = 1;

  // SCORE / TIME
  let score = 0;
  let timeSec = 0;
  let timerId = null;

  // ✅ session-only : niveaux déjà “annoncés”
  const seenLevelIntro = new Set();

  async function startLevel(id, { showIntro = true } = {}) {
    levelId = id;

    const levelConfig = await loadLevel(levelId);

    // ✅ intro seulement la 1ère fois du niveau, et seulement si showIntro=true
    if (showIntro && !seenLevelIntro.has(levelId)) {
      seenLevelIntro.add(levelId);
      await showLevelIntro(dom, { levelName: levelConfig.name, durationMs: 1300 });
    }

    game = new Game(canvas, ctx, levelConfig);
    running = true;
  }

  function stopGame() {
    running = false;
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function updateHUD() {
    if (scoreDisplay) scoreDisplay.textContent = String(score);
    if (timeDisplay) timeDisplay.textContent = formatTime(timeSec);
  }

  async function initializeGame({ showIntro = true } = {}) {
    stopGame();
    score = 0;
    timeSec = 0;
    updateHUD();

    // niveau 1 par défaut
    await startLevel(1, { showIntro });

    timerId = setInterval(() => {
      if (!running) return;
      timeSec++;
      updateHUD();
    }, 1000);

    if (pauseButton) {
      pauseButton.innerHTML = '<i class="fa-solid fa-pause" style="color: #ffffff;"></i>';
    }

    gameLoop();
  }

  function update() {
    if (!running || !game) return;

    const res = game.update(); // { removed, fallen, starBonus }

    const scoring = game.level?.scoring ?? {
      matchBubble: 10,
      fallenBubble: 20,
      starBonusDefault: 500,
    };

    if (res.removed > 0) score += res.removed * scoring.matchBubble;
    if (res.fallen > 0) score += res.fallen * scoring.fallenBubble;
    if (res.starBonus > 0) score += res.starBonus;

    if (res.removed > 0 || res.fallen > 0 || res.starBonus > 0) updateHUD();

    if (game.isOver) {
      stopGame();

      if (game.isWin) {
        modals?.openWinModal?.({ score, timeSec });
      } else {
        modals?.openGameOverModal?.();
      }
    }
  }

  function draw() {
    if (game) game.draw();
  }

  function gameLoop() {
    update();
    draw();
    if (running) requestAnimationFrame(gameLoop);
  }

  function shoot(angle) {
    if (!running || !game) return;
    game.shoot(angle);
  }

  function calculateAngle(mouseX, mouseY) {
    const cannonX = game ? game.startX : canvas.width / 2;
    const cannonY = game ? game.shooterY : canvas.height - 60;

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
    canvas?.addEventListener("click", (e) => {
      if (!running || !game) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (mouseY > canvas.height - 50) return;

      const angle = calculateAngle(mouseX, mouseY);
      shoot(angle);
    });

    document.addEventListener("keydown", (e) => {
      if (!running || !game) return;
      if (e.code === "Space" || e.code === "ArrowUp") shoot(-Math.PI / 2);
    });

    dom.pauseButton?.addEventListener("click", () => {
      running = !running;
      dom.pauseButton.innerHTML = running
        ? '<i class="fa-solid fa-pause" style="color: #ffffff;"></i>'
        : '<i class="fa-solid fa-play" style="color: #ffffff;"></i>';

      if (running) gameLoop();
    });

    dom.backToMenuButton?.addEventListener("click", () => {
      stopGame();
      dom.gameScreen.classList.add("hidden");
      dom.landingPage.classList.remove("hidden");
    });
  }

  return {
    initializeGame,
    startLevel, // (utile plus tard si tu enchaînes niveau 2/3)
    stopGame,
    bindInputs,
    getGame: () => game,
    getScore: () => score,
    getTimeSec: () => timeSec,
    isRunning: () => running,
  };
}




