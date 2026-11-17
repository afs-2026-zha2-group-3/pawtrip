import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PolicyTags } from "@/components/trip/policy-tags";
import { policyNoteParts, restrictionFeeParts } from "@/lib/location-summary";
import { formatDistanceKm } from "@/lib/distance";
import { matchLocationPolicyForType } from "@/lib/trip/policy-match";
import { useActiveTrip, usePolicySubjects } from "@/lib/trip/selectors";
import { cn } from "@/lib/utils";
import type { LocationSummary } from "../../../queries/locations";
import { DaySelect } from "./-day-select";
import { LocationCover } from "./-location-cover";
import { LocationRating } from "./-location-rating";
import { PetFriendlyBadge } from "./-pet-friendly-badge";

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
    <Card className={cn("pt-0", highlighted && "ring-2 ring-primary")}>
      <LocationCover
        coverPhotoUrl={location.coverPhotoUrl}
        name={location.name}
        typeLabel={typeLabel}
        className="rounded-t-xl"
      />
      <CardHeader>
        <CardTitle>{location.name}</CardTitle>
        <CardDescription className="flex items-center justify-between gap-2">
          <span>{location.address ?? "地址未收录"}</span>
          <LocationRating rating={location.rating} />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            {anchorName && location.distanceMeters != null ? (
              <p className="text-xs text-muted-foreground">
                距{anchorName}约 {formatDistanceKm(location.distanceMeters)}
              </p>
            ) : null}
            <Badge variant="outline">{typeLabel}</Badge>
            <PetFriendlyBadge
              typeGroup={location.typeGroup}
              maxPetsPerPerson={location.petPolicies.maxPetsPerPerson}
            />
            <PolicyTags
              subjects={subjects}
              match={(pet) =>
                matchLocationPolicyForType(location.typeGroup, location.petPolicies, pet)
              }
            />
          </div>
          {addedDays.length > 0 ? (
            <div className="flex flex-wrap items-start justify-end gap-1">
              <span className="sr-only">已加入：</span>
              {addedDays.map((day) => (
                <Badge key={day} variant="outline">
                  第 {day} 天
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        {restrictionParts.length > 0 ? (
          <p className="text-xs text-muted-foreground">{restrictionParts.join(" · ")}</p>
        ) : null}
        {noteParts.length > 0 ? (
          <p className="text-xs text-muted-foreground">{noteParts.join(" · ")}</p>
        ) : null}
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onOpen}>
          查看详情
        </Button>
        <DaySelect
          label="添加到行程"
          totalDays={totalDays}
          onSelectDay={onAddStop}
        />
        <Button size="sm" variant="outline" onClick={onAddUnscheduled}>
          暂不排期
        </Button>
        {onLocate ? (
          <Button
            size="sm"
            variant="outline"
            aria-label="在地图查看"
            onClick={onLocate}
          >
            <MapPin aria-hidden="true" className="size-4" />
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
