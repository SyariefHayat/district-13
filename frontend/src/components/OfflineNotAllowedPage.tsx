import React from "react";
import { WifiOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export const OfflineNotAllowedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center dark:bg-amber-950 dark:text-amber-400">
        <WifiOff className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold tracking-tight mb-2">
        Fungsi Dibatasi Saat Offline
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-2">
        Kode:{" "}
        <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
          OFFLINE_NOT_ALLOWED
        </code>
      </p>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Fungsi ini (pengelolaan produk, inventaris, laporan, dan pengaturan)
        membutuhkan koneksi server aktif. Penjualan kasir tetap dapat dilakukan
        secara penuh melalui menu POS.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/dashboard/pos")}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90"
        >
          Buka Kasir POS
        </button>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-4 py-2 border text-sm font-medium rounded-md hover:bg-accent"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>
    </div>
  );
};
