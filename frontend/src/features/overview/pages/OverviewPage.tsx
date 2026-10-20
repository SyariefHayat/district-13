import { SectionCards } from "@/features/overview/components/SectionCards";
import { ChartAreaInteractive } from "@/features/overview/components/ChartAreaInteractive";
import { DataTable } from "@/features/overview/components/DataTable";
import { OverviewPlaceholderCards } from "@/features/overview/components/OverviewPlaceholderCards";
import data from "@/components/layouts/data.json";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <OverviewPlaceholderCards />
      <DataTable data={data} />
    </div>
  );
}
