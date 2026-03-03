import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { MotorEvaluation } from "../api/motorEvaluations.api";

const MOTOR_LABELS: Record<keyof Pick<MotorEvaluation, "speed" | "endurance" | "jumping" | "agility" | "acceleration" | "strength">, string> = {
  speed: "Szybkość",
  endurance: "Wytrzymałość",
  jumping: "Skoczność",
  agility: "Zwinność",
  acceleration: "Przyspieszenie",
  strength: "Siła",
};

const MOTOR_KEYS = ["speed", "endurance", "jumping", "agility", "acceleration", "strength"] as const;

function motorToChartData(motor: MotorEvaluation): { subject: string; value: number; fullMark: number }[] {
  return MOTOR_KEYS.map((key) => ({
    subject: MOTOR_LABELS[key],
    value: motor[key] ?? 0,
    fullMark: 5,
  }));
}

type MotorRadarChartProps = {
  motor: MotorEvaluation | null;
  className?: string;
};

export function MotorRadarChart({ motor, className }: MotorRadarChartProps) {
  if (!motor) return null;
  const data = motorToChartData(motor);
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
          <Radar name="Motoryka" dataKey="value" stroke="#dc2626" fill="#dc2626" fillOpacity={0.4} />
          <Tooltip formatter={(value: number | undefined) => [value ?? 0, "Ocena"]} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
