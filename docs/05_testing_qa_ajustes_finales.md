# 🧪 Doc 05 — Testing, QA y Ajustes Finales

> **Instrucciones para Antigravity:** Lee todo el documento antes de empezar. En este paso vas a verificar que el proyecto **storytelling** funciona end-to-end, tanto en local como en producción. Corrige cualquier error que encuentres antes de marcar cada punto del checklist. Este es el documento final de la guía.

---

## Objetivo

Al terminar este documento tendrás:

- El proyecto verificado end-to-end en local y en producción
- Un flujo completo probado: subir voz → escribir texto → generar audio → escuchar → descargar
- Errores comunes identificados y resueltos
- El proyecto limpio, commiteado y listo para usar

---

## Paso 1 — Verificación del backend en producción

Ejecuta estas peticiones contra la URL pública del backend. Reemplaza `API_URL` con tu dominio real de Coolify:

```bash
export API_URL=https://storytelling-api.tuservidor.sslip.io

# 1. Health check
curl $API_URL/health

# Esperado:
# {"status":"ok","environment":"production","device":"cpu"}

# 2. Listar voces (debe devolver lista vacía inicialmente)
curl $API_URL/voices

# Esperado:
# {"items":[]}

# 3. Listar historial (debe devolver lista vacía inicialmente)
curl $API_URL/history

# Esperado:
# {"items":[]}
```

---

## Paso 2 — Subir una voz de referencia

Necesitas un clip `.wav` de 10–15 segundos en inglés para probar voice cloning. Si no tienes uno, descarga una muestra libre de HuggingFace:

```bash
# Descarga una muestra de LibriSpeech (dominio público)
wget -O test_voice.wav \
  "https://huggingface.co/datasets/hf-internal-testing/librispeech_asr_dummy/resolve/main/data/validation.clean.0.flac"
```

> Si el formato es FLAC, conviértelo a WAV:
> ```bash
> ffmpeg -i test_voice.wav -ar 22050 -ac 1 reference_voice.wav
> ```

Sube la voz a producción:

```bash
curl -X POST "$API_URL/voices/upload" \
  -F "file=@reference_voice.wav" \
  -F "name=English Narrator"

# Esperado: JSON con item.id = 1
```

---

## Paso 3 — Prueba de generación TTS completa

```bash
# Generación con voz de referencia
curl -X POST "$API_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "In the beginning, there was silence. [pause] Then, from the shadows, a voice emerged — calm, deliberate, and full of purpose.",
    "voice_id": 1,
    "exaggeration": 0.65,
    "cfg_weight": 0.4,
    "output_format": "both"
  }'
```

Verifica en la respuesta:
- `item.id` existe
- `audio.wav_url` tiene formato `/audio/gen-XXXX.wav`
- `audio.mp3_url` tiene formato `/audio/gen-XXXX.mp3`
- `audio.duration_seconds` es mayor que 0

```bash
# Prueba sin voz de referencia (usa voz por defecto del modelo)
curl -X POST "$API_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Chapter one. The old lighthouse stood alone at the edge of the world.",
    "voice_id": null,
    "exaggeration": 0.5,
    "cfg_weight": 0.5,
    "output_format": "wav"
  }'
```

---

## Paso 4 — Verificar que los audios se sirven correctamente

Copia los filenames de las respuestas anteriores y verifica:

```bash
# WAV
curl -I "$API_URL/audio/gen-NOMBRE.wav"
# Esperado: HTTP/2 200, content-type: audio/wav

# MP3
curl -I "$API_URL/audio/gen-NOMBRE.mp3"
# Esperado: HTTP/2 200, content-type: audio/mpeg
```

También abre en el navegador directamente:

```
https://storytelling-api.tuservidor.sslip.io/audio/gen-NOMBRE.mp3
```

Debe reproducirse o descargarse correctamente.

---

## Paso 5 — Prueba completa desde la UI

Abre el frontend en producción `https://storytelling-frontend.tuservidor.sslip.io` y sigue este flujo completo:

### Flujo 1 — Subir voz y generar

1. Ve a `/voices`
2. Click en **Upload Voice** → selecciona `reference_voice.wav`
3. Verifica que aparece la tarjeta de la voz con nombre y duración
4. Ve a `/` (Generate)
5. En el panel derecho, selecciona la voz recién subida
6. Escribe este texto en el editor:

```
Once upon a time [chuckle], in a village forgotten by maps and memory, 
there lived a storyteller who had never told a lie.
```

7. Ajusta el preset a **Dramatic**
8. Click en **Generate Voice**
9. Espera la generación (puede tardar 30–90s en CPU)
10. Verifica que aparece el AudioPlayer con la forma de onda
11. Presiona **Play** y escucha el audio
12. Click en el ícono de descarga y verifica que se descarga el `.mp3`

### Flujo 2 — Verificar historial

1. Ve a `/history`
2. Verifica que aparece la generación del Flujo 1
3. Verifica que el AudioPlayer funciona en la página de historial
4. Verifica que se muestran los metadatos: voz usada, duración, parámetros

---

## Paso 6 — Pruebas de etiquetas expresivas

Genera estos textos para verificar que las etiquetas expresivas funcionan:

```bash
# Con [laugh]
curl -X POST "$API_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "And then — [laugh] — he realized he had been talking to a scarecrow the entire time.",
    "voice_id": 1,
    "exaggeration": 0.7,
    "cfg_weight": 0.3,
    "output_format": "mp3"
  }'

# Con [chuckle]
curl -X POST "$API_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The wizard adjusted his hat. [chuckle] Well, he said. That did not go as planned.",
    "voice_id": 1,
    "exaggeration": 0.6,
    "cfg_weight": 0.4,
    "output_format": "mp3"
  }'
```

Escucha los audios resultantes y verifica que las etiquetas generan expresiones naturales en la voz.

---

## Paso 7 — Pruebas de límites y errores

```bash
# Texto vacío — debe devolver 422 o 400
curl -X POST "$API_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{"text": "", "output_format": "wav"}'

# Voice ID inexistente — debe devolver 404
curl -X POST "$API_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "voice_id": 9999, "output_format": "wav"}'

# Archivo que no es WAV — debe devolver 400
echo "not a wav" > fake.txt
curl -X POST "$API_URL/voices/upload" \
  -F "file=@fake.txt" \
  -F "name=Fake"
```

Verifica que en todos los casos el error devuelto es descriptivo y no un 500.

---

## Paso 8 — Verificar persistencia tras redeploy

Fuerza un nuevo deploy desde Coolify (o haz un commit vacío):

```bash
git commit --allow-empty -m "chore: trigger redeploy test"
git push
```

Espera a que Coolify complete el deploy. Luego verifica:

```bash
# Las voces deben seguir existiendo
curl $API_URL/voices
# Esperado: la voz que subiste antes sigue en la lista

# El historial debe seguir existiendo
curl $API_URL/history
# Esperado: las generaciones anteriores siguen en el historial
```

Esto confirma que los volúmenes Docker están funcionando correctamente.

---

## Paso 9 — Ajustes de rendimiento opcionales

Si la generación es muy lenta en CPU, aplica estas optimizaciones:

### Limitar longitud de texto en el frontend

En `frontend/components/ui/TextArea.tsx`, el `maxLength` ya está en 5000. Para producción puedes bajarlo a 1000 caracteres para mantener tiempos razonables en CPU:

```tsx
// En GeneratorForm.tsx, cambia:
const maxChars = 5000;
// Por:
const maxChars = 1000;
```

### Agregar timeout al backend

En `backend/app/routers/tts.py`, agrega un timeout de seguridad:

```python
import asyncio
from fastapi import HTTPException

# Dentro de generate_audio(), antes de TTSService.generate_wav():
import concurrent.futures
import functools

executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)

loop = asyncio.get_event_loop()
try:
    await asyncio.wait_for(
        loop.run_in_executor(
            executor,
            functools.partial(
                TTSService.generate_wav,
                text=text,
                output_path=wav_path,
                audio_prompt_path=audio_prompt_path,
                exaggeration=payload.exaggeration,
                cfg_weight=payload.cfg_weight,
            )
        ),
        timeout=300  # 5 minutos máximo
    )
except asyncio.TimeoutError:
    raise HTTPException(status_code=504, detail="TTS generation timed out")
```

---

## Paso 10 — README final

Reemplaza `README.md` en la raíz con la versión final:

```markdown
# Storytelling 🎙️

Self-hosted Text-to-Speech platform for English narration, powered by Chatterbox-Turbo.

## Stack

- **Frontend:** Next.js 15 + Tailwind CSS
- **Backend:** FastAPI + Python 3.11
- **TTS Engine:** Chatterbox (Resemble AI)
- **Database:** SQLite via SQLModel
- **Deploy:** Docker Compose + Coolify

## Features

- Voice cloning from a 10–15s WAV reference clip
- Expressive narration with tags: `[laugh]` `[chuckle]` `[cough]`
- WAV + MP3 output
- Generation history
- Voice library management
- Waveform audio player

## Narration Presets

| Preset | Expressiveness | Pace Control |
|---|---:|---:|
| Neutral | 0.5 | 0.5 |
| Dramatic | 0.7 | 0.3 |
| Expressive | 0.8 | 0.2 |

## Local Development

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

Frontend: http://localhost:3000
Backend: http://localhost:8000
API Docs: http://localhost:8000/docs

## Production Deploy

See Doc 04 — Docker Compose & Deploy en Coolify.
```

---

## Paso 11 — Commit final

```bash
git add .
git commit -m "docs: finalize README and project cleanup for storytelling"
git push
```

---

## ✅ Checklist final del proyecto

### Backend
- [ ] `GET /health` responde `status: ok` en producción
- [ ] `POST /voices/upload` acepta `.wav` y rechaza otros formatos
- [ ] `GET /voices` lista voces correctamente
- [ ] `POST /generate` crea audio con y sin voz de referencia
- [ ] `GET /audio/{filename}` sirve `.wav` y `.mp3`
- [ ] `GET /history` muestra generaciones con metadatos
- [ ] Errores devuelven mensajes descriptivos (no 500 genéricos)

### Frontend
- [ ] `/` carga el generador con editor, sliders y VoiceSelector
- [ ] Los presets (Neutral, Dramatic, Expressive) funcionan
- [ ] La generación muestra el AudioPlayer con waveform
- [ ] El audio se puede reproducir y descargar
- [ ] `/voices` muestra la biblioteca y permite subir nuevas voces
- [ ] `/history` muestra el historial con players funcionales
- [ ] No hay errores en la consola del navegador

### Infraestructura
- [ ] Docker Compose corre sin errores en local
- [ ] Coolify despliega automáticamente al hacer `git push`
- [ ] Los volúmenes persisten datos tras redeploy
- [ ] El frontend tiene URL pública HTTPS
- [ ] El backend tiene URL pública HTTPS
- [ ] Swagger accesible desde la URL pública del backend

### Código
- [ ] No hay referencias a "VoxForge" en el proyecto
- [ ] El README está actualizado
- [ ] Todos los commits están en GitHub
- [ ] No hay archivos `.env` con secretos subidos al repo

---

## 🎉 El proyecto está completo

El sistema **Storytelling** está listo para usarse. Para generar narración:

1. Sube un clip `.wav` de referencia en inglés desde `/voices`
2. Escribe o pega tu historia en `/`
3. Selecciona la voz, ajusta los parámetros
4. Presiona **Generate Voice**
5. Escucha, descarga y usa el audio donde lo necesites

---

> **Dile a Cristian que el proyecto está completo y listo para producción.**
````

Eso es todo — los **5 documentos** están completos. Resumen de la guía completa:

| Doc | Archivo |
|---|---|
| 01 | `01_project_setup_architecture` |
| 02 | `02_backend_fastapi_chatterbox` |
| 03 | `03_frontend_nextjs_tipo_elevenlabs` |
| 04 | `04_docker_compose_deploy_coolify` |
| 05 | `05_testing_qa_ajustes_finales` |
