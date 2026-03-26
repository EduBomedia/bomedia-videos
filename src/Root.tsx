// src/Root.tsx
import { Composition } from "remotion";
import { BomediaVideo, videoSchema } from "./BomediaVideo";

const FPS = 30;

export const RemotionRoot = () => {
  return (
    <>
      {/* Horizontal 16:9 — YouTube / web */}
      <Composition
        id="BomediaVideo"
        component={BomediaVideo}
        durationInFrames={75 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        schema={videoSchema}
        defaultProps={{
          titulo: "5 objetos que puedes personalizar con UV",
          guion_tts: "Con una impresora UV compacta puedes personalizar fundas, gadgets y regalos. Bomedia te ofrece la gama artisJet para tiendas de personalización.",
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
          duracion_seg: 75,
          variacion: 1,
          formato: "horizontal",
        }}
      />

      {/* Vertical 9:16 — Reels / Shorts */}
      <Composition
        id="BomediaShort"
        component={BomediaVideo}
        durationInFrames={45 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        schema={videoSchema}
        defaultProps={{
          titulo: "Personaliza objetos en segundos",
          guion_tts: "¿Sabías que puedes imprimir sobre cualquier objeto al instante? Con las impresoras UV de Bomedia, personaliza fundas, regalos y mucho más. Sin mínimos. Sin esperas.",
          escenas: [
            { seg_inicio: 3,  seg_fin: 15, img_index: 0, texto_overlay: "Imprime sobre todo" },
            { seg_inicio: 15, seg_fin: 28, img_index: 1, texto_overlay: "Sin mínimos" },
            { seg_inicio: 28, seg_fin: 40, img_index: 2, texto_overlay: "Resultados al instante" },
          ],
          imagenes: [
            "https://artisjet-printers.eu/wp-content/uploads/2020/10/Imagen-102.png",
            "https://rescate.artisjet-printers.eu/wp-content/uploads/2020/10/Imagen-1-1024x613.png",
            "https://rescate.artisjet-printers.eu/wp-content/uploads/2020/10/Imagen-9-1024x506.png",
          ],
          plantilla: "uv-compact",
          duracion_seg: 45,
          variacion: 1,
          formato: "vertical",
        }}
      />
    </>
  );
};
