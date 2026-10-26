
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ClientPartition } from "../mock-data/datasetPartition";

export type ChartMode = "percentage" | "count";

type Props = {
  partitions: ClientPartition[];
  numClasses: number;
  mode: ChartMode;
  height?: number;
};

const CLASS_COLORS = [
  "#2563eb",
  "#f59e0b",
  "#16a34a",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#64748b",
];

export function DatasetStackedBarChart({
  partitions,
  numClasses,
  mode,
  height = 520
}: Props) {
  const data = partitions.map((partition) => {
    const row: Record<string, string | number> = {
      clientId: partition.clientId,
    };

    partition.classCounts.forEach((count, index) => {
      row[`class${index}`] =
        mode === "percentage"
          ? partition.totalSamples > 0
            ? (count / partition.totalSamples) * 100
            : 0
          : count;
    });

    return row;
  });

  const maxSamples = Math.max(
    1,
    ...partitions.map((p) => p.totalSamples)
  );

  return (
    <div
      className="dataset-chart-container"
      style={{ width: "100%", height, minWidth: 0 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 15,
            right: 25,
            left: 10,
            bottom: 15,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="clientId"
            angle={-35}
            textAnchor="end"
            height={65}
            tick={{ fontSize: 12 }}
            interval={0}
          />

          <YAxis
            domain={
              mode === "percentage"
                ? [0, 100]
                : [0, maxSamples]
            }
            tickFormatter={(value: number) =>
              mode === "percentage"
                ? `${value}%`
                : String(value)
            }
            tick={{ fontSize: 12 }}
          />

          <Tooltip
            formatter={(value, name) => [
              mode === "percentage"
                ? `${Number(value ?? 0).toFixed(2)}%`
                : `${value ?? 0} samples`,
              String(name),
            ]}
          />

          <Legend
            verticalAlign="bottom"
            align="center"
            height={65}
            wrapperStyle={{
              fontSize: 12,
            }}
          />

          {Array.from({ length: numClasses }, (_, index) => (
            <Bar
              key={index}
              dataKey={`class${index}`}
              name={`Class ${index}`}
              stackId="classes"
              fill={CLASS_COLORS[index % CLASS_COLORS.length]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
