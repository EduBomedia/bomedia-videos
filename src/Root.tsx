// src/Root.tsx
import { Composition } from "remotion";
import { BomediaVideo, videoSchema } from "./BomediaVideo";

// 75 seconds at 30fps = 2250 frames
const FPS = 30;
const DURATION_SECS = 75;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BomediaVideo"
        component={BomediaVideo}
        durationInFrames={DURATION_SECS * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        schema={videoSchema}
        defaultProps={{
          titulo: "5 objetos que puedes personalizar con UV",
          guion_tts: "Con una impresora UV compacta puedes personalizar fundas de móvil, gadgets, regalos promocionales y mucho más. Bomedia te ofrece la gama artisJet, la solución perfecta para tiendas de personalización, kioscos e imprentas rápidas. Sin mínimos, sin serigrafía, con curado instantáneo. El negocio de personalización más rentable empieza con una sola máquina.",
          escenas: [
            { seg_inicio: 4,  seg_fin: 18, img_index: 0, texto_overlay: "Personalización en tienda" },
            { seg_inicio: 18, seg_fin: 35, img_index: 1, texto_overlay: "Sin mínimos · Full color" },
            { seg_inicio: 35, seg_fin: 55, img_index: 2, texto_overlay: "Catálogo desde una máquina" },
            { seg_inicio: 55, seg_fin: 68, img_index: 3, texto_overlay: "artisJet · artis 2100U" },
          ],
          imagenes: [
            "https://artisjet-printers.eu/wp-content/uploads/2020/10/Imagen-102.png",
            "https://rescate.artisjet-printers.eu/wp-content/uploads/2020/10/Imagen-1-1024x613.png",
            "https://rescate.artisjet-printers.eu/wp-content/uploads/2020/10/Imagen-9-1024x506.png",
            "https://artisjet-printers.eu/wp-content/uploads/2017/12/artis2100Uimg1.jpg",
          ],
          plantilla: "uv-compact",
          duracion_seg: DURATION_SECS,
          variacion: 1,
        }}
      />
    </>
  );
};
