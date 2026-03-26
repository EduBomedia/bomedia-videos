// server.js v12 — escenas en formato pipe, voz onyx
const express  = require("express");
const https    = require("https");
const fs       = require("fs");
const path     = require("path");

const app        = express();
const PORT       = process.env.PORT || 3001;
const SECRET     = process.env.WEBHOOK_SECRET || "bomedia2024";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const BASE_URL   = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : `http://localhost:${PORT}`;

const AWS_REGION         = process.env.AWS_REGION || "eu-west-1";
const LAMBDA_FUNCTION    = process.env.REMOTION_LAMBDA_FUNCTION || "";
const REMOTION_SERVE_URL = process.env.REMOTION_SERVE_URL || "";

const AUDIO_DIR = path.join(__dirname, "public_audio");
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

app.use(express.json({ limit: "10mb" }));
app.use("/audio", express.static(AUDIO_DIR));

app.get("/", (req, res) => res.json({
  status: "ok", version: "12.0.0",
  lambda: LAMBDA_FUNCTION ? "✅ " + LAMBDA_FUNCTION : "⚠️ not configured",
  region: AWS_REGION
}));
app.get("/status", (req, res) => res.json({ status: "ready", uptime: process.uptime() }));

// Parsea escenas en formato pipe: "3|18|0|Texto escena|18|33|1|Otro texto|..."
// Cada escena = seg_inicio|seg_fin|img_index|texto_overlay
function parseEscenasPipe(escenasStr, numImagenes, duracionSeg) {
  if (typeof escenasStr === "string" && escenasStr.includes("|")) {
    try {
      const parts = escenasStr.split("|");
      const escenas = [];
      for (let i = 0; i + 3 < parts.length; i += 4) {
        escenas.push({
          seg_inicio:    Number(parts[i].trim()),
          seg_fin:       Number(parts[i+1].trim()),
          img_index:     Number(parts[i+2].trim()),
          texto_overlay: parts[i+3].trim()
        });
      }
      if (escenas.length > 0) {
        console.log(`   🎬 ${escenas.length} escenas desde pipe format`);
        return escenas;
      }
    } catch (e) {
      console.warn("   ⚠️ Error parseando escenas pipe:", e.message);
    }
  }

  // Fallback auto-generar
  console.log("   ℹ️ Escenas auto-generadas");
  const introEnd   = 3;
  const closeStart = duracionSeg - 5;
  const contentDur = closeStart - introEnd;
  const numScenes  = Math.min(numImagenes, 4);
  const sceneDur   = Math.floor(contentDur / numScenes);
  return Array.from({ length: numScenes }, (_, i) => ({
    seg_inicio:    introEnd + i * sceneDur,
    seg_fin:       introEnd + (i + 1) * sceneDur,
    img_index:     i % numImagenes,
    texto_overlay: ""
  }));
}

function parseImagenes(imagenes) {
  if (Array.isArray(imagenes)) return imagenes;
  if (typeof imagenes === "string")
    return imagenes.split("|").map(u => u.trim()).filter(u => u.startsWith("http"));
  return [];
}

function generateAudio(text, destPath) {
  return new Promise((resolve, reject) => {
    if (!OPENAI_KEY) return resolve(null);
    const body = JSON.stringify({
      model: "tts-1-hd",
      voice: "onyx",
      input: text.substring(0, 4096),
      response_format: "mp3",
      speed: 0.95
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

async function renderWithLambda(props, composition) {
  const { renderMediaOnLambda, getRenderProgress } = require("@remotion/lambda/client");
  const result = await renderMediaOnLambda({
    region: AWS_REGION,
    functionName: LAMBDA_FUNCTION,
    serveUrl: REMOTION_SERVE_URL,
    composition,
    inputProps: props,
    codec: "h264",
    imageFormat: "jpeg",
    maxRetries: 3,
    privacy: "public",
    downloadBehavior: { type: "play-in-browser" },
    concurrencyPerLambda: 1,
    framesPerLambda: 20,
  });

  while (true) {
    const progress = await getRenderProgress({
      bucketName: result.bucketName,
      region: AWS_REGION,
      functionName: LAMBDA_FUNCTION,
      renderId: result.renderId,
    });
    if (progress.done) return progress.outputFile;
    if (progress.fatalErrorEncountered)
      throw new Error(progress.errors[0]?.message || "Lambda render failed");
    console.log(`   ⏳ ${Math.round(progress.overallProgress * 100)}%`);
    await new Promise(r => setTimeout(r, 3000));
  }
}

app.post("/render", async (req, res) => {
  if (req.headers["x-webhook-secret"] !== SECRET)
    return res.status(401).json({ error: "Unauthorized" });

  const {
    titulo, guion_tts, imagenes, escenas_pipe,
    plantilla    = "uv-compact",
    duracion_seg = 30,
    variacion    = 1,
    formato      = "horizontal",
    idea_id      = "video",
  } = req.body;

  if (!titulo) return res.status(400).json({ error: "Missing: titulo" });
  if (!LAMBDA_FUNCTION || !REMOTION_SERVE_URL)
    return res.status(500).json({ error: "Lambda not configured" });

  const isVertical  = formato === "vertical";
  const composition = isVertical ? "BomediaShort" : "BomediaVideo";
  const durSeg      = Math.min(Number(duracion_seg) || 30, isVertical ? 60 : 90);

  console.log(`\n📹 ${idea_id} — "${titulo}" [${isVertical ? "9:16" : "16:9"}] ${durSeg}s`);

  const safeId    = idea_id.replace(/[^a-zA-Z0-9_-]/g, "_");
  const audioFile = path.join(AUDIO_DIR, `${safeId}-audio.mp3`);

  try {
    let audioUrl = undefined;
    if (guion_tts && OPENAI_KEY) {
      console.log("   🎵 Generando audio (onyx)...");
      try {
        await generateAudio(guion_tts, audioFile);
        audioUrl = `${BASE_URL}/audio/${safeId}-audio.mp3`;
        console.log("   🎵 Audio OK");
      } catch (e) {
        console.warn("   ⚠️ Audio falló:", e.message);
      }
    }

    const imagenesArr = parseImagenes(imagenes);
    const escenasArr  = parseEscenasPipe(escenas_pipe, imagenesArr.length, durSeg);
    console.log(`   📸 ${imagenesArr.length} imágenes | 🎬 ${escenasArr.length} escenas`);

    const props = {
      titulo,
      guion_tts:    guion_tts || "",
      escenas:      escenasArr,
      imagenes:     imagenesArr,
      plantilla,
      duracion_seg: durSeg,
      variacion:    Number(variacion) || 1,
      audio_url:    audioUrl,
      formato:      isVertical ? "vertical" : "horizontal",
    };

    console.log(`   🚀 Lambda (${composition})...`);
    const videoUrl = await renderWithLambda(props, composition);

    try { fs.unlinkSync(audioFile); } catch (_) {}

    console.log(`   ✅ ${videoUrl}`);
    res.json({ ok: true, idea_id, titulo, video_url: videoUrl });

  } catch (err) {
    try { fs.unlinkSync(audioFile); } catch (_) {}
    console.error("   ❌", err.message);
    res.status(500).json({ error: "Render failed", detail: err.message, idea_id });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Bomedia Video Factory v12`);
  console.log(`   Voz: onyx | Escenas: pipe format`);
  console.log(`   Lambda: ${LAMBDA_FUNCTION || "⚠️ not set"}`);
  console.log(`   BASE_URL: ${BASE_URL}\n`);
});
