import React, { createContext, useContext, useEffect, useState } from "react";
import { connectivity } from "../lib/connectivity";
import { onStoragePersistChange, requestPersistentStorage } from "../lib/pwa";
import {
  onSyncStatusChange,
  syncOutbox,
  type SyncEngineStatus,
} from "../lib/outbox-sync";

interface ConnectivityContextType {
  isOnline: boolean;
  isOffline: boolean;
  storagePersistDenied: boolean;
  pendingSyncCount: number;
  oldestAgeHours: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  checkConnectivity: () => Promise<boolean>;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  isOffline: false,
  storagePersistDenied: false,
  pendingSyncCount: 0,
  oldestAgeHours: 0,
  isSyncing: false,
  syncNow: async () => {},
  checkConnectivity: async () => true,
});

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(connectivity.isOnline);
  const [storagePersistDenied, setStoragePersistDenied] =
    useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>({
    isSyncing: false,
    pendingCount: 0,
    oldestAgeHours: 0,
  });

  useEffect(() => {
    // 1. Subscribe to active connectivity
    const unsubConnectivity = connectivity.subscribe((online) => {
      setIsOnline(online);
    });

    // 2. Request persistent storage (OFF-011)
    requestPersistentStorage().then((granted) => {
      setStoragePersistDenied(!granted);
    });

    const unsubPersist = onStoragePersistChange((persisted) => {
      setStoragePersistDenied(!persisted);
    });

    // 3. Subscribe to outbox sync status
    const unsubSync = onSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    return () => {
      unsubConnectivity();
      unsubPersist();
      unsubSync();
    };
  }, []);

  const syncNow = async () => {
    await syncOutbox();
  };

  const checkConnectivity = async () => {
    return connectivity.checkServerConnectivity();
  };

  return (
    <ConnectivityContext.Provider
      value={{
        isOnline,
        isOffline: !isOnline,
        storagePersistDenied,
        pendingSyncCount: syncStatus.pendingCount,
        oldestAgeHours: syncStatus.oldestAgeHours,
        isSyncing: syncStatus.isSyncing,
        syncNow,
        checkConnectivity,
      }}
    >
      {children}
    </ConnectivityContext.Provider>
  );
};

export function useConnectivity() {
  return useContext(ConnectivityContext);
}
