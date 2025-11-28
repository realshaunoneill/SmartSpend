"use client"

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

export function SpendingChart({ period }: SpendingChartProps) {
  const data = mockData[period]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trends</CardTitle>
        <CardDescription>Your spending patterns over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
