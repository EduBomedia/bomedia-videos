# Bomedia Video Factory

Sistema automático de generación de vídeos con Remotion + Make.com + OpenAI.

## Stack
- **Remotion** — renderiza vídeos MP4 desde React
- **Express** — servidor webhook que recibe llamadas de Make
- **Railway** — cloud hosting del servidor
- **Make.com** — orquesta el flujo completo

## Variables de entorno (configurar en Railway)
```
WEBHOOK_SECRET=tu_clave_secreta_aqui
PORT=3001
```

## Endpoint principal
```
POST /render
Headers: x-webhook-secret: tu_clave_secreta_aqui
Body: {
  "idea_id": "G01-01",
  "titulo": "5 objetos que puedes personalizar con UV",
  "guion_tts": "Con una impresora UV compacta...",
  "escenas": [
    { "seg_inicio": 4, "seg_fin": 18, "img_index": 0, "texto_overlay": "Personalización en tienda" },
    { "seg_inicio": 18, "seg_fin": 35, "img_index": 1, "texto_overlay": "Sin mínimos · Full color" },
    { "seg_inicio": 35, "seg_fin": 55, "img_index": 2, "texto_overlay": "Catálogo desde una máquina" },
    { "seg_inicio": 55, "seg_fin": 68, "img_index": 3, "texto_overlay": "artisJet · artis 2100U" }
  ],
  "imagenes": [
    "https://artisjet-printers.eu/wp-content/uploads/2020/10/Imagen-102.png",
    "https://rescate.artisjet-printers.eu/wp-content/uploads/2020/10/Imagen-1-1024x613.png",
    "https://rescate.artisjet-printers.eu/wp-content/uploads/2020/10/Imagen-9-1024x506.png",
    "https://artisjet-printers.eu/wp-content/uploads/2017/12/artis2100Uimg1.jpg"
  ],
  "plantilla": "uv-compact",
  "duracion_seg": 75,
  "variacion": 1,
  "audio_url": "https://tu-audio-openai.mp3"
}
```

## Plantillas disponibles
| Plantilla | Familia | Color |
|---|---|---|
| uv-compact | UV compacto | Cian #0099CC |
| uv-medium | UV mediano | Azul #0077AA |
| uv-large | UV gran formato | Azul oscuro |
| uv-cards | Tarjetas PVC | Azul |
| uv-tech | Materiales/tinta | Índigo |
| uv-niche | Aplicaciones nicho | Cian |
| laser-co2 | Láser CO2 | Magenta #CC3399 |
| laser-flux | FLUX creativo | Rosa |
| laser-fiber | Fibra industrial | Morado |
| dtf | Textil DTF | Naranja |
| comparativa | UV vs Láser | Amarillo |
| premium | Cilíndricos premium | Violeta |

## Variaciones de layout
- `variacion: 1` → Split izq · Overlay · Split der
- `variacion: 2` → Overlay · Split izq · Split der  
- `variacion: 3` → Split der · Split izq · Overlay
