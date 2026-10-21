"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Map PostgreSQL DOW (0=Sun, 1=Mon, ..., 6=Sat) to column index (0=Mon..6=Sun)
const dowToCol: Record<number, number> = {
  1: 0, // Mon
  2: 1, // Tue
  3: 2, // Wed
  4: 3, // Thu
  5: 4, // Fri
  6: 5, // Sat
  0: 6, // Sun
};

function formatHourLabel(h: number): string {
  const ampm = h >= 12 ? "pm" : "am";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH} ${ampm}`;
}

export interface HeatmapEntry {
  dow: number;
  hour: number;
  transactionCount: number;
  totalSales: number;
}

interface BusyHourProps {
  highlightDay?: string;
  apiData?: HeatmapEntry[];
  isLoading?: boolean;
}

function getThresholds(maxOrders: number): [number, number, number, number] {
  if (maxOrders >= 1500) {
    return [200, 500, 1000, 2000];
  }
  if (maxOrders <= 0) {
    return [1, 2, 3, 4];
  }
  if (maxOrders <= 4) {
    return [1, 2, 3, 4];
  }
  if (maxOrders <= 10) {
    return [1, 3, 6, 9];
  }
  if (maxOrders <= 20) {
    return [2, 5, 10, 15];
  }
  if (maxOrders <= 50) {
    return [5, 12, 25, 40];
  }
  if (maxOrders <= 100) {
    return [10, 25, 50, 80];
  }
  if (maxOrders <= 500) {
    return [50, 120, 250, 400];
  }
  return [
    Math.max(1, Math.round(maxOrders * 0.15)),
    Math.max(2, Math.round(maxOrders * 0.35)),
    Math.max(3, Math.round(maxOrders * 0.65)),
    Math.max(4, Math.round(maxOrders * 0.9)),
  ];
}

function getCellBackground(
  orders: number,
  t: [number, number, number, number]
): {
  style: React.CSSProperties;
  className: string;
} {
  if (orders <= 0) {
    return {
      style: {},
      className:
        "bg-zinc-200/60 dark:bg-zinc-800/70 border-border/20 dark:border-zinc-700/30",
    };
  }

  const [t1, t2, t3, t4] = t;

  if (orders >= t4) {
    // Level 4: Solid bright coral-orange (Peak)
    return {
      style: {
        backgroundColor: "#ff5e3a",
        boxShadow: "0 0 10px rgba(255, 94, 58, 0.45)",
      },
      className: "border-orange-400/40",
    };
  }
  if (orders >= t3) {
    // Level 3: Solid warm reddish-orange
    return {
      style: {
        backgroundColor: "#d8432a",
        boxShadow: "0 0 6px rgba(216, 67, 42, 0.3)",
      },
      className: "border-red-500/30",
    };
  }
  if (orders >= t2) {
    // Level 2: Hatched medium reddish-orange
    return {
      style: {
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(185, 28, 28, 0.85), rgba(185, 28, 28, 0.85) 2.5px, rgba(45, 15, 15, 0.9) 2.5px, rgba(45, 15, 15, 0.9) 5px)",
      },
      className: "border-red-800/40",
    };
  }
  if (orders >= t1) {
    // Level 1: Hatched dark maroon
    return {
      style: {
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(120, 24, 20, 0.8), rgba(120, 24, 20, 0.8) 2.5px, rgba(32, 24, 24, 0.95) 2.5px, rgba(32, 24, 24, 0.95) 5px)",
      },
      className: "border-red-950/40",
    };
  }

  // Orders > 0 but below t1: Level 1 minimum
  return {
    style: {
      backgroundImage:
        "repeating-linear-gradient(45deg, rgba(120, 24, 20, 0.8), rgba(120, 24, 20, 0.8) 2.5px, rgba(32, 24, 24, 0.95) 2.5px, rgba(32, 24, 24, 0.95) 5px)",
    },
    className: "border-red-950/40",
  };
}

export function BusyHour({
  highlightDay,
  apiData = [],
  isLoading,
}: BusyHourProps = {}) {
  // Determine 7-hour window.
  // Default is 9..15 (9 am..3 pm). If real transactions exist outside 9..15, shift window.
  const { timeSlotHours, timeSlots } = React.useMemo(() => {
    let startHour = 9;

    const activeHours = (apiData ?? [])
      .filter((e) => e.transactionCount > 0)
      .map((e) => e.hour);

    if (activeHours.length > 0) {
      const minActive = Math.min(...activeHours);
      const maxActive = Math.max(...activeHours);

      // If active hours don't fit in 9..15
      if (minActive < 9 || maxActive > 15) {
        // Center the 7 slots around active hours, clamped to 0..17 (so startHour + 6 <= 23)
        const avg = Math.floor((minActive + maxActive) / 2);
        startHour = Math.max(0, Math.min(17, avg - 3));
      }
    }

    const hours = Array.from({ length: 7 }, (_, i) => startHour + i);
    const slots = hours.map(formatHourLabel);
    return { timeSlotHours: hours, timeSlots: slots };
  }, [apiData]);

  // Build 7x7 grid from real API data
  const { heatmapData, maxOrders } = React.useMemo(() => {
    const grid: number[][] = timeSlotHours.map(
      () => Array(7).fill(0) as number[]
    );
    let max = 0;

    for (const entry of apiData ?? []) {
      const col = dowToCol[entry.dow];
      const rowIdx = timeSlotHours.indexOf(entry.hour);
      if (col !== undefined && rowIdx >= 0) {
        grid[rowIdx][col] = entry.transactionCount;
        if (entry.transactionCount > max) {
          max = entry.transactionCount;
        }
      }
    }

    return { heatmapData: grid, maxOrders: max };
  }, [apiData, timeSlotHours]);

  const thresholds = React.useMemo(() => getThresholds(maxOrders), [maxOrders]);

  const legendItems = React.useMemo(() => {
    const colors = ["#4c1a16", "#7c2419", "#d8432a", "#ff5e3a"];
    return thresholds.map((t, idx) => ({
      label: `${t.toLocaleString()}>`,
      color: colors[idx],
    }));
  }, [thresholds]);

  return (
    <Card className="gap-0 py-0 md:col-span-2 xl:col-span-2">
      <CardHeader className="flex flex-col gap-2 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-semibold">
          Orders by time
        </CardTitle>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] sm:text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col p-4 sm:p-6">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {timeSlots.map((time) => (
              <div key={time} className="flex items-center gap-3">
                <Skeleton className="h-4 w-12" />
                <div className="grid grid-cols-7 gap-2 flex-1">
                  {days.map((day) => (
                    <Skeleton
                      key={`${time}-${day}`}
                      className="aspect-square w-full rounded-md"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <TooltipProvider delay={100}>
            <div className="w-full max-w-sm sm:max-w-md">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                {timeSlots.map((time, timeIdx) => (
                  <div key={time} className="flex items-center gap-2 sm:gap-3">
                    <span className="w-10 sm:w-12 shrink-0 text-right text-[11px] sm:text-xs text-muted-foreground font-medium">
                      {time}
                    </span>
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1">
                      {days.map((day, dayIdx) => {
                        const orders = heatmapData[timeIdx][dayIdx];
                        const cellConfig = getCellBackground(
                          orders,
                          thresholds
                        );

                        return (
                          <Tooltip key={`${time}-${day}`}>
                            <TooltipTrigger className="aspect-square w-full">
                              <div
                                style={cellConfig.style}
                                className={`size-full rounded-md sm:rounded-lg border transition-transform hover:scale-110 cursor-pointer ${cellConfig.className}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <span className="font-semibold">
                                {day}, {time}
                              </span>
                              :{" "}
                              {orders > 0
                                ? `${orders.toLocaleString()} ${orders === 1 ? "order" : "orders"}`
                                : "No orders"}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Bottom day labels */}
                <div className="flex items-center gap-2 sm:gap-3 pt-1">
                  <span className="w-10 sm:w-12 shrink-0" />
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1 text-center text-[11px] sm:text-xs text-muted-foreground font-medium">
                    {days.map((day) => {
                      const isHighlighted = highlightDay === day;
                      return (
                        <span
                          key={day}
                          className={
                            isHighlighted
                              ? "font-bold text-foreground underline decoration-primary decoration-2 underline-offset-4"
                              : ""
                          }
                        >
                          {day}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
