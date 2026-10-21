"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = ["9 am", "10 am", "11 am", "12 pm", "1 pm", "2 pm", "3 pm"];

// 7 rows (timeSlots) x 7 cols (days)
// Values mapped precisely to the heatmap in Screenshot 2026-10-21 155150.png
const heatmapData: number[][] = [
  // 9 am
  [0, 0, 0, 0, 0, 0, 0],
  // 10 am
  [0, 0, 0, 280, 0, 0, 0],
  // 11 am
  [0, 360, 650, 890, 420, 390, 0],
  // 12 pm
  [0, 780, 1420, 2480, 1380, 1260, 310],
  // 1 pm
  [270, 390, 820, 2190, 790, 740, 0],
  // 2 pm
  [0, 0, 350, 720, 410, 360, 0],
  // 3 pm
  [0, 0, 0, 310, 0, 0, 0],
];

const legendItems = [
  { label: "200>", color: "#4c1a16" },
  { label: "500>", color: "#7c2419" },
  { label: "1,000>", color: "#d8432a" },
  { label: "2,000>", color: "#ff5e3a" },
];

function getCellBackground(orders: number): {
  style: React.CSSProperties;
  className: string;
} {
  if (orders >= 2000) {
    // Level 4: 2,000> solid bright coral-orange (Peak)
    return {
      style: {
        backgroundColor: "#ff5e3a",
        boxShadow: "0 0 10px rgba(255, 94, 58, 0.45)",
      },
      className: "border-orange-400/40",
    };
  }
  if (orders >= 1000) {
    // Level 3: 1,000> solid warm reddish-orange
    return {
      style: {
        backgroundColor: "#d8432a",
        boxShadow: "0 0 6px rgba(216, 67, 42, 0.3)",
      },
      className: "border-red-500/30",
    };
  }
  if (orders >= 500) {
    // Level 2: 500> hatched medium reddish-orange
    return {
      style: {
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(185, 28, 28, 0.85), rgba(185, 28, 28, 0.85) 2.5px, rgba(45, 15, 15, 0.9) 2.5px, rgba(45, 15, 15, 0.9) 5px)",
      },
      className: "border-red-800/40",
    };
  }
  if (orders >= 200) {
    // Level 1: 200> hatched dark maroon
    return {
      style: {
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(120, 24, 20, 0.8), rgba(120, 24, 20, 0.8) 2.5px, rgba(32, 24, 24, 0.95) 2.5px, rgba(32, 24, 24, 0.95) 5px)",
      },
      className: "border-red-950/40",
    };
  }
  // Inactive
  return {
    style: {},
    className:
      "bg-zinc-200/60 dark:bg-zinc-800/70 border-border/20 dark:border-zinc-700/30",
  };
}

export function BusyHour() {
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
                      const cellConfig = getCellBackground(orders);

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
                              ? `${orders.toLocaleString()} orders`
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
                  {days.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
