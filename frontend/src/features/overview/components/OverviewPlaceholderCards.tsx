import {
  IconCash,
  IconClockHour4,
  IconReceipt2,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BestSellingProducts } from "./BestSellingProducts";

export function OverviewPlaceholderCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:px-6 xl:grid-cols-4">
      <BestSellingProducts />
      <Card className="gap-0 py-0 xl:col-span-1">
        <CardHeader className="border-b py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconClockHour4 className="size-4" />
            </span>
            Busy Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-48 flex-col justify-center gap-5 p-5">
          <div>
            <p className="text-sm text-muted-foreground">
              Peak transaction hour
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
              12.00–13.00
            </p>
          </div>
          <div className="flex items-center gap-2 border-t pt-4 text-sm">
            <IconReceipt2 className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Peak day</span>
            <span className="ml-auto font-medium">Saturday</span>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 xl:col-span-1">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Operational Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4">
          <div className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IconReceipt2 className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Active Shift</p>
              <p className="text-sm text-muted-foreground">
                2 cashier shifts currently open
              </p>
            </div>
          </div>
          <div className="flex gap-3 border-t pt-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <IconAlertTriangle className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Inventory Alert</p>
              <p className="text-sm text-muted-foreground">
                3 products below minimum stock
              </p>
            </div>
          </div>
          <div className="flex gap-3 border-t pt-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <IconCash className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Cash Flow</p>
              <p className="text-sm text-muted-foreground">
                Cash inflow and outflow summary
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
