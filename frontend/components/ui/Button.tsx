import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand hover:bg-brand-dark text-white font-semibold shadow-lg shadow-orange-900/20",
  ghost:
    "bg-transparent hover:bg-surface-hover text-neutral-300 hover:text-white",
  outline:
    "border border-surface-border hover:border-brand text-neutral-300 hover:text-white bg-transparent",
};

export default function Button({
  variant = "primary",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
