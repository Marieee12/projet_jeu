import { getTopLeaderboard } from "../leaderboard/leaderboard.js";

function rankLabel(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

export function renderLandingLeaderboard(dom) {
  const tbody = dom.landingLeaderboardBody;
  if (!tbody) return;

  const top5 = getTopLeaderboard(5);

  tbody.innerHTML = "";

  if (top5.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center; opacity:0.6;">
          Aucun score pour l’instant
        </td>
      </tr>
    `;
    return;
  }

  top5.forEach((row, i) => {
    const rank = i + 1;
    const tr = document.createElement("tr");

    // classes podium 
    if (rank <= 3) tr.classList.add(`rank-${rank}`);

    tr.innerHTML = `
      <td>${rankLabel(rank)}</td>
      <td>${row.pseudo}</td>
      <td>${row.score}</td>
    `;

    tbody.appendChild(tr);
  });
}
