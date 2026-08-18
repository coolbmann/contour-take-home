"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: DayPickerProps) {
  const dayBase =
    "relative flex h-9 w-9 items-center justify-center p-0 text-sm";

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}

      className={cn("relative w-fit font-body text-contour-ink", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex h-9 items-center justify-center",
        caption_label: "font-display text-sm font-bold tracking-tight",

        nav: "absolute inset-x-0 top-0 flex h-9 items-center justify-between",
        button_previous:
          "inline-flex h-9 w-9 items-center justify-center rounded-sm border border-contour-rule bg-contour-paper " +
          "text-contour-ink transition-colors duration-short ease-contour-out hover:bg-contour-paper-2 " +
          "outline-2 outline-offset-2 outline-transparent [outline-style:solid] focus-visible:outline-contour-focus " +
          "disabled:cursor-not-allowed disabled:opacity-40",
        button_next:
          "inline-flex h-9 w-9 items-center justify-center rounded-sm border border-contour-rule bg-contour-paper " +
          "text-contour-ink transition-colors duration-short ease-contour-out hover:bg-contour-paper-2 " +
          "outline-2 outline-offset-2 outline-transparent [outline-style:solid] focus-visible:outline-contour-focus " +
          "disabled:cursor-not-allowed disabled:opacity-40",

        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "flex h-9 w-9 items-center justify-center text-xs font-normal text-contour-muted",
        weeks: "flex flex-col",
        week: "flex w-full",

        day: dayBase,
        day_button:
          "flex h-9 w-9 items-center justify-center rounded-sm border border-transparent tabular-nums " +
          "transition-colors duration-short ease-contour-out hover:bg-contour-paper-2 " +
          "outline-2 outline-offset-2 outline-transparent [outline-style:solid] focus-visible:outline-contour-focus " +
          "disabled:pointer-events-none",

        today: "font-medium text-contour-accent",
        selected:
          "[&>button]:border-contour-ink [&>button]:bg-contour-ink [&>button]:font-medium [&>button]:text-contour-paper " +
          "[&>button]:hover:bg-contour-ink",
        outside: "text-contour-muted opacity-50",
        disabled: "text-contour-muted opacity-40",
        hidden: "invisible",

        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...rest }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" {...rest} />
          ) : (
            <ChevronRight className="h-4 w-4" {...rest} />
          ),
      }}
      {...props}
    />
  );
}
