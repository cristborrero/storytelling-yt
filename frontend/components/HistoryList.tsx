"use client";
import { useEffect, useState } from "react";
import { getHistory, audioUrl } from "@/lib/api";
import type { Generation } from "@/lib/types";
import AudioPlayer from "./ui/AudioPlayer";
import Badge from "./ui/Badge";
import { History, Calendar, Settings2 } from "lucide-react";

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
      <div className="flex items-center justify-center py-24 text-neutral-500 text-sm glass-panel rounded-3xl">
        <span className="w-5 h-5 border-2 border-white/20 border-t-brand rounded-full animate-spin mr-2" />
        Loading generation history...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-neutral-500 glass-panel rounded-3xl">
        <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600">
          <History size={20} />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-neutral-300">No generations yet</p>
          <p className="text-sm text-neutral-500 mt-1">Generate your first audio from the Voice Generator page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="glass-panel glow-card rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
        >
          {/* Top details */}
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-neutral-200 font-medium leading-relaxed flex-1">
              {item.text}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {item.voice_name && (
                <Badge className="bg-brand/10 border border-brand/20 text-brand font-semibold px-2 py-0.5 rounded-lg text-[10px]">
                  {item.voice_name}
                </Badge>
              )}
              {item.duration_seconds && (
                <Badge className="bg-white/5 border border-white/10 text-neutral-300 font-mono px-2 py-0.5 rounded-lg text-[10px]">
                  {item.duration_seconds.toFixed(1)}s
                </Badge>
              )}
            </div>
          </div>

          {/* Audio Player */}
          <div className="w-full">
            <AudioPlayer
              url={audioUrl(item.output_mp3_url ?? item.output_wav_url)}
              filename={item.output_mp3_filename ?? item.output_wav_filename}
            />
          </div>

          {/* Bottom metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4 text-[10px] text-neutral-500 font-mono">
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {new Date(item.created_at).toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg border border-white/5">
              <Settings2 size={10} className="text-neutral-600" />
              <span>temperature: <strong className="text-neutral-300">{(item.cfg_weight).toFixed(2)}</strong></span>
              <span className="text-neutral-700">·</span>
              <span>repetition_penalty: <strong className="text-neutral-300">{(1.0 + item.exaggeration * 0.4).toFixed(2)}</strong></span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
