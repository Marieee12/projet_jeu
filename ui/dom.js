// ui/dom.js
export const dom = {
  loaderScreen: document.getElementById("loader-screen"),
  landingPage: document.getElementById("landing-page"),
  gameScreen: document.getElementById("game-screen"),
  startButton: document.getElementById("start-button"),
  rulesButton: document.getElementById("rules-button"),
  pauseButton: document.getElementById("pause-button"),
  backToMenuButton: document.getElementById("back-to-menu"),
  colorButtons: document.querySelectorAll(".color-select"),
  scoreDisplay: document.getElementById("score-display"),
  timeDisplay: document.getElementById("time-display"),
  canvas: document.getElementById("gameCanvas"),
  ctx: document.getElementById("gameCanvas")?.getContext("2d"),

  // rules modal
  rulesModal: document.getElementById("rules-modal"),
  closeRulesBtn: document.getElementById("close-rules-modal"),
  startFromModalBtn: document.getElementById("start-from-modal"),

  // Level intro loader
  levelIntro: document.getElementById("level-intro"),
  levelIntroTitle: document.getElementById("level-intro-title"),
  levelIntroSubtitle: document.getElementById("level-intro-subtitle"),
  levelIntroProgress: document.getElementById("level-intro-progress"),

  // gameover modal
  gameOverModal: document.getElementById("gameover-modal"),
  restartGameBtn: document.getElementById("restart-game"),
  quitGameBtn: document.getElementById("quit-game"),

  // win modal
  winModal: document.getElementById("win-modal"),
  winPlayerEl: document.getElementById("win-player"),
  winScoreEl: document.getElementById("win-score"),
  winTimeEl: document.getElementById("win-time"),
  winRankEl: document.getElementById("win-rank"),
  winTbody: document.getElementById("win-leaderboard-body"),
  winRestartBtn: document.getElementById("win-restart"),
  winQuitBtn: document.getElementById("win-quit"),

  // player UI
  playerInput: document.getElementById("player-input"),
  playerSave: document.getElementById("player-save"),
  playerChange: document.getElementById("player-change"),
  playerHello: document.getElementById("player-hello"),
};
