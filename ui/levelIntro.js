export function showLevelIntro(dom, { levelName, durationMs = 1300 }) {
  const { levelIntro, levelIntroTitle, levelIntroSubtitle, levelIntroProgress } = dom;

  if (!levelIntro) return Promise.resolve();

  if (levelIntroTitle) levelIntroTitle.textContent = levelName ?? "Niveau";
  if (levelIntroSubtitle) levelIntroSubtitle.textContent = "Prépare-toi...";
  if (levelIntroProgress) {
    levelIntroProgress.style.transition = "none";
    levelIntroProgress.style.width = "0%";
  }

  levelIntro.classList.remove("hidden");

  // relancer l'animation de barre
  requestAnimationFrame(() => {
    if (levelIntroProgress) {
      levelIntroProgress.style.transition = `width ${durationMs}ms linear`;
      levelIntroProgress.style.width = "100%";
    }
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      levelIntro.classList.add("hidden");
      if (levelIntroProgress) {
        levelIntroProgress.style.transition = "none";
        levelIntroProgress.style.width = "0%";
      }
      resolve();
    }, durationMs);
  });
}
