"use client"

import React from "react"
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SeriesItem {
  key: string
  label?: string
  color: string
}

interface AreaChartProps {
  data: Record<string, unknown>[]
  dataKey?: string
  xAxisKey?: string
  xKey?: string
  color?: string
  series?: SeriesItem[]
  title?: string
  className?: string
  height?: number
  formatValue?: (value: number) => string
}

export function AreaChartComponent({
  data,
  dataKey,
  xAxisKey,
  xKey,
  color = "hsl(var(--primary))",
  series,
  title,
  className,
  height = 300,
  formatValue,
}: AreaChartProps) {
  const xField = xAxisKey || xKey || "x"
  const seriesList: SeriesItem[] = series || (dataKey ? [{ key: dataKey, color }] : [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {formatValue ? formatValue(entry.value) : entry.value?.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }

  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {seriesList.map((s, i) => (
            <linearGradient key={i} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
        <XAxis dataKey={xField} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={formatValue} />
        <Tooltip content={<CustomTooltip />} />
        {seriesList.length > 1 && <Legend />}
        {seriesList.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label || s.key}
            stroke={s.color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#grad-${s.key})`}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )

  if (title) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2"><CardTitle className="text-base font-medium">{title}</CardTitle></CardHeader>
        <CardContent className="pb-4">{chart}</CardContent>
      </Card>
    )
  }
  return <div className={className}>{chart}</div>
}

export { AreaChartComponent as AreaChart }
