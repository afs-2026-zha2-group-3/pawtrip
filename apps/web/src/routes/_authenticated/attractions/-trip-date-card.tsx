import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { CalendarRange } from "@/components/ui/calendar-range";
import { tripActions } from "@/lib/trip/store";
import { useActiveTrip } from "@/lib/trip/selectors";

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function TripDateCard() {
  const active = useActiveTrip();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (!active) {
    return null;
  }

  const start = active.startDate;
  const end = start ? addDays(start, active.totalDays - 1) : null;

  return (
    <div
      ref={rootRef}
      className="relative w-full max-w-[544px] rounded-[22px] bg-card px-5 py-2.5 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)]"
    >
      <div className="flex min-w-0 items-center justify-between gap-4">
        <h2 className="min-w-0 truncate text-lg leading-7 font-medium text-foreground">
          {active.name}
        </h2>
        <button
          type="button"
          aria-expanded={open}
          aria-label="选择出发日期"
          onClick={() => setOpen((current) => !current)}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 text-sm text-foreground transition-colors hover:border-paw-line"
        >
          <span className="tabular-nums">{start ?? "未设置出发日期"}</span>
          <ArrowRight aria-hidden="true" className="size-4" />
          <span className="tabular-nums">{end ?? `共 ${active.totalDays} 天`}</span>
          <CalendarDays aria-hidden="true" className="size-4" />
        </button>
      </div>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-2 w-[360px] rounded-2xl bg-card p-3 shadow-[0_10px_60px_0_rgba(0,0,0,0.1)]">
          <p className="mb-2 px-1 text-xs text-muted-foreground">
            选择出发日期，行程共 {active.totalDays} 天，结束日期自动顺延。
          </p>
          <CalendarRange
            startDate={start ?? ""}
            endDate={end ?? ""}
            onSelect={(selectedStart) => {
              tripActions.setStartDate(selectedStart);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
