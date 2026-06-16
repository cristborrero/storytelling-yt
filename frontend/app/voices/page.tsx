"use client";
import { useEffect, useState, useRef } from "react";
import { getVoices, uploadVoice } from "@/lib/api";
import type { Voice } from "@/lib/types";
import { Mic2, Upload, X, FileAudio, FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function VoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [transcript, setTranscript] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => setVoices(await getVoices());

  useEffect(() => {
    load();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setVoiceName(file.name.replace(".wav", ""));
    setTranscript("");
    setShowModal(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      await uploadVoice(selectedFile, voiceName, transcript);
      await load();
      closeModal();
    } catch (err) {
      console.error("Failed to upload voice:", err);
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0d10] overflow-y-auto">
      {/* Workspace Header */}
      <header className="h-14 border-b border-[#1a1a1f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Mic2 size={16} className="text-orange-500" />
          <h1 className="text-sm font-semibold text-white tracking-tight">Voice Library</h1>
        </div>

        <div className="flex items-center gap-4">
          <input
            ref={inputRef}
            type="file"
            accept=".wav"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            onClick={() => inputRef.current?.click()}
            className="gap-2 px-3 py-1.5 text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-black shadow-md transition-all cursor-pointer"
          >
            <Upload size={12} /> Upload reference clip
          </Button>
          <div className="text-[10px] font-bold text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full select-none">
            My Team <span className="text-orange-500 font-extrabold ml-1">Free</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xs text-black select-none">
            U
          </div>
        </div>
      </header>

      {/* Workspace Body */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Cloned <span className="text-orange-500">Voices</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Upload 10–15s reference WAV clips and provide their transcripts for high-quality voice cloning.
          </p>
        </div>

        {voices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 border border-dashed border-[#222227] rounded-3xl text-neutral-500 bg-[#121215]/40">
            <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
              <Mic2 size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-300">No reference voices uploaded yet</p>
              <p className="text-xs text-neutral-500 mt-1">Click the button in the header to select a .wav file.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {voices.map((v) => (
              <div
                key={v.id}
                className="bg-[#121215] border border-[#1d1d22] rounded-2xl p-5 flex flex-col justify-between gap-5 relative overflow-hidden group shadow-md"
              >
                {/* Card Header */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                    <Mic2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-orange-500 transition-colors">
                      {v.name}
                    </h3>
                    <p className="text-[10px] text-neutral-500 truncate mt-0.5">{v.original_filename}</p>
                  </div>
                </div>

                {/* Transcript Preview */}
                {v.transcript ? (
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-xs text-neutral-400 min-h-12 max-h-24 overflow-y-auto font-sans leading-relaxed">
                    <span className="font-semibold text-neutral-500 block text-[9px] mb-0.5">TRANSCRIPT:</span>
                    &quot;{v.transcript}&quot;
                  </div>
                ) : (
                  <div className="bg-black/10 border border-dashed border-white/5 rounded-xl p-3 text-xs text-neutral-600 italic">
                    No reference transcript provided.
                  </div>
                )}

                {/* Card Footer */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-1">
                  <div className="flex gap-2">
                    {v.duration_seconds && (
                      <Badge className="bg-white/5 border border-white/10 text-neutral-300 text-[10px] px-1.5 py-0.5 rounded-md">
                        {v.duration_seconds.toFixed(1)}s
                      </Badge>
                    )}
                    <Badge className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] px-1.5 py-0.5 rounded-md">WAV</Badge>
                  </div>
                  <span className="text-[9px] text-neutral-600 font-mono">
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal - Upload Voice Reference */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
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
                <label htmlFor="voice-name" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Speaker / Voice Name
                </label>
                <input
                  id="voice-name"
                  type="text"
                  required
                  placeholder="e.g., Antony - Audiobook Reader"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-brand focus:ring-1 focus:ring-brand/50 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none transition-all duration-200"
                />
              </div>

              {/* Transcript Textarea */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="voice-transcript" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={12} /> Reference Transcript (Recommended)
                  </label>
                  <span className="text-[10px] text-orange-500/80 font-medium">Improves cloning accuracy</span>
                </div>
                <textarea
                  id="voice-transcript"
                  rows={4}
                  placeholder="Type or paste the exact words spoken in the 10-15s WAV clip..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 focus:border-brand focus:ring-1 focus:ring-brand/50 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none resize-none transition-all duration-200"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 mt-2">
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
