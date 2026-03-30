type RatingBarProps = {
  label: string;
  value: number;
  max: number;
  className?: string;
};

/** Single row: label (left) | horizontal progress bar (pill) | value (right). */
export function RatingBar({ label, value, max, className = "" }: RatingBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      <span className="min-w-[8rem] font-medium text-slate-700">{label}</span>
      <div className="flex-1 min-w-0 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-red-600 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
