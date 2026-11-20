import * as React from "react";
import {
  IconAlertTriangle,
  IconFileSpreadsheet,
  IconUpload,
} from "@tabler/icons-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

interface FailedRow {
  row: number;
  data?: Record<string, unknown>;
  error: string;
}

interface ImportResult {
  importedCount: number;
  failedCount: number;
  errors?: FailedRow[];
}

interface ProductCsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const SAMPLE_CSV = `name,price,category,sku,barcode,in_stock
Espresso,15000,Kopi,ESP-01,8990001001,50
Cappuccino,22000,Kopi,CAP-01,8990001002,40
Croissant,18000,Pastry,CRO-01,8990001003,25`;

export function ProductCsvImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: ProductCsvImportDialogProps) {
  const { authorizedFetch } = useAuth();
  const [csvText, setCsvText] = React.useState("");
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setCsvText("");
      setSelectedFileName(null);
      setResult(null);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) {
      toast.add({
        title: "Pilih file CSV atau isi teks CSV",
        type: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setResult(null);

      const res = await authorizedFetch("/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: csvText.trim() }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string | string[];
        } | null;
        throw new Error(
          Array.isArray(body?.message)
            ? body.message.join(", ")
            : body?.message || `Gagal mengimpor produk (${res.status})`
        );
      }

      const resData = (await res.json()) as ImportResult;
      setResult(resData);

      if (resData.importedCount > 0) {
        toast.add({
          title: "Impor CSV Selesai",
          description: `${resData.importedCount} produk berhasil ditambahkan ke katalog.`,
        });
        onSuccess?.();
      }
    } catch (err) {
      toast.add({
        title: "Gagal Impor CSV",
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFileSpreadsheet className="size-5 text-primary" />
            <span>Unggah & Impor Produk dari CSV</span>
          </DialogTitle>
          <DialogDescription>
            Format kolom CSV wajib:{" "}
            <code>name,price,category,sku,barcode,in_stock</code>. Jika SKU atau
            barcode bentrok, pesan detail produk terkait akan ditampilkan.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleImport} className="space-y-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>Pilih File .CSV</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={isSubmitting}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <IconUpload className="size-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs sm:text-sm font-medium">
                  {selectedFileName
                    ? selectedFileName
                    : "Klik untuk memilih file .csv dari komputer"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Format teks Comma-Separated Values (.csv)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="csvText">Atau Masukkan Teks CSV Manual</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setCsvText(SAMPLE_CSV)}
                >
                  Gunakan Contoh
                </Button>
              </div>
              <Textarea
                id="csvText"
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={SAMPLE_CSV}
                className="font-mono text-xs"
                disabled={isSubmitting}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !csvText.trim()}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    Mengimpor…
                  </>
                ) : (
                  <>
                    <IconUpload className="mr-2 size-4" />
                    Mulai Impor Produk
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                <p className="text-xs text-muted-foreground font-medium">
                  Berhasil Diimpor
                </p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">
                  {result.importedCount} Produk
                </p>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-center">
                <p className="text-xs text-muted-foreground font-medium">
                  Gagal Diimpor
                </p>
                <p className="text-xl font-bold text-rose-600 mt-0.5">
                  {result.failedCount} Baris
                </p>
              </div>
            </div>

            {/* FAILED ROWS TABLE */}
            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                  <IconAlertTriangle className="size-4" />
                  <span>Daftar Baris yang Gagal Diproses:</span>
                </div>
                <div className="rounded-xl border max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Baris</TableHead>
                        <TableHead>Alasan / Pesan Kesalahan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errors.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono font-medium text-xs">
                            #{err.row}
                          </TableCell>
                          <TableCell className="text-xs text-rose-600 font-medium">
                            {err.error}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setCsvText("");
                }}
              >
                Impor File Lain
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Selesai
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
