"use client";

import * as React from "react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";

import { SectionCards } from "@/features/overview/components/SectionCards";
import { ChartBarInteractive } from "@/features/overview/components/ChartBarInteractive";
import { OverviewHeader } from "../components/OverviewHeader";
import { BestSellingProducts } from "../components/BestSellingProducts";
import { BusyHour } from "../components/BusyHour";
import { getOverviewData } from "../data/overviewData";

export default function OverviewPage() {
  const [today] = React.useState(() => new Date());
  const [date, setDate] = React.useState<DateRange | undefined>(() => ({
    from: today,
    to: today,
  }));
  const [preset, setPreset] = React.useState<string>("Today");

  const overviewData = React.useMemo(
    () => getOverviewData(date, preset, today),
    [date, preset, today]
  );

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <OverviewHeader
        date={date}
        onDateChange={setDate}
        preset={preset}
        onPresetChange={setPreset}
      />
      <SectionCards kpis={overviewData.kpis} />
      <div className="px-4 lg:px-6">
        <ChartBarInteractive
          data={overviewData.chartData}
          totalSales={overviewData.totalSales}
          description={overviewData.chartDescription}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:px-6 xl:grid-cols-4">
        <BestSellingProducts data={overviewData.products} />
        <BusyHour highlightDay={format(date?.from ?? today, "EEE")} />
      </div>
    </div>
  );
}
