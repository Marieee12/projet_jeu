import { dom } from "./ui/dom.js";
import { bindPlayerUI, getPlayerName } from "./player/session.js";
import { bindModals } from "./ui/modals.js";
import { createGameController } from "./game/loop.js";
import { renderLandingLeaderboard } from "./ui/landingleaderboard.js";

import { logInfo, logError } from "./logger.js";

logInfo("app_loaded", {
  screen: "landing",
});

function hideLoader() {
  logInfo("loader_hidden");

  dom.loaderScreen.classList.add("hidden");
  dom.landingPage.classList.remove("hidden");

  setTimeout(() => {
    document.querySelector(".panel-left")?.style && (document.querySelector(".panel-left").style.opacity = "1");
    document.querySelector(".panel-right")?.style && (document.querySelector(".panel-right").style.opacity = "1");
  }, 100);

  player.refreshPlayerUI();
  renderLandingLeaderboard(dom);

}

const player = bindPlayerUI(dom);

const modals = bindModals(dom, {
  onStartFromRules: () => {
    if (!getPlayerName()) return;
    dom.landingPage.classList.add("hidden");
    dom.gameScreen.classList.remove("hidden");
    gameController.initializeGame();
  },
  onRestart: () => gameController.initializeGame({ showIntro: false }),
  onQuit: () => {
    logInfo("game_quit_clicked");
    gameController.stopGame();
    dom.gameScreen.classList.add("hidden");
    dom.landingPage.classList.remove("hidden");
    dom.landingPage.classList.remove("hidden");
    renderLandingLeaderboard(dom);
  },
  onWinRestart: () => gameController.initializeGame({ showIntro: false }),
  onWinQuit: () => {
    logInfo("game_win_quit_clicked");
    gameController.stopGame();
    dom.gameScreen.classList.add("hidden");
    dom.landingPage.classList.remove("hidden");
    renderLandingLeaderboard(dom);
  },
});

const gameController = createGameController(dom, modals);
gameController.bindInputs();

dom.startButton?.addEventListener("click", () => {
  logInfo("game_start_clicked", {
    hasPlayerName: !!getPlayerName(),
  });
  if (!getPlayerName()) return;
  dom.landingPage.classList.add("hidden");
  dom.gameScreen.classList.remove("hidden");
  gameController.initializeGame();
});

// loader
setTimeout(hideLoader, 2000);

// LOGS des erreurs globales front
window.addEventListener("error", (e) => {
  logError("frontend_error", {
    message: e.message,
    file: e.filename,
    line: e.lineno,
    column: e.colno,
  });
});

window.addEventListener("unhandledrejection", (e) => {
  logError("promise_rejection", {
    reason: String(e.reason),
  });
});







