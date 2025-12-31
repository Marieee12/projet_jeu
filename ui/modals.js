// ui/modals.js
export function bindModals(dom, { onStartFromRules, onRestart, onQuit, onWinRestart, onWinQuit }) {
  // rules
  dom.rulesButton?.addEventListener("click", () => {
    dom.rulesModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  });

  function closeRules() {
    dom.rulesModal?.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
  dom.closeRulesBtn?.addEventListener("click", closeRules);
  dom.rulesModal?.querySelector(".modal-overlay")?.addEventListener("click", closeRules);
  dom.startFromModalBtn?.addEventListener("click", () => {
    closeRules();
    onStartFromRules?.();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dom.rulesModal && !dom.rulesModal.classList.contains("hidden")) closeRules();
  });

  // gameover
  function openGameOver() {
    dom.gameOverModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeGameOver() {
    dom.gameOverModal?.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
  dom.restartGameBtn?.addEventListener("click", () => {
    closeGameOver();
    onRestart?.();
  });
  dom.quitGameBtn?.addEventListener("click", () => {
    closeGameOver();
    onQuit?.();
  });
  dom.gameOverModal?.querySelector(".modal-overlay")?.addEventListener("click", closeGameOver);

  // win
  function openWin() {
    dom.winModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeWin() {
    dom.winModal?.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
  dom.winRestartBtn?.addEventListener("click", () => {
    closeWin();
    onWinRestart?.();
  });
  dom.winQuitBtn?.addEventListener("click", () => {
    closeWin();
    onWinQuit?.();
  });
  dom.winModal?.querySelector(".modal-overlay")?.addEventListener("click", closeWin);

  return { openGameOver, closeGameOver, openWin, closeWin };
}
