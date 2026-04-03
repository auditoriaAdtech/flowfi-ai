"use client"

import React from "react"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BarConfig {
  dataKey: string
  color: string
  name?: string
  radius?: number
}

interface BarChartProps {
  data: Record<string, unknown>[]
  bars?: BarConfig[]
  xAxisKey?: string
  xKey?: string
  yKey?: string
  color?: string
  title?: string
  className?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  stacked?: boolean
  formatValue?: (value: number) => string
}

export function BarChartComponent({
  data,
  bars: barsProp,
  xAxisKey,
  xKey,
  yKey,
  color = "hsl(var(--primary))",
  title,
  className,
  height = 300,
  showGrid = true,
  showLegend = false,
  stacked = false,
  formatValue,
}: BarChartProps) {
  const xField = xAxisKey || xKey || "name"
  const bars = barsProp || [{ dataKey: yKey || "value", color, name: "Value" }]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="mb-1 text-xs text-muted-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.name}:
            </span>
            <span className="text-sm font-semibold">
              {formatValue
                ? formatValue(entry.value)
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xField}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatValue}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name || bar.dataKey}
            fill={bar.color}
            radius={bar.radius ?? [4, 4, 0, 0]}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )

  if (title) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">{chart}</CardContent>
      </Card>
    )
  }

  return <div className={className}>{chart}</div>
}

export { BarChartComponent as BarChart };
