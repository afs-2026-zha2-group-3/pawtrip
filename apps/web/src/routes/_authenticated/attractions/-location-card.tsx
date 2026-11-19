import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PolicyTags } from "@/components/trip/policy-tags";
import { locationDescription, policyNoteParts } from "@/lib/location-summary";
import { formatDistanceKm } from "@/lib/distance";
import { matchLocationPolicyForType, violatedLimitTags } from "@/lib/trip/policy-match";
import {
  useActiveTrip,
  useActiveTripReadOnly,
  usePolicySubjects,
} from "@/lib/trip/selectors";
import { cn } from "@/lib/utils";
import type { LocationSummary } from "../../../queries/locations";
import { DaySelect } from "./-day-select";
import { LocationCover } from "./-location-cover";
import { LocationRating } from "./-location-rating";
import { PetFriendlyBadge } from "./-pet-friendly-badge";

const OVERLAY_TAG_CLASS =
  "inline-flex h-5 items-center rounded-full bg-white/85 px-2 text-[11px] text-[#5A5A5A] backdrop-blur-sm";
const OVERLAY_LIMIT_TAG_CLASS =
  "inline-flex h-5 items-center rounded-full bg-white/85 px-2 text-[11px] font-medium text-destructive ring-1 ring-inset ring-destructive/25 backdrop-blur-sm";

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
  const readOnly = useActiveTripReadOnly();
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
        "gap-2.5 rounded-[14px] border border-paw-accent-soft bg-card p-2.5 ring-0",
        onLocate && "cursor-pointer transition-colors hover:border-paw-accent",
        highlighted && "border-paw-accent",
      )}
    >
      <div className="relative">
        <LocationCover
          coverPhotoUrl={location.coverPhotoUrl}
          name={location.name}
          typeLabel={typeLabel}
          className="aspect-[4/3] rounded-[10px]"
        />
        <div className="absolute top-2 left-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
          <PetFriendlyBadge
            tone="overlay"
            typeGroup={location.typeGroup}
            maxPetsPerPerson={location.petPolicies.maxPetsPerPerson}
          />
          {location.keytag ? (
            <span className="inline-flex h-5 items-center rounded-full bg-white/85 px-2 text-[11px] text-paw-ink backdrop-blur-sm">
              {location.keytag}
            </span>
          ) : null}
        </div>
        <div className="absolute right-2 bottom-2">
          <LocationRating rating={location.rating} variant="badge" />
        </div>
        {noteParts.length > 0 || limitTags.length > 0 ? (
          <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-4rem)] flex-wrap gap-1">
            {noteParts.map((part) => (
              <span key={part} className={OVERLAY_TAG_CLASS}>
                {part}
              </span>
            ))}
            {limitTags.map((part) => (
              <span key={part} className={OVERLAY_LIMIT_TAG_CLASS}>
                {part}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="min-w-0 flex-1 truncate text-[15px] leading-6 font-semibold text-paw-ink">
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
        <p className="line-clamp-2 text-xs leading-5 text-[#8A8A8A]">
          {locationDescription(location)}
        </p>
        {anchorName && location.distanceMeters != null ? (
          <p className="text-xs text-muted-foreground">
            距{anchorName}约 {formatDistanceKm(location.distanceMeters)}
          </p>
        ) : null}
        {subjects.status === "ready" ? (
          <PolicyTags
            subjects={subjects}
            match={(pet) =>
              matchLocationPolicyForType(location.typeGroup, location.petPolicies, pet)
            }
          />
        ) : null}
      </div>
      <div
        className="mt-auto flex items-center justify-between gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          size="sm"
          variant="ghost"
          className="h-7 rounded-full px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onOpen}
        >
          查看详情
        </Button>
        <DaySelect
          variant="compact"
          label="添加到行程"
          totalDays={totalDays}
          onSelectDay={onAddStop}
          onSelectUnscheduled={onAddUnscheduled}
          disabled={readOnly}
        />
      </div>
    </Card>
  );
}
