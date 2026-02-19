import type { HeatmapRow } from "../types";
import { cn } from "@/lib/utils";

const STATUSES = ["observed", "shortlist", "trial", "offer", "signed", "rejected"] as const;

function cellClass(value: number, max: number) {
  if (max <= 0) return "bg-white";
  const ratio = value / max;
  if (value === 0) return "bg-slate-50";
  if (ratio < 0.2) return "bg-blue-50";
  if (ratio < 0.4) return "bg-blue-100";
  if (ratio < 0.6) return "bg-blue-200";
  if (ratio < 0.8) return "bg-blue-300";
  return "bg-blue-400 text-white";
}

export function HeatmapTable({ rows }: { rows: HeatmapRow[] }) {
  const max = rows.reduce((acc, r) => {
    const v = Math.max(r.observed, r.shortlist, r.trial, r.offer, r.signed, r.rejected);
    return Math.max(acc, v);
  }, 0);

  return (
    <div className="overflow-auto rounded-md border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-600">
          <tr>
            <th className="sticky left-0 bg-slate-50 px-3 py-2 text-left">Region</th>
            {STATUSES.map((s) => (
              <th key={s} className="px-3 py-2 text-right">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.region_id ?? r.region_name} className="border-t border-slate-100">
              <td className="sticky left-0 bg-white px-3 py-2 font-medium text-slate-900">
                {r.region_name}
              </td>
              {STATUSES.map((s) => {
                const value = r[s];
                return (
                  <td
                    key={s}
                    className={cn("px-3 py-2 text-right tabular-nums", cellClass(value, max))}
                    title={`${r.region_name} • ${s}: ${value}`}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

