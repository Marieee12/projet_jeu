import { Game } from "./game.js";
import { loadLevel } from "../levels/loader-levels.js";
import { showLevelIntro } from "../ui/levelIntro.js";
import { renderLandingLeaderboard } from "../ui/landingleaderboard.js";

export function createGameController(dom, modals) {
  const { canvas, ctx, scoreDisplay, timeDisplay, pauseButton } = dom;

  let game = null;
  let running = false;
  let levelId = 1;

  const TOTAL_LEVELS = 3;

  // SCORE / TIME (par niveau)
  let score = 0;
  let timeSec = 0;
  let timerId = null;

  // session-only : intro déjà affichée pour un niveau
  const seenLevelIntro = new Set();

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function updateHUD() {
    if (scoreDisplay) scoreDisplay.textContent = String(score);
    if (timeDisplay) timeDisplay.textContent = formatTime(timeSec);
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      if (!running) return;
      timeSec++;
      updateHUD();
    }, 1000);
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  async function startLevel(id, { showIntro = true, resetStats = true } = {}) {
    levelId = id;

    if (resetStats) {
      score = 0;
      timeSec = 0;
      updateHUD();
    }

    const levelConfig = await loadLevel(levelId);

    // intro seulement la 1ère fois du niveau (dans cette session) si showIntro = true
    if (showIntro && !seenLevelIntro.has(levelId)) {
      seenLevelIntro.add(levelId);
      await showLevelIntro(dom, { levelName: levelConfig.name, durationMs: 1300 });
    }

    game = new Game(canvas, ctx, levelConfig);
    running = true;

    // timer par niveau
    startTimer();

    // UI pause en mode pause
    if (pauseButton) {
      pauseButton.innerHTML = '<i class="fa-solid fa-pause" style="color: #ffffff;"></i>';
    }

    // lance la boucle
    gameLoop();
  }

  function hasNextLevel() {
    return levelId < TOTAL_LEVELS;
  }

  async function goToNextLevel() {
    // On passe au niveau suivant avec reset stats (par défaut)
    const next = levelId + 1;
    await startLevel(next, { showIntro: true, resetStats: true });
  }

  function stopGame() {
    running = false;
    stopTimer();
  }

  async function initializeGame({ showIntro = true } = {}) {
    stopGame();
    // démarre au niveau 1, reset stats
    await startLevel(4, { showIntro, resetStats: true });
  }

  function update() {
    if (!running || !game) return;

    // update logique du jeu
    const res = game.update(); // { removed, fallen, starBonus }

    // scoring depuis le JSON de niveau (fallback si absent)
    const scoring = game.level?.scoring ?? {
      matchBubble: 10,
      fallenBubble: 20,
      starBonusDefault: 500,
    };

    if (res.removed > 0) score += res.removed * scoring.matchBubble;
    if (res.fallen > 0) score += res.fallen * scoring.fallenBubble;
    if (res.starBonus > 0) score += res.starBonus;

    if (res.removed > 0 || res.fallen > 0 || res.starBonus > 0) updateHUD();

    // fin de niveau
    if (game.isOver) {
      stopGame();

      if (game.isWin) {
        // Win niveau 1/2 => niveau suivant
        if (hasNextLevel()) {
          goToNextLevel();
          return;
        }

        //  Win dernier niveau => modal victoire
        modals?.openWinModal?.({ score, timeSec });
        return;
      }

      // Game over
      modals?.openGameOverModal?.({ score, timeSec });
    }
  }

  function draw() {
    if (game) {
      game.draw();
      updateBallColors(); // Mettre à jour l'affichage des couleurs
    }
  }

  function updateBallColors() {
    if (!game) return;
    
    const colors = game.getCurrentColors();
    
    // Mettre à jour l'affichage de la balle actuelle
    if (dom.currentBallDisplay) {
      dom.currentBallDisplay.style.backgroundColor = colors.current;
    }
    
    // Mettre à jour l'affichage de la prochaine balle
    if (dom.nextBallDisplay) {
      dom.nextBallDisplay.style.backgroundColor = colors.next;
    }
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

    // clamp (tir vers le haut)
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

      // ignore click sur zone UI bas
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

      if (running) {
        // relance la boucle (timer continue mais n’incrémente pas si running=false)
        gameLoop();
      }
    });

    dom.backToMenuButton?.addEventListener("click", () => {
      stopGame();
      dom.gameScreen.classList.add("hidden");
      dom.landingPage.classList.remove("hidden");
      renderLandingLeaderboard(dom); // Actualiser le classement
    });
  }


  return {
    initializeGame, // lance niveau 1
    startLevel,     
    stopGame,
    bindInputs,

    // getters
    getGame: () => game,
    getScore: () => score,
    getTimeSec: () => timeSec,
    getLevel: () => levelId,
    isRunning: () => running,
  };
}





