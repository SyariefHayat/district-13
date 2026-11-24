import * as React from "react";
import { Link } from "react-router";
import {
  IconBuildingStore,
  IconDeviceTablet,
  IconNumber,
  IconPlus,
  IconRefresh,
  IconShieldLock,
  IconCheck,
  IconX,
  IconBluetooth,
  IconPrinter,
} from "@tabler/icons-react";
import { useAuth } from "@/context/auth-context";
import {
  useBluetoothPrinter,
  saveCachedStoreConfig,
} from "@/lib/escpos-printer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  receiptFooter: string;
  taxMode: "none" | "exclusive" | "inclusive";
  taxRate: number;
  defaultMinStock: number;
}

interface DeviceItem {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  lastSeenAt?: string | null;
  createdAt?: string;
}

export default function SettingsPage() {
  const { user, authorizedFetch } = useAuth();
  const isOwner = user?.role === "OWNER";

  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);
  const [settings, setSettings] = React.useState<StoreSettings>({
    storeName: "District 13 Coffee & Eatery",
    storeAddress: "Jl. Industri No. 13",
    receiptFooter: "Terima kasih atas kunjungan Anda!",
    taxMode: "none",
    taxRate: 11,
    defaultMinStock: 5,
  });

  // Devices state
  const [devices, setDevices] = React.useState<DeviceItem[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = React.useState(true);
  const [addDeviceOpen, setAddDeviceOpen] = React.useState(false);
  const [newDeviceCode, setNewDeviceCode] = React.useState("");
  const [newDeviceName, setNewDeviceName] = React.useState("");
  const [isSubmittingDevice, setIsSubmittingDevice] = React.useState(false);

  // Queue state
  const [isResettingQueue, setIsResettingQueue] = React.useState(false);

  // Bluetooth Printer Driver
  const {
    isSupported: isBtSupported,
    status: btStatus,
    deviceName: btDeviceName,
    isPrinting: isBtPrinting,
    connect: connectBluetooth,
    disconnect: disconnectBluetooth,
    printReceipt: printBtReceipt,
  } = useBluetoothPrinter();

  const handleTestPrint = async () => {
    try {
      if (!isBtSupported) {
        toast.add({
          title: "Web Bluetooth Tidak Didukung",
          description:
            "Browser ini tidak mendukung Web Bluetooth API. Gunakan Chrome via HTTPS.",
          type: "warning",
        });
        return;
      }

      if (btStatus !== "connected") {
        const res = await connectBluetooth();
        if (!res.success) {
          toast.add({
            title: "Koneksi Gagal",
            description: res.error || "Gagal menyambungkan ke printer.",
            type: "warning",
          });
          return;
        }
      }

      const res = await printBtReceipt({
        storeName: settings.storeName,
        storeAddress: settings.storeAddress,
        receiptFooter: settings.receiptFooter,
        transactionNumber: "TRX-TEST-PRINT",
        date: new Date(),
        cashierName: user?.username || "Admin",
        paymentMethod: "CASH",
        items: [
          {
            name: "Uji Coba Cetak ESC/POS",
            quantity: 1,
            unitPrice: 15000,
            subtotalPrice: 15000,
            notes: "Koneksi Web Bluetooth Berhasil!",
          },
        ],
        subtotalAmount: 15000,
        totalAmount: 15000,
        paidAmount: 15000,
        changeAmount: 0,
      });

      if (res.success) {
        toast.add({
          title: "Uji Cetak Berhasil",
          description: "Struk uji coba telah dicetak oleh printer thermal.",
          type: "success",
        });
      } else {
        toast.add({
          title: "Uji Cetak Gagal",
          description: res.error || "Gagal mengirim data cetak ke printer.",
          type: "warning",
        });
      }
    } catch (err: any) {
      toast.add({
        title: "Kendala Uji Cetak",
        description: err.message || "Terjadi kesalahan saat mencetak.",
        type: "error",
      });
    }
  };

  // Fetch settings & devices
  const loadSettings = React.useCallback(async () => {
    try {
      setIsLoadingSettings(true);
      const res = await authorizedFetch("/settings");
      if (res.ok) {
        const data = (await res.json()) as Partial<StoreSettings>;
        saveCachedStoreConfig({
          storeName: data.storeName,
          storeAddress: data.storeAddress,
          receiptFooter: data.receiptFooter,
        });
        setSettings((prev) => ({
          ...prev,
          storeName: data.storeName ?? prev.storeName,
          storeAddress: data.storeAddress ?? prev.storeAddress,
          receiptFooter: data.receiptFooter ?? prev.receiptFooter,
          taxMode: data.taxMode ?? prev.taxMode,
          taxRate: data.taxRate ?? prev.taxRate,
          defaultMinStock: data.defaultMinStock ?? prev.defaultMinStock,
        }));
      }
    } catch {
      // Keep default values
    } finally {
      setIsLoadingSettings(false);
    }
  }, [authorizedFetch]);

  const loadDevices = React.useCallback(async () => {
    try {
      setIsLoadingDevices(true);
      const res = await authorizedFetch("/devices");
      if (res.ok) {
        const data = (await res.json()) as DeviceItem[];
        setDevices(Array.isArray(data) ? data : []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingDevices(false);
    }
  }, [authorizedFetch]);

  React.useEffect(() => {
    void loadSettings();
    void loadDevices();
  }, [loadSettings, loadDevices]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      toast.add({
        title: "Akses Ditolak",
        description: "Hanya Pemilik yang dapat mengubah pengaturan toko.",
        type: "error",
      });
      return;
    }

    try {
      setIsSavingSettings(true);
      const res = await authorizedFetch("/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string | string[];
        } | null;
        throw new Error(
          Array.isArray(body?.message)
            ? body.message.join(", ")
            : body?.message || "Gagal menyimpan pengaturan"
        );
      }

      saveCachedStoreConfig({
        storeName: settings.storeName,
        storeAddress: settings.storeAddress,
        receiptFooter: settings.receiptFooter,
      });

      toast.add({
        title: "Pengaturan berhasil disimpan",
        description: "Data konfigurasi toko telah diperbarui.",
      });
    } catch (err) {
      toast.add({
        title: "Gagal menyimpan",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        type: "error",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetQueue = async () => {
    if (!isOwner) {
      toast.add({
        title: "Akses Ditolak",
        description: "Hanya Pemilik yang dapat mereset antrean.",
        type: "error",
      });
      return;
    }

    try {
      setIsResettingQueue(true);
      const res = await authorizedFetch("/settings/queue-counter/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Gagal mereset nomor antrean");

      toast.add({
        title: "Nomor antrean berhasil direset",
        description: "Nomor antrean hari ini telah dikembalikan ke awal (0).",
      });
    } catch (err) {
      toast.add({
        title: "Gagal reset",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        type: "error",
      });
    } finally {
      setIsResettingQueue(false);
    }
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceCode.trim() || !newDeviceName.trim()) return;

    try {
      setIsSubmittingDevice(true);
      const res = await authorizedFetch("/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newDeviceCode.trim(),
          name: newDeviceName.trim(),
          isActive: true,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string | string[];
        } | null;
        throw new Error(
          Array.isArray(body?.message)
            ? body.message.join(", ")
            : body?.message || "Gagal mendaftarkan perangkat"
        );
      }

      toast.add({
        title: "Perangkat terdaftar",
        description: `Perangkat ${newDeviceName} (${newDeviceCode}) siap digunakan.`,
      });

      setAddDeviceOpen(false);
      setNewDeviceCode("");
      setNewDeviceName("");
      void loadDevices();
    } catch (err) {
      toast.add({
        title: "Pendaftaran gagal",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        type: "error",
      });
    } finally {
      setIsSubmittingDevice(false);
    }
  };

  const handleToggleDevice = async (device: DeviceItem) => {
    try {
      const res = await authorizedFetch(`/devices/${device.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !device.isActive }),
      });

      if (!res.ok) throw new Error("Gagal mengubah status perangkat");

      setDevices((prev) =>
        prev.map((d) =>
          d.id === device.id ? { ...d, isActive: !d.isActive } : d
        )
      );

      toast.add({
        title: "Status perangkat diperbarui",
        description: `${device.name} sekarang ${!device.isActive ? "Aktif" : "Nonaktif"}.`,
      });
    } catch (err) {
      toast.add({
        title: "Gagal",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        type: "error",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Pengaturan Toko & Perangkat
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Konfigurasi identitas toko, kebijakan perpajakan, toleransi offline,
          dan perangkat kasir POS.
        </p>
      </div>

      {!isOwner && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-700 dark:text-amber-300">
          <IconShieldLock className="size-5 shrink-0" />
          <span>
            <strong>Mode Terbatas:</strong> Anda masuk sebagai Admin. Hak akses
            Anda dibatasi untuk melihat konfigurasi toko dan mengelola perangkat
            kasir.
          </span>
        </div>
      )}

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="store" className="gap-2">
            <IconBuildingStore className="size-4" />
            <span className="hidden sm:inline">Toko & Pajak</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <IconDeviceTablet className="size-4" />
            <span className="hidden sm:inline">Perangkat</span>
          </TabsTrigger>
          <TabsTrigger value="queue" className="gap-2">
            <IconNumber className="size-4" />
            <span className="hidden sm:inline">Antrean</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: STORE & TAX SETTINGS */}
        <TabsContent value="store" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Identitas & Kebijakan Toko
              </CardTitle>
              <CardDescription>
                Informasi ini akan dicetak pada struk belanja dan diterapkan
                pada perhitungan transaksi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner className="size-6 text-muted-foreground" />
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Nama Toko</Label>
                      <Input
                        id="storeName"
                        value={settings.storeName}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            storeName: e.target.value,
                          })
                        }
                        disabled={!isOwner || isSavingSettings}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultMinStock">
                        Batas Stok Minimum Default
                      </Label>
                      <Input
                        id="defaultMinStock"
                        type="number"
                        min="0"
                        value={settings.defaultMinStock}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            defaultMinStock:
                              Number.parseInt(e.target.value, 10) || 0,
                          })
                        }
                        disabled={!isOwner || isSavingSettings}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeAddress">Alamat Lengkap Toko</Label>
                    <Textarea
                      id="storeAddress"
                      rows={2}
                      value={settings.storeAddress}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          storeAddress: e.target.value,
                        })
                      }
                      disabled={!isOwner || isSavingSettings}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiptFooter">
                      Catatan Kaki Struk (Receipt Footer)
                    </Label>
                    <Input
                      id="receiptFooter"
                      value={settings.receiptFooter}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          receiptFooter: e.target.value,
                        })
                      }
                      disabled={!isOwner || isSavingSettings}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="taxMode">Mode Pajak (PPN)</Label>
                      <Select
                        value={settings.taxMode}
                        onValueChange={(val) =>
                          setSettings({
                            ...settings,
                            taxMode:
                              (val as StoreSettings["taxMode"]) || "none",
                          })
                        }
                        disabled={!isOwner || isSavingSettings}
                      >
                        <SelectTrigger id="taxMode">
                          <SelectValue placeholder="Pilih mode pajak" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tanpa Pajak (0%)</SelectItem>
                          <SelectItem value="inclusive">
                            Termasuk Pajak (Inclusive)
                          </SelectItem>
                          <SelectItem value="exclusive">
                            Pajak Tambahan (Exclusive)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Tarif Pajak (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.taxRate}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            taxRate: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={
                          !isOwner ||
                          settings.taxMode === "none" ||
                          isSavingSettings
                        }
                      />
                    </div>
                  </div>

                  {isOwner && (
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" disabled={isSavingSettings}>
                        {isSavingSettings ? "Menyimpan…" : "Simpan Perubahan"}
                      </Button>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: DEVICE MANAGEMENT */}
        <TabsContent value="devices" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Perangkat Kasir Terdaftar
                </CardTitle>
                <CardDescription>
                  Otorisasi tablet kasir untuk sinkronisasi transaksi offline
                  dan pelacakan audit.
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setAddDeviceOpen(true)}
              >
                <IconPlus className="size-4" />
                <span>Tambah Perangkat</span>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingDevices ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner className="size-6 text-muted-foreground" />
                </div>
              ) : devices.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground border rounded-xl border-dashed">
                  Belum ada perangkat kasir terdaftar. Daftarkan tablet kasir
                  Anda di sini.
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Perangkat</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Terakhir Dilihat</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devices.map((device) => (
                        <TableRow key={device.id}>
                          <TableCell className="font-mono font-medium">
                            {device.code}
                          </TableCell>
                          <TableCell>{device.name}</TableCell>
                          <TableCell>
                            {device.isActive ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                              >
                                Aktif
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-muted text-muted-foreground"
                              >
                                Nonaktif
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {device.lastSeenAt
                              ? new Date(device.lastSeenAt).toLocaleString(
                                  "id-ID"
                                )
                              : "Belum pernah"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleToggleDevice(device)}
                              className="text-xs"
                            >
                              {device.isActive ? (
                                <>
                                  <IconX className="mr-1 size-3.5" />
                                  Nonaktifkan
                                </>
                              ) : (
                                <>
                                  <IconCheck className="mr-1 size-3.5" />
                                  Aktifkan
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD: BLUETOOTH THERMAL PRINTER (ESC/POS 58MM) */}
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <IconBluetooth className="size-5 text-emerald-600" />
                  <span>Printer Kasir Bluetooth (ESC/POS 58mm)</span>
                </CardTitle>
                <CardDescription>
                  Pengaturan koneksi nirkabel printer thermal (misal EPPOS
                  EP-RPP02 / POS-58) via Web Bluetooth API.
                </CardDescription>
              </div>
              <Badge
                variant={btStatus === "connected" ? "default" : "secondary"}
                className={
                  btStatus === "connected"
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground"
                }
              >
                {btStatus === "connected"
                  ? "Terhubung"
                  : btStatus === "connecting"
                    ? "Menghubungkan..."
                    : "Terputus"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border p-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Status Driver Web Bluetooth
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    {isBtSupported
                      ? `Web Bluetooth didukung · ${btDeviceName ? `Perangkat: ${btDeviceName}` : "Belum ada printer aktif"}`
                      : "Web Bluetooth tidak didukung pada browser ini (gunakan Chrome di Android/Desktop via HTTPS)"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {btStatus === "connected" ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={disconnectBluetooth}
                        className="text-xs"
                      >
                        Putuskan
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleTestPrint}
                        disabled={isBtPrinting}
                        className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isBtPrinting ? (
                          <IconRefresh className="size-3.5 animate-spin" />
                        ) : (
                          <IconPrinter className="size-3.5" />
                        )}
                        <span>
                          {isBtPrinting ? "Mencetak..." : "Uji Cetak Struk"}
                        </span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleTestPrint}
                      disabled={isBtPrinting || !isBtSupported}
                      className="text-xs gap-1.5 bg-primary"
                    >
                      <IconBluetooth className="size-3.5" />
                      <span>Sambungkan & Uji Cetak</span>
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <span className="text-muted-foreground">
                  Ingin melakukan benchmark MTU paket atau pengujian GATT
                  lanjutan?
                </span>
                <Link to="/dashboard/printer-spike">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <IconDeviceTablet className="size-3.5" />
                    <span>Halaman Uji Spike EPPOS (T-08)</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: QUEUE COUNTER */}
        <TabsContent value="queue" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Nomor Antrean Pesanan
              </CardTitle>
              <CardDescription>
                Nomor antrean pesanan bertambah secara berurutan dan dapat
                direset setiap awal hari operasional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border p-4 bg-muted/40 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Pengaturan Reset Harian
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    Reset otomatis setiap pukul 00:00 WIB (atau manual oleh
                    Pemilik)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleResetQueue()}
                  disabled={!isOwner || isResettingQueue}
                  className="gap-1.5"
                >
                  <IconRefresh className="size-4" />
                  <span>
                    {isResettingQueue ? "Mereset…" : "Reset Antrean Sekarang"}
                  </span>
                </Button>
              </div>

              {!isOwner && (
                <p className="text-xs text-muted-foreground">
                  * Tombol reset nomor antrean dinonaktifkan karena Anda masuk
                  sebagai Admin.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG ADD DEVICE */}
      <Dialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Daftarkan Perangkat Baru</DialogTitle>
            <DialogDescription>
              Tambahkan perangkat kasir baru dengan kode identifikasi unik.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDevice} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deviceCode">Kode Perangkat</Label>
              <Input
                id="deviceCode"
                placeholder="Contoh: TAB-01 / POS-KASIR"
                value={newDeviceCode}
                onChange={(e) => setNewDeviceCode(e.target.value)}
                required
                disabled={isSubmittingDevice}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceName">Nama Perangkat</Label>
              <Input
                id="deviceName"
                placeholder="Contoh: Tablet Kasir Depan"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                required
                disabled={isSubmittingDevice}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDeviceOpen(false)}
                disabled={isSubmittingDevice}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmittingDevice}>
                {isSubmittingDevice ? "Mendaftarkan…" : "Daftarkan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
