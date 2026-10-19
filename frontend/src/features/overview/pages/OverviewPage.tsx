import { SectionCards } from "@/components/modules/dashboard/SectionCards";
import { ChartAreaInteractive } from "@/components/modules/dashboard/ChartAreaInteractive";
import { DataTable } from "@/components/modules/dashboard/DataTable";
import data from "@/components/layouts/data.json";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </div>
  );
}
