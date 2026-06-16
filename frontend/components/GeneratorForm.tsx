"use client";
import { useState } from "react";
import { Wand2, AlertTriangle, Sparkles, Smile, Speech, ShieldAlert, Heart, Flame } from "lucide-react";
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
  const [exaggeration, setExaggeration] = useState(0.5); // Maps to repetition_penalty in backend
  const [cfgWeight, setCfgWeight] = useState(0.7); // Maps to temperature in backend
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.length;
  const maxChars = 1000;

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
      const msg = e instanceof Error ? e.message : "Inference failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const insertTag = (tag: string) => {
    const textarea = document.getElementById("story-text") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const newText = currentText.substring(0, start) + `[${tag}] ` + currentText.substring(end);
    setText(newText);
    
    // Focus back and move cursor inside
    setTimeout(() => {
      textarea.focus();
      const newPos = start + tag.length + 3;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const emotionTags = [
    { label: "Laughter", tag: "laughter", icon: Smile, color: "text-amber-400 border-amber-900/30 bg-amber-950/20 hover:bg-amber-950/40" },
    { label: "Whisper", tag: "whisper", icon: Speech, color: "text-cyan-400 border-cyan-900/30 bg-cyan-950/20 hover:bg-cyan-950/40" },
    { label: "Angry", tag: "angry", icon: ShieldAlert, color: "text-rose-400 border-rose-900/30 bg-rose-950/20 hover:bg-rose-950/40" },
    { label: "Excited", tag: "excited", icon: Flame, color: "text-orange-400 border-orange-900/30 bg-orange-950/20 hover:bg-orange-950/40" },
    { label: "Sad", tag: "sad", icon: Heart, color: "text-indigo-400 border-indigo-900/30 bg-indigo-950/20 hover:bg-indigo-950/40" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left — Text Input area & output player */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <div className="relative">
            <TextArea
              id="story-text"
              label="Story Text"
              placeholder={`Write or paste your story here...\n\nUse emotional tags to control prosody fine-grainedly, e.g. "Hello [laughter] how are you? [whisper] I am here."`}
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={maxChars}
              hint={`${charCount} / ${maxChars} characters`}
              className="bg-black/30 border-white/5 focus:border-brand rounded-2xl text-base p-4"
            />
          </div>

          {/* Emotional Tags Helper */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-brand" /> Insert Emotion Tag (Fish Speech native)
            </span>
            <div className="flex flex-wrap gap-2">
              {emotionTags.map((e) => {
                const Icon = e.icon;
                return (
                  <button
                    key={e.tag}
                    type="button"
                    onClick={() => insertTag(e.tag)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer ${e.color}`}
                  >
                    <Icon size={12} />
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          loading={loading}
          disabled={!text.trim() || loading}
          className="w-full py-3.5 text-base font-bold rounded-2xl bg-gradient-to-r from-brand to-orange-500 hover:from-orange-500 hover:to-brand shadow-lg shadow-orange-950/10 gap-2 transition-all duration-300"
        >
          <Wand2 size={18} />
          {loading ? "Generating narration..." : "Generate Voice"}
        </Button>

        {error && (
          <div className="rounded-2xl border border-red-950 bg-red-950/20 px-5 py-4 text-sm text-red-400 flex items-start gap-3">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-semibold">Generation Error</p>
              <p className="text-xs text-neutral-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              Generated Narration
            </h3>
            {result.audio.mp3_url ? (
              <AudioPlayer
                url={audioUrl(result.audio.mp3_url)}
                filename={result.item.output_mp3_filename ?? "narration.mp3"}
              />
            ) : (
              <AudioPlayer
                url={audioUrl(result.audio.wav_url)}
                filename={result.item.output_wav_filename}
              />
            )}
            {result.audio.duration_seconds && (
              <p className="text-xs text-neutral-500 font-mono">
                Duration: {result.audio.duration_seconds.toFixed(2)}s
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right — Settings panel */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6">
        <VoiceSelector value={voiceId} onChange={setVoiceId} />

        <div className="border-t border-white/5 pt-5 flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Parameters
          </p>
          <Slider
            label="Creativity (Temperature)"
            min={0.1}
            max={1.5}
            step={0.05}
            value={cfgWeight}
            valueLabel={cfgWeight.toFixed(2)}
            onChange={(e) => setCfgWeight(parseFloat(e.target.value))}
          />
          <Slider
            label="Clarity (Repetition Penalty)"
            min={0.0}
            max={1.5}
            step={0.05}
            value={exaggeration}
            valueLabel={exaggeration.toFixed(2)}
            onChange={(e) => setExaggeration(parseFloat(e.target.value))}
          />

          <div className="flex flex-col gap-2 mt-1">
            <p className="text-xs text-neutral-500 font-medium">Presets</p>
            {[
              { label: "Conversational", ex: 0.2, cfg: 0.7 },
              { label: "Narrative (Neutral)", ex: 0.5, cfg: 0.6 },
              { label: "Highly Expressive", ex: 0.8, cfg: 0.85 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => { setExaggeration(p.ex); setCfgWeight(p.cfg); }}
                className="text-left text-xs px-3.5 py-2.5 rounded-xl border border-white/5 hover:border-brand/40 bg-white/2 hover:bg-white/5 hover:text-white text-neutral-400 transition-colors"
              >
                {p.label}
                <span className="float-right text-neutral-600 font-mono text-[10px]">
                  temp: {p.cfg} / rep: {p.ex}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
