import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransportMode } from "@/data/transport-rules";
import type { StopRef } from "@/lib/trip/plan";
import { displayToNext } from "@/lib/trip/plan";
import { tripActions, tripStore } from "@/lib/trip/store";
import {
  ESTIMATE_LOADING_TEXT,
  ESTIMATE_UNAVAILABLE_TEXT,
  SAME_POI_NOTE,
  TAXI_PET_HINT,
  toNextLabels,
  transportSelectorOptions,
  type TransportSegment,
} from "@/lib/trip/transport-segments";
import type { ToNextEstimate, TripStop } from "@/lib/trip/types";
import { routeEstimateQueryOptions } from "@/queries/trips";

interface TransportSegmentRowProps {
  tripId: number;
  stopRef: StopRef;
  segment: TransportSegment;
  transportMode: TransportMode | null;
  compact?: boolean;
}

export function TransportSegmentRow({
  tripId,
  stopRef,
  segment,
  transportMode,
  compact = false,
}: TransportSegmentRowProps) {
  const stop = useSelector(tripStore, (state): TripStop | null => {
    if (!state.active || stopRef.container === "unscheduled") return null;
    const day = state.active.plan.days.find((entry) => entry.day === stopRef.container);
    return day?.stops[stopRef.index] ?? null;
  });
  const displayMode = stop ? displayToNext(stop, transportMode) : segment.displayMode;
  const snapshot = stop?.toNextEstimate ?? null;
  const queryMode = displayMode === "walk" ? "walk" : "drive";
  const estimateQuery = useQuery(
    routeEstimateQueryOptions(tripId, segment.fromPoiId, segment.toPoiId, queryMode, {
      enabled: !segment.samePoi && !snapshot && (!compact || Boolean(stop?.toNext)),
    }),
  );

  useEffect(() => {
    if (!estimateQuery.data || !stop?.toNext || stop.toNextEstimate) return;
    const { durationMinutes, costLowYuan, costHighYuan } = estimateQuery.data;
    const estimate: ToNextEstimate =
      stop.toNext === "self_drive"
        ? { durationMinutes, costLowYuan: 0, costHighYuan: 0 }
        : { durationMinutes, costLowYuan, costHighYuan };
    tripActions.backfillStopEstimate(stopRef, estimate);
  }, [estimateQuery.data, stop, stopRef]);

  if (!stop) return null;

  if (segment.samePoi) {
    return (
      <p data-testid="same-poi-note" className="px-1 text-xs text-muted-foreground">
        {SAME_POI_NOTE}
      </p>
    );
  }

  const estimate: ToNextEstimate | null =
    snapshot ??
    (estimateQuery.data
      ? {
          durationMinutes: estimateQuery.data.durationMinutes,
          costLowYuan: estimateQuery.data.costLowYuan,
          costHighYuan: estimateQuery.data.costHighYuan,
        }
      : null);
  const options = transportSelectorOptions(transportMode);
  const savedMode =
    stop.toNext === "walk" || stop.toNext === "drive" || stop.toNext === "self_drive"
      ? stop.toNext
      : null;
  const selectValue = compact
    ? savedMode && options.includes(savedMode)
      ? savedMode
      : ""
    : options.includes(displayMode)
      ? displayMode
      : "";
  const handleModeChange = (value: string | null) => {
    if (value === "walk" || value === "drive" || value === "self_drive") {
      tripActions.setStopTransport(stopRef, value, null);
    }
  };

  if (compact) {
    return (
      <div data-testid="transport-segment" className="flex flex-col gap-0.5 py-0.5 pl-0">
        <div className="relative flex min-h-8 items-center gap-1.5">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[10px] z-0 h-[100px] w-[2px] -translate-y-1/2 bg-paw-accent"
          />
          <span
            aria-hidden="true"
            className="relative z-10 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-paw-accent text-xs text-paw-accent-strong"
          >
            ↔
          </span>
          <select
            aria-label={transportMode === "drive" ? "选择其他途内交通方式" : "选择途内交通方式"}
            className="relative z-10 h-7 shrink-0 rounded-full border-0 bg-muted px-2.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectValue}
            onChange={(event) => handleModeChange(event.target.value)}
          >
            {selectValue === "" ? (
              <option value="" disabled>
                点击此处选择小交通
              </option>
            ) : null}
            {options.map((mode) => (
              <option key={mode} value={mode}>
                {toNextLabels[mode]}
              </option>
            ))}
          </select>
          {selectValue !== "" && estimate ? (
            <span className="relative z-10 text-xs text-muted-foreground">
              约 {estimate.durationMinutes} 分钟
            </span>
          ) : null}
          {selectValue === "drive" && estimate ? (
            <span className="relative z-10 text-xs text-muted-foreground">
              ¥{estimate.costLowYuan}–{estimate.costHighYuan}
            </span>
          ) : selectValue === "walk" && estimate ? (
            <span className="relative z-10 text-xs text-muted-foreground">¥0</span>
          ) : null}
        </div>
        {selectValue === "drive" ? (
          <p className="pl-7 text-xs text-muted-foreground">{TAXI_PET_HINT}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      data-testid="transport-segment"
      className="flex flex-col gap-0.5 rounded-md bg-muted/40 px-2 py-1"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span data-testid="segment-mode" className="font-medium text-foreground">
          {toNextLabels[displayMode]}
        </span>
        {estimate ? (
          <>
            <span>{`约 ${estimate.durationMinutes} 分钟`}</span>
            {displayMode === "drive" ? (
              <span>{`¥${estimate.costLowYuan}–${estimate.costHighYuan}`}</span>
            ) : displayMode === "walk" ? (
              <span>¥0</span>
            ) : null}
          </>
        ) : estimateQuery.isError ? (
          <span>{ESTIMATE_UNAVAILABLE_TEXT}</span>
        ) : (
          <span>{ESTIMATE_LOADING_TEXT}</span>
        )}
        <Select
          value={selectValue === "" ? null : selectValue}
          onValueChange={handleModeChange}
        >
          <SelectTrigger
            size="sm"
            aria-label={
              transportMode === "drive" ? "选择其他途内交通方式" : "选择途内交通方式"
            }
            className="ml-auto text-xs"
          >
            <SelectValue>
              {(value: string | null) =>
                value ? toNextLabels[value as keyof typeof toNextLabels] : "切换方式"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {toNextLabels[mode]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {displayMode === "drive" ? (
        <p className="text-xs text-muted-foreground">{TAXI_PET_HINT}</p>
      ) : null}
    </div>
  );
}
