import { getPlayerName } from "../player/session.js";
import {
  recordWinAndGetRank,
  renderLeaderboardCentered,
} from "../leaderboard/leaderboard.js";
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

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  // --- game over ---
  function openGameOverModal({ score, timeSec, levelId } = {}) {
    const pseudo = getPlayerName() || "Joueur";

    // infos joueur
    if (dom.gameOverPlayerEl) dom.gameOverPlayerEl.textContent = pseudo;
    if (dom.gameOverScoreEl) dom.gameOverScoreEl.textContent = String(score ?? 0);
    if (dom.gameOverTimeEl) dom.gameOverTimeEl.textContent = formatTime(timeSec ?? 0);

    // Leaderboard + rang + centrage
    if (score !== undefined && timeSec !== undefined) {
      const { lb, index } = recordWinAndGetRank({ pseudo, score, timeSec });

      if (dom.gameOverRankEl) dom.gameOverRankEl.textContent = `#${index + 1}`;
      renderLeaderboardCentered(dom.gameOverLeaderboardBody, lb, index);

      // Actualiser le classement de la landing page
      renderLandingLeaderboard(dom);
    } else {
      if (dom.gameOverRankEl) dom.gameOverRankEl.textContent = "#?";
    }

    // UI : au niveau 1, pas besoin du bouton "Depuis le début" (c'est déjà le début)
    if (levelId === 1) {
      dom.restartFromBeginningBtn?.classList.add("hidden");
      if (dom.restartGameBtn) dom.restartGameBtn.textContent = "🔁 Recommencer";
    } else {
      dom.restartFromBeginningBtn?.classList.remove("hidden");
      if (dom.restartGameBtn) dom.restartGameBtn.textContent = "🔁 Rejouer ce niveau";
    }

    dom.gameOverModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeGameOverModal() {
    dom.gameOverModal?.classList.add("hidden");
    document.body.style.overflow = "auto";
  }

  // Bouton existant : "Recommencer"
  dom.restartGameBtn?.addEventListener("click", () => {
    closeGameOverModal();

    // rester sur le même niveau
    if (callbacks?.onRestartSameLevel) {
      callbacks.onRestartSameLevel();
      return;
    }

    callbacks?.onRestart?.();
  });

  // boutn: "Recommencer depuis le début"
  dom.restartFromBeginningBtn?.addEventListener("click", () => {
    closeGameOverModal();
    callbacks?.onRestartFromBeginning?.();
  });

  dom.quitGameBtn?.addEventListener("click", () => {
    closeGameOverModal();
    callbacks?.onQuit?.();
  });

  dom.gameOverModal
    ?.querySelector(".modal-overlay")
    ?.addEventListener("click", closeGameOverModal);

  // --- win ---
  function openWinModal({ score, timeSec }) {
    const pseudo = getPlayerName() || "Joueur";

    if (dom.winPlayerEl) dom.winPlayerEl.textContent = pseudo;
    if (dom.winScoreEl) dom.winScoreEl.textContent = String(score);
    if (dom.winTimeEl) dom.winTimeEl.textContent = formatTime(timeSec);

    const { lb, index } = recordWinAndGetRank({ pseudo, score, timeSec });

    if (dom.winRankEl) dom.winRankEl.textContent = `#${index + 1}`;
    renderLeaderboardCentered(dom.winTbody, lb, index);

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

  return {
    openGameOverModal,
    openWinModal,
    closeRulesModal,
  };
}




