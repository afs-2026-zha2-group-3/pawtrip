import { useMemo } from "react";
import pawStickerSm from "@/assets/paw-sticker-sm.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DAY_ROUTE_ALL_MISSING_TEXT,
  DAY_ROUTE_EMPTY_TEXT,
  DAY_ROUTE_SINGLE_TEXT,
  buildDayRoute,
} from "@/lib/trip/day-route";
import type { ItineraryDayLine } from "@/lib/trip/itinerary";
import type { LocationBrowseDetail } from "@/queries/locations";
import { DayRouteMap } from "./day-route-map";

interface DayRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: ItineraryDayLine;
  locations: Record<string, LocationBrowseDetail>;
}

export function DayRouteDialog({
  open,
  onOpenChange,
  day,
  locations,
}: DayRouteDialogProps) {
  const route = useMemo(
    () => buildDayRoute(day, locations),
    [day, locations],
  );
  const hasCoordinates = route.stops.some(
    (stop) => stop.longitude != null && stop.latitude != null,
  );
  const description = [day.dateLabel, day.city].filter(Boolean).join(" · ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl print:hidden">
        <div data-testid="day-route-dialog" className="flex flex-col gap-3">
          <img
            src={pawStickerSm}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-3 right-20 w-12 select-none"
          />
          <DialogHeader className="pr-36">
            <DialogTitle>{`第 ${day.day} 天路线规划`}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
