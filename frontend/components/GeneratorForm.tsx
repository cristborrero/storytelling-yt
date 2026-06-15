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
