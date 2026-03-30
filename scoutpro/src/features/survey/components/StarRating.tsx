import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  className?: string;
};

export function StarRating({ value, onChange, max = 5, className }: StarRatingProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} gwiazdka`}
          className="text-2xl transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
          onMouseEnter={() => {}}
          onClick={() => onChange(star)}
        >
          {star <= value ? (
            <span className="text-yellow-400">★</span>
          ) : (
            <span className="text-slate-300">☆</span>
          )}
        </button>
      ))}
    </div>
  );
}
