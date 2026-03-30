import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import type { TrendsBucket } from "../types";

export function TrendsChart({ buckets }: { buckets: TrendsBucket[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={buckets}>
          <XAxis dataKey="t" tick={{ fontSize: 12 }} minTickGap={16} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="first_contact" name="First Contact" stroke="#3B82F6" dot={false} />
          <Line type="monotone" dataKey="observed" name="Observed" stroke="#2563EB" dot={false} />
          <Line type="monotone" dataKey="in_contact" name="Kontakt" stroke="#7C3AED" dot={false} />
          <Line type="monotone" dataKey="evaluation" name="Weryfikacja" stroke="#F59E0B" dot={false} />
          <Line type="monotone" dataKey="offer" name="Offer" stroke="#10B981" dot={false} />
          <Line type="monotone" dataKey="signed" name="Signed" stroke="#059669" dot={false} />
          <Line type="monotone" dataKey="rejected_by_club" name="Odrzucony (klub)" stroke="#EF4444" dot={false} />
          <Line type="monotone" dataKey="rejected_by_player" name="Odrzucony (zawodnik)" stroke="#F87171" dot={false} />
          <Line type="monotone" dataKey="out_of_reach" name="Poza zasięgiem" stroke="#94A3B8" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

