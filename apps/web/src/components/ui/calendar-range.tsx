import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function formatIsoDate(year: number, monthIndex: number, day: number): string {
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function monthOf(value: string | null): { year: number; monthIndex: number } {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (match) {
    return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
  }
  const today = new Date();
  return { year: today.getFullYear(), monthIndex: today.getMonth() };
}

function formatAriaLabel(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

function localIsoDate(date: Date): string {
  return formatIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function CalendarRange({
  startDate,
  endDate,
  onSelect,
}: {
  startDate: string;
  endDate: string;
  onSelect: (startDate: string, endDate: string) => void;
}) {
  const [view, setView] = useState(() => monthOf(startDate));
  const today = localIsoDate(new Date());

  const firstWeekday = new Date(view.year, view.monthIndex, 1).getDay();
  const daysInMonth = new Date(view.year, view.monthIndex + 1, 0).getDate();
  const monthValue = `${view.year}-${String(view.monthIndex + 1).padStart(2, "0")}`;
  const days = Array.from({ length: daysInMonth }, (_, index) =>
    formatIsoDate(view.year, view.monthIndex, index + 1),
  );

  function shiftMonth(offset: number) {
    setView((current) => {
      const next = new Date(current.year, current.monthIndex + offset, 1);
      return { year: next.getFullYear(), monthIndex: next.getMonth() };
    });
  }

  function pick(day: string) {
    if (!startDate || endDate || day < startDate) {
      onSelect(day, "");
      return;
    }
    onSelect(startDate, day);
  }

  return (
    <div
      data-slot="calendar-range"
      data-month={monthValue}
      className="rounded-lg border p-3"
    >
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="上个月"
          onClick={() => shiftMonth(-1)}
        >
          <ChevronLeftIcon />
        </Button>
        <span aria-live="polite" className="text-sm font-medium">
          {view.year} 年 {view.monthIndex + 1} 月
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="下个月"
          onClick={() => shiftMonth(1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="py-1">
            {weekday}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7">
        {Array.from({ length: firstWeekday }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {days.map((day) => {
          const isStart = day === startDate;
          const isEnd = day === endDate;
          const disabled = day < today;
          const inRange =
            Boolean(startDate && endDate) &&
            day > startDate &&
            day < endDate;
          const shape =
            isStart || isEnd
              ? isStart && isEnd
                ? "rounded-md"
                : isStart
                  ? endDate
                    ? "rounded-l-md"
                    : "rounded-md"
                  : "rounded-r-md"
              : inRange
                ? "rounded-none"
                : "rounded-md";
          return (
            <button
              key={day}
              type="button"
              data-date={day}
              disabled={disabled}
              aria-label={formatAriaLabel(day)}
              aria-pressed={isStart || isEnd}
              onClick={() => pick(day)}
              className={cn(
                "flex h-8 items-center justify-center text-sm tabular-nums outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                shape,
                disabled
                  ? "cursor-not-allowed text-muted-foreground/40"
                  : cn(
                      inRange && "bg-muted",
                      !isStart && !isEnd && "hover:bg-muted",
                      (isStart || isEnd) &&
                        "bg-primary text-primary-foreground hover:bg-primary",
                    ),
              )}
            >
              {Number(day.slice(-2))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
