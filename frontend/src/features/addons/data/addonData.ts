export interface AddonItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isActive: boolean;
  linkedProductsCount: number;
}

export const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export const ADDON_CATEGORIES = [
  "Semua Kategori",
  "Espresso & Kopi",
  "Susu Alternatif",
  "Sirup & Pemanis",
  "Topping Minuman",
  "Topping & Saus Makanan",
];

export const INITIAL_ADDONS: AddonItem[] = [
  {
    id: "add-1",
    name: "Extra Espresso Shot",
    category: "Espresso & Kopi",
    price: 6000,
    isActive: true,
    linkedProductsCount: 8,
  },
  {
    id: "add-2",
    name: "Oat Milk (Gluten-Free)",
    category: "Susu Alternatif",
    price: 10000,
    isActive: true,
    linkedProductsCount: 12,
  },
  {
    id: "add-3",
    name: "Almond Milk",
    category: "Susu Alternatif",
    price: 10000,
    isActive: true,
    linkedProductsCount: 12,
  },
  {
    id: "add-4",
    name: "Soy Milk",
    category: "Susu Alternatif",
    price: 8000,
    isActive: true,
    linkedProductsCount: 10,
  },
  {
    id: "add-5",
    name: "Vanilla Syrup Pump",
    category: "Sirup & Pemanis",
    price: 5000,
    isActive: true,
    linkedProductsCount: 15,
  },
  {
    id: "add-6",
    name: "Caramel Sauce Drizzle",
    category: "Sirup & Pemanis",
    price: 5000,
    isActive: true,
    linkedProductsCount: 14,
  },
  {
    id: "add-7",
    name: "Hazelnut Syrup",
    category: "Sirup & Pemanis",
    price: 5000,
    isActive: false,
    linkedProductsCount: 10,
  },
  {
    id: "add-8",
    name: "Whipped Cream",
    category: "Topping Minuman",
    price: 6000,
    isActive: true,
    linkedProductsCount: 9,
  },
  {
    id: "add-9",
    name: "Ice Cream Scoop (Vanilla)",
    category: "Topping Minuman",
    price: 8000,
    isActive: true,
    linkedProductsCount: 6,
  },
  {
    id: "add-10",
    name: "Extra Cheddar Cheese Slice",
    category: "Topping & Saus Makanan",
    price: 6000,
    isActive: true,
    linkedProductsCount: 4,
  },
  {
    id: "add-11",
    name: "Truffle Mayo Dip",
    category: "Topping & Saus Makanan",
    price: 7000,
    isActive: true,
    linkedProductsCount: 5,
  },
  {
    id: "add-12",
    name: "Pandan Syrup",
    category: "Sirup & Pemanis",
    price: 5000,
    isActive: false,
    linkedProductsCount: 4,
  },
];
