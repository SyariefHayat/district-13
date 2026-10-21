"use client";

import * as React from "react";
import {
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  subDays,
} from "date-fns";
import { type DateRange } from "react-day-picker";

import { SectionCards } from "@/features/overview/components/SectionCards";
import { ChartBarInteractive } from "@/features/overview/components/ChartBarInteractive";
import { OverviewHeader } from "../components/OverviewHeader";
import { BestSellingProducts } from "../components/BestSellingProducts";
import { BusyHour } from "../components/BusyHour";
import { useOverviewData } from "../hooks/useOverviewData";
import {
  formatIDR,
  type ChartDataPoint,
  type KpiItem,
  type ProductItem,
} from "../data/overviewData";

export default function OverviewPage() {
  const [today] = React.useState(() => new Date());
  const [date, setDate] = React.useState<DateRange | undefined>(() => ({
    from: today,
    to: today,
  }));
  const [preset, setPreset] = React.useState<string>("Today");

  const { data, isLoading, error } = useOverviewData(date, preset);

  // --- Derive display data from API response ---
  const overviewData = React.useMemo(() => {
    const from = date?.from ?? today;
    const to = date?.to ?? from;
    const isSingleDay = isSameDay(from, to);
    const isToday = isSingleDay && isSameDay(from, today);
    const isYesterday = isSingleDay && isSameDay(from, subDays(today, 1));

    const daysDiff = Math.max(
      1,
      Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    // Dynamic comparison text
    let comparisonText = "vs previous period";
    if (isToday) {
      comparisonText = "vs yesterday";
    } else if (isYesterday) {
      comparisonText = "vs day before";
    } else if (preset === "This Week" || preset === "Last 7 Days") {
      comparisonText = "vs last week";
    } else if (preset === "Last 28 Days" || preset === "This Month") {
      comparisonText = "vs last month";
    } else if (preset === "Last Month") {
      comparisonText = "vs 2 months ago";
    } else if (preset === "This Year") {
      comparisonText = "vs last year";
    } else if (isSingleDay) {
      comparisonText = "vs previous day";
    } else {
      comparisonText = `vs prior ${daysDiff} days`;
    }

    // Chart description
    let periodLabel = preset;
    if (preset === "Custom") {
      periodLabel = isSingleDay
        ? format(from, "MMM dd, yyyy")
        : `${format(from, "MMM dd")} - ${format(to, "MMM dd")}`;
    }

    let chartDescription = "";
    if (daysDiff < 28) {
      chartDescription = `Daily trend (last 30 days) • ${periodLabel} highlighted`;
    } else {
      chartDescription = `Daily sales for ${periodLabel}`;
    }

    if (!data) {
      return {
        kpis: [] as KpiItem[],
        chartData: [] as ChartDataPoint[],
        totalSales: 0,
        chartDescription,
        products: [] as ProductItem[],
      };
    }

    // --- KPIs ---
    const fmtTrend = (change: number) =>
      `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;

    const kpis: KpiItem[] = [
      {
        label: "Sales",
        value: formatIDR(data.kpis.sales.value),
        trend: fmtTrend(data.kpis.sales.change),
        trendDescription: comparisonText,
        trendPositive: data.kpis.sales.change >= 0,
      },
      {
        label: "Net Profit",
        value: formatIDR(data.kpis.netProfit.value),
        trend: fmtTrend(data.kpis.netProfit.change),
        trendDescription: comparisonText,
        trendPositive: data.kpis.netProfit.change >= 0,
      },
      {
        label: "Transactions",
        value: data.kpis.transactions.value.toLocaleString("id-ID"),
        trend: fmtTrend(data.kpis.transactions.change),
        trendDescription: comparisonText,
        trendPositive: data.kpis.transactions.change >= 0,
      },
      {
        label: "Avg Transaction",
        value: formatIDR(data.kpis.avgTransaction.value),
        trend: fmtTrend(data.kpis.avgTransaction.change),
        trendDescription: comparisonText,
        trendPositive: data.kpis.avgTransaction.change >= 0,
      },
    ];

    // --- Chart data: fill gaps with 0 so we get a continuous bar chart ---
    let chartStart: Date;
    const chartEnd = to;
    if (daysDiff < 28) {
      chartStart = subDays(to, 29);
    } else {
      chartStart = from;
    }

    const salesMap = new Map(
      data.dailySales.map((d) => [d.date, d.totalSales])
    );
    const intervalDays = eachDayOfInterval({
      start: chartStart,
      end: chartEnd,
    });

    const chartData: ChartDataPoint[] = intervalDays.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const sales = salesMap.get(key) ?? 0;
      const isHighlighted = isWithinInterval(day, {
        start: startOfDay(from),
        end: endOfDay(to),
      });
      return { label: key, sales, isHighlighted };
    });

    const totalSales = chartData
      .filter((item) => item.isHighlighted)
      .reduce((sum, item) => sum + item.sales, 0);

    // --- Products ---
    const products: ProductItem[] = data.products.map((p) => ({
      id: p.productId,
      product: p.productName,
      sold: p.quantitySold,
      sales: p.totalSales,
      category: p.categoryName,
    }));

    return { kpis, chartData, totalSales, chartDescription, products };
  }, [data, date, preset, today]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <OverviewHeader
        date={date}
        onDateChange={setDate}
        preset={preset}
        onPresetChange={setPreset}
      />
      {error && (
        <div className="mx-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300 lg:mx-6">
          {error}
        </div>
      )}
      <SectionCards kpis={overviewData.kpis} isLoading={isLoading} />
      <div className="px-4 lg:px-6">
        <ChartBarInteractive
          data={overviewData.chartData}
          totalSales={overviewData.totalSales}
          description={overviewData.chartDescription}
          isLoading={isLoading}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:px-6 xl:grid-cols-4">
        <BestSellingProducts
          data={overviewData.products}
          isLoading={isLoading}
        />
        <BusyHour
          highlightDay={format(date?.from ?? today, "EEE")}
          apiData={data?.hourlyHeatmap}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
