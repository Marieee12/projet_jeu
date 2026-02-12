import { Bubble } from "./bubble.js";

export function drawBackground(ctx, canvas) {
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, "#667eea");
  g.addColorStop(1, "#764ba2");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawDangerLine(ctx, canvas, dangerLineY) {
  const y = dangerLineY;

  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.moveTo(0, y);
  ctx.lineTo(canvas.width, y);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.font = "12px Montserrat, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("LIMITE", 12, y - 8);
  ctx.restore();
}

function drawBlock(ctx, radius, block) {
  const size = radius * 1.8;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(block.x - size / 2, block.y - size / 2, size, size);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawStar(ctx, radius, star) {
  ctx.save();
  ctx.fillStyle = "rgba(255,215,0,0.9)";
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(star.x, star.y, radius * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#111";
  ctx.font = "16px Montserrat, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★", star.x, star.y + 1);

  ctx.restore();
}

export function drawGrid(ctx, grid, rows, cols, radius) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (!cell) continue;

      if (cell instanceof Bubble) {
        cell.draw(ctx);
        continue;
      }

      if (cell.type === "block") {
        drawBlock(ctx, radius, cell);
        continue;
      }

      if (cell.type === "star") {
        drawStar(ctx, radius, cell);
        continue;
      }
    }
  }
}
