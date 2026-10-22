export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  isActive: boolean;
  soldCount: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  itemCount: number;
}

export const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export const PRODUCT_CATEGORIES = [
  "Semua Kategori",
  "Coffee",
  "Non-Coffee",
  "Pastry & Bakery",
  "Main Course",
  "Snacks",
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    name: "Espresso Single Shot",
    sku: "COF-001",
    category: "Coffee",
    price: 18000,
    stock: 120,
    isAvailable: true,
    isActive: true,
    soldCount: 340,
  },
  {
    id: "prod-2",
    name: "Caffe Latte",
    sku: "COF-002",
    category: "Coffee",
    price: 28000,
    stock: 85,
    isAvailable: true,
    isActive: true,
    soldCount: 520,
  },
  {
    id: "prod-3",
    name: "Cappuccino",
    sku: "COF-003",
    category: "Coffee",
    price: 28000,
    stock: 64,
    isAvailable: true,
    isActive: true,
    soldCount: 412,
  },
  {
    id: "prod-4",
    name: "Caramel Macchiato",
    sku: "COF-004",
    category: "Coffee",
    price: 34000,
    stock: 45,
    isAvailable: true,
    isActive: true,
    soldCount: 290,
  },
  {
    id: "prod-5",
    name: "Matcha Fusion Latte",
    sku: "NCF-001",
    category: "Non-Coffee",
    price: 32000,
    stock: 38,
    isAvailable: true,
    isActive: true,
    soldCount: 310,
  },
  {
    id: "prod-6",
    name: "Earl Grey Artisan Tea",
    sku: "NCF-002",
    category: "Non-Coffee",
    price: 24000,
    stock: 50,
    isAvailable: true,
    isActive: true,
    soldCount: 145,
  },
  {
    id: "prod-7",
    name: "Butter Croissant",
    sku: "BAK-001",
    category: "Pastry & Bakery",
    price: 22000,
    stock: 18,
    isAvailable: true,
    isActive: true,
    soldCount: 198,
  },
  {
    id: "prod-8",
    name: "Pain au Chocolat",
    sku: "BAK-002",
    category: "Pastry & Bakery",
    price: 25000,
    stock: 0,
    isAvailable: false,
    isActive: true,
    soldCount: 160,
  },
  {
    id: "prod-9",
    name: "Smoked Beef Sandwich",
    sku: "MNC-001",
    category: "Main Course",
    price: 42000,
    stock: 15,
    isAvailable: true,
    isActive: true,
    soldCount: 88,
  },
  {
    id: "prod-10",
    name: "Truffle French Fries",
    sku: "SNK-001",
    category: "Snacks",
    price: 26000,
    stock: 30,
    isAvailable: true,
    isActive: true,
    soldCount: 240,
  },
];
