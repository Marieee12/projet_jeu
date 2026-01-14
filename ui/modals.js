import { getPlayerName } from "../player/session.js";
import { recordWinAndGetRank, renderWinLeaderboardCentered } from "../leaderboard/leaderboard.js";
import { renderLandingLeaderboard } from "./landingleaderboard.js";

export function bindModals(dom, callbacks) {
  // --- règles ---
  dom.rulesButton?.addEventListener("click", () => {
    dom.rulesModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  });

  function closeRulesModal() {
    dom.rulesModal?.classList.add("hidden");
    document.body.style.overflow = "auto";
  }

  dom.closeRulesBtn?.addEventListener("click", closeRulesModal);
  dom.startFromModalBtn?.addEventListener("click", () => {
    closeRulesModal();
    callbacks?.onStartFromRules?.();
  });

  dom.startFromModalButton?.addEventListener("click", () => {
    closeRulesModal();
    callbacks?.onStartFromRules?.();
  });

  // --- game over ---
  function openGameOverModal({ score, timeSec } = {}) {
    // Enregistrer le score même en cas de défaite
    if (score !== undefined && timeSec !== undefined) {
      const pseudo = getPlayerName() || "Joueur";
      recordWinAndGetRank({ pseudo, score, timeSec });
      // Actualiser le classement de la landing page
      renderLandingLeaderboard(dom);
    }
    
    dom.gameOverModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeGameOverModal() {
    dom.gameOverModal?.classList.add("hidden");
    document.body.style.overflow = "auto";
  }

  dom.restartGameBtn?.addEventListener("click", () => {
    closeGameOverModal();
    callbacks?.onRestart?.();
  });

  dom.quitGameBtn?.addEventListener("click", () => {
    closeGameOverModal();
    callbacks?.onQuit?.();
  });

  dom.gameOverModal?.querySelector(".modal-overlay")?.addEventListener("click", closeGameOverModal);

  // --- win ---
  function openWinModal({ score, timeSec }) {
  const pseudo = getPlayerName() || "Joueur";

  if (dom.winPlayerEl) dom.winPlayerEl.textContent = pseudo;
  if (dom.winScoreEl) dom.winScoreEl.textContent = String(score);
  if (dom.winTimeEl) dom.winTimeEl.textContent = formatTime(timeSec);

  // Leaderboard
  const { lb, index } = recordWinAndGetRank({ pseudo, score, timeSec });
  if (dom.winRankEl) dom.winRankEl.textContent = `#${index + 1}`;
  renderWinLeaderboardCentered(dom, lb, index);

  // Actualiser le classement de la landing page
  renderLandingLeaderboard(dom);

  dom.winModal?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}


  function closeWinModal() {
    dom.winModal?.classList.add("hidden");
    document.body.style.overflow = "auto";
  }

  dom.winRestartBtn?.addEventListener("click", () => {
    closeWinModal();
    callbacks?.onWinRestart?.();
  });

  dom.winQuitBtn?.addEventListener("click", () => {
    closeWinModal();
    callbacks?.onWinQuit?.();
  });

  dom.winModal?.querySelector(".modal-overlay")?.addEventListener("click", closeWinModal);

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return {
    openGameOverModal,
    openWinModal,
    closeRulesModal,
  };
}

