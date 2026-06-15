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
