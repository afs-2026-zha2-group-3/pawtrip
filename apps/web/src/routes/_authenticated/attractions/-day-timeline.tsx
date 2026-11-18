import { useSelector } from "@tanstack/react-store";
import { tripStore } from "@/lib/trip/store";
import { cn } from "@/lib/utils";
import type { Trip } from "@/lib/trip/types";

interface RailStop {
  poiId: string;
  name: string;
}

export function DayTimeline({
  active,
  focusPoiId,
  onFocus,
}: {
  active: Trip;
  focusPoiId: string | null;
  onFocus: (poiId: string) => void;
}) {
  const locations = useSelector(tripStore, (state) => state.cache.locations);
  const days = Array.from({ length: active.totalDays }, (_, index) => index + 1).map((day) => ({
    day,
    stops: (active.plan.days.find((entry) => entry.day === day)?.stops ?? [])
      .filter((stop) => {
        const cached = locations[stop.poiId];
        return !cached || cached.typeGroup === "attraction";
      })
      .map<RailStop>((stop) => ({
        poiId: stop.poiId,
        name: locations[stop.poiId]?.name ?? stop.poiId,
      })),
  }));
  const unscheduled = active.plan.unscheduled.map<RailStop>((stop) => ({
    poiId: stop.poiId,
    name: locations[stop.poiId]?.name ?? stop.poiId,
  }));

  return (
    <nav aria-label="每日景点行程" className="flex w-full flex-col gap-6">
      <h2 className="text-base leading-6 font-medium text-paw-ink">每日景点行程</h2>
      {days.map(({ day, stops }) => (
        <section key={day} className="flex flex-col gap-4">
          <span className="inline-flex h-8 w-fit items-center rounded-full bg-[#F5F5F5] px-3 text-sm text-foreground">
            Day {day}
          </span>
          <div className="relative flex flex-col gap-4 pl-8">
            {stops.length > 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-6 bottom-6 left-[10px] w-px bg-[#E5E5E5]"
              />
            ) : null}
            {stops.map((stop) => (
              <div key={stop.poiId} className="relative">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1/2 -left-[28px] size-3 -translate-y-1/2 rounded-full border-[1.5px] bg-card",
                    focusPoiId === stop.poiId ? "border-paw-accent-strong" : "border-paw-accent",
                  )}
                />
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 -left-[15px] h-px w-[15px] bg-[#E5E5E5]"
                />
                <button
                  type="button"
                  onClick={() => onFocus(stop.poiId)}
                  aria-current={focusPoiId === stop.poiId ? "true" : undefined}
                  className={cn(
                    "flex h-12 w-full items-center rounded-xl border bg-card px-4 text-left text-base font-medium text-paw-ink transition-colors",
                    focusPoiId === stop.poiId
                      ? "border-paw-accent"
                      : "border-[#E5E5E5] hover:border-paw-accent/60",
                  )}
                >
                  <span className="truncate">{stop.name}</span>
                </button>
              </div>
            ))}
            {stops.length === 0 ? (
              <p className="text-xs text-muted-foreground">这一天还没有安排景点</p>
            ) : null}
          </div>
        </section>
      ))}
      {unscheduled.length > 0 ? (
        <section className="flex flex-col gap-3">
          <span className="inline-flex h-8 w-fit items-center rounded-full bg-[#F5F5F5] px-3 text-sm text-foreground">
            待安排
          </span>
          <div className="flex flex-col gap-2 pl-8">
            {unscheduled.map((stop) => (
              <button
                key={stop.poiId}
                type="button"
                onClick={() => onFocus(stop.poiId)}
                className={cn(
                  "flex h-10 w-full items-center rounded-xl border bg-card px-4 text-left text-sm text-paw-ink transition-colors",
                  focusPoiId === stop.poiId
                    ? "border-paw-accent"
                    : "border-[#E5E5E5] hover:border-paw-accent/60",
                )}
              >
                <span className="truncate">{stop.name}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </nav>
  );
}
