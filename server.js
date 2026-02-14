import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3010;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SON parser
app.use(express.json({ limit: "32kb" }));

// Endpoint logs 
app.post("/log", (req, res) => {
  const event = req.body;

  if (!event || typeof event !== "object") {
    return res.status(400).json({ ok: false });
  }

  console.log(JSON.stringify({ origin: "frontend", ...event }));
  return res.sendStatus(204);
});

// Static file
app.use(express.static(__dirname));

// Root: loader page (shows a short splash before index)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'loader.html'));
});

// SPA fallback (any other route -> index)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

