// server.js v2 — Bomedia Video Factory
const express = require("express");
const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");
const os   = require("os");

const app    = express();
const PORT   = process.env.PORT || 3001;
const SECRET = process.env.WEBHOOK_SECRET || "bomedia2024";
const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : `http://localhost:${PORT}`;

const VIDEOS_DIR = path.join(__dirname, "public_videos");
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

app.use(express.json({ limit: "50mb" }));
app.use("/videos", express.static(VIDEOS_DIR));

app.get("/", (req, res) => res.json({ status: "ok", version: "2.0.0" }));
app.get("/status", (req, res) => res.json({ status: "ready", uptime: process.uptime() }));

app.post("/render", async (req, res) => {
  if (req.headers["x-webhook-secret"] !== SECRET)
    return res.status(401).json({ error: "Unauthorized" });

  const {
    titulo, guion_tts, escenas, imagenes,
    plantilla = "uv-compact", duracion_seg = 75, variacion = 1,
    audio_url, audio_data, idea_id = "video",
  } = req.body;

  if (!titulo || !escenas || !imagenes)
    return res.status(400).json({ error: "Missing: titulo, escenas, imagenes" });

  console.log(`\n📹 ${idea_id} — "${titulo}"`);

  const safeId    = idea_id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const outFile   = path.join(VIDEOS_DIR, `${safeId}.mp4`);
  const propsFile = path.join(os.tmpdir(), `${safeId}-props.json`);
  const audioFile = path.join(os.tmpdir(), `${safeId}-audio.mp3`);

  try {
    let resolvedAudio = audio_url || undefined;
    if (audio_data) {
      fs.writeFileSync(audioFile, Buffer.from(audio_data, "base64"));
      resolvedAudio = audioFile;
      console.log("   🎵 Audio base64 OK");
    }

    const props = {
      titulo,
      guion_tts: guion_tts || "",
      escenas:   typeof escenas  === "string" ? JSON.parse(escenas)  : escenas,
      imagenes:  typeof imagenes === "string" ? JSON.parse(imagenes) : imagenes,
      plantilla,
      duracion_seg: Number(duracion_seg),
      variacion:    Number(variacion),
      audio_url:    resolvedAudio,
    };

    fs.writeFileSync(propsFile, JSON.stringify(props));

    const frames = Number(duracion_seg) * 30;
    console.log(`   🎬 Renderizando ${frames} frames...`);

    execSync(
      `npx remotion render BomediaVideo "${outFile}" --props="${propsFile}" --frames=0-${frames-1} --log=warn --overwrite`,
      { cwd: __dirname, stdio: "pipe", timeout: 300000 }
    );

    try { fs.unlinkSync(propsFile); } catch (_) {}
    try { if (audio_data) fs.unlinkSync(audioFile); } catch (_) {}

    const video_url = `${BASE_URL}/videos/${safeId}.mp4`;
    const file_size = fs.statSync(outFile).size;
    console.log(`   ✅ ${video_url} (${Math.round(file_size/1024/1024)}MB)`);

    res.json({ ok: true, idea_id, titulo, video_url, file_size });

  } catch (err) {
    try { fs.unlinkSync(propsFile); } catch (_) {}
    try { fs.unlinkSync(audioFile); } catch (_) {}
    console.error("   ❌", err.message);
    res.status(500).json({ error: "Render failed", detail: err.message, idea_id });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Bomedia Video Factory v2 — puerto ${PORT}`);
  console.log(`   BASE_URL: ${BASE_URL}\n`);
});
