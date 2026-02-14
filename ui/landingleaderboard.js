import { getTopLeaderboard, formatTime } from "../leaderboard/leaderboard.js";
import { getPlayerName } from "../player/session.js";
 
function rankLabel(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}
 
export function renderLandingLeaderboard(dom) {
  const tbody = dom.landingLeaderboardBody;
  if (!tbody) return;
 
  const currentPlayer = getPlayerName();
  const top = getTopLeaderboard(5);
 
  tbody.innerHTML = "";
 
  if (top.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; opacity:0.6; padding: 20px;">
          Aucun score pour l'instant
        </td>
      </tr>
    `;
    return;
  }
 
  top.forEach((row, i) => {
    const rank = i + 1;
    const tr = document.createElement("tr");
 
    // classes podium
    if (rank <= 3) tr.classList.add(`rank-${rank}`);
 
    // surligner le joueur connecté
    if (currentPlayer && row.pseudo === currentPlayer) tr.classList.add("current-player-highlight");
 
    const timeText = row.timeSec == null ? "-" : formatTime(row.timeSec);
 
    tr.innerHTML = `
      <td>${rankLabel(rank)}</td>
      <td>${row.pseudo}</td>
      <td>${row.score}</td>
      <td>${timeText}</td>
    `;

    tbody.appendChild(tr);
  });
}
