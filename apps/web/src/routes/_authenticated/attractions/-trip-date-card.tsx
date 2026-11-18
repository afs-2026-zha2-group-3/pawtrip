import { ArrowRight, CalendarDays } from "lucide-react";
import { useActiveTrip } from "@/lib/trip/selectors";

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function TripDateCard() {
  const active = useActiveTrip();

  if (!active) {
    return null;
  }

  const start = active.startDate;
  const end = start ? addDays(start, active.totalDays - 1) : null;

  return (
    <div className="w-full min-w-0 shrink-0">
      <div className="flex min-w-0 flex-col items-start gap-0.5">
        <h2 className="w-full min-w-0 truncate text-lg leading-7 font-medium text-foreground">
          {active.name}
        </h2>
<div className="flex items-center gap-2 text-sm text-foreground">
          <span className="tabular-nums">{start ?? "未设置出发日期"}</span>
          <ArrowRight aria-hidden="true" className="size-4" />
          <span className="tabular-nums">{end ?? `共 ${active.totalDays} 天`}</span>
          <CalendarDays aria-hidden="true" className="size-4" />
        </div>
      </div>
    </div>
  );
}
