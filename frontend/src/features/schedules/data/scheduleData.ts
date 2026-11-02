export type ShiftType = "MORNING" | "AFTERNOON" | "NIGHT" | "FULLDAY";
export type ScheduleStatus =
  "SCHEDULED" | "ON_DUTY" | "COMPLETED" | "CANCELLED";

export interface ScheduleItem {
  id: string;
  userId: string;
  userName: string;
  userRole: "OWNER" | "ADMIN" | "CASHIER";
  shiftType: ShiftType;
  shiftName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: ScheduleStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const SHIFT_TYPE_CONFIG: Record<
  ShiftType,
  {
    label: string;
    description: string;
    defaultStartTime: string;
    defaultEndTime: string;
    color: string;
  }
> = {
  MORNING: {
    label: "Shift Pagi (Morning)",
    description: "Operasional pagi (07.00 - 16.00)",
    defaultStartTime: "07:00",
    defaultEndTime: "16:00",
    color:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  AFTERNOON: {
    label: "Shift Siang (Afternoon)",
    description: "Operasional siang-malam (15.00 - 24.00)",
    defaultStartTime: "15:00",
    defaultEndTime: "24:00",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  NIGHT: {
    label: "Shift Malam (Night)",
    description: "Operasional malam-pagi (23.00 - 08.00)",
    defaultStartTime: "23:00",
    defaultEndTime: "08:00",
    color:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  FULLDAY: {
    label: "Full Day",
    description: "Penugasan operasional sepanjang hari",
    defaultStartTime: "07:00",
    defaultEndTime: "24:00",
    color:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
};

export const SCHEDULE_STATUS_CONFIG: Record<
  ScheduleStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    className: string;
  }
> = {
  SCHEDULED: {
    label: "Terjadwal",
    variant: "outline",
    className: "border-sky-500/30 text-sky-700 dark:text-sky-400 bg-sky-500/10",
  },
  ON_DUTY: {
    label: "Sedang Bertugas",
    variant: "default",
    className:
      "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10",
  },
  COMPLETED: {
    label: "Selesai",
    variant: "secondary",
    className:
      "border-slate-500/30 text-slate-700 dark:text-slate-400 bg-slate-500/10",
  },
  CANCELLED: {
    label: "Dibatalkan",
    variant: "destructive",
    className: "border-destructive/30 text-destructive bg-destructive/10",
  },
};

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatScheduleDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: "sch-1",
    userId: "usr-1",
    userName: "Budi Santoso",
    userRole: "CASHIER",
    shiftType: "MORNING",
    shiftName: "Shift Pagi (Kasir 1)",
    date: getTodayDateString(),
    startTime: "07:00",
    endTime: "16:00",
    status: "ON_DUTY",
    notes: "Buka kasir utama & cek stok awal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sch-2",
    userId: "usr-2",
    userName: "Siti Rahma",
    userRole: "CASHIER",
    shiftType: "AFTERNOON",
    shiftName: "Shift Siang (Kasir 1)",
    date: getTodayDateString(),
    startTime: "15:00",
    endTime: "24:00",
    status: "SCHEDULED",
    notes: "Tutup shift & setoran kas akhir",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sch-3",
    userId: "usr-3",
    userName: "Ahmad Rizky",
    userRole: "ADMIN",
    shiftType: "FULLDAY",
    shiftName: "Operasional & Gudang",
    date: getTodayDateString(),
    startTime: "08:00",
    endTime: "17:00",
    status: "ON_DUTY",
    notes: "Penerimaan restock bahan baku",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sch-4",
    userId: "usr-4",
    userName: "Dewi Lestari",
    userRole: "CASHIER",
    shiftType: "MORNING",
    shiftName: "Shift Pagi (Kasir 2)",
    date: getTodayDateString(),
    startTime: "07:00",
    endTime: "16:00",
    status: "ON_DUTY",
    notes: "Bantu peak hour sarapan",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sch-5",
    userId: "usr-5",
    userName: "Eko Prasetyo",
    userRole: "CASHIER",
    shiftType: "AFTERNOON",
    shiftName: "Shift Siang (Kasir 2)",
    date: getTodayDateString(),
    startTime: "15:00",
    endTime: "24:00",
    status: "SCHEDULED",
    notes: "Standby kasir counter take-away",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sch-6",
    userId: "usr-6",
    userName: "Fajar Nugraha",
    userRole: "CASHIER",
    shiftType: "NIGHT",
    shiftName: "Shift Malam",
    date: getTodayDateString(),
    startTime: "23:00",
    endTime: "08:00",
    status: "SCHEDULED",
    notes: "Shift malam & persiapan pembukaan",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
