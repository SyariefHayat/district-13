import * as React from "react";
import { useNavigate } from "react-router";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconChevronLeft,
  IconUpload,
  IconPhoto,
  IconPlus,
  IconTrash,
  IconLink,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import {
  getPresetImageForCategory,
  generateSkuForCategory,
  type ProductItem,
} from "../data/productData";
import {
  addProductSchema,
  type AddProductFormData,
} from "../schemas/productFormSchema";

const DEFAULT_CATEGORY_MAP: Record<string, string[]> = {
  Apparel: ["Hoodies", "T-Shirts", "Pants", "Jackets", "Accessories"],
  Coffee: ["Espresso", "Latte", "Cappuccino", "Cold Brew", "Manual Brew"],
  "Non-Coffee": ["Artisan Tea", "Matcha Fusion", "Chocolate", "Fresh Juice"],
  "Pastry & Bakery": ["Croissant", "Danish", "Cookies", "Cake Slice"],
  "Main Course": ["Rice Bowl", "Pasta", "Burgers", "Sandwiches"],
  Snacks: ["French Fries", "Nachos", "Platter", "Churros"],
};

const VARIANT_OPTIONS = ["Size", "Color", "Flavor", "Material", "Style"];

interface AddProductPageProps {
  onProductCreated?: (product: ProductItem) => void;
}

export default function AddProductPage({
  onProductCreated,
}: AddProductPageProps) {
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [categoryMap, setCategoryMap] = React.useState(DEFAULT_CATEGORY_MAP);
  const [showUrlModal, setShowUrlModal] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState("");

  const categories = Object.keys(categoryMap);

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      description: "",
      images: [],
      basePrice: 0,
      discountedPrice: undefined,
      chargeTax: false,
      inStock: true,
      status: "draft",
      category: categories[0] || "Apparel",
      subCategory: categoryMap[categories[0]]?.[0] || "",
      variants: [
        { id: "var-1", option: "Size", value: "Regular", price: 0 },
        { id: "var-2", option: "Size", value: "Large", price: 5000 },
      ],
    },
    mode: "onBlur",
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const currentCategory = watch("category");
  const currentImages = watch("images");
  const currentStatus = watch("status");

  const subCategories = categoryMap[currentCategory] || [];

  const handleCategoryChange = (val: string | null) => {
    if (!val) return;
    setValue("category", val, { shouldValidate: true });
    const nextSubs = categoryMap[val] || [];
    setValue("subCategory", nextSubs[0] || "");
  };

  const handleAddCategory = () => {
    const newCat = window.prompt("Enter new category name:");
    if (newCat && newCat.trim()) {
      const trimmed = newCat.trim();
      if (!categoryMap[trimmed]) {
        setCategoryMap((prev) => ({ ...prev, [trimmed]: [] }));
      }
      setValue("category", trimmed, { shouldValidate: true });
      setValue("subCategory", "");
    }
  };

  const handleAddSubCategory = () => {
    if (!currentCategory) {
      alert("Please select a category first.");
      return;
    }
    const newSub = window.prompt(
      `Enter new sub category for "${currentCategory}":`
    );
    if (newSub && newSub.trim()) {
      const trimmed = newSub.trim();
      setCategoryMap((prev) => ({
        ...prev,
        [currentCategory]: [...(prev[currentCategory] || []), trimmed],
      }));
      setValue("subCategory", trimmed);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setValue("images", [
            ...form.getValues("images"),
            event.target.result as string,
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrlImage = () => {
    if (urlInput.trim()) {
      setValue("images", [...currentImages, urlInput.trim()]);
      setUrlInput("");
      setShowUrlModal(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setValue(
      "images",
      currentImages.filter((_, i) => i !== index)
    );
  };

  const submitWithStatus = (targetStatus: "draft" | "published") => {
    setValue("status", targetStatus);
    handleSubmit((data) => {
      try {
        const primaryImage =
          data.images && data.images.length > 0
            ? data.images[0]
            : getPresetImageForCategory(data.category);

        const createdItem: ProductItem = {
          id: `prod-${Date.now()}`,
          name: data.name.trim(),
          sku:
            data.sku?.trim().toUpperCase() ||
            generateSkuForCategory(data.category),
          category: data.subCategory || data.category,
          price:
            data.discountedPrice !== undefined && data.discountedPrice > 0
              ? data.discountedPrice
              : data.basePrice,
          stock: data.inStock ? 50 : 0,
          isAvailable: data.inStock,
          isActive: targetStatus === "published",
          soldCount: 0,
          rating: 5.0,
          image: primaryImage,
          description: data.description?.trim(),
        };

        if (onProductCreated) {
          onProductCreated(createdItem);
        }

        toast.add({
          title:
            targetStatus === "published" ? "Product Published" : "Draft Saved",
          description: `"${data.name}" has been ${targetStatus === "published" ? "published" : "saved as draft"}.`,
          type: targetStatus === "published" ? "success" : "info",
        });

        navigate("/dashboard/products");
      } catch (err) {
        toast.add({
          title: "Save Failed",
          description:
            err instanceof Error ? err.message : "Error saving product",
          type: "error",
        });
      }
    })();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-[1240px] space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2">
          {/* Back button + Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/products")}
              className="size-9 rounded-xl border border-zinc-800 bg-[#141416] text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Back to products"
            >
              <IconChevronLeft className="size-4" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Add Products
            </h1>
          </div>

          {/* Action Buttons: Discard, Save Draft, Publish */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard/products")}
              className="h-9 px-4 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => submitWithStatus("draft")}
              className="h-9 px-4 rounded-xl text-sm font-medium bg-[#1c1c20] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => submitWithStatus("published")}
              className="h-9 px-5 rounded-xl text-sm font-semibold bg-white hover:bg-zinc-200 text-zinc-950 transition-colors shadow-xs cursor-pointer"
            >
              Publish
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Details, Images, Variants (7 or 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Product Details */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-5">
              <h2 className="text-sm md:text-base font-semibold text-zinc-100">
                Product Details
              </h2>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium text-zinc-300">
                  Name
                </label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder=""
                      className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3.5 focus-visible:border-zinc-600 focus-visible:ring-0"
                      {...field}
                    />
                  )}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* SKU & Barcode Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium text-zinc-300">
                    SKU
                  </label>
                  <Controller
                    name="sku"
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder=""
                        className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3.5 focus-visible:border-zinc-600 focus-visible:ring-0"
                        {...field}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium text-zinc-300">
                    Barcode
                  </label>
                  <Controller
                    name="barcode"
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder=""
                        className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3.5 focus-visible:border-zinc-600 focus-visible:ring-0"
                        {...field}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Description (Optional) */}
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium text-zinc-300">
                  Description (Optional)
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      rows={4}
                      placeholder=""
                      className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl p-3.5 resize-none focus-visible:border-zinc-600 focus-visible:ring-0"
                      {...field}
                    />
                  )}
                />
                <p className="text-xs text-zinc-500">
                  Set a description to the product for better visibility.
                </p>
              </div>
            </div>

            {/* Card 2: Product Images */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm md:text-base font-semibold text-zinc-100">
                  Product Images
                </h2>
                <button
                  type="button"
                  onClick={() => setShowUrlModal(!showUrlModal)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Add media from URL
                </button>
              </div>

              {/* URL input modal/toggle */}
              {showUrlModal && (
                <div className="flex items-center gap-2 p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <IconLink className="size-4 text-zinc-400 shrink-0" />
                  <Input
                    placeholder="https://example.com/image.png"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-200"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddUrlImage}
                    className="h-8 text-xs bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  >
                    Add
                  </Button>
                </div>
              )}

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-800/90 rounded-2xl bg-[#0d0d0f] p-8 md:p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:border-zinc-700 transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                <div className="size-11 rounded-xl bg-[#1c1c20] flex items-center justify-center text-zinc-400">
                  <IconPhoto className="size-5" />
                </div>

                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-zinc-200">
                    Drop your images here
                  </p>
                  <p className="text-xs text-zinc-500">PNG or JPG (max. 5MB)</p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-medium bg-[#1c1c20] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
                >
                  <IconUpload className="size-3.5" />
                  <span>Select images</span>
                </button>
              </div>

              {/* Uploaded Thumbnails Grid */}
              {currentImages.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                  {currentImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="group relative size-18 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden"
                    >
                      <img
                        src={img}
                        alt="Product preview"
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 size-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconX className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 3: Variants */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm md:text-base font-semibold text-zinc-100">
                  Variants
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    appendVariant({
                      id: `var-${Date.now()}`,
                      option: "Size",
                      value: "",
                      price: 0,
                    })
                  }
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium bg-[#1c1c20] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
                >
                  <IconPlus className="size-3.5" />
                  <span>Add Variant</span>
                </button>
              </div>

              {/* Variants Table / Grid */}
              <div className="space-y-3">
                {/* Headers */}
                <div className="grid grid-cols-12 gap-3 text-xs font-medium text-zinc-300 px-1">
                  <div className="col-span-4">Options</div>
                  <div className="col-span-4">Value</div>
                  <div className="col-span-3">Price</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Rows */}
                {variantFields.map((fieldItem, index) => (
                  <div
                    key={fieldItem.id}
                    className="grid grid-cols-12 gap-3 items-center"
                  >
                    {/* Option Select */}
                    <div className="col-span-4">
                      <Controller
                        name={`variants.${index}.option`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(val) => val && field.onChange(val)}
                          >
                            <SelectTrigger className="bg-[#18181b] border-zinc-800 text-zinc-100 rounded-xl h-10 px-3 w-full text-xs">
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#18181b] border-zinc-800 text-zinc-200">
                              {VARIANT_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {/* Value Input */}
                    <div className="col-span-4">
                      <Controller
                        name={`variants.${index}.value`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            placeholder=""
                            className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3 text-xs focus-visible:border-zinc-600 focus-visible:ring-0"
                            {...field}
                          />
                        )}
                      />
                    </div>

                    {/* Price Input */}
                    <div className="col-span-3">
                      <Controller
                        name={`variants.${index}.price`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            min="0"
                            placeholder=""
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3 text-xs focus-visible:border-zinc-600 focus-visible:ring-0"
                          />
                        )}
                      />
                    </div>

                    {/* Delete action */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                        title="Remove variant"
                      >
                        <IconTrash className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Pricing, Status, Categories (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 4: Pricing */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-5">
              <h2 className="text-sm md:text-base font-semibold text-zinc-100">
                Pricing
              </h2>

              {/* Base Price */}
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium text-zinc-300">
                  Base Price
                </label>
                <Controller
                  name="basePrice"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
                      placeholder=""
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3.5 focus-visible:border-zinc-600 focus-visible:ring-0"
                    />
                  )}
                />
                {errors.basePrice && (
                  <p className="text-xs text-red-500">
                    {errors.basePrice.message}
                  </p>
                )}
              </div>

              {/* Discounted Price */}
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium text-zinc-300">
                  Discounted Price
                </label>
                <Controller
                  name="discountedPrice"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
                      placeholder=""
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                      className="bg-[#18181b] border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-10 px-3.5 focus-visible:border-zinc-600 focus-visible:ring-0"
                    />
                  )}
                />
              </div>

              {/* Charge tax on this product */}
              <Controller
                name="chargeTax"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-zinc-700 data-checked:bg-white data-checked:text-black data-checked:border-white"
                    />
                    <span className="text-xs md:text-sm text-zinc-300 font-normal">
                      Charge tax on this product
                    </span>
                  </label>
                )}
              />

              {/* In stock Toggle */}
              <div className="pt-2 border-t border-zinc-850">
                <Controller
                  name="inStock"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <span className="text-xs md:text-sm text-zinc-200 font-normal">
                        In stock
                      </span>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Card 5: Status */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-4">
              <h2 className="text-sm md:text-base font-semibold text-zinc-100">
                Status
              </h2>

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) =>
                      val &&
                      field.onChange(val as "draft" | "published" | "archived")
                    }
                  >
                    <SelectTrigger className="bg-[#18181b] border-zinc-800 text-zinc-100 rounded-xl h-10 px-3.5 w-full flex items-center justify-between text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            currentStatus === "published"
                              ? "bg-emerald-500"
                              : currentStatus === "draft"
                                ? "bg-amber-500"
                                : "bg-zinc-400"
                          }`}
                        />
                        <span className="capitalize">{field.value}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] border-zinc-800 text-zinc-200">
                      <SelectItem value="draft">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-amber-500" />
                          <span>Draft</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="published">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          <span>Published</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="archived">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-zinc-400" />
                          <span>Archived</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />

              <p className="text-xs text-zinc-500">Set the product status.</p>
            </div>

            {/* Card 6: Categories */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 space-y-4">
              <h2 className="text-sm md:text-base font-semibold text-zinc-100">
                Categories
              </h2>

              {/* Category Select with (+) button */}
              <div className="flex items-center gap-2">
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="bg-[#18181b] border-zinc-800 text-zinc-100 rounded-xl h-10 px-3.5 flex-1 flex items-center justify-between text-xs md:text-sm">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#18181b] border-zinc-800 text-zinc-200">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="size-10 rounded-xl border border-zinc-800 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  title="Add category"
                >
                  <IconPlus className="size-4" />
                </button>
              </div>

              {/* Sub Category Select with (+) button */}
              <div className="flex items-center gap-2">
                <Controller
                  name="subCategory"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => val && field.onChange(val)}
                    >
                      <SelectTrigger className="bg-[#18181b] border-zinc-800 text-zinc-100 rounded-xl h-10 px-3.5 flex-1 flex items-center justify-between text-xs md:text-sm">
                        <SelectValue placeholder="Select a sub category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#18181b] border-zinc-800 text-zinc-200">
                        {subCategories.length === 0 ? (
                          <div className="p-2 text-xs text-zinc-500 text-center">
                            No sub categories
                          </div>
                        ) : (
                          subCategories.map((sub) => (
                            <SelectItem key={sub} value={sub}>
                              {sub}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                <button
                  type="button"
                  onClick={handleAddSubCategory}
                  className="size-10 rounded-xl border border-zinc-800 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  title="Add sub category"
                >
                  <IconPlus className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
