"use client";
import { InputHTMLAttributes } from "react";

interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  valueLabel?: string;
}

export default function Slider({ label, valueLabel, ...props }: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-neutral-300">{label}</label>
        {valueLabel !== undefined && (
          <span className="text-sm font-mono text-brand">{valueLabel}</span>
        )}
      </div>
      <input
        type="range"
        className="w-full h-1.5 rounded-full appearance-none bg-surface-border cursor-pointer accent-brand"
        {...props}
      />
    </div>
  );
}
