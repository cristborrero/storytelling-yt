"use client";
import { useEffect, useRef, useState } from "react";
import { Upload, Mic2, X, FileAudio, FileText, Check, ChevronDown, Plus } from "lucide-react";
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
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      setVoices(await getVoices());
    } catch (e) {
      console.error("Failed to load voices in selector:", e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setVoiceName(file.name.replace(".wav", ""));
    setTranscript("");
    setShowModal(true);
    setIsOpen(false);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const newVoice = await uploadVoice(selectedFile, voiceName, transcript);
      await load();
      onChange(newVoice.id);
      closeModal();
    } catch (err) {
      console.error("Failed to upload voice in selector:", err);
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFile(null);
    setVoiceName("");
    setTranscript("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const selectedVoice = value === null ? null : voices.find((v) => v.id === value);

  return (
    <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
        Voice
      </label>

      {/* Dropdown Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#161619] border border-[#222227] hover:border-[#2d2d35] rounded-xl px-4 py-2.5 flex items-center justify-between text-sm cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-5 h-5 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <Mic2 size={11} />
          </div>
          <span className="font-semibold text-neutral-200 truncate">
            {selectedVoice ? selectedVoice.name : "Default System Voice"}
          </span>
        </div>
        <ChevronDown size={14} className="text-neutral-500 shrink-0" />
      </div>

      {/* Dropdown Options Menu */}
      {isOpen && (
        <div className="absolute top-[68px] left-0 w-full z-50 bg-[#161619] border border-[#222227] rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 max-h-[280px] overflow-y-auto">
          {/* Default Option */}
          <div
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
              value === null
                ? "bg-[#1d1d22] text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Mic2 size={11} className={value === null ? "text-orange-500" : "text-neutral-600"} />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold truncate">Default System Voice</span>
              </div>
            </div>
            {value === null && <Check size={12} className="text-orange-500 shrink-0" />}
          </div>

          {/* List of custom voices */}
          {voices.map((v) => (
            <div
              key={v.id}
              onClick={() => {
                onChange(v.id);
                setIsOpen(false);
              }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                value === v.id
                  ? "bg-[#1d1d22] text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Mic2 size={11} className={value === v.id ? "text-orange-500" : "text-neutral-600"} />
                <span className="font-semibold truncate">{v.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {v.duration_seconds && (
                  <span className="text-[9px] text-neutral-600 font-mono">
                    {v.duration_seconds.toFixed(0)}s
                  </span>
                )}
                {value === v.id && <Check size={12} className="text-orange-500 shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add More Voice Reference Trigger */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".wav"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border border-dashed border-[#222227] hover:border-orange-500/40 text-neutral-500 hover:text-neutral-300 rounded-xl py-2 px-3 text-[10px] font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer mt-1.5 transition-all"
        >
          <Plus size={11} /> Add more voice
        </button>
      </div>

      {/* Modal - Upload Voice Reference inline */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <Mic2 size={16} />
                </div>
                <span className="font-bold text-white text-base">Add Voice Reference</span>
              </div>
              <button
                onClick={closeModal}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 flex flex-col gap-5">
              {/* File Info Box */}
              {selectedFile && (
                <div className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 text-sm text-neutral-300">
                  <FileAudio className="text-orange-500 shrink-0" size={24} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{selectedFile.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · WAV format
                    </p>
                  </div>
                </div>
              )}

              {/* Speaker Name Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="voice-name-select" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Speaker / Voice Name
                </label>
                <input
                  id="voice-name-select"
                  type="text"
                  required
                  placeholder="e.g., Drew"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-brand focus:ring-1 focus:ring-brand/50 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none transition-all duration-200"
                />
              </div>

              {/* Transcript Textarea */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="voice-transcript-select" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={12} /> Reference Transcript (Recommended)
                  </label>
                </div>
                <textarea
                  id="voice-transcript-select"
                  rows={3}
                  placeholder="Type or paste the exact words spoken in the WAV clip..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-brand focus:ring-1 focus:ring-brand/50 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none resize-none transition-all duration-200"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-neutral-300 font-medium transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={uploading}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-950/20 transition-all duration-200"
                >
                  Create Voice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
