import {
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  startOfYear,
} from "date-fns";
import { type DateRange } from "react-day-picker";

export type DatePreset =
  | "Today"
  | "Yesterday"
  | "This Week"
  | "Last 7 Days"
  | "Last 28 Days"
  | "This Month"
  | "Last Month"
  | "This Year"
  | "Custom";

export interface KpiItem {
  label: string;
  value: string;
  trend: string;
  trendDescription?: string;
  trendPositive: boolean;
}

export interface ChartDataPoint {
  label: string;
  sales: number;
  isHighlighted: boolean;
}

export interface ProductItem {
  id: string;
  product: string;
  sold: number;
  sales: number;
  image?: string;
  category?: string;
}

export const getPresetRanges = (today: Date) => [
  { label: "Today", range: () => ({ from: today, to: today }) },
  {
    label: "Yesterday",
    range: () => {
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: yesterday };
    },
  },
  {
    label: "This Week",
    range: () => ({
      from: startOfWeek(today, { weekStartsOn: 1 }),
      to: today,
    }),
  },
  {
    label: "Last 7 Days",
    range: () => ({ from: subDays(today, 6), to: today }),
  },
  {
    label: "Last 28 Days",
    range: () => ({ from: subDays(today, 27), to: today }),
  },
  {
    label: "This Month",
    range: () => ({ from: startOfMonth(today), to: today }),
  },
  {
    label: "Last Month",
    range: () => {
      const lastMonth = subMonths(today, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    },
  },
  {
    label: "This Year",
    range: () => ({ from: startOfYear(today), to: today }),
  },
];

export const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const baseProducts = [
  {
    id: "1",
    product: "Sports Shoes",
    basePrice: 316000,
    baseQty: 32,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80",
    category: "Footwear",
  },
  {
    id: "2",
    product: "Black T-Shirt",
    basePrice: 274000,
    baseQty: 28,
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "3",
    product: "Jeans",
    basePrice: 195000,
    baseQty: 24,
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "4",
    product: "Red Sneakers",
    basePrice: 402000,
    baseQty: 22,
    image:
      "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=100&auto=format&fit=crop&q=80",
    category: "Footwear",
  },
  {
    id: "5",
    product: "Red Scarf",
    basePrice: 280000,
    baseQty: 19,
    image:
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "6",
    product: "Kitchen Accessory",
    basePrice: 150000,
    baseQty: 18,
    image:
      "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=100&auto=format&fit=crop&q=80",
    category: "Kitchen",
  },
  {
    id: "7",
    product: "Bicycle",
    basePrice: 316000,
    baseQty: 16,
    image:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=100&auto=format&fit=crop&q=80",
    category: "Sports",
  },
  {
    id: "8",
    product: "Sports Shoes v2",
    basePrice: 290000,
    baseQty: 15,
    image:
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=100&auto=format&fit=crop&q=80",
    category: "Footwear",
  },
  {
    id: "9",
    product: "Leather Jacket",
    basePrice: 450000,
    baseQty: 14,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "10",
    product: "Running Cap",
    basePrice: 85000,
    baseQty: 13,
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "11",
    product: "Classic Watch",
    basePrice: 520000,
    baseQty: 12,
    image:
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "12",
    product: "Denim Jacket",
    basePrice: 210000,
    baseQty: 11,
    image:
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "13",
    product: "Wireless Earbuds",
    basePrice: 175000,
    baseQty: 10,
    image:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=100&auto=format&fit=crop&q=80",
    category: "Electronics",
  },
  {
    id: "14",
    product: "Canvas Backpack",
    basePrice: 130000,
    baseQty: 9,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "15",
    product: "Sunglasses",
    basePrice: 95000,
    baseQty: 8,
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "16",
    product: "Winter Beanie",
    basePrice: 45000,
    baseQty: 7,
    image:
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "17",
    product: "Smart Fitness Band",
    basePrice: 110000,
    baseQty: 6,
    image:
      "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=100&auto=format&fit=crop&q=80",
    category: "Electronics",
  },
  {
    id: "18",
    product: "Silk Tie",
    basePrice: 65000,
    baseQty: 5,
    image:
      "https://images.unsplash.com/photo-1589756823695-278bc923f962?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
  {
    id: "19",
    product: "Casual Hoodie",
    basePrice: 230000,
    baseQty: 4,
    image:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=100&auto=format&fit=crop&q=80",
    category: "Clothing",
  },
  {
    id: "20",
    product: "Travel Duffel Bag",
    basePrice: 340000,
    baseQty: 3,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&auto=format&fit=crop&q=80",
    category: "Accessories",
  },
];

export function getOverviewData(
  date: DateRange | undefined,
  preset: string,
  today: Date = new Date()
) {
  const from = date?.from ?? today;
  const to = date?.to ?? from;
  const isSingleDay = isSameDay(from, to);
  const isToday = isSingleDay && isSameDay(from, today);
  const isYesterday = isSingleDay && isSameDay(from, subDays(today, 1));

  const daysDiff = Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  let periodLabel = "Today";

  if (isToday) {
    periodLabel = "Today";
  } else if (isYesterday) {
    periodLabel = "Yesterday";
  } else if (preset === "This Week" || preset === "Last 7 Days") {
    periodLabel = preset;
  } else if (preset === "Last 28 Days" || preset === "This Month") {
    periodLabel = preset;
  } else if (preset === "Last Month") {
    periodLabel = "Last Month";
  } else if (preset === "This Year") {
    periodLabel = "This Year";
  } else {
    periodLabel = isSingleDay
      ? format(from, "MMM dd, yyyy")
      : `${format(from, "MMM dd")} - ${format(to, "MMM dd")}`;
  }

  // 1. Chart Data: Rolling 30 days if range is small, or selected interval
  let chartStart: Date;
  let chartEnd: Date;

  if (daysDiff < 28) {
    // Show rolling 30-day window ending at `to` so there are always ~30 bars
    chartStart = subDays(to, 29);
    chartEnd = to;
  } else {
    chartStart = from;
    chartEnd = to;
  }

  const intervalDays = eachDayOfInterval({ start: chartStart, end: chartEnd });

  const chartData: ChartDataPoint[] = intervalDays.map((day, idx) => {
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const wave = Math.sin(idx / 3) * 0.25 + 1;
    const baseDaily = 2400000 * wave * (isWeekend ? 1.25 : 0.95);
    const sales = Math.round(baseDaily / 1000) * 1000;

    const isHighlighted = isWithinInterval(day, {
      start: startOfDay(from),
      end: endOfDay(to),
    });

    return {
      label: format(day, "yyyy-MM-dd"),
      sales,
      isHighlighted,
    };
  });

  // Selected period total sales
  const selectedPeriodSales = chartData
    .filter((item) => item.isHighlighted)
    .reduce((sum, item) => sum + item.sales, 0);

  // Description for chart card
  let chartDescription = "";
  if (isToday) {
    chartDescription = "Daily trend (last 30 days) • Today highlighted";
  } else if (isYesterday) {
    chartDescription = "Daily trend (last 30 days) • Yesterday highlighted";
  } else if (preset === "This Week" || preset === "Last 7 Days") {
    chartDescription = `Daily trend (last 30 days) • ${preset} highlighted`;
  } else if (daysDiff < 28) {
    chartDescription = `Daily trend (last 30 days) • ${periodLabel} highlighted`;
  } else {
    chartDescription = `Daily sales for ${periodLabel}`;
  }

  // Dynamic comparison text based on period
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

  // 2. KPIs
  const netProfit = Math.round(selectedPeriodSales * 0.28);
  const avgTicket = isSingleDay ? 58000 : 64000;
  const transactions = Math.max(1, Math.round(selectedPeriodSales / avgTicket));
  const cashBalance = 13100000;

  const kpis: KpiItem[] = [
    {
      label: "Sales",
      value: formatIDR(selectedPeriodSales),
      trend: isToday ? "+12.4%" : "+8.4%",
      trendDescription: comparisonText,
      trendPositive: true,
    },
    {
      label: "Net Profit",
      value: formatIDR(netProfit),
      trend: isToday ? "+9.1%" : "+6.2%",
      trendDescription: comparisonText,
      trendPositive: true,
    },
    {
      label: "Transactions",
      value: transactions.toLocaleString("id-ID"),
      trend: isToday ? "+15.0%" : "+12.0%",
      trendDescription: comparisonText,
      trendPositive: true,
    },
    {
      label: "Cash Balance",
      value: formatIDR(cashBalance),
      trend: "+3.1%",
      trendDescription: isToday ? "daily cash inflow" : comparisonText,
      trendPositive: true,
    },
  ];

  // 3. Best Selling Products for the period
  const products: ProductItem[] = baseProducts.map((p, idx) => {
    const randomVariation = 1 + (idx % 3) * 0.1 - 0.05;
    const scaledQty = Math.max(
      1,
      Math.round(
        (isSingleDay
          ? Math.max(1, Math.round(p.baseQty / 4))
          : p.baseQty * Math.max(1, daysDiff / 4)) * randomVariation
      )
    );

    return {
      id: p.id,
      product: p.product,
      sold: p.basePrice,
      sales: scaledQty,
      image: p.image,
      category: p.category,
    };
  });

  return {
    isToday,
    isSingleDay,
    periodLabel,
    chartDescription,
    chartData,
    totalSales: selectedPeriodSales,
    kpis,
    products,
  };
}
