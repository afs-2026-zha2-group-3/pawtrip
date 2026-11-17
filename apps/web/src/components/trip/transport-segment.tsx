import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-store";
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
}

export function TransportSegmentRow({
  tripId,
  stopRef,
  segment,
  transportMode,
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
      enabled: !segment.samePoi && !snapshot,
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
  const selectValue = options.includes(displayMode) ? displayMode : "";

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
        <select
          aria-label={
            transportMode === "drive" ? "选择其他途内交通方式" : "选择途内交通方式"
          }
          className="ml-auto rounded-md border bg-card px-1 py-0.5 text-xs"
          value={selectValue}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "walk" || value === "drive" || value === "self_drive") {
              tripActions.setStopTransport(stopRef, value, null);
            }
          }}
        >
          {selectValue === "" ? (
            <option value="" disabled>
              切换方式
            </option>
          ) : null}
          {options.map((mode) => (
            <option key={mode} value={mode}>
              {toNextLabels[mode]}
            </option>
          ))}
        </select>
      </div>
      {displayMode === "drive" ? (
        <p className="text-xs text-muted-foreground">{TAXI_PET_HINT}</p>
      ) : null}
    </div>
  );
}