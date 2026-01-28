const LS_KEY = "bubbleShooter.playerName";

async function loadModule() {
  // ✅ Charge ton module ESM depuis un test CommonJS
  return await import("../player/session.js");
}

function makeDom() {
  const playerHello = document.createElement("div");

  const playerInput = document.createElement("input");
  playerInput.classList.add("hidden");

  const playerSave = document.createElement("button");
  playerSave.classList.add("hidden");

  const playerChange = document.createElement("button");
  playerChange.classList.add("hidden");

  const startButton = document.createElement("button");
  startButton.classList.add("hidden");

  document.body.append(playerHello, playerInput, playerSave, playerChange, startButton);

  return { playerHello, playerInput, playerSave, playerChange, startButton };
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("player/session.js – localStorage helpers", () => {
  test("getPlayerName returns empty string when nothing stored", async () => {
    const { getPlayerName } = await loadModule();
    expect(getPlayerName()).toBe("");
  });

  test("setPlayerName trims and stores the value", async () => {
    const { setPlayerName, getPlayerName } = await loadModule();
    setPlayerName("  Emilie  ");
    expect(localStorage.getItem(LS_KEY)).toBe("Emilie");
    expect(getPlayerName()).toBe("Emilie");
  });

  test("clearPlayerName removes stored name", async () => {
    const { clearPlayerName, getPlayerName } = await loadModule();
    localStorage.setItem(LS_KEY, "Bob");
    clearPlayerName();
    expect(localStorage.getItem(LS_KEY)).toBeNull();
    expect(getPlayerName()).toBe("");
  });
});

describe("player/session.js – bindPlayerUI", () => {
  test("refreshPlayerUI shows input when no player name", async () => {
    const { bindPlayerUI } = await loadModule();
    const dom = makeDom();
    const { refreshPlayerUI } = bindPlayerUI(dom);

    refreshPlayerUI();

    expect(dom.playerHello.textContent).toBe("Choisis un pseudo pour jouer.");
    expect(dom.playerInput.classList.contains("hidden")).toBe(false);
    expect(dom.playerSave.classList.contains("hidden")).toBe(false);
    expect(dom.playerChange.classList.contains("hidden")).toBe(true);
    expect(dom.startButton.classList.contains("hidden")).toBe(true);
  });

  test("refreshPlayerUI shows greeting when player name exists", async () => {
    const { bindPlayerUI } = await loadModule();
    localStorage.setItem(LS_KEY, "Alice");

    const dom = makeDom();
    const { refreshPlayerUI } = bindPlayerUI(dom);

    refreshPlayerUI();

    expect(dom.playerHello.textContent).toBe("Salut, Alice 👋");
    expect(dom.playerInput.classList.contains("hidden")).toBe(true);
    expect(dom.playerSave.classList.contains("hidden")).toBe(true);
    expect(dom.playerChange.classList.contains("hidden")).toBe(false);
    expect(dom.startButton.classList.contains("hidden")).toBe(false);
  });

  test("click on Save with short name shows error", async () => {
    const { bindPlayerUI } = await loadModule();
    const dom = makeDom();
    const { refreshPlayerUI } = bindPlayerUI(dom);

    refreshPlayerUI();
    dom.playerInput.value = "a";
    dom.playerSave.click();

    expect(dom.playerHello.textContent).toContain("Pseudo trop court");
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  test("click on Save stores name and updates UI", async () => {
    const { bindPlayerUI } = await loadModule();
    const dom = makeDom();
    const { refreshPlayerUI } = bindPlayerUI(dom);

    refreshPlayerUI();
    dom.playerInput.value = "  Zoé  ";
    dom.playerSave.click();

    expect(localStorage.getItem(LS_KEY)).toBe("Zoé");
    expect(dom.playerHello.textContent).toBe("Salut, Zoé 👋");
  });

  test("click on Change clears name and resets UI", async () => {
    const { bindPlayerUI } = await loadModule();
    localStorage.setItem(LS_KEY, "Léo");

    const dom = makeDom();
    const { refreshPlayerUI } = bindPlayerUI(dom);

    refreshPlayerUI();
    dom.playerInput.value = "whatever";
    dom.playerChange.click();

    expect(localStorage.getItem(LS_KEY)).toBeNull();
    expect(dom.playerInput.value).toBe("");
    expect(dom.playerHello.textContent).toBe("Choisis un pseudo pour jouer.");
  });
});

