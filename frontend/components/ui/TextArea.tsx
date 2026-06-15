import { TextareaHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export default function TextArea({ label, hint, className, ...props }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-neutral-300">{label}</label>
      )}
      <textarea
        className={twMerge(
          "w-full rounded-xl bg-surface-card border border-surface-border text-neutral-100 placeholder-neutral-600 px-4 py-3 text-sm resize-none focus:outline-none focus:border-brand transition-colors",
          className
        )}
        {...props}
      />
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
