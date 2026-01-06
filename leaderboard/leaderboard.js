// leaderboard/leaderboard.js
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
  localStorage.setItem(LS_LEADERBOARD, JSON.stringify(lb));
}

function loadLeaderboard() {
  const raw = localStorage.getItem("bubbleShooter.leaderboard");

  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }

  // SEED depuis le HTML
  const seeded = seedLeaderboardFromLandingTable();
  localStorage.setItem("bubbleShooter.leaderboard", JSON.stringify(seeded));
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
  const lb = loadLeaderboard();
  const entry = { pseudo, score, timeSec, createdAt: Date.now() };

  lb.push(entry);
  sortLeaderboard(lb);

  const trimmed = lb.slice(0, 200);
  saveLeaderboard(trimmed);

  const idx = trimmed.findIndex(
    (x) =>
      x.pseudo === entry.pseudo &&
      x.score === entry.score &&
      x.timeSec === entry.timeSec &&
      x.createdAt === entry.createdAt
  );

  return { lb: trimmed, index: idx === -1 ? 0 : idx };
}

export function renderWinLeaderboardCentered(dom, lb, playerIndex) {
  if (!dom.winTbody) return;

  dom.winTbody.innerHTML = "";

  lb.forEach((row, i) => {
    const tr = document.createElement("tr");

    // 👉 ligne du joueur
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
  const raw = localStorage.getItem("bubbleShooter.leaderboard");
  if (!raw) return [];

  try {
    const lb = JSON.parse(raw);
    return lb.slice(0, limit);
  } catch {
    return [];
  }
}


