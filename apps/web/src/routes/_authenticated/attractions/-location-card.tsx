import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PolicyTags } from "@/components/trip/policy-tags";
import { policyNoteParts, restrictionFeeParts } from "@/lib/location-summary";
import { formatDistanceKm } from "@/lib/distance";
import { matchLocationPolicy } from "@/lib/trip/policy-match";
import { useActiveTrip, usePolicySubjects } from "@/lib/trip/selectors";
import { cn } from "@/lib/utils";
import type { LocationSummary } from "../../../queries/locations";
import { DaySelect } from "./-day-select";
import { LocationCover } from "./-location-cover";
import { LocationRating } from "./-location-rating";
import { PetFriendlyBadge } from "./-pet-friendly-badge";

const TAG_PILL_CLASS =
  "inline-flex h-6 items-center rounded-full bg-[#F0F0F0] px-2.5 text-xs text-[#838383]";

export function LocationCard({
  location,
  typeLabel,
  totalDays,
  anchorName,
  highlighted = false,
  onLocate,
  onOpen,
  onAddStop,
  onAddUnscheduled,
}: {
  location: LocationSummary;
  typeLabel: string;
  totalDays: number;
  anchorName?: string | null;
  highlighted?: boolean;
  onLocate?: () => void;
  onOpen: () => void;
  onAddStop: (day: number) => void;
  onAddUnscheduled: () => void;
}) {
  const subjects = usePolicySubjects();
  const active = useActiveTrip();
  const addedDays = active
    ? active.plan.days
        .filter((entry) => entry.stops.some((stop) => stop.poiId === location.poiId))
        .map((entry) => entry.day)
    : [];
  const restrictionParts = restrictionFeeParts(location.petPolicies);
  const noteParts = policyNoteParts(location.petPolicies);
  return (
    <Card
      className={cn(
        "gap-4 rounded-[22px] border border-paw-line p-4 shadow-[0_2px_8px_0_rgba(38,31,18,0.04)] ring-0",
        highlighted && "border-paw-accent",
      )}
    >
      <LocationCover
        coverPhotoUrl={location.coverPhotoUrl}
        name={location.name}
        typeLabel={typeLabel}
        className="rounded-[14px]"
      />
      <div className="flex flex-col gap-2">
        <CardTitle className="text-xl leading-7 font-medium text-paw-ink">
          {location.name}
        </CardTitle>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-[21px] items-center rounded-md bg-paw-accent-soft px-1.5 text-xs font-medium text-paw-accent-strong">
            {location.keytag ?? typeLabel}
          </span>
          <LocationRating rating={location.rating} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <PetFriendlyBadge maxPetsPerPerson={location.petPolicies.maxPetsPerPerson} />
          {noteParts.map((part) => (
            <span key={part} className={TAG_PILL_CLASS}>
              {part}
            </span>
          ))}
          <PolicyTags
            subjects={subjects}
            match={(pet) => matchLocationPolicy(location.petPolicies, pet)}
          />
        </div>
        {restrictionParts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {restrictionParts.map((part) => (
              <span key={part} className={TAG_PILL_CLASS}>
                {part}
              </span>
            ))}
          </div>
        ) : null}
        <p className="line-clamp-2 text-base leading-6 text-[#737373]">
          {location.address ?? "地址未收录"}
        </p>
        {anchorName && location.distanceMeters != null ? (
          <p className="text-xs text-muted-foreground">
            距{anchorName}约 {formatDistanceKm(location.distanceMeters)}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="rounded-full" onClick={onOpen}>
            查看详情
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-muted-foreground"
            onClick={onAddUnscheduled}
          >
            暂不排期
          </Button>
          {onLocate ? (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="在地图查看"
              className="rounded-full text-muted-foreground"
              onClick={onLocate}
            >
              <MapPin aria-hidden="true" className="size-4" />
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {addedDays.map((day) => (
            <span
              key={day}
              className="inline-flex h-9 items-center rounded-full border border-[#404040] bg-[#0A0A0A] px-3 text-sm font-medium text-[#FAFAFA]"
            >
              第 {day} 天
            </span>
          ))}
          <DaySelect label="添加到行程" totalDays={totalDays} onSelectDay={onAddStop} />
        </div>
      </div>
    </Card>
  );
}
