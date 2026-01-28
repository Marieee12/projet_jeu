const LS_PLAYER = "bubbleShooter.playerName";

export function getPlayerName() {
  return localStorage.getItem(LS_PLAYER) || "";
}
export function setPlayerName(name) {
  localStorage.setItem(LS_PLAYER, name.trim());
}
export function clearPlayerName() {
  localStorage.removeItem(LS_PLAYER);
}

export function bindPlayerUI(dom) {
  function refreshPlayerUI() {
    const name = getPlayerName();

    if (!name) {
      dom.playerHello && (dom.playerHello.textContent = "Choisis un pseudo pour jouer.");
      dom.playerInput?.classList.remove("hidden");
      dom.playerSave?.classList.remove("hidden");
      dom.playerChange?.classList.add("hidden");
      dom.startButton?.classList.add("hidden");
    } else {
      dom.playerHello && (dom.playerHello.textContent = `Salut, ${name} 👋`);
      dom.playerInput?.classList.add("hidden");
      dom.playerSave?.classList.add("hidden");
      dom.playerChange?.classList.remove("hidden");
      dom.startButton?.classList.remove("hidden");
    }
  }

  dom.playerSave?.addEventListener("click", () => {
    const v = (dom.playerInput?.value || "").trim();
    if (v.length < 2) {
      dom.playerHello && (dom.playerHello.textContent = "Pseudo trop court 🙂 (min 2 caractères)");
      return;
    }
    setPlayerName(v);
    refreshPlayerUI();
  });

  dom.playerInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") dom.playerSave?.click();
  });

  dom.playerChange?.addEventListener("click", () => {
    clearPlayerName();
    if (dom.playerInput) dom.playerInput.value = "";
    refreshPlayerUI();
  });

  // expose refresh
  return { refreshPlayerUI };
}
