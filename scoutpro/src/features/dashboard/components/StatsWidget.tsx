import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type StatsWidgetProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
};

export function StatsWidget({ title, value, subtitle, icon }: StatsWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-3 px-6">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{title}</span>
          {icon && <span className="text-slate-400">{icon}</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-1 px-6">
        <div className="text-3xl font-semibold text-slate-900">{value}</div>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}
