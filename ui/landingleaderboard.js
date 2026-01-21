import { getTopLeaderboard, getPlayerScores, formatTime } from "../leaderboard/leaderboard.js";
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
  
  // Toujours afficher le classement GLOBAL de tous les joueurs
  if (dom.leaderboardTitle) {
    dom.leaderboardTitle.innerHTML = '<i class="fa-solid fa-ranking-star"></i>CLASSEMENT';
  }
  
  // En-tête du tableau
  if (dom.leaderboardHeader) {
    dom.leaderboardHeader.innerHTML = `
      <tr>
        <th>Rang</th>
        <th>Pseudo</th>
        <th>Score</th>
        <th>Temps</th>
      </tr>
    `;
  }
  
  const topScores = getTopLeaderboard(10); // Top 10 de tous les joueurs
  
  console.log("Rendering global leaderboard with", topScores.length, "entries");

  tbody.innerHTML = "";

  if (topScores.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; opacity:0.6; padding: 20px;">
          Aucun score pour l'instant<br>
          <small style="font-size: 0.85em; margin-top: 5px; display: block;">Sois le premier à jouer !</small>
        </td>
      </tr>
    `;
    return;
  }

  topScores.forEach((row, i) => {
    const rank = i + 1;
    const tr = document.createElement("tr");

    // classes podium 
    if (rank <= 3) tr.classList.add(`rank-${rank}`);
    
    // Mettre en surbrillance la ligne du joueur actuel
    if (currentPlayer && row.pseudo === currentPlayer) {
      tr.classList.add("current-player-highlight");
    }

    const timeText = row.timeSec != null ? formatTime(row.timeSec) : "-";

    tr.innerHTML = `
      <td>${rankLabel(rank)}</td>
      <td>${row.pseudo}</td>
      <td>${row.score}</td>
      <td>${timeText}</td>
    `;

    tbody.appendChild(tr);
  });
}
