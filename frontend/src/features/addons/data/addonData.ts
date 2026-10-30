export interface AddonItem {
  id: string;
  name: string;
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

export const INITIAL_ADDONS: AddonItem[] = [
  {
    id: "add-1",
    name: "Extra Espresso Shot",
    price: 6000,
    isActive: true,
    linkedProductsCount: 8,
  },
  {
    id: "add-2",
    name: "Oat Milk (Gluten-Free)",
    price: 10000,
    isActive: true,
    linkedProductsCount: 12,
  },
  {
    id: "add-3",
    name: "Almond Milk",
    price: 10000,
    isActive: true,
    linkedProductsCount: 12,
  },
  {
    id: "add-4",
    name: "Soy Milk",
    price: 8000,
    isActive: true,
    linkedProductsCount: 10,
  },
  {
    id: "add-5",
    name: "Vanilla Syrup",
    price: 5000,
    isActive: true,
    linkedProductsCount: 15,
  },
  {
    id: "add-6",
    name: "Caramel Sauce",
    price: 5000,
    isActive: true,
    linkedProductsCount: 14,
  },
  {
    id: "add-7",
    name: "Hazelnut Syrup",
    price: 5000,
    isActive: true,
    linkedProductsCount: 11,
  },
  {
    id: "add-8",
    name: "Whipped Cream",
    price: 5000,
    isActive: true,
    linkedProductsCount: 9,
  },
  {
    id: "add-9",
    name: "Boba Pearls",
    price: 6000,
    isActive: true,
    linkedProductsCount: 6,
  },
  {
    id: "add-10",
    name: "Extra Cheddar Cheese Slice",
    price: 6000,
    isActive: true,
    linkedProductsCount: 4,
  },
  {
    id: "add-11",
    name: "Truffle Mayo Dip",
    price: 7000,
    isActive: true,
    linkedProductsCount: 5,
  },
  {
    id: "add-12",
    name: "Pandan Syrup",
    price: 5000,
    isActive: false,
    linkedProductsCount: 4,
  },
];
