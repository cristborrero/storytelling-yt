"use client";
import { useState } from "react";
import {
  Wand2,
  AlertTriangle,
  Sparkles,
  Smile,
  Speech,
  ShieldAlert,
  Heart,
  Flame,
  Menu,
  Moon,
  Headphones,
  Globe,
  Settings,
  History,
  Volume2,
  Gauge,
  Plus,
  Play
} from "lucide-react";
import { generateAudio, audioUrl } from "@/lib/api";
import type { GenerateResponse } from "@/lib/types";
import AudioPlayer from "./ui/AudioPlayer";
import VoiceSelector from "./VoiceSelector";
import HistoryList from "./HistoryList";

export default function GeneratorForm() {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState<number | null>(null);
  const [exaggeration, setExaggeration] = useState(0.5); // temperature/cfg maps
  const [cfgWeight, setCfgWeight] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tabs on the right panel
  const [activeTab, setActiveTab] = useState<"settings" | "history">("settings");

  // Toggles for premium settings
  const [loudnessNorm, setLoudnessNorm] = useState(true);
  const [textNorm, setTextNorm] = useState(true);
  const [tagMode, setTagMode] = useState(false);

  // Custom audio sliders
  const [volume, setVolume] = useState(0); // dB offset
  const [speed, setSpeed] = useState(1.0); // play speed multiplier

  const charCount = text.length;
  const maxChars = 500; // Aligned with their character limit in the screen: "466 / 500 characters"

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
      // Automatically refresh history tab if needed or notify user
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
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + tag.length + 3;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const emotionTags = [
    { label: "Laughter", tag: "laughter", icon: Smile, color: "text-amber-400 border-amber-950/30 bg-amber-950/20 hover:bg-amber-950/40" },
    { label: "Whisper", tag: "whisper", icon: Speech, color: "text-cyan-400 border-cyan-900/30 bg-cyan-950/20 hover:bg-cyan-950/40" },
    { label: "Angry", tag: "angry", icon: ShieldAlert, color: "text-rose-400 border-rose-900/30 bg-rose-950/20 hover:bg-rose-950/40" },
    { label: "Excited", tag: "excited", icon: Flame, color: "text-orange-400 border-orange-900/30 bg-orange-950/20 hover:bg-orange-950/40" },
    { label: "Sad", tag: "sad", icon: Heart, color: "text-indigo-400 border-indigo-900/30 bg-indigo-950/20 hover:bg-indigo-950/40" },
  ];

  return (
    <div className="flex-1 flex overflow-hidden h-full w-full">
      {/* 1. Main Workspace (Center) */}
      <div className="flex-1 flex flex-col h-full bg-[#0d0d10] overflow-y-auto">
        {/* Workspace Top Header */}
        <header className="h-14 border-b border-[#1a1a1f] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Menu size={16} className="text-neutral-400 cursor-pointer" />
            <h1 className="text-sm font-semibold text-white tracking-tight">Text to Speech</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-neutral-400 hover:text-white transition-colors">
              <Moon size={16} />
            </button>
            <button className="text-neutral-400 hover:text-white transition-colors">
              <Globe size={16} />
            </button>
            <button className="text-neutral-400 hover:text-white transition-colors">
              <Headphones size={16} />
            </button>
            <div className="text-[10px] font-bold text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full select-none">
              My Team <span className="text-orange-500 font-extrabold ml-1">Free</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xs text-black select-none">
              U
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
          {/* Main Text Editor Panel */}
          <div className="bg-[#121215] border border-[#1d1d22] rounded-2xl p-6 flex flex-col h-[400px] justify-between relative shadow-lg">
            {/* Top Toolbar: Selected Voice Display */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5.5 h-5.5 rounded-full bg-orange-500 flex items-center justify-center font-bold text-[9px] text-black">
                {voiceId ? "C" : "D"}
              </div>
              <span className="text-xs font-bold text-neutral-200">
                {voiceId ? "Custom Voice Ref" : "Drew"}
              </span>
            </div>

            {/* Textarea */}
            <textarea
              id="story-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={maxChars}
              placeholder="All of this happened several years ago, but there's something that still won't let me sleep properly when I think back on it. A strange feeling, like something was terribly wrong..."
              className="w-full flex-1 bg-transparent border-0 outline-none text-neutral-200 placeholder-neutral-600 resize-none text-sm leading-relaxed outline-0 focus:ring-0"
            />

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-900">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#222227] hover:bg-[#1d1d22] text-xs font-semibold text-neutral-300 rounded-xl transition-colors cursor-pointer"
              >
                <Plus size={12} /> Add Speaker
              </button>

              <div className="flex items-center gap-4">
                <span className="text-[11px] text-neutral-500 font-medium">
                  {charCount} / {maxChars} characters
                </span>
                
                <button
                  type="button"
                  onClick={() => insertTag("laughter")}
                  className="flex items-center gap-1 px-3 py-1.5 border border-[#222227] hover:bg-[#1d1d22] text-xs font-semibold text-neutral-300 rounded-xl transition-colors cursor-pointer"
                >
                  <Sparkles size={11} className="text-orange-500" /> Auto Tag All
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={!text.trim() || loading}
                  className="px-4 py-2 text-xs font-extrabold text-black bg-white rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Generating..." : "Generate Speech"}
                  <span className="text-[9px] text-neutral-500 font-bold bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200">
                    ⌘↵
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Insert Preset Emotion Tags Section */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={11} className="text-orange-500" /> Insert Native Emotion Presets
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

          {/* Error Banner */}
          {error && (
            <div className="rounded-2xl border border-red-950 bg-red-950/20 px-5 py-4 text-sm text-red-400 flex items-start gap-3 mt-4">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-white">Inference Error</p>
                <p className="text-xs text-neutral-400 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Audio Output Panel */}
          {result && (
            <div className="bg-[#121215] border border-[#1d1d22] rounded-2xl p-6 flex flex-col gap-4 shadow-lg mt-4 animate-in fade-in duration-300">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Generated Audio
              </h3>
              <AudioPlayer
                url={audioUrl(result.audio.mp3_url ?? result.audio.wav_url)}
                filename={result.item.output_mp3_filename ?? "narration.mp3"}
              />
              {result.audio.duration_seconds && (
                <p className="text-[10px] text-neutral-500 font-mono">
                  Duration: {result.audio.duration_seconds.toFixed(2)}s
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Settings & History Panel (Right Sidebar) */}
      <div className="w-[340px] border-l border-[#1a1a1f] bg-[#101012] flex flex-col h-full overflow-hidden shrink-0 select-none">
        {/* Sidebar Header Tabs */}
        <div className="px-4 py-3 border-b border-[#1a1a1f] shrink-0">
          <div className="flex bg-[#161619] border border-[#222227] p-0.5 rounded-xl w-full">
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "settings"
                  ? "bg-[#1d1d22] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Settings size={12} /> Settings
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-[#1d1d22] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <History size={12} /> History
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {activeTab === "settings" ? (
            <>
              {/* Voice Selector */}
              <VoiceSelector value={voiceId} onChange={setVoiceId} />

              {/* Model Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  Model
                </label>
                <div className="bg-[#161619] border border-[#222227] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-[#1d1d22] transition-colors">
                  <span className="font-semibold text-neutral-200">Chatterbox Turbo</span>
                  <span className="text-[9px] font-extrabold text-violet-400 bg-violet-950/40 border border-violet-900/30 px-1.5 py-0.5 rounded-md">
                    Local
                  </span>
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  Audio Controls
                </span>

                {/* Volume slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-medium text-neutral-300">
                    <span className="flex items-center gap-1">
                      <Volume2 size={12} className="text-neutral-500" /> Volume
                    </span>
                    <span className="font-mono text-neutral-400">{volume} dB</span>
                  </div>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={1}
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full accent-orange-500 bg-[#161619] rounded-lg appearance-none h-1.5 cursor-pointer"
                  />
                </div>

                {/* Speed slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-medium text-neutral-300">
                    <span className="flex items-center gap-1">
                      <Gauge size={12} className="text-neutral-500" /> Speed
                    </span>
                    <span className="font-mono text-neutral-400">{speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 bg-[#161619] rounded-lg appearance-none h-1.5 cursor-pointer"
                  />
                </div>

                {/* Loudness Norm Toggle */}
                <div className="flex items-center justify-between py-2 border-t border-neutral-900">
                  <span className="text-xs font-medium text-neutral-300">Loudness Normalization</span>
                  <div
                    onClick={() => setLoudnessNorm(!loudnessNorm)}
                    className={`w-10 h-5.5 rounded-full p-0.5 cursor-pointer transition-colors ${
                      loudnessNorm ? "bg-orange-500" : "bg-neutral-800"
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 bg-white rounded-full transition-transform ${
                        loudnessNorm ? "translate-x-4.5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>

                {/* Text Norm Toggle */}
                <div className="flex items-center justify-between py-2 border-t border-neutral-900">
                  <span className="text-xs font-medium text-neutral-300">Text Normalization</span>
                  <div
                    onClick={() => setTextNorm(!textNorm)}
                    className={`w-10 h-5.5 rounded-full p-0.5 cursor-pointer transition-colors ${
                      textNorm ? "bg-orange-500" : "bg-neutral-800"
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 bg-white rounded-full transition-transform ${
                        textNorm ? "translate-x-4.5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>

                {/* Tag Compatibility Toggle */}
                <div className="flex items-center justify-between py-2 border-t border-neutral-900">
                  <span className="text-xs font-medium text-neutral-300">Tag Compatible Mode</span>
                  <div
                    onClick={() => setTagMode(!tagMode)}
                    className={`w-10 h-5.5 rounded-full p-0.5 cursor-pointer transition-colors ${
                      tagMode ? "bg-orange-500" : "bg-neutral-800"
                    }`}
                  >
                    <div
                      className={`w-4.5 h-4.5 bg-white rounded-full transition-transform ${
                        tagMode ? "translate-x-4.5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Recent Generations
              </span>
              {/* Render HistoryList directly here with a more compact styling wrapper */}
              <div className="compact-history-list text-xs">
                <HistoryList />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
