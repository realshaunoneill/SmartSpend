"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface SpendingChartProps {
  period: "week" | "month" | "year"
}

const mockData = {
  week: [
    { name: "Mon", amount: 45.32 },
    { name: "Tue", amount: 89.5 },
    { name: "Wed", amount: 125.67 },
    { name: "Thu", amount: 78.23 },
    { name: "Fri", amount: 156.89 },
    { name: "Sat", amount: 203.45 },
    { name: "Sun", amount: 92.18 },
  ],
  month: [
    { name: "Week 1", amount: 456.78 },
    { name: "Week 2", amount: 623.45 },
    { name: "Week 3", amount: 789.12 },
    { name: "Week 4", amount: 977.97 },
  ],
  year: [
    { name: "Jan", amount: 2345.67 },
    { name: "Feb", amount: 2156.34 },
    { name: "Mar", amount: 2789.45 },
    { name: "Apr", amount: 3012.89 },
    { name: "May", amount: 2867.23 },
    { name: "Jun", amount: 3156.78 },
    { name: "Jul", amount: 2945.34 },
    { name: "Aug", amount: 3234.56 },
    { name: "Sep", amount: 2876.45 },
    { name: "Oct", amount: 3123.67 },
    { name: "Nov", amount: 2989.34 },
    { name: "Dec", amount: 3456.78 },
  ],
}

// Custom tooltip component that properly uses theme colors
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
        <p className="mb-1 font-semibold text-foreground">{label}</p>
        <p className="text-sm text-foreground">
          <span className="font-medium">Amount:</span> ${payload[0].value?.toFixed(2)}
        </p>
      </div>
    )
  }
  return null
}

export function SpendingChart({ period }: SpendingChartProps) {
  const data = mockData[period]
  const [colors, setColors] = useState({
    primary: "#10b981",
    border: "#e5e7eb",
    muted: "#f3f4f6",
    mutedForeground: "#6b7280",
  })

  useEffect(() => {
    // Get computed CSS variables after component mounts
    const root = document.documentElement
    const styles = getComputedStyle(root)
    
    setColors({
      primary: styles.getPropertyValue("--color-primary").trim() || "#10b981",
      border: styles.getPropertyValue("--color-border").trim() || "#e5e7eb",
      muted: styles.getPropertyValue("--color-muted").trim() || "#f3f4f6",
      mutedForeground: styles.getPropertyValue("--color-muted-foreground").trim() || "#6b7280",
    })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trends</CardTitle>
        <CardDescription>Your spending patterns over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={colors.border}
              opacity={0.5}
            />
            <XAxis 
              dataKey="name" 
              tick={{ fill: colors.mutedForeground, fontSize: 12 }}
              stroke={colors.border}
              tickLine={{ stroke: colors.border }}
            />
            <YAxis 
              tick={{ fill: colors.mutedForeground, fontSize: 12 }}
              stroke={colors.border}
              tickLine={{ stroke: colors.border }}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar 
              dataKey="amount" 
              fill={colors.primary}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
