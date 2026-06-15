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
    const file = e.target.files?.[0];
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
