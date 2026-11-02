import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";
import {
  getTodayDateString,
  SCHEDULE_STATUS_CONFIG,
  SHIFT_TYPE_CONFIG,
  type ScheduleItem,
  type ScheduleStatus,
  type ShiftType,
} from "../data/scheduleData";
import type { CreateScheduleInput } from "../hooks/useScheduleData";

interface UserOption {
  id: string;
  username: string;
  role: "OWNER" | "ADMIN" | "CASHIER";
  isActive: boolean;
}

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: ScheduleItem | null;
  onSubmit: (values: CreateScheduleInput) => Promise<boolean>;
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
  onSubmit,
}: ScheduleFormDialogProps) {
  const { authorizedFetch } = useAuth();
  const isEditing = Boolean(schedule);

  const [availableUsers, setAvailableUsers] = React.useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);

  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [userRole, setUserRole] = React.useState<"CASHIER" | "ADMIN" | "OWNER">(
    "CASHIER"
  );
  const [shiftType, setShiftType] = React.useState<ShiftType>("MORNING");
  const [date, setDate] = React.useState(getTodayDateString());
  const [startTime, setStartTime] = React.useState(
    SHIFT_TYPE_CONFIG.MORNING.defaultStartTime
  );
  const [endTime, setEndTime] = React.useState(
    SHIFT_TYPE_CONFIG.MORNING.defaultEndTime
  );
  const [status, setStatus] = React.useState<ScheduleStatus>("SCHEDULED");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Fetch real employees from backend
  React.useEffect(() => {
    if (!open) return;
    let active = true;
    setIsLoadingUsers(true);

    authorizedFetch("/users")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: UserOption[]) => {
        if (active && Array.isArray(data)) {
          setAvailableUsers(data.filter((u) => u.isActive));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingUsers(false);
      });

    return () => {
      active = false;
    };
  }, [open, authorizedFetch]);

  React.useEffect(() => {
    if (schedule) {
      setSelectedUserId(schedule.userId);
      setUserName(schedule.userName);
      setUserRole(schedule.userRole);
      setShiftType(schedule.shiftType);
      setDate(schedule.date);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setStatus(schedule.status);
      setNotes(schedule.notes || "");
    } else {
      setSelectedUserId("");
      setUserName("");
      setUserRole("CASHIER");
      setShiftType("MORNING");
      setDate(getTodayDateString());
      setStartTime(SHIFT_TYPE_CONFIG.MORNING.defaultStartTime);
      setEndTime(SHIFT_TYPE_CONFIG.MORNING.defaultEndTime);
      setStatus("SCHEDULED");
      setNotes("");
    }
    setErrorMsg(null);
  }, [schedule, open]);

  const handleShiftTypeChange = (newType: ShiftType) => {
    setShiftType(newType);
    const config = SHIFT_TYPE_CONFIG[newType];
    setStartTime(config.defaultStartTime);
    setEndTime(config.defaultEndTime);
  };

  const handleUserSelect = (userId: string | null) => {
    if (!userId) {
      setSelectedUserId("");
      return;
    }
    setSelectedUserId(userId);
    const found = availableUsers.find((u) => u.id === userId);
    if (found) {
      setUserName(found.username);
      setUserRole(found.role);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setErrorMsg("Pilih karyawan untuk jadwal shift");
      return;
    }
    if (!date) {
      setErrorMsg("Tanggal shift wajib diisi");
      return;
    }
    if (!startTime || !endTime) {
      setErrorMsg("Jam mulai dan jam selesai wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const shiftName = `${SHIFT_TYPE_CONFIG[shiftType].label.split(" ")[0]} (${userRole === "CASHIER" ? "Kasir" : userRole === "ADMIN" ? "Admin" : "Owner"})`;

    const success = await onSubmit({
      userId: selectedUserId,
      userName: userName.trim(),
      userRole,
      shiftType,
      shiftName,
      date,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      status,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Jadwal Shift" : "Tambah Jadwal Shift Baru"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Perbarui rincian penugasan jam kerja staf."
                : "Tentukan nama karyawan, tipe shift, tanggal, dan jam kerja."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {errorMsg && (
              <div className="rounded-md bg-destructive/15 p-3 text-xs font-medium text-destructive">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="employeeSelect" className="text-xs font-medium">
                Pilih Karyawan <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedUserId}
                onValueChange={handleUserSelect}
                disabled={isSubmitting || isLoadingUsers}
              >
                <SelectTrigger id="employeeSelect" className="h-9 w-full">
                  <SelectValue
                    placeholder={
                      isLoadingUsers
                        ? "Memuat karyawan..."
                        : "Pilih karyawan terdaftar..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.username} ({u.role})
                    </SelectItem>
                  ))}
                  {availableUsers.length === 0 && !isLoadingUsers && (
                    <SelectItem value="_empty" disabled>
                      Tidak ada karyawan aktif
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="shiftType" className="text-xs font-medium">
                  Tipe Shift
                </Label>
                <Select
                  value={shiftType}
                  onValueChange={(val) => {
                    if (val) handleShiftTypeChange(val as ShiftType);
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="shiftType" className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SHIFT_TYPE_CONFIG) as ShiftType[]).map(
                      (key) => (
                        <SelectItem key={key} value={key}>
                          {SHIFT_TYPE_CONFIG[key].label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="date" className="text-xs font-medium">
                  Tanggal <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-xs font-medium">
                  Jam Mulai
                </Label>
                <Input
                  id="startTime"
                  type="text"
                  placeholder="07:00"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-xs font-medium">
                  Jam Selesai
                </Label>
                <Input
                  id="endTime"
                  type="text"
                  placeholder="16:00 atau 24:00"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-medium">
                Status Penugasan
              </Label>
              <Select
                value={status}
                onValueChange={(val) => {
                  if (val) setStatus(val as ScheduleStatus);
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(SCHEDULE_STATUS_CONFIG) as ScheduleStatus[]
                  ).map((key) => (
                    <SelectItem key={key} value={key}>
                      {SCHEDULE_STATUS_CONFIG[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-medium">
                Catatan (Opsional)
              </Label>
              <Input
                id="notes"
                placeholder="mis. Buka kasir utama, serah terima setoran"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="size-4 mr-2" />}
              {isEditing ? "Simpan Perubahan" : "Tambah Jadwal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
