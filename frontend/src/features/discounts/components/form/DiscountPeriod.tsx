import * as React from "react";
import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { Controller } from "react-hook-form";
import { id as idLocale } from "date-fns/locale";
import { IconCalendar, IconCalendarOff } from "@tabler/icons-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { DiscountFormData } from "../../schemas/discountFormSchema";

interface DiscountPeriodProps {
  control: Control<DiscountFormData>;
  errors: FieldErrors<DiscountFormData>;
  setValue: UseFormSetValue<DiscountFormData>;
  endDate?: string | null;
}

function parseLocalDate(dateStr?: string | null): Date | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.slice(0, 10).split("-").map(Number);
  if (
    parts.length < 3 ||
    isNaN(parts[0]) ||
    isNaN(parts[1]) ||
    isNaN(parts[2])
  ) {
    return undefined;
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DiscountPeriod({
  control,
  errors,
  setValue,
  endDate,
}: DiscountPeriodProps) {
  const [isStartOpen, setIsStartOpen] = React.useState(false);
  const [isEndOpen, setIsEndOpen] = React.useState(false);

  const getTodayStr = () => toLocalDateString(new Date());

  const handleSetForever = () => {
    setValue("startDate", getTodayStr(), { shouldValidate: true });
    setValue("endDate", null, { shouldValidate: true });
  };

  const handleSetOneMonth = () => {
    const today = new Date();
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(today.getMonth() + 1);

    setValue("startDate", toLocalDateString(today), {
      shouldValidate: true,
    });
    setValue("endDate", toLocalDateString(oneMonthLater), {
      shouldValidate: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Periode Berlaku</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSetForever}
            className="h-7 text-xs px-2.5 text-zinc-300 hover:text-white"
          >
            Selamanya
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSetOneMonth}
            className="h-7 text-xs px-2.5 text-zinc-300 hover:text-white"
          >
            1 Bulan
          </Button>
        </div>

        {/* Tanggal Mulai Picker */}
        <div className="space-y-1.5">
          <Label className="text-xs md:text-sm font-medium text-zinc-300">
            Tanggal Mulai
          </Label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => {
              const selectedDate = parseLocalDate(field.value);
              return (
                <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal text-xs md:text-sm px-3 h-9",
                          !field.value && "text-zinc-500"
                        )}
                      >
                        <IconCalendar className="size-4 mr-2 shrink-0 text-zinc-400" />
                        <span className="truncate">
                          {field.value
                            ? formatDisplayDate(field.value)
                            : "Pilih tanggal mulai..."}
                        </span>
                      </Button>
                    }
                  />
                  <PopoverContent
                    className="w-auto p-0 bg-[#18181b] border-zinc-800 text-zinc-100"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        if (d) {
                          field.onChange(toLocalDateString(d));
                          setIsStartOpen(false);
                        }
                      }}
                      locale={idLocale}
                      defaultMonth={selectedDate || new Date()}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              );
            }}
          />
          {errors.startDate && (
            <p className="text-xs text-red-500">{errors.startDate.message}</p>
          )}
        </div>

        {/* Tanggal Berakhir Picker (Opsional) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs md:text-sm font-medium text-zinc-300">
              Tanggal Berakhir (Opsional)
            </Label>
            {endDate && (
              <button
                type="button"
                onClick={() =>
                  setValue("endDate", null, { shouldValidate: true })
                }
                className="text-[11px] text-zinc-400 hover:text-amber-400 underline cursor-pointer"
              >
                Hapus Batas
              </button>
            )}
          </div>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => {
              const selectedDate = parseLocalDate(field.value);
              return (
                <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal text-xs md:text-sm px-3 h-9",
                          !field.value && "text-zinc-500"
                        )}
                      >
                        {field.value ? (
                          <IconCalendar className="size-4 mr-2 shrink-0 text-zinc-400" />
                        ) : (
                          <IconCalendarOff className="size-4 mr-2 shrink-0 text-zinc-500" />
                        )}
                        <span className="truncate">
                          {field.value
                            ? formatDisplayDate(field.value)
                            : "Tanpa batas (selamanya)"}
                        </span>
                      </Button>
                    }
                  />
                  <PopoverContent
                    className="w-auto p-0 bg-[#18181b] border-zinc-800 text-zinc-100"
                    align="start"
                  >
                    <div className="p-1">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => {
                          if (d) {
                            field.onChange(toLocalDateString(d));
                            setIsEndOpen(false);
                          }
                        }}
                        locale={idLocale}
                        defaultMonth={selectedDate || new Date()}
                        autoFocus
                      />
                      {field.value && (
                        <div className="p-2 border-t border-zinc-800 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-zinc-400 hover:text-white"
                            onClick={() => {
                              field.onChange(null);
                              setIsEndOpen(false);
                            }}
                          >
                            Hapus Batas (Selamanya)
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }}
          />
          {errors.endDate && (
            <p className="text-xs text-red-500">{errors.endDate.message}</p>
          )}
          <p className="text-xs text-zinc-500">
            {endDate
              ? `Diskon otomatis berakhir pada ${formatDisplayDate(endDate)}.`
              : "Berlaku tanpa batas waktu (selamanya)."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
