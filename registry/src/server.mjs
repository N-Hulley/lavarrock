/**
 * server.mjs — Lavarrock Plugin Registry HTTP server.
 *
 * Serves the built plugin bundles and manifest over HTTP
 * with CORS enabled so the frontend can load them at runtime.
 */

import express from "express";
import cors from "cors";
import { resolve, dirname } from "path";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../dist");
const PORT = parseInt(process.env.PORT || "3001", 10);

const app = express();

// Enable CORS for all origins (the frontend runs on a different port)
app.use(cors());

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ── Health check ──────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "plugin-registry" });
});

// ── Serve the global plugin manifest ──────────────
app.get("/api/plugins", (_req, res) => {
  const manifestPath = resolve(DIST, "manifest.json");
  if (!existsSync(manifestPath)) {
    return res.status(503).json({
      error: "Registry not built yet. Run `node src/build.mjs` first.",
    });
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  res.json(manifest);
});

// ── Serve plugin bundles and assets ───────────────
// Static file serving for /plugins/<id>/bundle.js, style.css, etc.
app.use(
  "/plugins",
  express.static(resolve(DIST, "plugins"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      } else if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      }
      // Allow aggressive caching in production, no-cache for dev
      res.setHeader("Cache-Control", "no-cache");
    },
  }),
);

// ── Serve global CSS (theme + Tailwind utilities) ─
app.get("/plugin-utilities.css", (_req, res) => {
  const cssPath = resolve(DIST, "plugin-utilities.css");
  if (!existsSync(cssPath)) {
    return res.status(404).send("CSS not built yet");
  }
  res.setHeader("Content-Type", "text/css; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(cssPath);
});

// ── Start ─────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔌 Lavarrock Plugin Registry running on http://0.0.0.0:${PORT}`);
  console.log(`   Manifest: http://0.0.0.0:${PORT}/api/plugins`);
  console.log(`   Bundles:  http://0.0.0.0:${PORT}/plugins/<id>/bundle.js`);
});
