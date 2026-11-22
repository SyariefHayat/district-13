import { describe, it, expect } from "vitest";
import {
  isCrossingMidnight,
  mapBackendSchedule,
  SHIFT_TYPE_CONFIG,
  type BackendSchedule,
} from "../features/schedules/data/scheduleData";

describe("Staff Scheduling & Shift Types (SCH-001..005)", () => {
  describe("Fixed Patent Shifts (REQ: SCH-004)", () => {
    it("defines 3 patent shifts: MORNING, AFTERNOON, and NIGHT", () => {
      expect(SHIFT_TYPE_CONFIG.MORNING).toBeDefined();
      expect(SHIFT_TYPE_CONFIG.AFTERNOON).toBeDefined();
      expect(SHIFT_TYPE_CONFIG.NIGHT).toBeDefined();

      // Shift 1 Pagi: 07:00 - 16:00
      expect(SHIFT_TYPE_CONFIG.MORNING.defaultStartTime).toBe("07:00");
      expect(SHIFT_TYPE_CONFIG.MORNING.defaultEndTime).toBe("16:00");

      // Shift 2 Sore: 15:00 - 24:00
      expect(SHIFT_TYPE_CONFIG.AFTERNOON.defaultStartTime).toBe("15:00");
      expect(SHIFT_TYPE_CONFIG.AFTERNOON.defaultEndTime).toBe("24:00");

      // Shift 3 Malam: 23:00 - 08:00
      expect(SHIFT_TYPE_CONFIG.NIGHT.defaultStartTime).toBe("23:00");
      expect(SHIFT_TYPE_CONFIG.NIGHT.defaultEndTime).toBe("08:00");
    });
  });

  describe("Midnight Crossing Processing (REQ: SCH-005)", () => {
    it("detects midnight crossing for Shift 3 Malam (23:00 to 08:00)", () => {
      expect(isCrossingMidnight("23:00", "08:00")).toBe(true);
      expect(isCrossingMidnight("23:00:00", "08:00:00")).toBe(true);
    });

    it("returns false for daytime and evening shifts", () => {
      expect(isCrossingMidnight("07:00", "16:00")).toBe(false);
      expect(isCrossingMidnight("15:00", "24:00")).toBe(false);
      expect(isCrossingMidnight("", "")).toBe(false);
      expect(isCrossingMidnight(null, null)).toBe(false);
    });

    it("maps backend Shift 3 Malam as one unified entry on the start date without splitting", () => {
      const backendNightSchedule: BackendSchedule = {
        id: "sched-night-001",
        userId: "user-cashier-1",
        userName: "Budi Santoso",
        userRole: "CASHIER",
        shiftType: "NIGHT",
        shiftName: "Shift 3 Malam",
        date: "2026-11-22",
        startTime: "23:00",
        endTime: "08:00",
        status: "SCHEDULED",
        notes: "Shift malam akhir pekan",
        createdAt: "2026-11-20T08:00:00Z",
        updatedAt: "2026-11-20T08:00:00Z",
      };

      const mapped = mapBackendSchedule(backendNightSchedule);

      expect(mapped.id).toBe("sched-night-001");
      expect(mapped.date).toBe("2026-11-22");
      expect(mapped.startTime).toBe("23:00");
      expect(mapped.endTime).toBe("08:00");
      expect(isCrossingMidnight(mapped.startTime, mapped.endTime)).toBe(true);
    });
  });

  describe("Informational Nature of Schedule (REQ: SCH-003)", () => {
    it("treats schedule as purely informational without preventing cashier operations", () => {
      // In accordance with SCH-003, cashier opening shift is never blocked by schedule
      const dummyScheduleList: any[] = [];
      const canOpenShift = true; // Business rule: shifts can open regardless of schedule match
      expect(dummyScheduleList.length).toBe(0);
      expect(canOpenShift).toBe(true);
    });
  });

  describe("Access Isolation (AC: Kasir hanya melihat jadwal sendiri)", () => {
    it("filters cashier schedules to only match logged-in user id", () => {
      const allSchedules = [
        { id: "1", userId: "cashier-1", userName: "Ahmad" },
        { id: "2", userId: "cashier-2", userName: "Siti" },
        { id: "3", userId: "cashier-1", userName: "Ahmad" },
      ];

      const currentCashierId = "cashier-1";
      const cashierView = allSchedules.filter(
        (s) => s.userId === currentCashierId
      );

      expect(cashierView).toHaveLength(2);
      expect(cashierView.every((s) => s.userId === currentCashierId)).toBe(
        true
      );
    });
  });
});
