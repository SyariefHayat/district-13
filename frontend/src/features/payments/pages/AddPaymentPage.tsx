import * as React from "react";
import { useNavigate, useParams } from "react-router";
import {
  IconAlertCircle,
  IconBuildingBank,
  IconCash,
  IconChevronDown,
  IconChevronLeft,
  IconCreditCard,
  IconDeviceMobile,
  IconInfoCircle,
  IconQrcode,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { usePaymentData } from "../hooks/usePaymentData";
import {
  formatPaymentAmount,
  PAYMENT_TYPE_LABELS,
  type PaymentMethodItem,
  type PaymentStatus,
  type PaymentType,
} from "../data/paymentData";

const PAYMENT_TYPE_OPTIONS: {
  type: PaymentType;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "CASH",
    label: "Tunai (Cash)",
    desc: "Uang tunai di laci kasir",
    icon: <IconCash className="size-4 text-emerald-400" />,
  },
  {
    type: "QRIS",
    label: "QRIS",
    desc: "QRIS statis & dinamis POS",
    icon: <IconQrcode className="size-4 text-indigo-400" />,
  },
  {
    type: "CARD",
    label: "Kartu Debit / Kredit",
    desc: "Mesin EDC perbankan",
    icon: <IconCreditCard className="size-4 text-blue-400" />,
  },
  {
    type: "E_WALLET",
    label: "E-Wallet",
    desc: "GoPay, OVO, ShopeePay, DANA",
    icon: <IconDeviceMobile className="size-4 text-teal-400" />,
  },
  {
    type: "TRANSFER",
    label: "Transfer Bank",
    desc: "Virtual Account & Bank Transfer",
    icon: <IconBuildingBank className="size-4 text-purple-400" />,
  },
];

const SETTLEMENT_PRESETS = [
  "Real-time",
  "T+1 Hari Kerja",
  "T+2 Hari Kerja",
  "T+3 Hari Kerja",
];

const STATUS_SELECT_ITEMS = [
  { label: "Diterbitkan (Aktif)", value: "published", color: "bg-emerald-500" },
  { label: "Draf (Nonaktif)", value: "draft", color: "bg-amber-500" },
  {
    label: "Pemeliharaan (Maintenance)",
    value: "archived",
    color: "bg-zinc-400",
  },
];

export default function AddPaymentPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const isEditing = Boolean(params.id);

  const { payments, isLoading, createPayment, updatePayment } = usePaymentData({
    pollIntervalMs: 0,
  });

  const [savingStatus, setSavingStatus] = React.useState<
    "draft" | "published" | null
  >(null);
  const isSaving = savingStatus !== null;

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<PaymentType>("QRIS");
  const [provider, setProvider] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [feePercentage, setFeePercentage] = React.useState("0.7");
  const [settlementTime, setSettlementTime] = React.useState("T+1 Hari Kerja");
  const [minAmount, setMinAmount] = React.useState("0");
  const [description, setDescription] = React.useState("");
  const [statusState, setStatusState] = React.useState<
    "draft" | "published" | "archived"
  >("published");

  const [hasLoadedInitial, setHasLoadedInitial] = React.useState(false);

  // Load existing payment method details when editing
  React.useEffect(() => {
    if (!isEditing || hasLoadedInitial || isLoading) return;

    const existing = payments.find((p) => p.id === params.id);
    if (existing) {
      setName(existing.name);
      setCode(existing.code);
      setType(existing.type);
      setProvider(existing.provider);
      setAccountNumber(existing.accountNumber || "");
      setFeePercentage(String(existing.feePercentage));
      setSettlementTime(existing.settlementTime);
      setMinAmount(String(existing.minAmount));
      setDescription(existing.description || "");
      setStatusState(
        existing.status === "MAINTENANCE"
          ? "archived"
          : existing.isActive
            ? "published"
            : "draft"
      );
      setHasLoadedInitial(true);
    }
  }, [params.id, isEditing, isLoading, payments, hasLoadedInitial]);

  const handleTypeSelect = (selectedType: PaymentType) => {
    setType(selectedType);

    if (!isEditing) {
      if (selectedType === "CASH") {
        if (!provider) setProvider("Kasir Fisik");
        if (!accountNumber) setAccountNumber("Cash Drawer 01");
        setFeePercentage("0");
        setSettlementTime("Real-time");
        setMinAmount("0");
      } else if (selectedType === "QRIS") {
        if (!provider) setProvider("Bank BCA / Midtrans");
        if (!accountNumber) setAccountNumber("NMID: ID10200392019");
        setFeePercentage("0.7");
        setSettlementTime("T+1 Hari Kerja");
        setMinAmount("1000");
      } else if (selectedType === "CARD") {
        if (!provider) setProvider("Bank Central Asia");
        if (!accountNumber) setAccountNumber("TID: 88203912");
        setFeePercentage("1.5");
        setSettlementTime("T+1 Hari Kerja");
        setMinAmount("10000");
      } else if (selectedType === "E_WALLET") {
        if (!provider) setProvider("Midtrans");
        if (!accountNumber) setAccountNumber("MID: D13-01");
        setFeePercentage("1.5");
        setSettlementTime("T+1 Hari Kerja");
        setMinAmount("5000");
      } else if (selectedType === "TRANSFER") {
        if (!provider) setProvider("Bank BCA");
        if (!accountNumber) setAccountNumber("No. Rek: 8201928312");
        setFeePercentage("0");
        setSettlementTime("Real-time");
        setMinAmount("20000");
      }
    }
  };

  const submitWithStatus = async (
    targetPublishStatus: "draft" | "published",
    keepOnPage = false
  ) => {
    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    const cleanProvider = provider.trim();

    if (!cleanName || !cleanCode || !cleanProvider) {
      toast.add({
        title: "Validasi Formulir Gagal",
        description: "Mohon periksa kembali kolom yang bertanda bintang (*).",
        type: "error",
      });
      return;
    }

    const parsedFee = parseFloat(feePercentage);
    if (isNaN(parsedFee) || parsedFee < 0 || parsedFee > 100) {
      toast.add({
        title: "Biaya MDR Tidak Valid",
        description: "Biaya MDR harus berupa angka antara 0% hingga 100%.",
        type: "error",
      });
      return;
    }

    const parsedMin = parseInt(minAmount, 10);
    if (isNaN(parsedMin) || parsedMin < 0) {
      toast.add({
        title: "Minimal Transaksi Tidak Valid",
        description: "Minimal transaksi harus berupa angka positif.",
        type: "error",
      });
      return;
    }

    setSavingStatus(targetPublishStatus);

    try {
      const isPublished = targetPublishStatus === "published";
      const actualStatus: PaymentStatus =
        statusState === "archived"
          ? "MAINTENANCE"
          : isPublished
            ? "ACTIVE"
            : "INACTIVE";

      const payload: Omit<
        PaymentMethodItem,
        "id" | "transactionCount" | "totalVolume" | "updatedAt"
      > = {
        name: cleanName,
        code: cleanCode,
        type,
        provider: cleanProvider,
        accountNumber: accountNumber.trim(),
        feePercentage: parsedFee,
        settlementTime: settlementTime.trim() || "Real-time",
        minAmount: parsedMin,
        description: description.trim(),
        isActive: isPublished && actualStatus === "ACTIVE",
        status: actualStatus,
      };

      let success = false;
      if (isEditing && params.id) {
        success = await updatePayment(params.id, payload);
      } else {
        success = await createPayment(payload);
      }

      if (success) {
        toast.add({
          title: isPublished
            ? isEditing
              ? "Metode Pembayaran Diperbarui"
              : "Metode Pembayaran Diterbitkan"
            : "Draf Berhasil Disimpan",
          description: `"${cleanName}" telah tersimpan ke sistem.`,
          type: "success",
        });

        if (keepOnPage) {
          setName("");
          setCode("");
          setType("QRIS");
          setProvider("");
          setAccountNumber("");
          setFeePercentage("0.7");
          setSettlementTime("T+1 Hari Kerja");
          setMinAmount("0");
          setDescription("");
          setStatusState("published");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          navigate("/dashboard/payments");
        }
      } else {
        toast.add({
          title: "Gagal Menyimpan",
          description: "Tidak dapat menyimpan data metode pembayaran.",
          type: "error",
        });
      }
    } catch (err) {
      toast.add({
        title: "Gagal Menyimpan",
        description:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan sistem saat menyimpan data.",
        type: "error",
      });
    } finally {
      setSavingStatus(null);
    }
  };

  const accountPlaceholder = React.useMemo(() => {
    switch (type) {
      case "QRIS":
        return "Contoh: NMID: ID10200392019";
      case "CARD":
        return "Contoh: TID: 88203912 / MID: 00921";
      case "E_WALLET":
        return "Contoh: MID: D13-GOPAY-01";
      case "TRANSFER":
        return "Contoh: No. Rekening / Prefix VA: 1290381029";
      case "CASH":
      default:
        return "Contoh: Drawer Kasir POS 01";
    }
  }, [type]);

  const accountLabel = React.useMemo(() => {
    switch (type) {
      case "QRIS":
        return "Nomor NMID / Merchant ID";
      case "CARD":
        return "Terminal ID (TID) / Merchant ID";
      case "E_WALLET":
        return "Merchant ID / Akun Gateway";
      case "TRANSFER":
        return "Nomor Rekening / Virtual Account";
      case "CASH":
      default:
        return "Identitas Laci Kasir";
    }
  }, [type]);

  const selectedStatusLabel = React.useMemo(() => {
    const found = STATUS_SELECT_ITEMS.find((s) => s.value === statusState);
    if (!found) return undefined;
    return (
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${found.color}`} />
        <span>{found.label}</span>
      </div>
    );
  }, [statusState]);

  if (isEditing && isLoading && !hasLoadedInitial) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-zinc-400">
            Memuat data metode pembayaran...
          </p>
        </div>
      </div>
    );
  }

  if (
    isEditing &&
    !isLoading &&
    !hasLoadedInitial &&
    !payments.some((p) => p.id === params.id)
  ) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <IconAlertCircle className="size-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">
              Metode Pembayaran Tidak Ditemukan
            </h2>
            <p className="text-sm text-zinc-400">
              Metode pembayaran dengan ID tersebut tidak ditemukan atau telah
              dihapus.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/payments")}
            className="mt-2"
          >
            Kembali ke Daftar Metode
          </Button>
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
              onClick={() => navigate("/dashboard/payments")}
              title="Kembali ke daftar metode pembayaran"
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {isEditing
                  ? "Edit Metode Pembayaran"
                  : "Tambah Metode Pembayaran"}
              </h1>
            </div>
          </div>

          {/* Action Buttons: Batal, Simpan Draf, Terbitkan / Simpan Perubahan */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={() => navigate("/dashboard/payments")}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
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
                disabled={isSaving}
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
                        disabled={isSaving}
                        className="rounded-l-none px-2"
                        title="Opsi simpan lainnya"
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

        {/* 2-Column Layout */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitWithStatus("published", false);
          }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* LEFT COLUMN: Detail Saluran, Parameter, SOP (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Detail Saluran Pembayaran */}
            <Card>
              <CardHeader>
                <CardTitle>Detail Saluran Pembayaran</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Nama Saluran */}
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm font-medium text-zinc-300">
                    Nama Saluran <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    placeholder="Contoh: QRIS BCA Dinamis, EDC BCA, GoPay"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="text-xs text-zinc-500">
                    Nama resmi yang akan terlihat oleh kasir pada tombol
                    pembayaran kasir POS.
                  </p>
                </div>

                {/* Kode Unik & Provider Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm font-medium text-zinc-300">
                      Kode Unik <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      placeholder="Contoh: QRIS_BCA, EDC_MANDIRI"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="font-mono uppercase"
                    />
                    <p className="text-xs text-zinc-500">
                      Kode referensi transaksi di sistem (otomatis kapital).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm font-medium text-zinc-300">
                      Provider / Penerbit{" "}
                      <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      placeholder="Contoh: Bank BCA / Midtrans"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                    />
                    <p className="text-xs text-zinc-500">
                      Bank penerbit atau aggregator payment gateway resmi.
                    </p>
                  </div>
                </div>

                {/* Nomor Akun / NMID / TID */}
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm font-medium text-zinc-300">
                    {accountLabel}
                  </Label>
                  <Input
                    placeholder={accountPlaceholder}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                  <p className="text-xs text-zinc-500">
                    Nomor rekening, NMID, atau identitas terminal mesin EDC
                    kasir.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Parameter Transaksi & Biaya */}
            <Card>
              <CardHeader>
                <CardTitle>Parameter Transaksi & Biaya</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Biaya MDR */}
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm font-medium text-zinc-300">
                      Biaya MDR (%)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="0.7"
                        value={feePercentage}
                        onChange={(e) => setFeePercentage(e.target.value)}
                        className="pr-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                        %
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Potongan MDR per transaksi sukses (0% untuk tunai).
                    </p>
                  </div>

                  {/* Minimal Transaksi */}
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm font-medium text-zinc-300">
                      Minimal Transaksi (Rp)
                    </Label>
                    <Input
                      type="number"
                      step="1000"
                      min="0"
                      placeholder="0"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                    <p className="text-xs text-zinc-500">
                      {parseInt(minAmount, 10) > 0
                        ? `Batas minimal: ${formatPaymentAmount(parseInt(minAmount, 10))}`
                        : "Tidak ada batas minimal transaksi (Rp 0)"}
                    </p>
                  </div>
                </div>

                {/* Waktu Settlement */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs md:text-sm font-medium text-zinc-300">
                      Waktu Settlement / Pencairan
                    </Label>
                    <span className="text-xs text-zinc-500">
                      Pilihan Cepat:
                    </span>
                  </div>
                  <Input
                    placeholder="Contoh: Real-time, T+1 Hari Kerja"
                    value={settlementTime}
                    onChange={(e) => setSettlementTime(e.target.value)}
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {SETTLEMENT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSettlementTime(preset)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-colors select-none ${
                          settlementTime === preset
                            ? "bg-zinc-100 text-zinc-950 font-medium border-zinc-100"
                            : "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: SOP & Instruksi Kasir */}
            <Card>
              <CardHeader>
                <CardTitle>Instruksi Kasir</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm font-medium text-zinc-300">
                    Catatan Kasir / SOP Transaksi
                  </Label>
                  <Textarea
                    placeholder="Contoh: Arahkan pelanggan untuk melakukan scan kode QRIS pada monitor kasir. Pastikan status transaksi 'BERHASIL' muncul sebelum cetak struk."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-zinc-500">
                    Petunjuk operasional yang akan tampil bagi kasir saat metode
                    ini dipilih.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Kategori, Status, Pratinjau (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card: Status Metode (Styled like ProductStatus.tsx) */}
            <Card>
              <CardHeader>
                <CardTitle>Status Saluran</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <Select
                  items={STATUS_SELECT_ITEMS}
                  value={statusState}
                  onValueChange={(val) => {
                    if (val) {
                      setStatusState(val as "draft" | "published" | "archived");
                    }
                  }}
                >
                  <SelectTrigger className="w-full flex items-center justify-between text-xs md:text-sm">
                    <SelectValue>{selectedStatusLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={true}
                    className="bg-[#18181b] border-zinc-800 text-zinc-200"
                  >
                    <SelectGroup>
                      {STATUS_SELECT_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-2 rounded-full ${item.color}`}
                            />
                            <span>{item.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <p className="text-xs text-zinc-500">
                  Atur status ketersediaan metode pembayaran pada kasir POS.
                </p>
              </CardContent>
            </Card>

            {/* Card: Kategori Pembayaran */}
            <Card>
              <CardHeader>
                <CardTitle>Kategori Pembayaran</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm font-medium text-zinc-300">
                    Tipe Saluran <span className="text-red-400">*</span>
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {PAYMENT_TYPE_OPTIONS.map((item) => {
                      const isSelected = type === item.type;
                      return (
                        <div
                          key={item.type}
                          onClick={() => handleTypeSelect(item.type)}
                          className={`cursor-pointer rounded-lg border p-3 transition-all select-none flex items-center justify-between gap-3 ${
                            isSelected
                              ? "border-zinc-200 bg-zinc-800/80 ring-1 ring-zinc-300"
                              : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 bg-zinc-950/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800">
                              {item.icon}
                            </div>
                            <div>
                              <span className="font-medium text-sm text-zinc-100 block">
                                {item.label}
                              </span>
                              <span className="text-xs text-zinc-500 block">
                                {item.desc}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 border-zinc-600 bg-zinc-800 text-zinc-100"
                            >
                              Aktif
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card: Pratinjau Saluran */}
            <Card>
              <CardHeader>
                <CardTitle>Pratinjau Saluran</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shadow-xs">
                        {type === "CASH" ? (
                          <IconCash className="size-5 text-emerald-400" />
                        ) : type === "QRIS" ? (
                          <IconQrcode className="size-5 text-indigo-400" />
                        ) : type === "CARD" ? (
                          <IconCreditCard className="size-5 text-blue-400" />
                        ) : type === "E_WALLET" ? (
                          <IconDeviceMobile className="size-5 text-teal-400" />
                        ) : (
                          <IconBuildingBank className="size-5 text-purple-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-zinc-100 block">
                          {name || "Nama Saluran"}
                        </span>
                        <span className="text-xs text-zinc-400 block">
                          {provider || "Provider / Vendor"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`size-2 rounded-full ${
                          statusState === "published"
                            ? "bg-emerald-500"
                            : statusState === "draft"
                              ? "bg-amber-500"
                              : "bg-zinc-400"
                        }`}
                      />
                      <span className="text-xs text-zinc-300 font-medium">
                        {statusState === "published"
                          ? "Diterbitkan"
                          : statusState === "draft"
                            ? "Draf"
                            : "Pemeliharaan"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-[11px] font-semibold text-zinc-200">
                      {code || "KODE_UNIK"}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-400">
                      {PAYMENT_TYPE_LABELS[type]}
                    </span>
                  </div>

                  <Separator className="bg-zinc-800" />

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Nomor / TID:</span>
                      <span className="font-mono text-zinc-200 truncate max-w-[170px]">
                        {accountNumber || "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Biaya MDR:</span>
                      <span className="font-medium text-zinc-200">
                        {parseFloat(feePercentage) > 0
                          ? `${parseFloat(feePercentage).toFixed(1)}%`
                          : "Gratis (0%)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Settlement:</span>
                      <span className="text-zinc-200">
                        {settlementTime || "Real-time"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Min. Trx:</span>
                      <span className="text-zinc-200">
                        {parseInt(minAmount, 10) > 0
                          ? formatPaymentAmount(parseInt(minAmount, 10))
                          : "Rp 0"}
                      </span>
                    </div>
                  </div>

                  {description && (
                    <div className="rounded-lg bg-zinc-950/80 border border-zinc-800 p-2.5 text-[11px] text-zinc-400 leading-relaxed mt-2">
                      <span className="font-medium text-zinc-200 block mb-0.5">
                        Instruksi Kasir:
                      </span>
                      {description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card: Petunjuk & Bantuan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <IconInfoCircle className="size-4 text-blue-400" />
                  <span>Panduan Konfigurasi</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-zinc-400 space-y-2">
                <p>
                  • <strong>QRIS:</strong> Biaya MDR standar Bank Indonesia saat
                  ini adalah 0.7% untuk kategori merchant reguler.
                </p>
                <p>
                  • <strong>Mesin EDC:</strong> Masukkan Terminal ID (TID) yang
                  tertera pada stiker fisik mesin EDC di meja kasir.
                </p>
                <p>
                  • <strong>Settlement:</strong> Saluran berstatus{" "}
                  <em>Real-time</em> langsung menambah saldo penampung hari ini
                  juga.
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
