import { logInfo, logWarn, logError } from "../logger.js";

const LS_LEADERBOARD = "bubbleShooter.leaderboard";

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function seedLeaderboardFromLandingTable() {
  const rows = document.querySelectorAll("#leaderboard tbody tr");
  const data = [];

  rows.forEach((tr) => {
    const tds = tr.querySelectorAll("td");
    if (tds.length < 3) return;

    const pseudo = (tds[1]?.textContent || "").trim();
    const score = parseInt((tds[2]?.textContent || "0").trim(), 10) || 0;

    data.push({ pseudo, score, timeSec: null, createdAt: Date.now() });
  });

  return data;
}

function saveLeaderboard(lb) {
  try {
    localStorage.setItem(LS_LEADERBOARD, JSON.stringify(lb));
    logInfo("storage_write_ok", { key: LS_LEADERBOARD, entries: lb.length });
  } catch (e) {
    logError("storage_write_failed", {
      key: LS_LEADERBOARD,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

function loadLeaderboard() {
  const raw = localStorage.getItem(LS_LEADERBOARD);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed) && parsed.length > 0) {
        logInfo("leaderboard_loaded", {
          source: "localStorage",
          entries: parsed.length,
        });
        return parsed;
      }

      // Tableau vide ou mauvais format
      logWarn("leaderboard_empty_or_invalid", {
        source: "localStorage",
      });

    } catch (e) {
      logError("leaderboard_parse_failed", {
        key: LS_LEADERBOARD,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // SEED depuis le HTML
  const seeded = seedLeaderboardFromLandingTable();
  
  // Si le HTML n'a pas de données, créer des données par défaut
  if (seeded.length === 0) {
    const defaultData = [
      { pseudo: "Alice", score: 3110, timeSec: 180, createdAt: Date.now() - 5000 },
      { pseudo: "Bob", score: 3030, timeSec: 200, createdAt: Date.now() - 4000 },
      { pseudo: "Chloé", score: 3000, timeSec: 190, createdAt: Date.now() - 3000 },
      { pseudo: "David", score: 2980, timeSec: 210, createdAt: Date.now() - 2000 },
      { pseudo: "Emma", score: 2930, timeSec: 220, createdAt: Date.now() - 1000 }
    ];
    localStorage.setItem(LS_LEADERBOARD, JSON.stringify(defaultData));
    // LOG
    logInfo("leaderboard_seeded", {
      source: "default_data",
      entries: defaultData.length,
    });
    return defaultData;
  }
  
  localStorage.setItem(LS_LEADERBOARD, JSON.stringify(seeded));
  return seeded;
}


function sortLeaderboard(lb) {
  return lb.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const at = a.timeSec ?? Number.POSITIVE_INFINITY;
    const bt = b.timeSec ?? Number.POSITIVE_INFINITY;
    return at - bt;
  });
}

export function recordWinAndGetRank({ pseudo, score, timeSec }) {
  // LOG de tenter d'enregistrer
  logInfo("score_record_attempt", { pseudo, score, timeSec });
  
  const lb = loadLeaderboard();
  const entry = { pseudo, score, timeSec, createdAt: Date.now() };

  lb.push(entry);
  sortLeaderboard(lb);

  const trimmed = lb.slice(0, 200);
  saveLeaderboard(trimmed);
  
  // LOG du leadervoard sauvegardé
  logInfo("leaderboard_saved", {
    totalEntries: trimmed.length,
    });

  const idx = trimmed.findIndex(
    (x) =>
      x.pseudo === entry.pseudo &&
      x.score === entry.score &&
      x.timeSec === entry.timeSec &&
      x.createdAt === entry.createdAt
  );

  // LOG score enregistré
  const rank = idx === -1 ? 1 : idx + 1;

  logInfo("score_recorded", {
    pseudo,
    score,
    timeSec,
    rank,
    totalEntries: trimmed.length,
  });

  return { lb: trimmed, index: idx === -1 ? 0 : idx };
}

export function renderWinLeaderboardCentered(dom, lb, playerIndex) {
  if (!dom.winTbody) return;

  dom.winTbody.innerHTML = "";

  lb.forEach((row, i) => {
    const tr = document.createElement("tr");

    // ligne du joueur
    if (i === playerIndex) {
      tr.classList.add("win-player-row");
      tr.dataset.playerRow = "1";
    }

    const timeText = row.timeSec == null ? "-" : formatTime(row.timeSec);

    tr.innerHTML = `
      <td style="padding:10px 12px; color:#ffffff;">${i + 1}</td>
      <td style="padding:10px 12px; color:#ffffff;">${row.pseudo}</td>
      <td style="padding:10px 12px; color:#ffffff; text-align:right;">${row.score}</td>
      <td style="padding:10px 12px; color:#ffffff; text-align:right;">${timeText}</td>
    `;

    dom.winTbody.appendChild(tr);
  });

  // centre la vue sur le joueur APRÈS render
  requestAnimationFrame(() => {
    const playerRow = dom.winTbody.querySelector('tr[data-player-row="1"]');
    if (playerRow) {
      playerRow.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  });
}

export function getTopLeaderboard(limit = 5) {
  const lb = loadLeaderboard(); // Utiliser loadLeaderboard au lieu de lire directement localStorage
  return lb.slice(0, limit);
}

export function getPlayerScores(pseudo, limit = 5) {
  const lb = loadLeaderboard();
  
  // Filtrer les scores du joueur spécifique
  const playerScores = lb.filter(entry => entry.pseudo === pseudo);
  
  // Trier par score décroissant, puis par temps
  playerScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const at = a.timeSec ?? Number.POSITIVE_INFINITY;
    const bt = b.timeSec ?? Number.POSITIVE_INFINITY;
    return at - bt;
  });
  
  return playerScores.slice(0, limit);
}


