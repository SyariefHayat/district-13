"use client";

import * as React from "react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { IconDownload } from "@tabler/icons-react";
import { CalendarIcon } from "lucide-react";
import { getPresetRanges } from "../data/overviewData";

interface OverviewHeaderProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  preset: string;
  onPresetChange: (preset: string) => void;
}

export function OverviewHeader({
  date,
  onDateChange,
  preset,
  onPresetChange,
}: OverviewHeaderProps) {
  const [today] = React.useState(() => new Date());
  const presets = React.useMemo(() => getPresetRanges(today), [today]);

  const handleSelectPreset = (label: string, rangeFn: () => DateRange) => {
    onPresetChange(label);
    onDateChange(rangeFn());
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    onPresetChange("Custom");
    onDateChange(range);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-4 md:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-xl">
          Overview
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          {preset === "Today"
            ? "Welcome back! Here’s what’s happening with your store today."
            : `Viewing store performance for ${preset.toLowerCase()}.`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-56 sm:w-60">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  id="date-picker-range"
                  className="w-full justify-start px-2.5 font-normal text-xs sm:text-sm"
                >
                  <CalendarIcon data-icon="inline-start" className="size-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-2" align="end">
              <div className="flex items-stretch">
                <div className="flex w-36 shrink-0 flex-col gap-1 py-1">
                  {presets.map((item) => (
                    <Button
                      key={item.label}
                      type="button"
                      variant={preset === item.label ? "secondary" : "ghost"}
                      size="sm"
                      className="justify-start font-normal text-xs"
                      onClick={() => handleSelectPreset(item.label, item.range)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <Separator orientation="vertical" className="mx-2" />
                <Calendar
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={handleCustomDateSelect}
                  numberOfMonths={1}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="outline" size="default">
          <IconDownload data-icon="inline-start" className="size-4" /> Export
        </Button>
      </div>
    </div>
  );
}
