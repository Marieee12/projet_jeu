export async function loadLevel(id) {
  // 1 -> "01", 2 -> "02", 3 -> "03"
  const padded = String(id).padStart(2, "0");

  // chemin relatif au fichier courant (levels/)
  const url = new URL(`./level-${padded}.json`, import.meta.url);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Impossible de charger ${url} (${res.status} ${res.statusText})`);
  }

  return res.json();
}

