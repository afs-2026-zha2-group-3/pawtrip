import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PolicyTags } from "@/components/trip/policy-tags";
import { policyNoteParts } from "@/lib/location-summary";
import { formatDistanceKm } from "@/lib/distance";
import { matchLocationPolicyForType, violatedLimitTags } from "@/lib/trip/policy-match";
import { useActiveTrip, usePolicySubjects } from "@/lib/trip/selectors";
import { cn } from "@/lib/utils";
import type { LocationSummary } from "../../../queries/locations";
import { DaySelect } from "./-day-select";
import { LocationCover } from "./-location-cover";
import { LocationRating } from "./-location-rating";
import { PetFriendlyBadge } from "./-pet-friendly-badge";

const TAG_PILL_CLASS =
  "inline-flex h-6 items-center rounded-full bg-[#F0F0F0] px-2.5 text-xs text-[#838383]";
const LIMIT_TAG_CLASS =
  "inline-flex h-6 items-center rounded-full bg-destructive/10 px-2.5 text-xs font-medium text-destructive ring-1 ring-inset ring-destructive/25";

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
  const limitTags =
    subjects.status === "ready"
      ? Array.from(
          new Set(
            subjects.subjects.flatMap((pet) => violatedLimitTags(location.petPolicies, pet)),
          ),
        )
      : [];
  const noteParts = policyNoteParts(location.petPolicies);
  return (
    <Card
      role={onLocate ? "button" : undefined}
      tabIndex={onLocate ? 0 : undefined}
      aria-label={onLocate ? `在地图查看${location.name}` : undefined}
      onClick={onLocate}
      onKeyDown={(event) => {
        if (onLocate && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onLocate();
        }
      }}
      className={cn(
        "gap-3 rounded-[20px] border border-paw-line p-3 shadow-[0_2px_8px_0_rgba(38,31,18,0.04)] ring-0",
        onLocate && "cursor-pointer transition-colors hover:border-paw-accent",
        highlighted && "border-paw-accent",
      )}
    >
      <LocationCover
        coverPhotoUrl={location.coverPhotoUrl}
        name={location.name}
        typeLabel={typeLabel}
        className="aspect-[2.3] rounded-[14px]"
      />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="min-w-0 flex-1 truncate text-base leading-6 font-medium text-paw-ink">
            {location.name}
          </CardTitle>
          {addedDays.length > 0 ? (
            <div className="flex shrink-0 items-center gap-1">
              {addedDays.map((day) => (
                <span
                  key={day}
                  className="inline-flex h-6 items-center rounded-full border border-[#404040] bg-[#0A0A0A] px-2 text-xs font-medium text-[#FAFAFA]"
                >
                  第 {day} 天
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-[21px] items-center rounded-md bg-paw-accent-soft px-1.5 text-xs font-medium text-paw-accent-strong">
            {location.keytag ?? typeLabel}
          </span>
          <LocationRating rating={location.rating} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <PetFriendlyBadge
            typeGroup={location.typeGroup}
            maxPetsPerPerson={location.petPolicies.maxPetsPerPerson}
          />
          {noteParts.map((part) => (
            <span key={part} className={TAG_PILL_CLASS}>
              {part}
            </span>
          ))}
          <PolicyTags
            subjects={subjects}
            match={(pet) =>
              matchLocationPolicyForType(location.typeGroup, location.petPolicies, pet)
            }
          />
        </div>
        {limitTags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {limitTags.map((part) => (
              <span key={part} className={LIMIT_TAG_CLASS}>
                {part}
              </span>
            ))}
          </div>
        ) : null}
        <p className="line-clamp-2 text-sm leading-5 text-[#737373]">
          {location.address ?? "地址未收录"}
        </p>
        {anchorName && location.distanceMeters != null ? (
          <p className="text-xs text-muted-foreground">
            距{anchorName}约 {formatDistanceKm(location.distanceMeters)}
          </p>
        ) : null}
      </div>
      <div
        className="flex flex-wrap items-center justify-between gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="rounded-full" onClick={onOpen}>
            查看详情
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <DaySelect
            label="添加到行程"
            totalDays={totalDays}
            onSelectDay={onAddStop}
            onSelectUnscheduled={onAddUnscheduled}
          />
        </div>
      </div>
    </Card>
  );
}
