// server.js v4 — Bomedia Video Factory
const express  = require("express");
const { execSync } = require("child_process");
const https    = require("https");
const fs       = require("fs");
const path     = require("path");
const os       = require("os");

const app        = express();
const PORT       = process.env.PORT || 3001;
const SECRET     = process.env.WEBHOOK_SECRET || "bomedia2024";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const BASE_URL   = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : `http://localhost:${PORT}`;

const VIDEOS_DIR = path.join(__dirname, "public_videos");
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

app.use(express.json({ limit: "10mb" }));
app.use("/videos", express.static(VIDEOS_DIR));

app.get("/",       (req, res) => res.json({ status: "ok", version: "4.0.0" }));
app.get("/status", (req, res) => res.json({ status: "ready", uptime: process.uptime() }));

// Parsea escenas en cualquier formato que llegue desde Make
function parseEscenas(escenas) {
  if (Array.isArray(escenas)) return escenas;
  if (typeof escenas === "string") {
    const s = escenas.trim();
    // Intentar JSON directo
    try { return JSON.parse(s); } catch (_) {}
    // Intentar añadiendo corchetes (Make manda objetos sin array wrapper)
    try { return JSON.parse(`[${s}]`); } catch (_) {}
    // Fallback: escenas vacías, el vídeo renderizará solo con imágenes
    console.warn("   ⚠️ No se pudieron parsear escenas, usando fallback");
    return [];
  }
  return [];
}

// Parsea imagenes: string separado por | o array
function parseImagenes(imagenes) {
  if (Array.isArray(imagenes)) return imagenes;
  if (typeof imagenes === "string") {
    return imagenes.split("|").map(u => u.trim()).filter(Boolean);
  }
  return [];
}

// OpenAI TTS
function generateAudio(text, destPath) {
  return new Promise((resolve, reject) => {
    if (!OPENAI_KEY) return resolve(null);
    const body = JSON.stringify({
      model: "tts-1", voice: "nova",
      input: text.substring(0, 4096), response_format: "mp3"
    });
    const req = https.request({
      hostname: "api.openai.com", path: "/v1/audio/speech", method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        let err = ""; res.on("data", d => err += d);
        res.on("end", () => reject(new Error(`TTS ${res.statusCode}: ${err.substring(0,200)}`)));
        return;
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(destPath); });
    });
    req.on("error", reject);
    req.write(body); req.end();
  });
}

app.post("/render", async (req, res) => {
  if (req.headers["x-webhook-secret"] !== SECRET)
    return res.status(401).json({ error: "Unauthorized" });

  const {
    titulo, guion_tts, escenas, imagenes,
    plantilla = "uv-compact", duracion_seg = 75, variacion = 1,
    idea_id = "video",
  } = req.body;

  if (!titulo) return res.status(400).json({ error: "Missing: titulo" });

  console.log(`\n📹 ${idea_id} — "${titulo}"`);

  const safeId    = idea_id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const outFile   = path.join(VIDEOS_DIR, `${safeId}.mp4`);
  const propsFile = path.join(os.tmpdir(), `${safeId}-props.json`);
  const audioFile = path.join(os.tmpdir(), `${safeId}-audio.mp3`);

  try {
    // Audio
    let resolvedAudio = undefined;
    if (guion_tts && OPENAI_KEY) {
      console.log("   🎵 Generando audio...");
      try {
        await generateAudio(guion_tts, audioFile);
        resolvedAudio = audioFile;
        console.log("   🎵 Audio OK");
      } catch (e) {
        console.warn("   ⚠️ Audio falló:", e.message);
      }
    }

    const escenasArr  = parseEscenas(escenas);
    const imagenesArr = parseImagenes(imagenes);

    console.log(`   📸 ${imagenesArr.length} imágenes | 🎬 ${escenasArr.length} escenas`);

    const props = {
      titulo,
      guion_tts:    guion_tts || "",
      escenas:      escenasArr,
      imagenes:     imagenesArr,
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
    try { fs.unlinkSync(audioFile); } catch (_) {}

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
  console.log(`\n🚀 Bomedia Video Factory v4 — puerto ${PORT}`);
  console.log(`   OPENAI TTS: ${OPENAI_KEY ? "✅" : "⚠️ sin key"}`);
  console.log(`   BASE_URL: ${BASE_URL}\n`);
});
