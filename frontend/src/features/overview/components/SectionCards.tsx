import {
  IconCash,
  IconCoin,
  IconReceipt,
  IconShoppingCart,
  IconTrendingUp,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const kpis = [
  {
    label: "Sales",
    value: "Rp 12.450.000",
    Icon: IconShoppingCart,
    trend: "+8.4%",
  },
  {
    label: "Net Profit",
    value: "Rp 3.240.000",
    Icon: IconCoin,
    trend: "+6.2%",
  },
  {
    label: "Transactions",
    value: "186",
    Icon: IconReceipt,
    trend: "+12.0%",
  },
  {
    label: "Cash Balance",
    value: "Rp 13.100.000",
    Icon: IconCash,
    trend: "+3.1%",
  },
];

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {kpis.map((kpi) => (
        <Card className="@container/card" key={kpi.label}>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <kpi.Icon className="size-4" />
              {kpi.label}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {kpi.value}
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            <Badge variant="outline">
              <IconTrendingUp className="size-4" />
              {kpi.trend}
            </Badge>
            <span className="ml-2">vs previous period</span>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
