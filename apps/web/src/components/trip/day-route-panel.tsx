import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DAY_ROUTE_ALL_MISSING_TEXT,
  DAY_ROUTE_EMPTY_TEXT,
  DAY_ROUTE_SINGLE_TEXT,
  buildDayRoute,
} from "@/lib/trip/day-route";
import type { ItineraryDayLine } from "@/lib/trip/itinerary";
import type { LocationBrowseDetail } from "@/queries/locations";
import { DayRouteMap } from "./day-route-map";

interface DayRoutePanelProps {
  day: ItineraryDayLine;
  locations: Record<string, LocationBrowseDetail>;
  className?: string;
}

export function DayRoutePanel({ day, locations, className }: DayRoutePanelProps) {
  const titleId = useId();
  const route = useMemo(
    () => buildDayRoute(day, locations),
    [day, locations],
  );
  const hasCoordinates = route.stops.some(
    (stop) => stop.longitude != null && stop.latitude != null,
  );
  const description = [day.dateLabel, day.city].filter(Boolean).join(" · ");

  return (
    <section
      data-testid="day-route-panel"
      aria-labelledby={titleId}
      className={cn(
        "flex w-full flex-col gap-3 rounded-[26px] bg-card p-6 shadow-pet-card ring-1 ring-foreground/5 print:hidden sm:p-8",
        className,
      )}
    >
      <header className="flex flex-col gap-1">
        <h2 id={titleId} className="text-lg font-medium leading-snug text-paw-ink">
          {`第 ${day.day} 天路线规划`}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>

      {route.stops.length === 0 ? (
        <p
          data-testid="day-route-empty"
          className="py-10 text-center text-sm text-muted-foreground"
        >
          {DAY_ROUTE_EMPTY_TEXT}
        </p>
      ) : !hasCoordinates ? (
        <p
          data-testid="day-route-all-missing"
          className="py-10 text-center text-sm text-muted-foreground"
        >
          {DAY_ROUTE_ALL_MISSING_TEXT}
        </p>
      ) : route.stops.length === 1 ? (
        <>
          <DayRouteMap route={route} />
          <p data-testid="day-route-single" className="text-sm text-muted-foreground">
            {DAY_ROUTE_SINGLE_TEXT}
          </p>
        </>
      ) : (
        <DayRouteMap route={route} />
      )}
    </section>
  );
}
