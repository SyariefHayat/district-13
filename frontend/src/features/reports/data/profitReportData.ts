export interface ProductProfitItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitsSold: number;
  sellingPrice: number;
  costPrice: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  profitMargin: number; // percentage, e.g. 68.0
}

export interface ProfitReportSummary {
  netRevenue: number;
  totalCogs: number;
  grossProfit: number;
  profitMargin: number; // percentage
  totalUnitsSold: number;
  productCount: number;
}

export const SAMPLE_PROFIT_PRODUCTS: ProductProfitItem[] = [
  {
    id: "prf-001",
    name: "Kopi Susu Aren",
    sku: "KOP-001",
    category: "Coffee",
    unitsSold: 285,
    sellingPrice: 25000,
    costPrice: 8000,
    totalRevenue: 7125000,
    totalCogs: 2280000,
    grossProfit: 4845000,
    profitMargin: 68.0,
  },
  {
    id: "prf-002",
    name: "Manual Brew V60",
    sku: "KOP-002",
    category: "Coffee",
    unitsSold: 142,
    sellingPrice: 40000,
    costPrice: 15000,
    totalRevenue: 5680000,
    totalCogs: 2130000,
    grossProfit: 3550000,
    profitMargin: 62.5,
  },
  {
    id: "prf-003",
    name: "Caramel Macchiato",
    sku: "KOP-003",
    category: "Coffee",
    unitsSold: 168,
    sellingPrice: 35000,
    costPrice: 12000,
    totalRevenue: 5880000,
    totalCogs: 2016000,
    grossProfit: 3864000,
    profitMargin: 65.7,
  },
  {
    id: "prf-004",
    name: "Matcha Latte",
    sku: "NON-001",
    category: "Non-Coffee",
    unitsSold: 195,
    sellingPrice: 35000,
    costPrice: 13500,
    totalRevenue: 6825000,
    totalCogs: 2632500,
    grossProfit: 4192500,
    profitMargin: 61.4,
  },
  {
    id: "prf-005",
    name: "Signature Milk Tea",
    sku: "NON-002",
    category: "Non-Coffee",
    unitsSold: 210,
    sellingPrice: 30000,
    costPrice: 10500,
    totalRevenue: 6300000,
    totalCogs: 2205000,
    grossProfit: 4095000,
    profitMargin: 65.0,
  },
  {
    id: "prf-006",
    name: "Butter Croissant",
    sku: "PAS-001",
    category: "Pastry",
    unitsSold: 130,
    sellingPrice: 25000,
    costPrice: 12000,
    totalRevenue: 3250000,
    totalCogs: 1560000,
    grossProfit: 1690000,
    profitMargin: 52.0,
  },
  {
    id: "prf-007",
    name: "Beef Puff Pastry",
    sku: "PAS-002",
    category: "Pastry",
    unitsSold: 98,
    sellingPrice: 40000,
    costPrice: 24000,
    totalRevenue: 3920000,
    totalCogs: 2352000,
    grossProfit: 1568000,
    profitMargin: 40.0,
  },
  {
    id: "prf-008",
    name: "Tuna Melt Sandwich",
    sku: "MAK-001",
    category: "Makanan",
    unitsSold: 85,
    sellingPrice: 50000,
    costPrice: 28000,
    totalRevenue: 4250000,
    totalCogs: 2380000,
    grossProfit: 1870000,
    profitMargin: 44.0,
  },
  {
    id: "prf-009",
    name: "Cheesy French Fries",
    sku: "SNK-001",
    category: "Snack",
    unitsSold: 175,
    sellingPrice: 35000,
    costPrice: 14000,
    totalRevenue: 6125000,
    totalCogs: 2450000,
    grossProfit: 3675000,
    profitMargin: 60.0,
  },
  {
    id: "prf-010",
    name: "Belgian Butter Waffle",
    sku: "SNK-002",
    category: "Snack",
    unitsSold: 112,
    sellingPrice: 45000,
    costPrice: 19000,
    totalRevenue: 5040000,
    totalCogs: 2128000,
    grossProfit: 2912000,
    profitMargin: 57.8,
  },
];

export const calculateProfitSummary = (
  items: ProductProfitItem[]
): ProfitReportSummary => {
  const netRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalCogs = items.reduce((sum, item) => sum + item.totalCogs, 0);
  const grossProfit = netRevenue - totalCogs;
  const profitMargin =
    netRevenue > 0 ? Number(((grossProfit / netRevenue) * 100).toFixed(1)) : 0;
  const totalUnitsSold = items.reduce((sum, item) => sum + item.unitsSold, 0);

  return {
    netRevenue,
    totalCogs,
    grossProfit,
    profitMargin,
    totalUnitsSold,
    productCount: items.length,
  };
};

export const SAMPLE_PROFIT_SUMMARY: ProfitReportSummary =
  calculateProfitSummary(SAMPLE_PROFIT_PRODUCTS);
