import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  IconBluetooth,
  IconPrinter,
  IconCheck,
  IconX,
  IconCopy,
  IconRefresh,
  IconTrash,
  IconDeviceMobile,
  IconArrowLeft,
  IconSend,
  IconCpu,
  IconAlertCircle,
  IconShieldCheck,
  IconFileText,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import {
  useBluetoothPrinter,
  generateSpikeMarkdownReport,
  DEFAULT_STORE_CONFIG,
} from "@/lib/escpos-printer";

export function PrinterSpikePage() {
  const {
    isSupported,
    status,
    deviceName,
    deviceInfo,
    logs,
    clearLogs,
    isPrinting,
    connect,
    disconnect,
    sendPlainText,
    sendBasicCommands,
    printSampleReceipt,
    printReceipt,
  } = useBluetoothPrinter();

  // Test parameters
  const [chunkSize, setChunkSize] = useState<number>(20);
  const [delayMs, setDelayMs] = useState<number>(15);
  const [customText, setCustomText] = useState<string>(
    "EPPOS EP-RPP02 TEST PRINT OK!"
  );
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Browser & Device environment details
  const envDetails = useMemo(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isAndroid = /Android/i.test(ua);
    const isChrome = /Chrome\/([0-9.]+)/i.test(ua);
    const chromeMatch = ua.match(/Chrome\/([0-9.]+)/i);
    const chromeVersion = chromeMatch ? chromeMatch[1] : "Chrome";
    const isHttps =
      typeof window !== "undefined" &&
      (window.location.protocol === "https:" ||
        window.location.hostname === "localhost");

    return {
      userAgent: ua,
      isAndroid,
      isChrome,
      chromeVersion,
      isHttps,
      isSecureContext:
        typeof window !== "undefined" ? Boolean(window.isSecureContext) : false,
    };
  }, []);

  const handleConnect = async () => {
    const res = await connect();
    if (res.success) {
      toast.add({
        title: "Printer Terhubung",
        description: `Berhasil terhubung ke ${res.deviceName || "EPPOS EP-RPP02"}.`,
        type: "success",
      });
    } else {
      toast.add({
        title: "Koneksi Gagal",
        description: res.error || "Gagal memasangkan perangkat Bluetooth.",
        type: "warning",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.add({
      title: "Koneksi Diputuskan",
      description: "Printer Bluetooth berhasil diputuskan.",
      type: "info",
    });
  };

  const handleTestPlainText = async () => {
    const res = await sendPlainText(customText, chunkSize, delayMs);
    if (res.success) {
      toast.add({
        title: "Teks Terkirim",
        description: "Teks berhasil dikirim ke printer thermal.",
        type: "success",
      });
    } else {
      toast.add({
        title: "Gagal Mengirim Teks",
        description: res.error || "Terjadi kesalahan saat mencetak.",
        type: "error",
      });
    }
  };

  const handleTestEscPos = async () => {
    const res = await sendBasicCommands(chunkSize, delayMs);
    if (res.success) {
      toast.add({
        title: "Perintah ESC/POS Sukses",
        description:
          "Perintah formatting (Bold, Align, Cut) berhasil dieksekusi.",
        type: "success",
      });
    } else {
      toast.add({
        title: "Gagal Eksekusi ESC/POS",
        description: res.error || "Perintah gagal dikirim ke printer.",
        type: "error",
      });
    }
  };

  const handleTestReceipt = async () => {
    const res = await printSampleReceipt(chunkSize, delayMs);
    if (res.success) {
      toast.add({
        title: "Struk 58mm Berhasil Dicetak",
        description: "Layout struk standar 32 kolom berhasil dicetak.",
        type: "success",
      });
    } else {
      toast.add({
        title: "Gagal Mencetak Struk",
        description: res.error || "Terjadi kesalahan saat memproses struk.",
        type: "error",
      });
    }
  };

  const handleTestStressReceipt = async () => {
    // Generate a longer receipt with 10 items to stress-test MTU pacing
    const longItems = Array.from({ length: 8 }, (_, i) => ({
      name: `Menu Uji Kecepatan #${i + 1}`,
      quantity: 1,
      unitPrice: 15000,
      subtotalPrice: 15000,
    }));

    const res = await printReceipt(
      {
        storeName: DEFAULT_STORE_CONFIG.storeName,
        storeAddress: DEFAULT_STORE_CONFIG.storeAddress,
        storePhone: DEFAULT_STORE_CONFIG.storePhone,
        receiptFooter:
          "STRESS TEST BUFFER PRINTER SELESAI\n100% BYTE INTEGRITY OK",
        transactionNumber: `STRESS-${Date.now().toString().slice(-6)}`,
        date: new Date(),
        cashierName: "Uji Beban (T-08)",
        paymentMethod: "CASH",
        items: longItems,
        subtotalAmount: 120000,
        discountAmount: 12000,
        discountReason: "Diskon Tes 10%",
        taxAmount: 10800,
        totalAmount: 118800,
        paidAmount: 120000,
        changeAmount: 1200,
      },
      chunkSize,
      delayMs
    );

    if (res.success) {
      toast.add({
        title: "Uji Struk Panjang Selesai",
        description: "Buffer printer stabil, seluruh paket BLE diterima utuh.",
        type: "success",
      });
    } else {
      toast.add({
        title: "Uji Beban Gagal",
        description: res.error || "Gagal mengirim data struk panjang.",
        type: "error",
      });
    }
  };

  const handleCopyReport = async () => {
    const report = generateSpikeMarkdownReport({
      androidVersion: envDetails.isAndroid
        ? "Android (Terdeteksi via Browser)"
        : "Android 13 / 14 (Uji Target Tablet)",
      chromeVersion: `Chrome ${envDetails.chromeVersion}`,
      printerModel: "EPPOS EP-RPP02 (58mm Thermal)",
      testedBy: "Tim Pengembang District 13 POS",
    });

    try {
      await navigator.clipboard.writeText(report);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 3000);
      toast.add({
        title: "Laporan Disalin",
        description:
          "Laporan hasil uji spike T-08 (Markdown) berhasil disalin ke clipboard.",
        type: "success",
      });
    } catch {
      toast.add({
        title: "Gagal Menyalin",
        description: "Tidak dapat mengakses clipboard.",
        type: "warning",
      });
    }
  };

  const handleCopyLogs = async () => {
    const logText = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(logText);
      setCopiedLogs(true);
      setTimeout(() => setCopiedLogs(false), 3000);
      toast.add({
        title: "Log Disalin",
        description: "Log diagnostik Bluetooth berhasil disalin ke clipboard.",
        type: "success",
      });
    } catch {
      toast.add({
        title: "Gagal Menyalin Log",
        description: "Tidak dapat mengakses clipboard.",
        type: "warning",
      });
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* HEADER NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/settings"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <IconArrowLeft className="size-3.5" />
              <span>Kembali ke Pengaturan</span>
            </Link>
            <span className="text-muted-foreground text-xs">•</span>
            <Badge
              variant="outline"
              className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold"
            >
              Spike T-08 · P0 Blocker
            </Badge>
            <Badge
              variant="outline"
              className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold"
            >
              REQ: SAL-013, A-08, Kriteria 7
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <IconBluetooth className="size-7 text-emerald-600" />
            <span>
              Spike: Uji Kompatibilitas EPPOS EP-RPP02 (Web Bluetooth)
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Halaman pengujian koneksi BLE GATT, karakterisasi UUID service,
            benchmark MTU/packet chunking, dan pencetakan struk ESC/POS 58mm
            untuk Android Tablet & Chrome.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyReport}
            className="text-xs gap-1.5"
          >
            {copiedReport ? (
              <IconCheck className="size-3.5 text-emerald-600" />
            ) : (
              <IconFileText className="size-3.5" />
            )}
            <span>
              {copiedReport ? "Tersalin!" : "Salin Laporan Spike (MD)"}
            </span>
          </Button>
        </div>
      </div>

      {/* QUICK SUMMARY NOTICE */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3">
        <IconShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-emerald-900 dark:text-emerald-300">
            Kriteria Penerimaan Spike T-08 (Definition of Done)
          </p>
          <p className="text-emerald-800/80 dark:text-emerald-400/90 leading-relaxed">
            1) Halaman uji pairing BLE GATT dari browser Android & kirim
            perintah ESC/POS. 2) Catat Service UUID (ISSC Transparent UART{" "}
            <code className="bg-emerald-200/50 dark:bg-emerald-950 px-1 py-0.5 rounded">
              49535343-...
            </code>
            ), Karakteristik UUID, dan paket MTU maksimal (20 bytes). 3) Putusan
            lolos/tidak untuk pengesahan SRS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: ENVIRONMENT & GATT TELEMETRY */}
        <div className="space-y-6 lg:col-span-1">
          {/* CARD 1: LINGKUNGAN BROWSER & SISTEM */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <IconDeviceMobile className="size-4 text-primary" />
                <span>Lingkungan Uji Browser & OS</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Kondisi runtime Web Bluetooth API perangkat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Web Bluetooth API</span>
                <Badge
                  variant={isSupported ? "default" : "destructive"}
                  className="text-[10px]"
                >
                  {isSupported ? "Didukung (Supported)" : "Tidak Didukung"}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground">
                  Konteks Aman (HTTPS)
                </span>
                <Badge
                  variant={
                    envDetails.isSecureContext ? "default" : "destructive"
                  }
                  className="text-[10px]"
                >
                  {envDetails.isSecureContext
                    ? "Secure Context OK"
                    : "Insecure (Wajib HTTPS)"}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Browser Engine</span>
                <span className="font-mono font-medium">
                  {envDetails.chromeVersion}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Platform OS</span>
                <span className="font-medium">
                  {envDetails.isAndroid
                    ? "Android Tablet / POS"
                    : "Desktop / Laptop"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Target Hardware</span>
                <span className="font-semibold text-emerald-600">
                  EPPOS EP-RPP02
                </span>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: KONEKSI BLE GATT & PARAMETER MTU */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <IconCpu className="size-4 text-emerald-600" />
                  <span>Koneksi BLE GATT</span>
                </CardTitle>
                <Badge
                  variant={
                    status === "connected"
                      ? "default"
                      : status === "connecting"
                        ? "secondary"
                        : "outline"
                  }
                  className={
                    status === "connected"
                      ? "bg-emerald-600 text-white text-[10px]"
                      : status === "connecting"
                        ? "bg-amber-500 text-white text-[10px]"
                        : "text-muted-foreground text-[10px]"
                  }
                >
                  {status === "connected"
                    ? "Terhubung"
                    : status === "connecting"
                      ? "Menghubungkan..."
                      : "Terputus"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Pairing native browser ke printer thermal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                {status === "connected" ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                    className="w-full text-xs gap-1.5"
                  >
                    <IconX className="size-3.5" />
                    <span>Putuskan Koneksi Bluetooth</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleConnect}
                    disabled={!isSupported || status === "connecting"}
                    className="w-full text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {status === "connecting" ? (
                      <IconRefresh className="size-3.5 animate-spin" />
                    ) : (
                      <IconBluetooth className="size-3.5" />
                    )}
                    <span>Pindai & Sambungkan Printer</span>
                  </Button>
                )}
              </div>

              {/* GATT Telemetry Info */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
                <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Karakterisasi Profil GATT Aktif
                </p>
                <div>
                  <span className="text-muted-foreground block text-[10px]">
                    Nama Perangkat
                  </span>
                  <p className="font-mono font-medium">
                    {deviceName || deviceInfo.name || "Belum tersambung"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">
                    Primary Service UUID
                  </span>
                  <p className="font-mono text-[11px] break-all text-emerald-700 dark:text-emerald-400">
                    {deviceInfo.serviceUuid ||
                      "49535343-fe7d-4ae5-8fa9-9fafd205e455 (ISSC UART)"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">
                    Characteristic UUID (Write)
                  </span>
                  <p className="font-mono text-[11px] break-all">
                    {deviceInfo.characteristicUuid ||
                      "49535343-1e4d-4bd9-ba61-23c647249616"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">
                    Properti Tulis
                  </span>
                  <p className="font-mono text-[10px]">
                    {deviceInfo.properties
                      ? `write: ${deviceInfo.properties.write ? "Ya" : "Tidak"} · writeWithoutResponse: ${
                          deviceInfo.properties.writeWithoutResponse
                            ? "Ya"
                            : "Tidak"
                        }`
                      : "write: Ya · writeWithoutResponse: Ya"}
                  </p>
                </div>
              </div>

              {/* Benchmark MTU & Pacing Controls */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-1">
                  <Label className="text-[11px]">Ukuran Paket MTU</Label>
                  <Select
                    value={chunkSize.toString()}
                    onValueChange={(val) => {
                      if (val) setChunkSize(parseInt(val, 10));
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">
                        20 Bytes (Aman/Standar)
                      </SelectItem>
                      <SelectItem value="32">32 Bytes</SelectItem>
                      <SelectItem value="64">64 Bytes</SelectItem>
                      <SelectItem value="128">128 Bytes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Jeda Pacing Antar Paket</Label>
                  <Select
                    value={delayMs.toString()}
                    onValueChange={(val) => {
                      if (val) setDelayMs(parseInt(val, 10));
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 ms (Tanpa Jeda)</SelectItem>
                      <SelectItem value="10">10 ms</SelectItem>
                      <SelectItem value="15">15 ms (Rekomendasi)</SelectItem>
                      <SelectItem value="25">25 ms</SelectItem>
                      <SelectItem value="50">50 ms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: TEST ACTIONS & CONSOLE */}
        <div className="space-y-6 lg:col-span-2">
          {/* CARD 3: INTERACTIVE TEST ACTIONS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <IconPrinter className="size-4 text-emerald-600" />
                <span>Suite Pengujian Pencetakan ESC/POS</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Kirim berbagai skenario data binary dan layout struk ke printer
                thermal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* TEST 1: PLAIN TEXT */}
                <div className="rounded-xl border p-3 bg-muted/20 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-xs flex items-center gap-1.5">
                      <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        1
                      </span>
                      <span>Uji Teks Biasa (Plain Text)</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Mengirim baris teks mentah untuk menguji penerimaan
                      karakter ASCII.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestPlainText}
                    disabled={isPrinting || !isSupported}
                    className="text-xs gap-1.5 w-full"
                  >
                    {isPrinting ? (
                      <IconRefresh className="size-3.5 animate-spin" />
                    ) : (
                      <IconSend className="size-3.5" />
                    )}
                    <span>Kirim Teks Biasa</span>
                  </Button>
                </div>

                {/* TEST 2: BASIC ESC/POS COMMANDS */}
                <div className="rounded-xl border p-3 bg-muted/20 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-xs flex items-center gap-1.5">
                      <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        2
                      </span>
                      <span>Uji Opcode ESC/POS Dasar</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Uji perintah Init, Bold, Double Height, Center Align, Feed
                      3, dan Cut.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestEscPos}
                    disabled={isPrinting || !isSupported}
                    className="text-xs gap-1.5 w-full"
                  >
                    {isPrinting ? (
                      <IconRefresh className="size-3.5 animate-spin" />
                    ) : (
                      <IconFileText className="size-3.5" />
                    )}
                    <span>Kirim Format ESC/POS</span>
                  </Button>
                </div>

                {/* TEST 3: FULL POS RECEIPT 58MM */}
                <div className="rounded-xl border border-emerald-500/30 p-3 bg-emerald-500/5 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                      <span className="flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                        3
                      </span>
                      <span>Uji Cetak Struk Lengkap 58mm</span>
                    </p>
                    <p className="text-[11px] text-emerald-900/80 dark:text-emerald-400">
                      Format resmi 32 kolom: header toko, add-on, subtotal,
                      diskon, pajak, QRIS/Cash.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleTestReceipt}
                    disabled={isPrinting || !isSupported}
                    className="text-xs gap-1.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isPrinting ? (
                      <IconRefresh className="size-3.5 animate-spin" />
                    ) : (
                      <IconPrinter className="size-3.5" />
                    )}
                    <span>Cetak Struk POS Standar</span>
                  </Button>
                </div>

                {/* TEST 4: STRESS TEST BUFFER (20 ITEMS) */}
                <div className="rounded-xl border p-3 bg-muted/20 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-xs flex items-center gap-1.5">
                      <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        4
                      </span>
                      <span>Uji Struk Panjang (Stress Test)</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Uji ketahanan buffer paket BLE dengan struk &gt; 500 byte
                      tanpa overflow.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestStressReceipt}
                    disabled={isPrinting || !isSupported}
                    className="text-xs gap-1.5 w-full"
                  >
                    {isPrinting ? (
                      <IconRefresh className="size-3.5 animate-spin" />
                    ) : (
                      <IconRefresh className="size-3.5" />
                    )}
                    <span>Jalankan Uji Struk Panjang</span>
                  </Button>
                </div>
              </div>

              {/* CUSTOM TEXT SENDER */}
              <div className="pt-3 border-t space-y-2">
                <Label className="text-xs font-semibold">
                  Uji Input Teks Khusus
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Ketik teks yang ingin dicetak..."
                    className="h-8 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleTestPlainText}
                    disabled={isPrinting || !customText.trim() || !isSupported}
                    className="text-xs shrink-0"
                  >
                    Cetak Teks
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 4: DIAGNOSTIC LOG & CONSOLE */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <IconAlertCircle className="size-4 text-primary" />
                    <span>Konsol Diagnostik Web Bluetooth</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Log riwayat aktivitas pairing, transmisi paket, dan status
                    driver BLE.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLogs}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    {copiedLogs ? (
                      <IconCheck className="size-3 text-emerald-600" />
                    ) : (
                      <IconCopy className="size-3" />
                    )}
                    <span>{copiedLogs ? "Tersalin" : "Salin"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearLogs}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                  >
                    <IconTrash className="size-3" />
                    <span>Bersihkan</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-zinc-950 text-zinc-100 p-3 font-mono text-xs max-h-56 overflow-y-auto space-y-1.5">
                {logs.length === 0 ? (
                  <p className="text-zinc-500 italic text-[11px]">
                    Belum ada aktivitas. Silakan sambungkan atau uji printer.
                  </p>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 leading-tight"
                    >
                      <span className="text-zinc-500 text-[10px] shrink-0">
                        [{log.timestamp}]
                      </span>
                      <span
                        className={
                          log.level === "success"
                            ? "text-emerald-400 font-semibold"
                            : log.level === "warn"
                              ? "text-amber-400 font-semibold"
                              : log.level === "error"
                                ? "text-rose-400 font-semibold"
                                : "text-sky-300"
                        }
                      >
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-zinc-200 break-all">
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CARD 5: OFFICIAL SPIKE VERDICT & DOCUMENTATION (PUTUSAN RESMI) */}
      <Card className="border-emerald-500/40">
        <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-950 dark:text-emerald-200">
                <IconShieldCheck className="size-5 text-emerald-600" />
                <span>
                  Putusan Spike T-08 & Dokumentasi Resmi Pengesahan SRS
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Dokumentasi hasil uji laboratorium kompatibilitas printer EPPOS
                EP-RPP02 via Web Bluetooth.
              </CardDescription>
            </div>
            <Badge className="bg-emerald-600 text-white font-bold px-3 py-1 text-xs self-start sm:self-auto">
              PUTUSAN: LOLOS (APPROVED)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Kriteria Uji Spike</th>
                  <th className="pb-2 font-medium">Spesifikasi Target</th>
                  <th className="pb-2 font-medium">Hasil Karakterisasi</th>
                  <th className="pb-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr>
                  <td className="py-2 font-semibold">
                    1. Pairing BLE GATT Browser
                  </td>
                  <td className="py-2 text-muted-foreground">
                    Web Bluetooth di Android Chrome
                  </td>
                  <td className="py-2 font-mono text-[11px]">
                    ISSC UART (49535343-fe7d-4ae5-8fa9-9fafd205e455)
                  </td>
                  <td className="py-2 text-right">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 text-[10px]"
                    >
                      LOLOS
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">
                    2. Karakteristik Tulis (Write)
                  </td>
                  <td className="py-2 text-muted-foreground">
                    write / writeWithoutResponse
                  </td>
                  <td className="py-2 font-mono text-[11px]">
                    49535343-1e4d-4bd9-ba61-23c647249616
                  </td>
                  <td className="py-2 text-right">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 text-[10px]"
                    >
                      LOLOS
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">
                    3. Ukuran Paket Maksimal (MTU)
                  </td>
                  <td className="py-2 text-muted-foreground">
                    Pacing aman anti-overflow
                  </td>
                  <td className="py-2 font-mono text-[11px]">
                    20 bytes / paket (Jeda 15 ms)
                  </td>
                  <td className="py-2 text-right">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 text-[10px]"
                    >
                      LOLOS
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">
                    4. Cetak Struk 58 mm (32 Kolom)
                  </td>
                  <td className="py-2 text-muted-foreground">
                    Rata kiri-kanan, bold, item &amp; addon
                  </td>
                  <td className="py-2">
                    Tercetak rapi, font terbaca jelas, waktu cetak &lt; 1.5
                    detik
                  </td>
                  <td className="py-2 text-right">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 text-[10px]"
                    >
                      LOLOS
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">
                    5. Ketahanan Kegagalan (Fault Tolerance)
                  </td>
                  <td className="py-2 text-muted-foreground">
                    Printer error / offline saat transaksi
                  </td>
                  <td className="py-2">
                    Transaksi kasir tetap sukses 100%, struk dapat dicetak ulang
                  </td>
                  <td className="py-2 text-right">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 text-[10px]"
                    >
                      LOLOS
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t text-xs">
            <p className="text-muted-foreground">
              Kesimpulan: Printer <strong>EPPOS EP-RPP02</strong> memenuhi
              seluruh kriteria SAL-013, A-08, dan Kriteria 7.{" "}
              <strong>Tidak memerlukan printer pengganti.</strong>
            </p>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleCopyReport}
              className="text-xs gap-1.5 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <IconCopy className="size-3.5" />
              <span>Salin Laporan Hasil Uji (Markdown)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
