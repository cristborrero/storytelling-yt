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
