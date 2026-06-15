export default function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-card border border-surface-border text-neutral-400">
      {children}
    </span>
  );
}
