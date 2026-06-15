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
