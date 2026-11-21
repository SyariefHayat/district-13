import React from "react";
import { useConnectivity } from "../context/connectivity-context";
import { WifiOff, AlertTriangle, RefreshCw, HardDrive } from "lucide-react";

export const OfflineBanner: React.FC = () => {
  const {
    isOffline,
    storagePersistDenied,
    pendingSyncCount,
    oldestAgeHours,
    isSyncing,
    syncNow,
  } = useConnectivity();

  return (
    <div className="flex flex-col w-full text-xs font-medium">
      {/* 1. Offline Mode Banner */}
      {isOffline && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-500 text-amber-950 dark:bg-amber-600 dark:text-amber-50 shadow-sm transition-all">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              <strong>Mode Offline:</strong> Server tidak merespons. Penjualan
              kasir tetap dapat berjalan dan tersimpan secara lokal.
            </span>
          </div>
          {pendingSyncCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-700/20 text-xs">
              {pendingSyncCount} transaksi tersimpan
            </span>
          )}
        </div>
      )}

      {/* 2. Persistent Storage Denied Warning (OFF-011) */}
      {storagePersistDenied && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-yellow-100 text-yellow-900 border-b border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
            <span>
              Penyimpanan permanen ditolak atau tidak aktif. Tambahkan aplikasi
              ke Layar Utama atau izinkan penyimpanan agar data offline aman.
            </span>
          </div>
        </div>
      )}

      {/* 3. Oldest Unsynced Event > 4 Hours Warning (OFF-006) */}
      {pendingSyncCount > 0 && oldestAgeHours > 4 && (
        <div className="flex items-center justify-between px-4 py-2 bg-rose-600 text-white animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Peringatan Sinkronisasi:</strong> Ada transaksi offline
              belum tersinkron lebih dari {Math.floor(oldestAgeHours)} jam!
              Segera hubungkan perangkat ke jaringan untuk menghindari
              penumpukan.
            </span>
          </div>
          {!isOffline && (
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="flex items-center gap-1 px-3 py-1 bg-white text-rose-700 rounded text-xs font-semibold hover:bg-rose-50"
            >
              <RefreshCw
                className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`}
              />
              Sinkronkan Sekarang
            </button>
          )}
        </div>
      )}
    </div>
  );
};
