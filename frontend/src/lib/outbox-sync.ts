import { db, type LocalOutboxEvent } from "./db";
import { connectivity } from "./connectivity";

export interface SyncEngineStatus {
  isSyncing: boolean;
  pendingCount: number;
  oldestAgeHours: number;
  lastSyncTime?: string;
  lastError?: string;
}

let isSyncing = false;
let syncStatusListeners: Array<(status: SyncEngineStatus) => void> = [];

export function onSyncStatusChange(
  listener: (status: SyncEngineStatus) => void
) {
  syncStatusListeners.push(listener);
  notifyStatus();
  return () => {
    syncStatusListeners = syncStatusListeners.filter((l) => l !== listener);
  };
}

async function notifyStatus(lastError?: string) {
  const pendingCount = await db.outbox
    .where("status")
    .anyOf("pending", "syncing")
    .count();
  const oldestEvent = await db.outbox
    .where("status")
    .anyOf("pending", "syncing")
    .sortBy("createdAt");

  let oldestAgeHours = 0;
  if (oldestEvent.length > 0 && oldestEvent[0].createdAt) {
    const ageMs = Date.now() - new Date(oldestEvent[0].createdAt).getTime();
    oldestAgeHours = Math.max(0, ageMs / (1000 * 60 * 60));
  }

  const status: SyncEngineStatus = {
    isSyncing,
    pendingCount,
    oldestAgeHours,
    lastSyncTime: new Date().toISOString(),
    lastError,
  };

  syncStatusListeners.forEach((l) => l(status));
}

/**
 * Syncs pending outbox events to server in sequential batches of <= 50 (T-46, OFF-004)
 */
export async function syncOutbox(
  apiBaseUrl = ""
): Promise<{ synced: number; remaining: number }> {
  if (isSyncing || connectivity.isOffline) {
    const remaining = await db.outbox
      .where("status")
      .anyOf("pending", "syncing")
      .count();
    return { synced: 0, remaining };
  }

  isSyncing = true;
  notifyStatus();

  let totalSynced = 0;

  try {
    while (connectivity.isOnline) {
      // 1. Fetch batch of up to 50 pending events ordered by seq
      const batch: LocalOutboxEvent[] = await db.outbox
        .where("status")
        .anyOf("pending", "rejected")
        .sortBy("seq");

      if (!batch || batch.length === 0) {
        break;
      }

      const eventsToSend = batch.slice(0, 50);

      // Mark batch as syncing
      const eventIds = eventsToSend.map((e) => e.id);
      await db.outbox.where("id").anyOf(eventIds).modify({ status: "syncing" });

      const payload = {
        device_code: "T1",
        events: eventsToSend.map((e) => ({
          seq: e.seq,
          type: e.type,
          idempotency_key: e.idempotencyKey,
          occurred_at: e.occurredAt,
          payload: e.payload,
        })),
      };

      const token =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("token")
          : typeof sessionStorage !== "undefined"
            ? sessionStorage.getItem("token")
            : null;
      const response = await fetch(`${apiBaseUrl}/sync/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Network or server error - restore status to pending and back off
        await db.outbox
          .where("id")
          .anyOf(eventIds)
          .modify((item) => {
            item.status = "pending";
            item.retryCount = (item.retryCount || 0) + 1;
          });
        throw new Error(`Sync HTTP ${response.status}`);
      }

      const result = await response.json();
      const results: Array<{
        seq: number;
        status: "accepted" | "duplicate" | "rejected";
        error?: string;
      }> = result.results || [];

      // Process per-event result
      for (const res of results) {
        const matchingEvent = eventsToSend.find((e) => e.seq === res.seq);
        if (matchingEvent) {
          if (res.status === "accepted" || res.status === "duplicate") {
            // Delete from outbox on accepted or duplicate (both are considered success per CON-04)
            await db.outbox.delete(matchingEvent.id);
            totalSynced++;
          } else if (res.status === "rejected") {
            await db.outbox.update(matchingEvent.id, {
              status: "rejected",
              error: res.error || "Server rejected event",
            });
          }
        }
      }

      // If fewer than 50 events in batch, we're done
      if (eventsToSend.length < 50) {
        break;
      }
    }
  } catch (err: any) {
    notifyStatus(err?.message);
  } finally {
    isSyncing = false;
    notifyStatus();
  }

  const remaining = await db.outbox
    .where("status")
    .anyOf("pending", "syncing")
    .count();
  return { synced: totalSynced, remaining };
}

/**
 * Initializes background outbox sync engine
 */
export function startOutboxSyncEngine(intervalMs = 30000) {
  if (typeof window === "undefined") return;

  // Sync on connectivity restoration
  connectivity.subscribe((isOnline) => {
    if (isOnline) {
      syncOutbox();
    }
  });

  // Periodic background sync interval
  setInterval(() => {
    if (connectivity.isOnline) {
      syncOutbox();
    }
  }, intervalMs);
}
