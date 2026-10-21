import { SectionCards } from "@/features/overview/components/SectionCards";
import { ChartBarInteractive } from "@/features/overview/components/ChartBarInteractive";
import { OverviewHeader } from "../components/OverviewHeader";
import { BestSellingProducts } from "../components/BestSellingProducts";
import { BusyHour } from "../components/BusyHour";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <OverviewHeader />
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartBarInteractive />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:px-6 xl:grid-cols-4">
        <BestSellingProducts />
        <BusyHour />
      </div>
    </div>
  );
}
