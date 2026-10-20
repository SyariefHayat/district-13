import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const description = "Sales performance over time";

const chartData = [
  { date: "2024-04-01", sales: 222000 },
  { date: "2024-04-02", sales: 97000 },
  { date: "2024-04-03", sales: 167000 },
  { date: "2024-04-04", sales: 242000 },
  { date: "2024-04-05", sales: 373000 },
  { date: "2024-04-06", sales: 301000 },
  { date: "2024-04-07", sales: 245000 },
  { date: "2024-04-08", sales: 409000 },
  { date: "2024-04-09", sales: 59000 },
  { date: "2024-04-10", sales: 261000 },
  { date: "2024-04-11", sales: 327000 },
  { date: "2024-04-12", sales: 292000 },
  { date: "2024-04-13", sales: 342000 },
  { date: "2024-04-14", sales: 137000 },
  { date: "2024-04-15", sales: 120000 },
  { date: "2024-04-16", sales: 138000 },
  { date: "2024-04-17", sales: 446000 },
  { date: "2024-04-18", sales: 364000 },
  { date: "2024-04-19", sales: 243000 },
  { date: "2024-04-20", sales: 89000 },
  { date: "2024-04-21", sales: 137000 },
  { date: "2024-04-22", sales: 224000 },
  { date: "2024-04-23", sales: 138000 },
  { date: "2024-04-24", sales: 387000 },
  { date: "2024-04-25", sales: 215000 },
  { date: "2024-04-26", sales: 75000 },
  { date: "2024-04-27", sales: 383000 },
  { date: "2024-04-28", sales: 122000 },
  { date: "2024-04-29", sales: 315000 },
  { date: "2024-04-30", sales: 454000 },
  { date: "2024-05-01", sales: 165000 },
  { date: "2024-05-02", sales: 293000 },
  { date: "2024-05-03", sales: 247000 },
  { date: "2024-05-04", sales: 385000 },
  { date: "2024-05-05", sales: 481000 },
  { date: "2024-05-06", sales: 498000 },
  { date: "2024-05-07", sales: 388000 },
  { date: "2024-05-08", sales: 149000 },
  { date: "2024-05-09", sales: 227000 },
  { date: "2024-05-10", sales: 293000 },
  { date: "2024-05-11", sales: 335000 },
  { date: "2024-05-12", sales: 197000 },
  { date: "2024-05-13", sales: 197000 },
  { date: "2024-05-14", sales: 448000 },
  { date: "2024-05-15", sales: 473000 },
  { date: "2024-05-16", sales: 338000 },
  { date: "2024-05-17", sales: 499000 },
  { date: "2024-05-18", sales: 315000 },
  { date: "2024-05-19", sales: 235000 },
  { date: "2024-05-20", sales: 177000 },
  { date: "2024-05-21", sales: 82000 },
  { date: "2024-05-22", sales: 81000 },
  { date: "2024-05-23", sales: 252000 },
  { date: "2024-05-24", sales: 294000 },
  { date: "2024-05-25", sales: 201000 },
  { date: "2024-05-26", sales: 213000 },
  { date: "2024-05-27", sales: 420000 },
  { date: "2024-05-28", sales: 233000 },
  { date: "2024-05-29", sales: 78000 },
  { date: "2024-05-30", sales: 340000 },
  { date: "2024-05-31", sales: 178000 },
  { date: "2024-06-01", sales: 178000 },
  { date: "2024-06-02", sales: 470000 },
  { date: "2024-06-03", sales: 103000 },
  { date: "2024-06-04", sales: 439000 },
  { date: "2024-06-05", sales: 88000 },
  { date: "2024-06-06", sales: 294000 },
  { date: "2024-06-07", sales: 323000 },
  { date: "2024-06-08", sales: 385000 },
  { date: "2024-06-09", sales: 438000 },
  { date: "2024-06-10", sales: 155000 },
  { date: "2024-06-11", sales: 92000 },
  { date: "2024-06-12", sales: 492000 },
  { date: "2024-06-13", sales: 81000 },
  { date: "2024-06-14", sales: 426000 },
  { date: "2024-06-15", sales: 307000 },
  { date: "2024-06-16", sales: 371000 },
  { date: "2024-06-17", sales: 475000 },
  { date: "2024-06-18", sales: 107000 },
  { date: "2024-06-19", sales: 341000 },
  { date: "2024-06-20", sales: 408000 },
  { date: "2024-06-21", sales: 169000 },
  { date: "2024-06-22", sales: 317000 },
  { date: "2024-06-23", sales: 480000 },
  { date: "2024-06-24", sales: 132000 },
  { date: "2024-06-25", sales: 141000 },
  { date: "2024-06-26", sales: 434000 },
  { date: "2024-06-27", sales: 448000 },
  { date: "2024-06-28", sales: 149000 },
  { date: "2024-06-29", sales: 103000 },
  { date: "2024-06-30", sales: 446000 },
];

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Sales Performance</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Daily sales performance
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={[timeRange]}
            onValueChange={(values) => {
              const value = values[0];
              if (value) setTimeRange(value);
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(val) => {
              if (val) setTimeRange(val);
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sales)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(Number(value))
                  }
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("id-ID", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="sales"
              type="natural"
              fill="url(#fillSales)"
              stroke="var(--color-sales)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
