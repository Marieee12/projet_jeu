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
  function openGameOverModal({ score, timeSec, levelId } = {}) {
    // Enregistrer le score même en cas de défaite
    if (score !== undefined && timeSec !== undefined) {
      const pseudo = getPlayerName() || "Joueur";
      recordWinAndGetRank({ pseudo, score, timeSec });
      // Actualiser le classement de la landing page
      renderLandingLeaderboard(dom);
    }

    // ✅ UI : au niveau 1, pas besoin du bouton "Depuis le début" (c'est déjà le début)
    if (levelId === 1) {
      dom.restartFromBeginningBtn?.classList.add("hidden");

      // texte plus clair au niveau 1
      if (dom.restartGameBtn) dom.restartGameBtn.textContent = "🔁 Recommencer";
    } else {
      dom.restartFromBeginningBtn?.classList.remove("hidden");

      // texte plus explicite dès niveau 2+
      if (dom.restartGameBtn) dom.restartGameBtn.textContent = "🔁 Rejouer ce niveau";
    }

    dom.gameOverModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeGameOverModal() {
    dom.gameOverModal?.classList.add("hidden");
    document.body.style.overflow = "auto";
  }

  // ✅ Bouton existant : "Recommencer"
  // => maintenant, il rejoue le même niveau (si dispo), sinon fallback ancien onRestart
  dom.restartGameBtn?.addEventListener("click", () => {
    closeGameOverModal();

    // priorité : rester sur le même niveau
    if (callbacks?.onRestartSameLevel) {
      callbacks.onRestartSameLevel();
      return;
    }

    // fallback compat (ancien comportement)
    callbacks?.onRestart?.();
  });

  // ✅ Nouveau bouton optionnel : "Recommencer depuis le début"
  // ⚠️ Il faut l'ajouter dans dom.js + HTML (voir notes en dessous)
  dom.restartFromBeginningBtn?.addEventListener("click", () => {
    closeGameOverModal();
    callbacks?.onRestartFromBeginning?.();
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



