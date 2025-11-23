"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, Pie, PieChart, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { Follower } from "@/lib/mock-data"

type AnalyticsChartsProps = {
  followers: Follower[]
}

export function AnalyticsCharts({ followers }: AnalyticsChartsProps) {
  // Compute Status Distribution
  const statusData = useMemo(() => {
    const counts = followers.reduce(
      (acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return [
      { status: "Following", count: counts["Following"] || 0, fill: "var(--color-chart-1)" },
      { status: "Follower", count: counts["Follower"] || 0, fill: "var(--color-chart-2)" },
      { status: "Blocked", count: counts["Blocked"] || 0, fill: "var(--color-chart-5)" },
    ]
  }, [followers])

  // Compute Join Year Distribution
  const joinYearData = useMemo(() => {
    const counts = followers.reduce(
      (acc, curr) => {
        const year = curr.joinedDate.split("-")[0]
        acc[year] = (acc[year] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(counts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year))
  }, [followers])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4 bg-background/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Join Date Distribution</CardTitle>
          <CardDescription>When your network joined Twitter</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: {
                label: "Users",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px] w-full"
          >
            <BarChart accessibilityLayer data={joinYearData} margin={{ top: 20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" className="opacity-50" />
              <XAxis
                dataKey="year"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)" }}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-chart-1)" radius={4}>
                <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="col-span-3 bg-background/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Network Status</CardTitle>
          <CardDescription>Distribution of your connections</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={{
              Following: {
                label: "Following",
                color: "hsl(var(--chart-1))",
              },
              Follower: {
                label: "Followers",
                color: "hsl(var(--chart-2))",
              },
              Blocked: {
                label: "Blocked",
                color: "hsl(var(--chart-5))",
              },
            }}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={statusData} dataKey="count" nameKey="status" innerRadius={60} strokeWidth={5} paddingAngle={2}>
                <LabelList
                  dataKey="status"
                  className="fill-background"
                  stroke="none"
                  fontSize={12}
                  formatter={(value: keyof typeof statusData) => statusData[value]}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
