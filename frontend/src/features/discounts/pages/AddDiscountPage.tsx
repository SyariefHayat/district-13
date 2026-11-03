import * as React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import type { FieldErrors } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconChevronLeft, IconChevronDown } from "@tabler/icons-react";

import { toast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import {
  discountFormSchema,
  type DiscountFormData,
} from "../schemas/discountFormSchema";
import {
  DetailDiscount,
  DiscountValue,
  DiscountRequirements,
  DiscountStatus,
  DiscountApplyModeCard,
  DiscountPeriod,
  DiscountPreview,
} from "../components/form";
import type { BackendDiscount } from "../hooks/useDiscountData";

export default function AddDiscountPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { authorizedFetch } = useAuth();

  const editId = params.id || searchParams.get("edit");
  const isEditing = Boolean(editId);

  const [isLoadingDiscount, setIsLoadingDiscount] = React.useState(false);
  const [savingStatus, setSavingStatus] = React.useState<
    "draft" | "published" | null
  >(null);
  const isSaving = savingStatus !== null;

  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "percentage",
      applyMode: "manual",
      value: 20,
      minPurchase: 0,
      maxDiscount: null,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
      description: "",
      status: "published",
    },
    mode: "onBlur",
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const currentName = watch("name");
  const currentCode = watch("code");
  const currentType = watch("type");
  const currentApplyMode = watch("applyMode");
  const currentValue = watch("value") || 0;
  const currentMinPurchase = watch("minPurchase") || 0;
  const currentMaxDiscount = watch("maxDiscount");
  const currentEndDate = watch("endDate");
  const currentStatus = watch("status");

  // Load existing discount if in editing mode
  React.useEffect(() => {
    let isMounted = true;
    async function loadDiscount() {
      if (!editId) return;

      setIsLoadingDiscount(true);
      try {
        const res = await authorizedFetch(`/discounts/${editId}`);
        if (res.ok) {
          const data: BackendDiscount = await res.json();
          if (isMounted) {
            reset({
              name: data.name || "",
              code: data.code || "",
              type: data.type === "fixed" ? "fixed" : "percentage",
              applyMode:
                data.applyMode === "automatic" ? "automatic" : "manual",
              value: Number(data.value) || 0,
              minPurchase: Number(data.minPurchase) || 0,
              maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
              startDate: data.startDate ? data.startDate.slice(0, 10) : null,
              endDate: data.endDate ? data.endDate.slice(0, 10) : null,
              description: data.description || "",
              status: data.isActive ? "published" : "draft",
            });
          }
        } else {
          toast.add({
            title: "Diskon Tidak Ditemukan",
            description:
              "Data diskon yang ingin diedit tidak ditemukan di sistem.",
            type: "error",
          });
          navigate("/dashboard/discounts");
        }
      } catch (err) {
        toast.add({
          title: "Gagal Mengambil Data Diskon",
          description:
            err instanceof Error ? err.message : "Terjadi gangguan jaringan.",
          type: "error",
        });
      } finally {
        if (isMounted) {
          setIsLoadingDiscount(false);
        }
      }
    }

    void loadDiscount();
    return () => {
      isMounted = false;
    };
  }, [editId, authorizedFetch, navigate, reset]);

  const submitWithStatus = (
    targetStatus: "draft" | "published",
    keepOnPage = false
  ) => {
    setValue("status", targetStatus);

    const onValid = async (data: DiscountFormData) => {
      if (data.value <= 0) {
        toast.add({
          title: "Validasi Gagal",
          description: "Besar potongan diskon wajib lebih dari 0.",
          type: "error",
        });
        return;
      }

      setSavingStatus(targetStatus);
      try {
        const generatedCode =
          data.code?.trim().toUpperCase() ||
          `${data.applyMode === "automatic" ? "AUTO" : "TEMAN"}-${Date.now().toString().slice(-4)}`;

        const payload: {
          name: string;
          code: string;
          type: "percentage" | "fixed";
          applyMode: "manual" | "automatic";
          value: number;
          minPurchase: number;
          maxDiscount?: number | null;
          startDate?: string | null;
          endDate?: string | null;
          description?: string | null;
          isActive: boolean;
        } = {
          name: data.name.trim(),
          code: generatedCode,
          type: data.type,
          applyMode: data.applyMode,
          value: data.value,
          minPurchase: data.minPurchase ?? 0,
          maxDiscount:
            data.type === "percentage" && data.maxDiscount
              ? data.maxDiscount
              : null,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          description: data.description?.trim() || null,
          isActive: targetStatus === "published",
        };

        const url = isEditing ? `/discounts/${editId}` : "/discounts";
        const method = isEditing ? "PATCH" : "POST";

        const res = await authorizedFetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const errMsg =
            typeof body.message === "string"
              ? body.message
              : Array.isArray(body.message)
                ? body.message.join(", ")
                : `Gagal menyimpan diskon (${res.status})`;
          throw new Error(errMsg);
        }

        toast.add({
          title: isEditing
            ? "Perubahan Diskon Disimpan"
            : targetStatus === "published"
              ? "Diskon Berhasil Diterbitkan"
              : "Draf Diskon Berhasil Disimpan",
          description: `Diskon "${data.name.trim()}" telah tersimpan ke sistem warkop.`,
          type: "success",
        });

        if (keepOnPage && !isEditing) {
          reset({
            name: "",
            code: "",
            type: "percentage",
            applyMode: "manual",
            value: 20,
            minPurchase: 0,
            maxDiscount: null,
            startDate: new Date().toISOString().slice(0, 10),
            endDate: null,
            description: "",
            status: "published",
          });
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          navigate("/dashboard/discounts");
        }
      } catch (err) {
        toast.add({
          title: "Gagal Menyimpan Diskon",
          description:
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan sistem saat menyimpan ke database.",
          type: "error",
        });
      } finally {
        setSavingStatus(null);
      }
    };

    const onInvalid = (fieldErrors: FieldErrors<DiscountFormData>) => {
      const firstError = Object.values(fieldErrors)[0];
      toast.add({
        title: "Validasi Formulir Gagal",
        description:
          firstError?.message ||
          "Mohon periksa kembali kolom yang bertanda bintang (*).",
        type: "error",
      });
    };

    void handleSubmit(onValid, onInvalid)();
  };

  if (isLoadingDiscount) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-zinc-400">Memuat data diskon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-310 space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2">
          {/* Back button + Title */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard/discounts")}
              title="Kembali ke daftar diskon"
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {isEditing ? "Ubah Diskon" : "Tambah Diskon"}
              </h1>
            </div>
          </div>

          {/* Action Buttons: Batal, Simpan Draf, Terbitkan */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting || isSaving}
              onClick={() => navigate("/dashboard/discounts")}
            >
              Batal
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || isSaving}
              onClick={() => submitWithStatus("draft")}
              className="gap-2"
            >
              {savingStatus === "draft" && <Spinner className="size-4" />}
              <span>
                {savingStatus === "draft" ? "Menyimpan Draf..." : "Simpan Draf"}
              </span>
            </Button>

            {/* Split Button: Terbitkan / Simpan Perubahan | ▾ */}
            <div className="flex items-center -space-x-px">
              <Button
                type="button"
                variant="default"
                disabled={isSubmitting || isSaving}
                onClick={() => submitWithStatus("published", false)}
                className={isEditing ? "gap-2" : "rounded-r-none gap-2 pr-3"}
              >
                {savingStatus === "published" && <Spinner className="size-4" />}
                <span>
                  {savingStatus === "published"
                    ? isEditing
                      ? "Menyimpan..."
                      : "Menerbitkan..."
                    : isEditing
                      ? "Simpan Perubahan"
                      : "Terbitkan"}
                </span>
              </Button>

              {!isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="default"
                        size="icon"
                        disabled={isSubmitting || isSaving}
                        className="rounded-l-none px-2"
                        title="Opsi terbitkan lainnya"
                      >
                        <IconChevronDown className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#18181b] border-zinc-800 text-zinc-200 min-w-[140px]"
                  >
                    <DropdownMenuItem
                      onClick={() => submitWithStatus("published", true)}
                      className="cursor-pointer gap-2 py-2 text-xs md:text-sm hover:bg-zinc-800"
                    >
                      <span>Simpan & lanjut</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Detail Diskon, Nilai & Potongan, Ketentuan Belanja (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <DetailDiscount
              control={control}
              errors={errors}
              setValue={setValue}
              applyMode={currentApplyMode}
            />

            <DiscountValue
              control={control}
              errors={errors}
              setValue={setValue}
              type={currentType}
              value={currentValue}
              maxDiscount={currentMaxDiscount}
            />

            <DiscountRequirements
              control={control}
              errors={errors}
              minPurchase={currentMinPurchase}
            />
          </div>

          {/* RIGHT COLUMN: Status, Metode Penerapan Kasir, Periode, Pratinjau (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <DiscountStatus control={control} currentStatus={currentStatus} />

            <DiscountApplyModeCard control={control} />

            <DiscountPeriod
              control={control}
              errors={errors}
              setValue={setValue}
              endDate={currentEndDate}
            />

            <DiscountPreview
              name={currentName}
              code={currentCode}
              type={currentType}
              value={currentValue}
              maxDiscount={currentMaxDiscount}
              applyMode={currentApplyMode}
              status={currentStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
