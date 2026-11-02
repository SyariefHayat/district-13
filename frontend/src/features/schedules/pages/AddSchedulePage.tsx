import * as React from "react";
import { useNavigate } from "react-router";
import { id as idLocale } from "date-fns/locale";
import { cn } from "cn";
import {
  IconAlertCircle,
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconClock,
  IconInfoCircle,
  IconMoon,
  IconSun,
  IconSunset,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import {
  getTodayDateString,
  formatScheduleDate,
  SCHEDULE_STATUS_CONFIG,
  SHIFT_TYPE_CONFIG,
  type ScheduleStatus,
  type ShiftType,
} from "../data/scheduleData";

interface UserOption {
  id: string;
  username: string;
  role: "OWNER" | "ADMIN" | "CASHIER";
  isActive: boolean;
}

const SHIFT_TILES: {
  type: ShiftType;
  title: string;
  hours: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "MORNING",
    title: "Shift Pagi",
    hours: "07:00 - 16:00",
    icon: <IconSun className="size-4 text-amber-500" />,
  },
  {
    type: "AFTERNOON",
    title: "Shift Siang",
    hours: "15:00 - 24:00",
    icon: <IconSunset className="size-4 text-blue-500" />,
  },
  {
    type: "NIGHT",
    title: "Shift Malam",
    hours: "23:00 - 08:00",
    icon: <IconMoon className="size-4 text-purple-500" />,
  },
  {
    type: "FULLDAY",
    title: "Full Day",
    hours: "07:00 - 24:00",
    icon: <IconClock className="size-4 text-emerald-500" />,
  },
];

const STATUS_DESCRIPTIONS: Record<ScheduleStatus, string> = {
  SCHEDULED: "Karyawan terdaftar untuk bertugas pada jadwal yang ditentukan.",
  ON_DUTY: "Karyawan saat ini sedang aktif bertugas di shift ini.",
  COMPLETED: "Penugasan shift telah selesai dilaksanakan.",
  CANCELLED: "Jadwal penugasan ini telah dibatalkan.",
};

function calculateDuration(startTime: string, endTime: string): string | null {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }
  const diffMinutes = endMinutes - startMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (minutes === 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
}

export default function AddSchedulePage() {
  const navigate = useNavigate();
  const { authorizedFetch } = useAuth();

  const [availableUsers, setAvailableUsers] = React.useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);

  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [userRole, setUserRole] = React.useState<"CASHIER" | "ADMIN" | "OWNER">(
    "CASHIER"
  );
  const [shiftType, setShiftType] = React.useState<ShiftType>("MORNING");
  const [date, setDate] = React.useState(getTodayDateString());
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
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

  const selectedDate = React.useMemo(() => {
    if (!date) return undefined;
    const [year, month, day] = date.split("-").map(Number);
    if (!year || !month || !day) return undefined;
    return new Date(year, month - 1, day);
  }, [date]);

  // Fetch active users from backend
  React.useEffect(() => {
    let active = true;
    setIsLoadingUsers(true);

    authorizedFetch("/users")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: UserOption[]) => {
        if (active && Array.isArray(data)) {
          const activeList = data.filter((u) => u.isActive);
          setAvailableUsers(activeList);
          if (activeList.length > 0 && !selectedUserId) {
            setSelectedUserId(activeList[0].id);
            setUserName(activeList[0].username);
            setUserRole(activeList[0].role);
          }
        }
      })
      .catch((err) => {
        console.error("Gagal memuat daftar karyawan:", err);
      })
      .finally(() => {
        if (active) setIsLoadingUsers(false);
      });

    return () => {
      active = false;
    };
  }, [authorizedFetch, selectedUserId]);

  const handleShiftTypeChange = (newType: ShiftType) => {
    setShiftType(newType);
    const config = SHIFT_TYPE_CONFIG[newType];
    setStartTime(config.defaultStartTime);
    setEndTime(config.defaultEndTime);
  };

  const handleUserSelect = (userId: string | null) => {
    if (!userId) {
      setSelectedUserId("");
      setUserName("");
      return;
    }
    setSelectedUserId(userId);
    const found = availableUsers.find((u) => u.id === userId);
    if (found) {
      setUserName(found.username);
      setUserRole(found.role);
    }
  };

  const duration = calculateDuration(startTime, endTime);

  const userSelectItems = React.useMemo(() => {
    return availableUsers.map((u) => ({
      label: `${u.username} (${u.role === "CASHIER" ? "Kasir" : u.role === "ADMIN" ? "Admin" : "Owner"})`,
      value: u.id,
    }));
  }, [availableUsers]);

  const statusSelectItems = React.useMemo(() => {
    return (Object.keys(SCHEDULE_STATUS_CONFIG) as ScheduleStatus[]).map(
      (key) => ({
        label: SCHEDULE_STATUS_CONFIG[key].label,
        value: key,
      })
    );
  }, []);

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

    const shiftLabelPrefix = SHIFT_TYPE_CONFIG[shiftType].label.split(" ")[0];
    const roleLabel =
      userRole === "CASHIER"
        ? "Kasir"
        : userRole === "ADMIN"
          ? "Admin"
          : "Owner";
    const shiftName = `${shiftLabelPrefix} (${roleLabel})`;

    try {
      const response = await authorizedFetch("/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          shiftType,
          shiftName,
          date,
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          status,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const errDetail =
          body?.message || `Gagal menambahkan jadwal (${response.status})`;
        throw new Error(
          Array.isArray(errDetail) ? errDetail.join(", ") : String(errDetail)
        );
      }

      toast.add({
        title: "Jadwal Shift Berhasil Dibuat",
        description: `Jadwal untuk ${userName || "karyawan"} pada tanggal ${formatScheduleDate(date)} telah tersimpan.`,
        type: "success",
      });

      navigate("/dashboard/schedules");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan koneksi"
      );
      toast.add({
        title: "Gagal Menyimpan Jadwal",
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
          {/* Back button + Title */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard/schedules")}
              title="Kembali ke jadwal shift"
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Tambah Jadwal Shift
              </h1>
            </div>
          </div>

          {/* Action Buttons: Batal & Simpan */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => navigate("/dashboard/schedules")}
              className="gap-1.5"
            >
              <IconX className="size-4" />
              <span>Batal</span>
            </Button>
            <Button
              type="submit"
              form="add-schedule-form"
              disabled={isSubmitting || isLoadingUsers}
              className="gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <Spinner className="size-4" />
              ) : (
                <IconCheck className="size-4" />
              )}
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Jadwal"}</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconAlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setErrorMsg(null)}
              className="size-7 p-0"
            >
              <IconX className="size-4" />
            </Button>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <form
          id="add-schedule-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* LEFT COLUMN: Data Penugasan (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Karyawan & Tipe Shift */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <IconUser className="size-4 text-primary" />
                  <span>Karyawan & Tipe Shift</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Karyawan Select */}
                <div className="space-y-2">
                  <Label
                    htmlFor="employee-select"
                    className="text-xs md:text-sm font-medium"
                  >
                    Karyawan <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    items={userSelectItems}
                    value={selectedUserId || null}
                    onValueChange={handleUserSelect}
                    disabled={isSubmitting || isLoadingUsers}
                  >
                    <SelectTrigger
                      id="employee-select"
                      className="w-full flex items-center justify-between text-xs md:text-sm h-10"
                    >
                      <SelectValue
                        placeholder={
                          isLoadingUsers
                            ? "Memuat karyawan..."
                            : "Pilih karyawan..."
                        }
                      >
                        {userName
                          ? `${userName} (${userRole === "CASHIER" ? "Kasir" : userRole === "ADMIN" ? "Admin" : "Owner"})`
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {availableUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span className="font-medium">{u.username}</span>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 uppercase"
                              >
                                {u.role === "CASHIER"
                                  ? "Kasir"
                                  : u.role === "ADMIN"
                                    ? "Admin"
                                    : "Owner"}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                        {availableUsers.length === 0 && !isLoadingUsers && (
                          <SelectItem value="_empty" disabled>
                            Tidak ada karyawan aktif
                          </SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipe Shift Cards */}
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm font-medium">
                    Tipe Shift <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SHIFT_TILES.map((tile) => {
                      const isSelected = shiftType === tile.type;
                      return (
                        <div
                          key={tile.type}
                          onClick={() => handleShiftTypeChange(tile.type)}
                          className={cn(
                            "cursor-pointer rounded-xl border p-3.5 transition-all flex items-center justify-between gap-3 select-none",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                              : "border-border hover:bg-muted/40"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted/60">
                              {tile.icon}
                            </div>
                            <div>
                              <div className="text-xs md:text-sm font-semibold text-foreground">
                                {tile.title}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {tile.hours}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <IconCheck className="size-4 text-primary shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Waktu Bertugas & Catatan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <IconCalendar className="size-4 text-primary" />
                  <span>Waktu Bertugas & Catatan</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tanggal Shift */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="schedule-date"
                      className="text-xs md:text-sm font-medium"
                    >
                      Tanggal Shift <span className="text-destructive">*</span>
                    </Label>
                    <Popover
                      open={isCalendarOpen}
                      onOpenChange={setIsCalendarOpen}
                    >
                      <PopoverTrigger
                        render={
                          <Button
                            id="schedule-date"
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                            className={cn(
                              "h-10 w-full justify-start text-left font-normal text-xs md:text-sm px-3",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <IconCalendar className="size-4 mr-2 shrink-0 text-muted-foreground" />
                            <span className="truncate">
                              {date
                                ? formatScheduleDate(date)
                                : "Pilih tanggal..."}
                            </span>
                          </Button>
                        }
                      />
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(d) => {
                            if (d) {
                              const year = d.getFullYear();
                              const month = String(d.getMonth() + 1).padStart(
                                2,
                                "0"
                              );
                              const day = String(d.getDate()).padStart(2, "0");
                              setDate(`${year}-${month}-${day}`);
                              setIsCalendarOpen(false);
                            }
                          }}
                          locale={idLocale}
                          defaultMonth={selectedDate}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Jam Kerja */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs md:text-sm font-medium">
                        Jam Kerja <span className="text-destructive">*</span>
                      </Label>
                      {duration && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 font-normal"
                        >
                          {duration}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id="schedule-start-time"
                        type="text"
                        placeholder="07:00"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="h-10 text-xs md:text-sm text-center"
                        disabled={isSubmitting}
                        required
                      />
                      <Input
                        id="schedule-end-time"
                        type="text"
                        placeholder="16:00"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="h-10 text-xs md:text-sm text-center"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Catatan Penugasan */}
                <div className="space-y-2">
                  <Label
                    htmlFor="schedule-notes"
                    className="text-xs md:text-sm font-medium"
                  >
                    Catatan Penugasan (Opsional)
                  </Label>
                  <Input
                    id="schedule-notes"
                    placeholder="Contoh: Kasir Meja 1, serah terima uang modal awal shift"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-10 text-xs md:text-sm"
                    disabled={isSubmitting}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Instruksi operasional tambahan bagi karyawan selama shift
                    bertugas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Status & Live Preview (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card: Status Penugasan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <IconClock className="size-4 text-primary" />
                  <span>Status Penugasan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  items={statusSelectItems}
                  value={status}
                  onValueChange={(val) => {
                    if (val) setStatus(val as ScheduleStatus);
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full flex items-center justify-between text-xs md:text-sm h-10">
                    <SelectValue>
                      {SCHEDULE_STATUS_CONFIG[status]?.label || status}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(
                        Object.keys(SCHEDULE_STATUS_CONFIG) as ScheduleStatus[]
                      ).map((key) => {
                        const statusCfg = SCHEDULE_STATUS_CONFIG[key];
                        return (
                          <SelectItem key={key} value={key}>
                            {statusCfg.label}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {STATUS_DESCRIPTIONS[status]}
                </p>
              </CardContent>
            </Card>

            {/* Card: Ringkasan Shift */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <IconInfoCircle className="size-4 text-primary" />
                  <span>Ringkasan Shift</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <IconUser className="size-3.5 text-muted-foreground" />
                    Karyawan
                  </span>
                  <div className="text-right">
                    <span className="font-semibold text-foreground">
                      {userName || "-"}
                    </span>
                    {userRole && (
                      <span className="text-[11px] text-muted-foreground ml-1.5">
                        (
                        {userRole === "CASHIER"
                          ? "Kasir"
                          : userRole === "ADMIN"
                            ? "Admin"
                            : "Owner"}
                        )
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <IconCalendar className="size-3.5 text-muted-foreground" />
                    Tanggal
                  </span>
                  <span className="font-medium text-foreground">
                    {date ? formatScheduleDate(date) : "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <IconClock className="size-3.5 text-muted-foreground" />
                    Jam Kerja
                  </span>
                  <div className="text-right">
                    <span className="font-medium text-foreground">
                      {startTime} - {endTime}
                    </span>
                    {duration && (
                      <div className="text-[11px] text-muted-foreground">
                        {duration}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-muted-foreground">Tipe Shift</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-medium",
                      SHIFT_TYPE_CONFIG[shiftType].color
                    )}
                  >
                    {SHIFT_TYPE_CONFIG[shiftType].label.split(" (")[0]}
                  </Badge>
                </div>

                {notes && (
                  <div className="pt-2 border-t border-border text-muted-foreground">
                    <span className="text-foreground font-medium">
                      Catatan:
                    </span>{" "}
                    {notes}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
