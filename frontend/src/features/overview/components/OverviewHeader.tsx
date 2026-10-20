import * as React from "react";
import {
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
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

export function OverviewHeader() {
  const today = new Date();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: today,
    to: today,
  });
  const presets = [
    { label: "Today", range: () => ({ from: today, to: today }) },
    {
      label: "Yesterday",
      range: () => {
        const yesterday = subDays(today, 1);
        return { from: yesterday, to: yesterday };
      },
    },
    {
      label: "This Week",
      range: () => ({
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: today,
      }),
    },
    {
      label: "Last 7 Days",
      range: () => ({ from: subDays(today, 6), to: today }),
    },
    {
      label: "Last 28 Days",
      range: () => ({ from: subDays(today, 27), to: today }),
    },
    {
      label: "This Month",
      range: () => ({ from: startOfMonth(today), to: today }),
    },
    {
      label: "Last Month",
      range: () => {
        const lastMonth = subMonths(today, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      },
    },
    {
      label: "This Year",
      range: () => ({ from: startOfYear(today), to: today }),
    },
  ];

  return (
    <div className="flex justify-between items-start px-4 md:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-xl">
          Overview
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Welcome back! Here’s what’s happening with your store today.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="w-60">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  id="date-picker-range"
                  className="justify-start px-2.5 font-normal"
                >
                  <CalendarIcon data-icon="inline-start" />
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
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="justify-start font-normal"
                      onClick={() => setDate(preset.range())}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <Separator orientation="vertical" className="mx-2" />
                <Calendar
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={1}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="outline">
          <IconDownload data-icon="inline-start" /> Export
        </Button>
      </div>
    </div>
  );
}
