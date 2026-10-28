import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { IconChevronLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ProductDetail } from "../components/ProductDetail";
import { useProductData } from "../hooks/useProductData";
import { formatIDR } from "../data/productData";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, deleteProduct } = useProductData();

  // Find product if matching ID in products list
  const matchedProduct = React.useMemo(() => {
    if (!id || id === "demo") return null;
    return products.find((p) => p.id === id);
  }, [products, id]);

  // Transform product data or provide reference default
  const detailData = React.useMemo(() => {
    if (!matchedProduct) {
      // Default sample matching Main.png
      return {
        id: id || "prod-default",
        name: "Acme Prism T-Shirt",
        seller: "Poetic Fashion",
        publishedDate: "20 Oct, 2024",
        sku: "WH1000XM4",
        price: "$120.40",
        ordersCount: "250",
        availableStock: "2,550",
        totalRevenue: "$45,938",
        description:
          "Tommy Hilfiger men striped pink sweatshirt. Crafted with cotton. Material composition is 100% organic cotton.",
        features: [
          "Industry-leading noise cancellation",
          "30-hour battery life",
          "Touch sensor controls",
          "Speak-to-chat technology",
        ],
        colors: [
          { id: "emerald", name: "Emerald Green", hex: "#00d26a" },
          { id: "periwinkle", name: "Periwinkle Blue", hex: "#6366f1" },
          { id: "purple", name: "Vibrant Purple", hex: "#a855f7" },
        ],
        sizes: ["SM", "MD", "LG", "XL", "XXL"],
        specifications: [
          { label: "Category", value: "T-Shirt" },
          { label: "Brand", value: "Tommy Hilfiger" },
          { label: "Color", value: "Purple" },
          { label: "Weight", value: "140 Gr" },
        ],
      };
    }

    return {
      id: matchedProduct.id,
      name: matchedProduct.name,
      seller: "District-13 Store",
      publishedDate: "20 Oct, 2024",
      sku: matchedProduct.sku,
      price: formatIDR(matchedProduct.price),
      ordersCount: String(matchedProduct.soldCount || 250),
      availableStock: String(matchedProduct.stock.toLocaleString()),
      totalRevenue: formatIDR(
        (matchedProduct.price || 0) * (matchedProduct.soldCount || 1)
      ),
      description:
        matchedProduct.description ||
        "Premium quality garment tailored with high durability and optimal comfort for every season.",
      features: [
        "High quality premium fabric",
        "Breathable and durable stitching",
        "Colorfast after multiple washes",
        "Eco-friendly sustainable packaging",
      ],
      colors: [
        { id: "emerald", name: "Emerald Green", hex: "#00d26a" },
        { id: "periwinkle", name: "Periwinkle Blue", hex: "#6366f1" },
        { id: "purple", name: "Vibrant Purple", hex: "#a855f7" },
      ],
      sizes: ["SM", "MD", "LG", "XL", "XXL"],
      specifications: [
        { label: "Category", value: matchedProduct.category || "General" },
        { label: "Brand", value: "District 13" },
        {
          label: "Status",
          value: matchedProduct.isAvailable ? "In Stock" : "Out of Stock",
        },
        { label: "SKU", value: matchedProduct.sku },
      ],
      images: matchedProduct.image
        ? [
            {
              id: "p-img-1",
              url: matchedProduct.image,
              alt: matchedProduct.name,
            },
            {
              id: "p-img-2",
              url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80",
              alt: "Variant 2",
            },
            {
              id: "p-img-3",
              url: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80",
              alt: "Variant 3",
            },
            {
              id: "p-img-4",
              url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80",
              alt: "Variant 4",
            },
          ]
        : undefined,
    };
  }, [matchedProduct, id]);

  const handleDelete = async () => {
    if (matchedProduct) {
      await deleteProduct(matchedProduct.id);
    }
    toast.add({
      title: "Product deleted",
      description: `${detailData.name} has been removed.`,
    });
    navigate("/dashboard/products");
  };

  const handleEdit = () => {
    navigate(`/dashboard/products/new?edit=${detailData.id}`);
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 max-w-7xl mx-auto w-full">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/products")}
          className="gap-1 px-2 text-muted-foreground hover:text-foreground"
        >
          <IconChevronLeft className="size-4" />
          <span>Products</span>
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-xs">
          {detailData.name}
        </span>
      </div>

      {/* Main Scaffold Component */}
      <ProductDetail
        product={detailData}
        onBack={() => navigate("/dashboard/products")}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
