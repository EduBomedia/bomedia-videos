// src/BomediaVideo.tsx v2 — Horizontal + Vertical (Shorts/Reels)
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

export const escenaSchema = z.object({
  seg_inicio:     z.number(),
  seg_fin:        z.number(),
  img_index:      z.number(),
  texto_overlay:  z.string(),
});

export const videoSchema = z.object({
  titulo:       z.string(),
  guion_tts:    z.string(),
  escenas:      z.array(escenaSchema),
  imagenes:     z.array(z.string()),
  plantilla:    z.string(),
  duracion_seg: z.number().default(45),
  variacion:    z.number().min(1).max(3).default(1),
  audio_url:    z.string().optional(),
  formato:      z.enum(["horizontal", "vertical"]).default("vertical"),
});

type VideoProps = z.infer<typeof videoSchema>;

const PALETTES: Record<string, { accent: string; bg: string }> = {
  "uv-compact":  { accent: "#0099CC", bg: "#F4FAFD" },
  "uv-medium":   { accent: "#0077AA", bg: "#F4FAFD" },
  "uv-large":    { accent: "#005588", bg: "#F2F7FA" },
  "uv-cards":    { accent: "#0066BB", bg: "#F4F8FD" },
  "uv-tech":     { accent: "#004499", bg: "#F3F5FC" },
  "uv-niche":    { accent: "#0088CC", bg: "#F4FAFD" },
  "laser-co2":   { accent: "#CC3399", bg: "#FDF4FA" },
  "laser-flux":  { accent: "#AA2288", bg: "#FDF3F9" },
  "laser-fiber": { accent: "#881166", bg: "#FCF2F7" },
  "dtf":         { accent: "#CC6600", bg: "#FDF8F2" },
  "comparativa": { accent: "#AAAA00", bg: "#FAFAF2" },
  "premium":     { accent: "#6633CC", bg: "#F8F4FE" },
};

const BADGE: Record<string, string> = {
  "uv-compact": "UV LED", "uv-medium": "UV LED", "uv-large": "UV LED",
  "uv-cards": "TARJETAS", "uv-tech": "UV TECH", "uv-niche": "UV APPS",
  "laser-co2": "LÁSER CO2", "laser-flux": "LÁSER FLUX", "laser-fiber": "FIBRA",
  "dtf": "DTF TEXTIL", "comparativa": "COMPARATIVA", "premium": "PREMIUM",
};

// ── Shared scene components ──────────────────────────────────────────────────

const TopBar = ({ accent, badge, isVertical }: { accent: string; badge: string; isVertical: boolean }) => (
  <AbsoluteFill style={{ bottom: "auto", height: isVertical ? 90 : 72 }}>
    <div style={{
      width: "100%", height: "100%", background: "white",
      borderBottom: "1px solid #e8e8e8",
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: isVertical ? "0 40px" : "0 48px",
    }}>
      <Img
        src={staticFile("logo-bomedia.png")}
        style={{ height: isVertical ? 36 : 32, objectFit: "contain" }}
      />
      <div style={{
        fontSize: isVertical ? 20 : 16, fontWeight: 700, color: accent,
        background: accent + "18", border: `1px solid ${accent}44`,
        padding: isVertical ? "6px 20px" : "4px 16px",
        borderRadius: 20, letterSpacing: 2,
      }}>
        {badge}
      </div>
    </div>
  </AbsoluteFill>
);

const BottomStripe = ({ accent, progress }: { accent: string; progress: number }) => (
  <AbsoluteFill style={{ top: "auto", height: 6 }}>
    <div style={{ width: "100%", height: 6, background: "#e8e8e8" }}>
      <div style={{ width: `${progress * 100}%`, height: 6, background: accent }} />
    </div>
  </AbsoluteFill>
);

// ── VERTICAL scenes (9:16) ───────────────────────────────────────────────────

const VerticalSceneIntro = ({ titulo, accent, bg, frame }: {
  titulo: string; accent: string; bg: string; frame: number;
}) => {
  const sp = spring({ frame, fps: 30, config: { damping: 18, stiffness: 80 } });
  return (
    <AbsoluteFill style={{
      background: bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      paddingTop: 90, paddingBottom: 6, padding: "90px 60px 6px",
    }}>
      <div style={{
        width: 60, height: 5, background: accent, borderRadius: 3,
        marginBottom: 40,
        transform: `scaleX(${spring({ frame: frame - 5, fps: 30, config: { damping: 18 } })})`,
        transformOrigin: "left",
      }} />
      <div style={{
        fontSize: 72, fontWeight: 800, color: "#1a1a1a",
        textAlign: "center", lineHeight: 1.15,
        opacity: sp,
        transform: `translateY(${interpolate(sp, [0,1], [40,0])}px)`,
      }}>
        {titulo}
      </div>
      <div style={{
        width: 60, height: 5, background: accent, borderRadius: 3,
        marginTop: 40,
        transform: `scaleX(${spring({ frame: frame - 10, fps: 30, config: { damping: 18 } })})`,
        transformOrigin: "right",
      }} />
      <div style={{
        fontSize: 30, color: "#999", letterSpacing: 4, marginTop: 30,
        opacity: interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        bomedia.net
      </div>
    </AbsoluteFill>
  );
};

const VerticalSceneContent = ({ imgUrl, texto, accent, bg, frame, reverse }: {
  imgUrl: string; texto: string; accent: string; bg: string; frame: number; reverse?: boolean;
}) => {
  const sp = spring({ frame, fps: 30, config: { damping: 18, stiffness: 80 } });
  const fade = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{
      background: bg,
      display: "flex", flexDirection: "column",
      paddingTop: 90, paddingBottom: 6,
    }}>
      {/* Image takes 60% of vertical space */}
      <div style={{
        flex: "0 0 60%", overflow: "hidden", position: "relative",
        transform: `scale(${interpolate(sp, [0,1], [1.05,1])})`,
      }}>
        <Img src={imgUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 50%, rgba(244,250,253,0.95) 100%)",
        }} />
      </div>
      {/* Text takes 40% */}
      <div style={{
        flex: "0 0 40%", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "0 60px",
        opacity: fade,
      }}>
        <div style={{
          fontSize: 20, fontWeight: 700, color: accent,
          letterSpacing: 3, textTransform: "uppercase" as const, marginBottom: 20,
        }}>
          BOMEDIA
        </div>
        <div style={{
          fontSize: 56, fontWeight: 800, color: "#1a1a1a",
          lineHeight: 1.2, marginBottom: 16,
        }}>
          {texto}
        </div>
        <div style={{ width: 50, height: 5, background: accent, borderRadius: 3 }} />
      </div>
    </AbsoluteFill>
  );
};

const VerticalSceneClose = ({ accent, frame }: { accent: string; frame: number }) => {
  const sp = spring({ frame, fps: 30, config: { damping: 18, stiffness: 80 } });
  const fade = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{
      background: "white", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      paddingTop: 90, gap: 0,
    }}>
      <div style={{ opacity: fade, transform: `translateY(${interpolate(sp,[0,1],[30,0])}px)`,
        display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Img src={staticFile("logo-bomedia.png")}
          style={{ height: 70, objectFit: "contain", marginBottom: 50 }} />
        <div style={{ fontSize: 60, fontWeight: 800, color: "#1a1a1a",
          textAlign: "center", marginBottom: 20, padding: "0 60px", lineHeight: 1.2 }}>
          ¿Te interesa esta tecnología?
        </div>
        <div style={{ fontSize: 34, color: "#888", marginBottom: 50, letterSpacing: 1 }}>
          bomedia.net
        </div>
        <div style={{ background: accent, color: "white", fontSize: 30,
          fontWeight: 700, padding: "24px 60px", borderRadius: 12, letterSpacing: 1 }}>
          Contacta con Bomedia →
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── HORIZONTAL scenes (16:9) — same as before but kept compact ───────────────

const HSceneIntro = ({ titulo, accent, bg, frame }: any) => {
  const sp = spring({ frame, fps: 30, config: { damping: 18, stiffness: 80 } });
  return (
    <AbsoluteFill style={{ background: bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", paddingTop: 72, paddingBottom: 6 }}>
      <div style={{ width: 40, height: 4, background: accent, borderRadius: 2, marginBottom: 28,
        transform: `scaleX(${spring({ frame: frame-5, fps:30, config:{damping:18} })})`, transformOrigin:"left" }} />
      <div style={{ fontSize: 56, fontWeight: 800, color: "#1a1a1a", textAlign: "center",
        maxWidth: 1300, lineHeight: 1.2, padding: "0 80px", opacity: sp,
        transform: `translateY(${interpolate(sp,[0,1],[40,0])}px)` }}>
        {titulo}
      </div>
      <div style={{ width: 40, height: 4, background: accent, borderRadius: 2, marginTop: 32, marginBottom: 24,
        transform: `scaleX(${spring({ frame: frame-10, fps:30, config:{damping:18} })})`, transformOrigin:"right" }} />
      <div style={{ fontSize: 24, color: "#999", letterSpacing: 4,
        opacity: interpolate(frame,[22,37],[0,1],{extrapolateRight:"clamp"}) }}>
        bomedia.net
      </div>
    </AbsoluteFill>
  );
};

const HSceneContent = ({ imgUrl, texto, accent, bg, frame, reverse }: any) => {
  const sp = spring({ frame, fps: 30, config: { damping: 18, stiffness: 80 } });
  const fade = interpolate(frame, [0,15],[0,1],{extrapolateRight:"clamp"});
  const imgSide = (
    <div style={{ flex: 1.4, overflow:"hidden", position:"relative",
      transform:`translateX(${interpolate(sp,[0,1],[reverse?60:-60,0])}px)` }}>
      <Img src={imgUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} />
      <div style={{ position:"absolute", inset:0,
        background: reverse
          ? "linear-gradient(to left,rgba(0,0,0,0) 55%,rgba(244,250,253,0.95) 100%)"
          : "linear-gradient(to right,rgba(0,0,0,0) 55%,rgba(244,250,253,0.95) 100%)" }} />
    </div>
  );
  const textSide = (
    <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center",
      padding:"0 60px", background:bg, opacity:fade }}>
      <div style={{ fontSize:18, fontWeight:700, color:accent, letterSpacing:3,
        textTransform:"uppercase" as const, marginBottom:20 }}>BOMEDIA</div>
      <div style={{ fontSize:42, fontWeight:800, color:"#1a1a1a", lineHeight:1.25, marginBottom:16 }}>{texto}</div>
      <div style={{ width:40, height:4, background:accent, borderRadius:2, marginTop:24 }} />
    </div>
  );
  return (
    <AbsoluteFill style={{ display:"flex", flexDirection:reverse?"row-reverse":"row",
      paddingTop:72, paddingBottom:6, background:bg }}>
      {reverse ? <>{textSide}{imgSide}</> : <>{imgSide}{textSide}</>}
    </AbsoluteFill>
  );
};

const HSceneClose = ({ accent, frame }: any) => {
  const sp = spring({ frame, fps:30, config:{damping:18,stiffness:80} });
  const fade = interpolate(frame,[0,20],[0,1],{extrapolateRight:"clamp"});
  return (
    <AbsoluteFill style={{ background:"white", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", paddingTop:72, paddingBottom:6 }}>
      <div style={{ opacity:fade, transform:`translateY(${interpolate(sp,[0,1],[30,0])}px)`,
        display:"flex", flexDirection:"column", alignItems:"center" }}>
        <Img src={staticFile("logo-bomedia.png")} style={{height:56,objectFit:"contain",marginBottom:40}} />
        <div style={{fontSize:48,fontWeight:800,color:"#1a1a1a",textAlign:"center",marginBottom:16}}>
          ¿Te interesa esta tecnología?
        </div>
        <div style={{fontSize:24,color:"#888",marginBottom:40,letterSpacing:1}}>bomedia.net · info@bomedia.net</div>
        <div style={{background:accent,color:"white",fontSize:22,fontWeight:700,padding:"18px 48px",borderRadius:8}}>
          Contacta con Bomedia →
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export const BomediaVideo = ({
  titulo, escenas, imagenes, plantilla, variacion = 1, audio_url, formato = "vertical",
}: VideoProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const palette = PALETTES[plantilla] ?? PALETTES["uv-compact"];
  const { accent, bg } = palette;
  const badge = BADGE[plantilla] ?? "BOMEDIA";
  const isVertical = formato === "vertical";
  const progress = frame / durationInFrames;

  const currentSec = frame / fps;
  const topBarH = isVertical ? 90 : 72;

  const sceneOrder: Array<"content" | "content-r" | "overlay"> =
    variacion === 1 ? ["content", "overlay", "content-r"] :
    variacion === 2 ? ["overlay", "content", "content-r"] :
                     ["content-r", "content", "overlay"];

  const sceneLayouts = escenas.map((e, i) => ({
    ...e, layout: sceneOrder[i % sceneOrder.length],
  }));

  const lastEscena = escenas[escenas.length - 1];
  const closeStartSec = lastEscena ? lastEscena.seg_fin : durationInFrames / fps - 7;
  const introEndSec = 4;

  const renderScene = () => {
    if (currentSec < introEndSec) {
      const f = frame;
      return isVertical
        ? <VerticalSceneIntro titulo={titulo} accent={accent} bg={bg} frame={f} />
        : <HSceneIntro titulo={titulo} accent={accent} bg={bg} frame={f} />;
    }

    if (currentSec >= closeStartSec) {
      const f = frame - Math.floor(closeStartSec * fps);
      return isVertical
        ? <VerticalSceneClose accent={accent} frame={f} />
        : <HSceneClose accent={accent} frame={f} />;
    }

    for (const sc of sceneLayouts) {
      if (currentSec >= sc.seg_inicio && currentSec < sc.seg_fin) {
        const f = frame - Math.floor(sc.seg_inicio * fps);
        const imgUrl = imagenes[sc.img_index] ?? imagenes[0] ?? "";
        const texto = sc.texto_overlay || titulo;
        const reverse = sc.layout === "content-r";

        return isVertical
          ? <VerticalSceneContent imgUrl={imgUrl} texto={texto} accent={accent} bg={bg} frame={f} reverse={reverse} />
          : <HSceneContent imgUrl={imgUrl} texto={texto} accent={accent} bg={bg} frame={f} reverse={reverse} />;
      }
    }
    return <AbsoluteFill style={{ background: bg }} />;
  };

  return (
    <AbsoluteFill style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      {renderScene()}
      <TopBar accent={accent} badge={badge} isVertical={isVertical} />
      <BottomStripe accent={accent} progress={progress} />
      {audio_url && <Audio src={audio_url} />}
    </AbsoluteFill>
  );
};
