import { IconTicket, IconSparkles } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DiscountPreviewProps {
  name: string;
  code?: string;
  type: "percentage" | "fixed";
  value: number;
  maxDiscount?: number | null;
  applyMode: "manual" | "automatic";
  status: "published" | "draft";
}

export function DiscountPreview({
  name,
  code,
  type,
  value,
  maxDiscount,
  applyMode,
  status,
}: DiscountPreviewProps) {
  const displayValue =
    type === "percentage"
      ? `${value || 0}%`
      : `Rp ${(value || 0).toLocaleString("id-ID")}`;

  const displayName = name.trim() || "Nama Diskon Teman Warkop";
  const displayCode = code?.trim() || "TEMAN-KASIR";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTicket className="size-4 text-primary" />
          <span>Pratinjau Voucher Kasir</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Voucher Ticket Component */}
        <div className="relative overflow-hidden rounded-xl border border-dashed border-zinc-700 bg-gradient-to-br from-zinc-900 to-[#121215] p-4 text-zinc-100 shadow-inner">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-1.5">
              <IconSparkles className="size-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {applyMode === "manual" ? "Manual Kasir POS" : "Auto Apply"}
              </span>
            </div>
            <Badge
              variant="outline"
              className={
                status === "published"
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-400 text-[10px]"
                  : "border-amber-500/40 bg-amber-950/30 text-amber-400 text-[10px]"
              }
            >
              {status === "published" ? "Aktif" : "Draf"}
            </Badge>
          </div>

          <div className="py-3">
            <h4 className="font-semibold text-sm md:text-base leading-snug line-clamp-2 text-white">
              {displayName}
            </h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-400">
                {displayValue}
              </span>
              <span className="text-xs text-zinc-400">POTONGAN</span>
            </div>
            {type === "percentage" && maxDiscount && maxDiscount > 0 ? (
              <p className="text-[11px] text-zinc-400 mt-1">
                Maksimal potongan: Rp {maxDiscount.toLocaleString("id-ID")}
              </p>
            ) : null}
          </div>

          <div className="pt-3 border-t border-dashed border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500 text-[11px]">KODE DISKON</span>
            <span className="font-mono font-bold tracking-widest text-zinc-200 bg-zinc-800/80 px-2 py-0.5 rounded">
              {displayCode}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
