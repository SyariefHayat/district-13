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
  rating?: number;
  image?: string;
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

export const formatProductPrice = (value: number) => {
  if (value < 500) {
    return `$${value.toFixed(2)}`;
  }
  return formatIDR(value);
};

export const PRODUCT_CATEGORIES = [
  "Semua Kategori",
  "Hoodies",
  "T-Shirts",
  "Pants",
  "Accessories",
  "Coffee",
  "Non-Coffee",
  "Pastry & Bakery",
  "Main Course",
  "Snacks",
];

const hoodieSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%2327272a'/%3E%3Cpath d='M20 9c-3 0-5.5 1.5-6.5 4L8 16l2.5 3 2.5-1.5V31h14V17.5l2.5 1.5 2.5-3-5.5-3c-1-2.5-3.5-4-6.5-4zm0 3c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3z' fill='%23e4e4e7'/%3E%3C/svg%3E";
const tshirtSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%2327272a'/%3E%3Cpath d='M14 9c1 1.5 3.5 2.5 6 2.5s5-1 6-2.5l5 3-2 4-2-1v15H13V15l-2 1-2-4 5-3z' fill='%23e4e4e7'/%3E%3C/svg%3E";
const joggersSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%2327272a'/%3E%3Cpath d='M13 10h14v3l-2 18h-3l-2-12-2 12h-3l-2-18v-3z' fill='%2371717a'/%3E%3C/svg%3E";
const capSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%2327272a'/%3E%3Cpath d='M20 12c-6 0-10 4-10 8h20c0-4-4-8-10-8zm-11 8c0 0-2 4 4 4h18c2 0 4-1 4-2s-2-2-4-2H9z' fill='%23e11d48'/%3E%3C/svg%3E";
const sweatpantsSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%2327272a'/%3E%3Cpath d='M13 10h14v3l-2 18h-3l-2-12-2 12h-3l-2-18v-3z' fill='%23ef4444'/%3E%3C/svg%3E";

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "prod-101",
    name: "Heavyweight Pullover Hoodie",
    sku: "HDX-4821",
    category: "Hoodies",
    price: 64.9,
    stock: 12,
    rating: 4.8,
    isAvailable: true,
    isActive: true,
    soldCount: 154,
    image: hoodieSvg,
  },
  {
    id: "prod-102",
    name: "Classic Crew Neck T-Shirt",
    sku: "TSH-1174",
    category: "T-Shirts",
    price: 24.5,
    stock: 34,
    rating: 4.6,
    isAvailable: true,
    isActive: true,
    soldCount: 280,
    image: tshirtSvg,
  },
  {
    id: "prod-103",
    name: "Tapered Fleece Joggers",
    sku: "PNT-3308",
    category: "Pants",
    price: 49.9,
    stock: 0,
    rating: 4.4,
    isAvailable: false,
    isActive: true,
    soldCount: 95,
    image: joggersSvg,
  },
  {
    id: "prod-104",
    name: "Six-Panel Baseball Cap",
    sku: "ACC-2296",
    category: "Accessories",
    price: 19.99,
    stock: 48,
    rating: 4.7,
    isAvailable: true,
    isActive: true,
    soldCount: 310,
    image: capSvg,
  },
  {
    id: "prod-105",
    name: "Fleece Sweatpants",
    sku: "PNT-7712",
    category: "Pants",
    price: 44.5,
    stock: 7,
    rating: 4.2,
    isAvailable: true,
    isActive: true,
    soldCount: 68,
    image: sweatpantsSvg,
  },
  {
    id: "prod-1",
    name: "Espresso Single Shot",
    sku: "COF-001",
    category: "Coffee",
    price: 18000,
    stock: 120,
    rating: 4.8,
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
    rating: 4.7,
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
    rating: 4.6,
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
    rating: 4.5,
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
    rating: 4.9,
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
    rating: 4.4,
    isAvailable: true,
    isActive: true,
    soldCount: 145,
  },
];
