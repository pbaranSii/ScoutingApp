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
          <Line type="monotone" dataKey="shortlist" name="Shortlist" stroke="#7C3AED" dot={false} />
          <Line type="monotone" dataKey="trial" name="Trial" stroke="#F59E0B" dot={false} />
          <Line type="monotone" dataKey="offer" name="Offer" stroke="#10B981" dot={false} />
          <Line type="monotone" dataKey="signed" name="Signed" stroke="#059669" dot={false} />
          <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#EF4444" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

