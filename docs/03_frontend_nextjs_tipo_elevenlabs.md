# 🖥️ Doc 03 — Frontend Next.js tipo ElevenLabs

> **Instrucciones para Antigravity:** Lee todo el documento antes de empezar. En este paso construyes el frontend completo de VoxForge con Next.js 15, Tailwind CSS y un diseño oscuro profesional similar a ElevenLabs. Sigue los pasos en orden exacto. No omitas ningún archivo.

---

## Objetivo

Al terminar este documento tendrás una UI funcional con:

- Página principal con editor de texto + controles TTS
- Selector de voces de referencia con opción de subir nuevas
- Reproductor de audio custom con waveform
- Página de historial de generaciones
- Navbar con navegación entre secciones
- Conexión real al backend FastAPI

---

## Resultado esperado

```
http://localhost:3000       → Generador principal
http://localhost:3000/history  → Historial
http://localhost:3000/voices   → Gestión de voces
```

---

## Paso 1 — Inicializar Next.js

Desde la carpeta `voxforge/frontend/` ejecuta:

```bash
npx create-next-app@15 . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

Cuando pregunte si quieres sobreescribir archivos existentes, responde **Yes** a todos.

---

## Paso 2 — Instalar dependencias adicionales

```bash
npm install axios wavesurfer.js lucide-react clsx tailwind-merge
```

---

## Paso 3 — Variables de entorno del frontend

Crea `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Paso 4 — Configuración de Tailwind

Reemplaza `frontend/tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#f97316",
          dark: "#ea580c",
        },
        surface: {
          DEFAULT: "#0f0f0f",
          card: "#1a1a1a",
          border: "#2a2a2a",
          hover: "#242424",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Paso 5 — Estilos globales

Reemplaza `frontend/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  box-sizing: border-box;
}

html,
body {
  background-color: #0f0f0f;
  color: #e5e5e5;
  font-family: 'Inter', ui-sans-serif, system-ui;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #1a1a1a;
}
::-webkit-scrollbar-thumb {
  background: #3a3a3a;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #f97316;
}

.waveform-container wave {
  overflow: hidden !important;
}
```

---

## Paso 6 — TypeScript types

Crea `frontend/lib/types.ts`:

```ts
export interface Voice {
  id: number;
  name: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  duration_seconds: number | null;
  created_at: string;
}

export interface Generation {
  id: number;
  text: string;
  voice_id: number | null;
  voice_name: string | null;
  output_wav_filename: string;
  output_mp3_filename: string | null;
  output_wav_url: string;
  output_mp3_url: string | null;
  exaggeration: number;
  cfg_weight: number;
  format: string;
  status: string;
  duration_seconds: number | null;
  created_at: string;
}

export interface GenerateRequest {
  text: string;
  voice_id?: number | null;
  exaggeration?: number;
  cfg_weight?: number;
  output_format?: "wav" | "mp3" | "both";
}

export interface GenerateResponse {
  item: Generation;
  audio: {
    wav_url: string;
    mp3_url: string | null;
    duration_seconds: number | null;
  };
}
```

---

## Paso 7 — API client

Crea `frontend/lib/api.ts`:

```ts
import axios from "axios";
import type { GenerateRequest, GenerateResponse, Generation, Voice } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const api = axios.create({ baseURL: BASE });

export async function getVoices(): Promise<Voice[]> {
  const res = await api.get("/voices");
  return res.data.items;
}

export async function uploadVoice(file: File, name?: string): Promise<Voice> {
  const form = new FormData();
  form.append("file", file);
  if (name) form.append("name", name);
  const res = await api.post("/voices/upload", form);
  return res.data.item;
}

export async function generateAudio(payload: GenerateRequest): Promise<GenerateResponse> {
  const res = await api.post("/generate", payload);
  return res.data;
}

export async function getHistory(limit = 50): Promise<Generation[]> {
  const res = await api.get(`/history?limit=${limit}`);
  return res.data.items;
}

export function audioUrl(path: string): string {
  return `${BASE}${path}`;
}
```

---

## Paso 8 — Componentes UI base

### `frontend/components/ui/Button.tsx`

```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand hover:bg-brand-dark text-white font-semibold shadow-lg shadow-orange-900/20",
  ghost:
    "bg-transparent hover:bg-surface-hover text-neutral-300 hover:text-white",
  outline:
    "border border-surface-border hover:border-brand text-neutral-300 hover:text-white bg-transparent",
};

export default function Button({
  variant = "primary",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
```

---

### `frontend/components/ui/Badge.tsx`

```tsx
export default function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-card border border-surface-border text-neutral-400">
      {children}
    </span>
  );
}
```

---

### `frontend/components/ui/TextArea.tsx`

```tsx
import { TextareaHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export default function TextArea({ label, hint, className, ...props }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-neutral-300">{label}</label>
      )}
      <textarea
        className={twMerge(
          "w-full rounded-xl bg-surface-card border border-surface-border text-neutral-100 placeholder-neutral-600 px-4 py-3 text-sm resize-none focus:outline-none focus:border-brand transition-colors",
          className
        )}
        {...props}
      />
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
```

---

### `frontend/components/ui/Slider.tsx`

```tsx
"use client";
import { InputHTMLAttributes } from "react";

interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  valueLabel?: string;
}

export default function Slider({ label, valueLabel, ...props }: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-neutral-300">{label}</label>
        {valueLabel !== undefined && (
          <span className="text-sm font-mono text-brand">{valueLabel}</span>
        )}
      </div>
      <input
        type="range"
        className="w-full h-1.5 rounded-full appearance-none bg-surface-border cursor-pointer accent-brand"
        {...props}
      />
    </div>
  );
}
```

---

### `frontend/components/ui/AudioPlayer.tsx`

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Download } from "lucide-react";
import Button from "./Button";

interface AudioPlayerProps {
  url: string;
  filename?: string;
}

export default function AudioPlayer({ url, filename }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#3a3a3a",
      progressColor: "#f97316",
      cursorColor: "#f97316",
      height: 48,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
    });
    ws.load(url);
    ws.on("ready", () => {
      setReady(true);
      setDuration(ws.getDuration());
    });
    ws.on("timeupdate", (t) => setCurrentTime(t));
    ws.on("finish", () => setPlaying(false));
    wsRef.current = ws;
    return () => ws.destroy();
  }, [url]);

  const toggle = () => {
    wsRef.current?.playPause();
    setPlaying((p) => !p);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-xl p-3 w-full">
      <Button
        variant="ghost"
        className="p-2 shrink-0"
        onClick={toggle}
        disabled={!ready}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </Button>

      <div className="flex-1 min-w-0">
        <div ref={containerRef} className="waveform-container w-full" />
        <div className="flex justify-between mt-1 text-xs text-neutral-500 font-mono">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <a href={url} download={filename ?? "audio.wav"}>
        <Button variant="ghost" className="p-2 shrink-0">
          <Download size={16} />
        </Button>
      </a>
    </div>
  );
}
```

---

## Paso 9 — Navbar

Crea `frontend/components/Navbar.tsx`:

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic2, History, AudioLines } from "lucide-react";
import { clsx } from "clsx";

const links = [
  { href: "/", label: "Generate", icon: AudioLines },
  { href: "/voices", label: "Voices", icon: Mic2 },
  { href: "/history", label: "History", icon: History },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-surface/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
          <span className="text-brand">⬡</span> VoxForge
        </span>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                path === href
                  ? "bg-surface-card text-white font-medium"
                  : "text-neutral-400 hover:text-white hover:bg-surface-hover"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

---

## Paso 10 — VoiceSelector

Crea `frontend/components/VoiceSelector.tsx`:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { Upload, Mic2 } from "lucide-react";
import { getVoices, uploadVoice } from "@/lib/api";
import type { Voice } from "@/lib/types";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

interface VoiceSelectorProps {
  value: number | null;
  onChange: (id: number | null) => void;
}

export default function VoiceSelector({ value, onChange }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setVoices(await getVoices());
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.;
    if (!file) return;
    setUploading(true);
    try {
      await uploadVoice(file, file.name.replace(".wav", ""));
      await load();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-neutral-300">
          Voice Reference
        </label>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".wav"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            className="text-xs px-3 py-1.5 gap-1"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={13} /> Upload .wav
          </Button>
        </div>
      </div>

      {voices.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-4 border border-dashed border-surface-border rounded-xl">
          No voices yet — upload a 10s reference clip
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div
            onClick={() => onChange(null)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border transition-colors ${
              value === null
                ? "border-brand bg-orange-950/30 text-white"
                : "border-surface-border hover:border-neutral-600 text-neutral-400"
            }`}
          >
            <Mic2 size={15} />
            <span className="text-sm">Default (no reference)</span>
          </div>
          {voices.map((v) => (
            <div
              key={v.id}
              onClick={() => onChange(v.id)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer border transition-colors ${
                value === v.id
                  ? "border-brand bg-orange-950/30 text-white"
                  : "border-surface-border hover:border-neutral-600 text-neutral-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <Mic2 size={15} />
                <span className="text-sm font-medium">{v.name}</span>
              </div>
              {v.duration_seconds && (
                <Badge>{v.duration_seconds.toFixed(1)}s</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Paso 11 — GeneratorForm

Crea `frontend/components/GeneratorForm.tsx`:

```tsx
"use client";
import { useState } from "react";
import { Wand2 } from "lucide-react";
import { generateAudio, audioUrl } from "@/lib/api";
import type { GenerateResponse } from "@/lib/types";
import TextArea from "./ui/TextArea";
import Slider from "./ui/Slider";
import Button from "./ui/Button";
import AudioPlayer from "./ui/AudioPlayer";
import VoiceSelector from "./VoiceSelector";

export default function GeneratorForm() {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState<number | null>(null);
  const [exaggeration, setExaggeration] = useState(0.5);
  const [cfgWeight, setCfgWeight] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.length;
  const maxChars = 5000;

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await generateAudio({
        text: text.trim(),
        voice_id: voiceId,
        exaggeration,
        cfg_weight: cfgWeight,
        output_format: "both",
      });
      setResult(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left — Text + output */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <TextArea
          label="Text"
          placeholder={`Type or paste your English story here...\n\nSupported tags: [laugh] [chuckle] [cough]`}
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={maxChars}
          hint={`${charCount} / ${maxChars} characters`}
        />

        <Button
          onClick={handleGenerate}
          loading={loading}
          disabled={!text.trim() || loading}
          className="w-full py-3 text-base gap-2"
        >
          <Wand2 size={18} />
          {loading ? "Generating audio..." : "Generate Voice"}
        </Button>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-neutral-300">Output</p>
            {result.audio.mp3_url && (
              <AudioPlayer
                url={audioUrl(result.audio.mp3_url)}
                filename={result.item.output_mp3_filename ?? "audio.mp3"}
              />
            )}
            {!result.audio.mp3_url && (
              <AudioPlayer
                url={audioUrl(result.audio.wav_url)}
                filename={result.item.output_wav_filename}
              />
            )}
            {result.audio.duration_seconds && (
              <p className="text-xs text-neutral-500">
                Duration: {result.audio.duration_seconds.toFixed(2)}s
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right — Settings */}
      <div className="flex flex-col gap-6 bg-surface-card border border-surface-border rounded-2xl p-5">
        <VoiceSelector value={voiceId} onChange={setVoiceId} />

        <div className="border-t border-surface-border pt-5 flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Parameters
          </p>
          <Slider
            label="Expressiveness"
            min={0}
            max={2}
            step={0.05}
            value={exaggeration}
            valueLabel={exaggeration.toFixed(2)}
            onChange={(e) => setExaggeration(parseFloat(e.target.value))}
          />
          <Slider
            label="Pace Control"
            min={0}
            max={1}
            step={0.05}
            value={cfgWeight}
            valueLabel={cfgWeight.toFixed(2)}
            onChange={(e) => setCfgWeight(parseFloat(e.target.value))}
          />

          <div className="flex flex-col gap-2 mt-1">
            <p className="text-xs text-neutral-500 font-medium">Presets</p>
            {[
              { label: "Neutral", ex: 0.5, cfg: 0.5 },
              { label: "Dramatic", ex: 0.7, cfg: 0.3 },
              { label: "Expressive", ex: 0.8, cfg: 0.2 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => { setExaggeration(p.ex); setCfgWeight(p.cfg); }}
                className="text-left text-xs px-3 py-2 rounded-lg border border-surface-border hover:border-brand hover:text-white text-neutral-400 transition-colors"
              >
                {p.label}
                <span className="float-right text-neutral-600 font-mono">
                  {p.ex} / {p.cfg}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Paso 12 — HistoryList

Crea `frontend/components/HistoryList.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { getHistory, audioUrl } from "@/lib/api";
import type { Generation } from "@/lib/types";
import AudioPlayer from "./ui/AudioPlayer";
import Badge from "./ui/Badge";

export default function HistoryList() {
  const [items, setItems] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-500 text-sm">
        Loading history...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-500">
        <p className="text-lg">No generations yet</p>
        <p className="text-sm">Generate your first audio from the Generate page</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-surface-card border border-surface-border rounded-2xl p-5 flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-neutral-300 line-clamp-2 flex-1">
              {item.text}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {item.voice_name && <Badge>{item.voice_name}</Badge>}
              {item.duration_seconds && (
                <Badge>{item.duration_seconds.toFixed(1)}s</Badge>
              )}
            </div>
          </div>
          <AudioPlayer
            url={audioUrl(item.output_mp3_url ?? item.output_wav_url)}
            filename={item.output_mp3_filename ?? item.output_wav_filename}
          />
          <p className="text-xs text-neutral-600">
            {new Date(item.created_at).toLocaleString()} · ex:{" "}
            {item.exaggeration} · cfg: {item.cfg_weight}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

## Paso 13 — Root Layout

Reemplaza `frontend/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "VoxForge — Self-hosted TTS",
  description: "Generate professional English narration with Chatterbox-Turbo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface text-neutral-100">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
```

---

## Paso 14 — Página principal (Generador)

Reemplaza `frontend/app/page.tsx`:

```tsx
import GeneratorForm from "@/components/GeneratorForm";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Voice Generator</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Convert your English stories into professional narration
        </p>
      </div>
      <GeneratorForm />
    </div>
  );
}
```

---

## Paso 15 — Página de historial

Crea `frontend/app/history/page.tsx`:

```tsx
import HistoryList from "@/components/HistoryList";

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">History</h1>
        <p className="text-sm text-neutral-400 mt-1">
          All your previous audio generations
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
```

---

## Paso 16 — Página de voces

Crea `frontend/app/voices/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { getVoices, uploadVoice } from "@/lib/api";
import type { Voice } from "@/lib/types";
import { Mic2, Upload } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useRef } from "react";

export default function VoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => setVoices(await getVoices());

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.;
    if (!file) return;
    setUploading(true);
    try {
      await uploadVoice(file, file.name.replace(".wav", ""));
      await load();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Voice Library</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Upload 10–15s WAV clips to use as voice references
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".wav"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            loading={uploading}
            onClick={() => inputRef.current?.click()}
            className="gap-2"
          >
            <Upload size={16} /> Upload Voice
          </Button>
        </div>
      </div>

      {voices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-surface-border rounded-2xl text-neutral-500">
          <Mic2 size={32} />
          <p>No voices yet. Upload a .wav clip to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {voices.map((v) => (
            <div
              key={v.id}
              className="bg-surface-card border border-surface-border rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-950/50 border border-brand/30 flex items-center justify-center text-brand">
                  <Mic2 size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{v.name}</p>
                  <p className="text-xs text-neutral-500 truncate">{v.original_filename}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {v.duration_seconds && <Badge>{v.duration_seconds.toFixed(1)}s</Badge>}
                <Badge>WAV</Badge>
              </div>
              <p className="text-xs text-neutral-600">
                {new Date(v.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Paso 17 — next.config.ts

Reemplaza `frontend/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

---

## Paso 18 — Dockerfile del frontend

Reemplaza `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Paso 19 — Prueba local

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:3000` y verifica:

- [ ] La Navbar muestra Generate, Voices, History
- [ ] La página principal carga con el editor de texto
- [ ] El panel derecho muestra VoiceSelector y sliders
- [ ] Los presets (Neutral, Dramatic, Expressive) cambian los sliders
- [ ] La página `/voices` carga y muestra "No voices yet"
- [ ] La página `/history` carga y muestra "No generations yet"
- [ ] No hay errores en consola del navegador

---

## Paso 20 — Prueba integración con backend

Con el backend corriendo en `http://localhost:8000`:

1. Ve a `/voices` → sube un clip `.wav` de referencia
2. Ve a `/` → selecciona la voz, escribe texto y presiona **Generate Voice**
3. Verifica que aparece el AudioPlayer con la forma de onda
4. Presiona play y escucha el audio
5. Ve a `/history` → verifica que aparece la generación con su player

---

## Paso 21 — Commit del frontend

```bash
git add frontend
git commit -m "feat: add Next.js frontend UI for VoxForge"
git push
```

---

## ✅ Checklist antes del Doc 04

- [ ] `npm run dev` corre sin errores
- [ ] Las 3 páginas cargan correctamente
- [ ] VoiceSelector muestra voces desde el backend
- [ ] El formulario genera audio y muestra el AudioPlayer
- [ ] El historial muestra generaciones previas
- [ ] No hay errores TypeScript (`npx tsc --noEmit`)
- [ ] Commit subido a GitHub

---

> **Cuando el checklist esté completo, dile a Cristian para continuar con el Doc 04 — Docker Compose & Deploy en Coolify.**
````