// src/BomediaVideo.tsx
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

// ─── Schema (for type safety + Make integration) ────────────────────────────
export const escenaSchema = z.object({
  seg_inicio: z.number(),
  seg_fin: z.number(),
  img_index: z.number(),
  texto_overlay: z.string(),
});

export const videoSchema = z.object({
  titulo: z.string(),
  guion_tts: z.string(),
  escenas: z.array(escenaSchema),
  imagenes: z.array(z.string()),
  plantilla: z.string(),
  duracion_seg: z.number().default(75),
  variacion: z.number().min(1).max(3).default(1),
  audio_url: z.string().optional(),
});

type VideoProps = z.infer<typeof videoSchema>;

// ─── Brand palettes per plantilla ───────────────────────────────────────────
const PALETTES: Record<string, { accent: string; bg: string; light: string }> = {
  "uv-compact": { accent: "#0099CC", bg: "#F4FAFD", light: "#E6F6FF" },
  "uv-medium":  { accent: "#0077AA", bg: "#F4FAFD", light: "#DCF0FF" },
  "uv-large":   { accent: "#005588", bg: "#F2F7FA", light: "#D4EAF5" },
  "uv-cards":   { accent: "#0066BB", bg: "#F4F8FD", light: "#DDEEFF" },
  "uv-tech":    { accent: "#004499", bg: "#F3F5FC", light: "#D8E4FF" },
  "uv-niche":   { accent: "#0088CC", bg: "#F4FAFD", light: "#E0F4FF" },
  "laser-co2":  { accent: "#CC3399", bg: "#FDF4FA", light: "#FCEAF5" },
  "laser-flux": { accent: "#AA2288", bg: "#FDF3F9", light: "#F9E0F2" },
  "laser-fiber":{ accent: "#881166", bg: "#FCF2F7", light: "#F5D8EC" },
  "dtf":        { accent: "#CC6600", bg: "#FDF8F2", light: "#FCEBD8" },
  "comparativa":{ accent: "#AAAA00", bg: "#FAFAF2", light: "#F8F8DC" },
  "premium":    { accent: "#6633CC", bg: "#F8F4FE", light: "#EDE0FF" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const useSpring = (frame: number, delay = 0) =>
  spring({ frame: frame - delay, fps: 30, config: { damping: 18, stiffness: 80 } });

const fadeIn = (frame: number, start: number, duration = 15) =>
  interpolate(frame, [start, start + duration], [0, 1], { extrapolateRight: "clamp" });

// ─── Sub-components ─────────────────────────────────────────────────────────

// Top bar with logo + family badge
const TopBar = ({ accent, badge }: { accent: string; badge: string }) => (
  <AbsoluteFill style={{ bottom: "auto", height: 72 }}>
    <div style={{
      width: "100%", height: "100%", background: "white",
      borderBottom: "1px solid #e8e8e8",
      display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 48px",
    }}>
      <Img
        src={staticFile("logo-bomedia.png")}
        style={{ height: 32, objectFit: "contain" }}
      />
      <div style={{
        fontSize: 16, fontWeight: 700, color: accent,
        background: accent + "18", border: `1px solid ${accent}44`,
        padding: "4px 16px", borderRadius: 20, letterSpacing: 2,
      }}>
        {badge}
      </div>
    </div>
  </AbsoluteFill>
);

// Bottom accent stripe + progress
const BottomStripe = ({ accent, progress }: { accent: string; progress: number }) => (
  <AbsoluteFill style={{ top: "auto", height: 6 }}>
    <div style={{ width: "100%", height: 6, background: "#e8e8e8" }}>
      <div style={{ width: `${progress * 100}%`, height: 6, background: accent, transition: "width 0.3s" }} />
    </div>
  </AbsoluteFill>
);

// ── SCENE A: Intro ───────────────────────────────────────────────────────────
const SceneIntro = ({ titulo, accent, bg, light, frame }: {
  titulo: string; accent: string; bg: string; light: string; frame: number;
}) => {
  const titleSpring = useSpring(frame, 8);
  const lineSpring  = useSpring(frame, 18);
  const subFade     = fadeIn(frame, 22);

  return (
    <AbsoluteFill style={{
      background: bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      paddingTop: 72, paddingBottom: 6, gap: 0,
    }}>
      {/* Decorative top accent */}
      <div style={{
        width: 80, height: 4, background: accent, borderRadius: 2,
        marginBottom: 28,
        transform: `scaleX(${lineSpring})`, transformOrigin: "left",
      }} />
      <div style={{
        fontSize: 56, fontWeight: 800, color: "#1a1a1a",
        textAlign: "center", maxWidth: 1300, lineHeight: 1.2,
        padding: "0 80px",
        transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
        opacity: titleSpring,
      }}>
        {titulo}
      </div>
      <div style={{
        width: 60, height: 4, background: accent, borderRadius: 2,
        marginTop: 32, marginBottom: 24,
        transform: `scaleX(${lineSpring})`, transformOrigin: "right",
      }} />
      <div style={{
        fontSize: 24, color: "#999", letterSpacing: 4,
        fontWeight: 400, opacity: subFade,
      }}>
        bomedia.net
      </div>
    </AbsoluteFill>
  );
};

// ── SCENE B: Split (image left, text right) ──────────────────────────────────
const SceneSplit = ({ imgUrl, texto, sub, accent, bg, frame, reverse = false }: {
  imgUrl: string; texto: string; sub: string;
  accent: string; bg: string; frame: number; reverse?: boolean;
}) => {
  const sp = useSpring(frame, 0);
  const textFade = fadeIn(frame, 8);

  const imgSide = (
    <div style={{
      flex: 1.4, overflow: "hidden", position: "relative",
      transform: `translateX(${interpolate(sp, [0, 1], [reverse ? 60 : -60, 0])}px)`,
    }}>
      <Img src={imgUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{
        position: "absolute", inset: 0,
        background: reverse
          ? "linear-gradient(to left, rgba(0,0,0,0) 55%, rgba(244,250,253,0.95) 100%)"
          : "linear-gradient(to right, rgba(0,0,0,0) 55%, rgba(244,250,253,0.95) 100%)",
      }} />
    </div>
  );

  const textSide = (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      justifyContent: "center", padding: "0 60px", background: bg,
      opacity: textFade,
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: accent,
        letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>
        BOMEDIA
      </div>
      <div style={{ fontSize: 42, fontWeight: 800, color: "#1a1a1a",
        lineHeight: 1.25, marginBottom: 16 }}>
        {texto}
      </div>
      <div style={{ fontSize: 24, color: "#777", lineHeight: 1.6 }}>
        {sub}
      </div>
      <div style={{ width: 40, height: 4, background: accent,
        borderRadius: 2, marginTop: 32 }} />
    </div>
  );

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: reverse ? "row-reverse" : "row",
      paddingTop: 72, paddingBottom: 6, background: bg,
    }}>
      {reverse ? <>{textSide}{imgSide}</> : <>{imgSide}{textSide}</>}
    </AbsoluteFill>
  );
};

// ── SCENE C: Full image overlay (text bottom) ────────────────────────────────
const SceneOverlay = ({ imgUrl, texto, sub, accent, frame }: {
  imgUrl: string; texto: string; sub: string; accent: string; frame: number;
}) => {
  const sp = useSpring(frame, 0);
  const fade = fadeIn(frame, 0, 20);

  return (
    <AbsoluteFill style={{ background: "#111", paddingTop: 72, paddingBottom: 6 }}>
      <Img src={imgUrl} style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover",
        opacity: interpolate(fade, [0, 1], [0, 0.38]),
        transform: `scale(${interpolate(sp, [0, 1], [1.06, 1])})`,
      }} />
      {/* Gradient */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
        background: "linear-gradient(transparent, rgba(0,0,0,0.88))",
      }} />
      {/* Text content */}
      <div style={{
        position: "absolute", bottom: 56, left: 80, right: 80,
        opacity: fade,
        transform: `translateY(${interpolate(sp, [0, 1], [24, 0])}px)`,
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: accent,
          letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>
          BOMEDIA
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, color: "white",
          lineHeight: 1.2, maxWidth: 1100, marginBottom: 16 }}>
          {texto}
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.65)" }}>
          {sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── SCENE D: Closing ─────────────────────────────────────────────────────────
const SceneClose = ({ accent, bg, frame }: {
  accent: string; bg: string; frame: number;
}) => {
  const sp = useSpring(frame, 0);
  const fade = fadeIn(frame, 0, 20);

  return (
    <AbsoluteFill style={{
      background: "white", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      paddingTop: 72, paddingBottom: 6, gap: 0,
    }}>
      <div style={{
        opacity: fade,
        transform: `translateY(${interpolate(sp, [0, 1], [30, 0])}px)`,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <Img
          src={staticFile("logo-bomedia.png")}
          style={{ height: 56, objectFit: "contain", marginBottom: 40 }}
        />
        <div style={{ fontSize: 48, fontWeight: 800, color: "#1a1a1a",
          textAlign: "center", marginBottom: 16 }}>
          ¿Te interesa esta tecnología?
        </div>
        <div style={{ fontSize: 24, color: "#888", marginBottom: 40,
          letterSpacing: 1 }}>
          bomedia.net · info@bomedia.net
        </div>
        <div style={{
          background: accent, color: "white", fontSize: 22,
          fontWeight: 700, padding: "18px 48px", borderRadius: 8,
          letterSpacing: 1,
        }}>
          Contacta con Bomedia →
        </div>
        <div style={{ fontSize: 18, color: "#bbb", marginTop: 28 }}>
          Más de 20 años distribuyendo tecnología de impresión
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── LAYOUT VARIATIONS ───────────────────────────────────────────────────────
// Variation 1: Split L · Overlay · Split R · Close
// Variation 2: Overlay · Split L · Split R · Close
// Variation 3: Split R · Split L · Overlay · Close
// GPT-4o sends variacion: 1|2|3 — Remotion picks the layout automatically

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export const BomediaVideo = ({
  titulo, escenas, imagenes, plantilla, variacion = 1, audio_url,
}: VideoProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const palette = PALETTES[plantilla] ?? PALETTES["uv-compact"];
  const { accent, bg } = palette;

  const progress = frame / durationInFrames;
  const introEndFrame = 4 * fps; // 0–4s

  // Badge label from plantilla
  const badgeMap: Record<string, string> = {
    "uv-compact": "UV LED", "uv-medium": "UV LED", "uv-large": "UV LED",
    "uv-cards": "TARJETAS", "uv-tech": "UV TECH", "uv-niche": "UV APPS",
    "laser-co2": "LÁSER CO2", "laser-flux": "LÁSER FLUX", "laser-fiber": "FIBRA",
    "dtf": "DTF TEXTIL", "comparativa": "COMPARATIVA", "premium": "PREMIUM GIFT",
  };
  const badge = badgeMap[plantilla] ?? "BOMEDIA";

  // Find which scene is active now
  const currentSec = frame / fps;

  // Determine scene order based on variation
  const sceneOrder: Array<"split" | "overlay" | "split-r"> =
    variacion === 1 ? ["split", "overlay", "split-r"] :
    variacion === 2 ? ["overlay", "split", "split-r"] :
                     ["split-r", "split", "overlay"];

  // Build scene config: each escena gets a layout from sceneOrder
  const sceneLayouts = escenas.map((e, i) => ({
    ...e,
    layout: sceneOrder[i % sceneOrder.length],
  }));

  // Closing scene
  const lastEscena = escenas[escenas.length - 1];
  const closeStartSec = lastEscena ? lastEscena.seg_fin : 60;

  // Render active scene
  const renderScene = () => {
    // Intro
    if (currentSec < introEndFrame / fps) {
      return (
        <SceneIntro
          titulo={titulo} accent={accent} bg={bg} light={palette.light}
          frame={frame}
        />
      );
    }

    // Close
    if (currentSec >= closeStartSec) {
      return (
        <SceneClose
          accent={accent} bg={bg}
          frame={frame - Math.floor(closeStartSec * fps)}
        />
      );
    }

    // Content scenes
    for (const sc of sceneLayouts) {
      if (currentSec >= sc.seg_inicio && currentSec < sc.seg_fin) {
        const localFrame = frame - Math.floor(sc.seg_inicio * fps);
        const imgUrl = imagenes[sc.img_index] ?? imagenes[0];
        const parts = sc.texto_overlay.split("·").map((s) => s.trim());
        const texto = parts[0] ?? sc.texto_overlay;
        const sub = parts[1] ?? "";

        if (sc.layout === "overlay") {
          return (
            <SceneOverlay
              imgUrl={imgUrl} texto={texto} sub={sub}
              accent={accent} frame={localFrame}
            />
          );
        }
        if (sc.layout === "split-r") {
          return (
            <SceneSplit
              imgUrl={imgUrl} texto={texto} sub={sub}
              accent={accent} bg={bg} frame={localFrame} reverse={true}
            />
          );
        }
        return (
          <SceneSplit
            imgUrl={imgUrl} texto={texto} sub={sub}
            accent={accent} bg={bg} frame={localFrame}
          />
        );
      }
    }

    // Fallback
    return <AbsoluteFill style={{ background: bg }} />;
  };

  return (
    <AbsoluteFill style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      {renderScene()}
      <TopBar accent={accent} badge={badge} />
      <BottomStripe accent={accent} progress={progress} />
      {audio_url && <Audio src={audio_url} />}
    </AbsoluteFill>
  );
};
