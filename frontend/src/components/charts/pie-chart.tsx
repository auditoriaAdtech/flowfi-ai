"use client"

import React from "react"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const DEFAULT_COLORS = [
  "hsl(250, 60%, 50%)", "hsl(180, 60%, 45%)", "hsl(340, 60%, 50%)",
  "hsl(40, 80%, 50%)", "hsl(120, 50%, 45%)", "hsl(280, 50%, 55%)",
  "hsl(200, 70%, 50%)", "hsl(15, 70%, 50%)", "hsl(60, 60%, 45%)",
]

interface PieDataItem {
  name: string
  value: number
  color?: string
}

interface PieChartProps {
  data: PieDataItem[]
  title?: string
  className?: string
  height?: number
  donut?: boolean
  showLegend?: boolean
  formatValue?: (value: number) => string
}

export function PieChartComponent({
  data,
  title,
  className,
  height = 300,
  donut = false,
  showLegend = true,
  formatValue,
}: PieChartProps) {
  const coloredData = data.map((item, i) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }))
  const total = coloredData.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const item = payload[0]
    const percent = ((item.value / total) * 100).toFixed(1)
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.payload.color }}
          />
          <span className="text-sm font-medium">{item.name}</span>
        </div>
        <p className="mt-1 text-sm font-semibold">
          {formatValue ? formatValue(item.value) : item.value.toLocaleString()}
          <span className="ml-1 text-xs text-muted-foreground">
            ({percent}%)
          </span>
        </p>
      </div>
    )
  }

  const renderCustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={coloredData}
          cx="50%"
          cy="50%"
          innerRadius={donut ? "55%" : 0}
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {coloredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend content={renderCustomLegend} />}
      </RechartsPieChart>
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

export { PieChartComponent as PieChart };
