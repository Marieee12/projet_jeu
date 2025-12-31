// script.js
import { dom } from "./ui/dom.js";
import { bindPlayerUI, getPlayerName } from "./player/session.js";
import { bindModals } from "./ui/modals.js";
import { createGameController } from "./game/loop.js";

function hideLoader() {
  dom.loaderScreen.classList.add("hidden");
  dom.landingPage.classList.remove("hidden");

  setTimeout(() => {
    document.querySelector(".panel-left")?.style && (document.querySelector(".panel-left").style.opacity = "1");
    document.querySelector(".panel-right")?.style && (document.querySelector(".panel-right").style.opacity = "1");
  }, 100);

  player.refreshPlayerUI();
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
    gameController.stopGame();
    dom.gameScreen.classList.add("hidden");
    dom.landingPage.classList.remove("hidden");
  },
  onWinRestart: () => gameController.initializeGame({ showIntro: false }),
  onWinQuit: () => {
    gameController.stopGame();
    dom.gameScreen.classList.add("hidden");
    dom.landingPage.classList.remove("hidden");
  },
});

const gameController = createGameController(dom, modals);
gameController.bindInputs();

dom.startButton?.addEventListener("click", () => {
  if (!getPlayerName()) return;
  dom.landingPage.classList.add("hidden");
  dom.gameScreen.classList.remove("hidden");
  gameController.initializeGame();
});

// loader
setTimeout(hideLoader, 2000);







