// server.js — Webhook server for Make.com → Remotion render
// Runs on Railway alongside the Remotion renderer

const express = require("express");
const { execSync, exec } = require("child_process");
const https = require("https");
const http  = require("http");
const fs    = require("fs");
const path  = require("path");
const os    = require("os");

const app  = express();
const PORT = process.env.PORT || 3001;
const SECRET = process.env.WEBHOOK_SECRET || "bomedia2024";

app.use(express.json({ limit: "10mb" }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "bomedia-video-factory", version: "1.0.0" });
});

// ── Download audio file from URL ─────────────────────────────────────────────
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);
    proto.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => { file.close(); resolve(destPath); });
    }).on("error", reject);
  });
}

// ── Main render endpoint ──────────────────────────────────────────────────────
app.post("/render", async (req, res) => {
  // Auth
  const secret = req.headers["x-webhook-secret"];
  if (secret !== SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    titulo,
    guion_tts,
    escenas,
    imagenes,
    plantilla = "uv-compact",
    duracion_seg = 75,
    variacion = 1,
    audio_url,
    idea_id = "video",
  } = req.body;

  // Validate required fields
  if (!titulo || !escenas || !imagenes) {
    return res.status(400).json({ error: "Missing required fields: titulo, escenas, imagenes" });
  }

  console.log(`\n📹 Render request: ${idea_id} — "${titulo}"`);
  console.log(`   Plantilla: ${plantilla} | Variación: ${variacion} | Duración: ${duracion_seg}s`);

  const tmpDir  = os.tmpdir();
  const outFile = path.join(tmpDir, `${idea_id}.mp4`);

  try {
    // Build props JSON for Remotion
    const props = {
      titulo,
      guion_tts: guion_tts || "",
      escenas,
      imagenes,
      plantilla,
      duracion_seg,
      variacion: Number(variacion),
      audio_url: audio_url || undefined,
    };

    const propsFile = path.join(tmpDir, `${idea_id}-props.json`);
    fs.writeFileSync(propsFile, JSON.stringify(props));

    const fps = 30;
    const frames = duracion_seg * fps;

    // Run Remotion render
    console.log(`   Rendering ${frames} frames...`);
    const cmd = [
      "npx remotion render",
      "BomediaVideo",          // composition ID
      outFile,                  // output path
      `--props="${propsFile}"`,
      `--frames=0-${frames - 1}`,
      "--log=warn",
      "--overwrite",
    ].join(" ");

    execSync(cmd, { cwd: __dirname, stdio: "pipe", timeout: 300000 }); // 5 min timeout

    console.log(`   ✅ Render complete: ${outFile}`);

    // Return the MP4 as a download
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${idea_id}.mp4"`);
    res.setHeader("X-Video-Title", encodeURIComponent(titulo));
    res.setHeader("X-Idea-Id", idea_id);

    const stream = fs.createReadStream(outFile);
    stream.pipe(res);
    stream.on("end", () => {
      // Cleanup temp files
      try { fs.unlinkSync(outFile); } catch (_) {}
      try { fs.unlinkSync(propsFile); } catch (_) {}
      console.log(`   📤 Sent to Make: ${idea_id}.mp4`);
    });

  } catch (err) {
    console.error(`   ❌ Render error:`, err.message);
    res.status(500).json({
      error: "Render failed",
      detail: err.message,
      idea_id,
    });
  }
});

// ── Status endpoint (Make can poll this) ──────────────────────────────────────
app.get("/status", (req, res) => {
  res.json({
    status: "ready",
    uptime: process.uptime(),
    memory: process.memoryUsage().heapUsed,
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Bomedia Video Factory running on port ${PORT}`);
  console.log(`   POST /render  — trigger a video render`);
  console.log(`   GET  /status  — health check\n`);
});
