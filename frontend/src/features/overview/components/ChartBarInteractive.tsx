"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { type ChartDataPoint, formatIDR } from "../data/overviewData";
import { Skeleton } from "@/components/ui/skeleton";

const defaultData: ChartDataPoint[] = [];

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface ChartBarInteractiveProps {
  data?: ChartDataPoint[];
  totalSales?: number;
  description?: string;
  isLoading?: boolean;
}

export function ChartBarInteractive({
  data = defaultData,
  totalSales,
  description = "Daily sales trend (last 30 days)",
  isLoading,
}: ChartBarInteractiveProps) {
  const displayTotal =
    totalSales ??
    data
      .filter((item) => item.isHighlighted)
      .reduce((sum, item) => sum + item.sales, 0);

  const formatXAxisTick = (value: string) => {
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTooltipLabel = (value: unknown) => {
    const val = String(value);
    const dateStr = new Date(`${val}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return dateStr;
  };

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>Sales Performance</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex flex-col justify-center gap-1 border-t px-6 py-4 sm:border-t-0 sm:border-l sm:px-8 sm:py-6">
          <span className="text-xs text-muted-foreground">Total Sales</span>
          <span className="text-lg leading-none font-bold sm:text-3xl">
            {isLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              formatIDR(displayTotal)
            )}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={formatXAxisTick}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={formatTooltipLabel}
                  formatter={(value, _name, item) => {
                    const point = item?.payload as ChartDataPoint | undefined;
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">
                          {formatIDR(Number(value))}
                        </span>
                        {point?.isHighlighted && (
                          <span className="text-[10px] text-primary font-medium">
                            (Selected)
                          </span>
                        )}
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.label}-${index}`}
                  fill="var(--color-sales)"
                  fillOpacity={entry.isHighlighted ? 1 : 0.35}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
