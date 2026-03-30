import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

type ComparisonItem = {
  id: string;
  label: string;
  first_contact: number;
  signed: number;
  success_rate: number;
};

export function ComparisonsChart({ items }: { items: ComparisonItem[] }) {
  const data = items.slice(0, 12);
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="first_contact" name="First Contact" fill="#3B82F6" />
          <Bar dataKey="signed" name="Signed" fill="#059669" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

