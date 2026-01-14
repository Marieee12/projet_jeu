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
  
  // Si un joueur est connecté, afficher ses scores personnels
  if (currentPlayer) {
    // Changer le titre
    if (dom.leaderboardTitle) {
      dom.leaderboardTitle.innerHTML = '<i class="fa-solid fa-trophy"></i>MES SCORES';
    }
    
    // Changer l'en-tête du tableau
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
    
    const playerScores = getPlayerScores(currentPlayer, 5);
    
    console.log("Rendering personal scores for", currentPlayer, "with", playerScores.length, "entries:", playerScores);

    tbody.innerHTML = "";

    if (playerScores.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; opacity:0.6; padding: 20px;">
            Aucun score pour l'instant<br>
            <small style="font-size: 0.85em; margin-top: 5px; display: block;">Joue une partie pour voir tes scores !</small>
          </td>
        </tr>
      `;
      return;
    }

    playerScores.forEach((row, i) => {
      const rank = i + 1;
      const tr = document.createElement("tr");

      // classes podium 
      if (rank <= 3) tr.classList.add(`rank-${rank}`);

      const timeText = row.timeSec != null ? formatTime(row.timeSec) : "-";

      tr.innerHTML = `
        <td>${rankLabel(rank)}</td>
        <td>${currentPlayer}</td>
        <td>${row.score}</td>
        <td>${timeText}</td>
      `;

      tbody.appendChild(tr);
    });
    
    return;
  }
  
  // Si aucun joueur n'est connecté, afficher le classement global
  // Changer le titre
  if (dom.leaderboardTitle) {
    dom.leaderboardTitle.innerHTML = '<i class="fa-solid fa-ranking-star"></i>CLASSEMENT';
  }
  
  // Changer l'en-tête du tableau
  if (dom.leaderboardHeader) {
    dom.leaderboardHeader.innerHTML = `
      <tr>
        <th>Rang</th>
        <th>Pseudo</th>
        <th>Score</th>
      </tr>
    `;
  }
  
  const top5 = getTopLeaderboard(5);
  
  console.log("Rendering global leaderboard with", top5.length, "entries:", top5);

  tbody.innerHTML = "";

  if (top5.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center; opacity:0.6;">
          Aucun score pour l'instant
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
