import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatsWidgetProps = {
  title: string;
  value: number | string;
  subtitle?: string;
};

export function StatsWidget({ title, value, subtitle }: StatsWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}
