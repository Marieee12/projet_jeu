// /levels/loader.js
export async function loadLevel(levelId) {
  const file = `./levels/level-${String(levelId).padStart(2, "0")}.json`;
  const res = await fetch(file);

  if (!res.ok) {
    throw new Error(`Impossible de charger ${file} (HTTP ${res.status})`);
  }

  return res.json();
}
