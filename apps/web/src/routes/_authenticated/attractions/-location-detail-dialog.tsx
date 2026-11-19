import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PolicySubjectNotice, PolicyTags } from "@/components/trip/policy-tags";
import { locationDescription } from "@/lib/location-summary";
import { matchLocationPolicyForType } from "@/lib/trip/policy-match";
import {
  useActiveTrip,
  useActiveTripReadOnly,
  usePolicySubjects,
} from "@/lib/trip/selectors";
import { tripActions } from "@/lib/trip/store";
import { locationBrowseDetailQueryOptions } from "../../../queries/locations";
import { DaySelect } from "./-day-select";
import { LocationCover } from "./-location-cover";
import { LocationRating } from "./-location-rating";
import { PetFriendlyBadge } from "./-pet-friendly-badge";
import { PetPolicyFields } from "./-pet-policy-fields";

export function LocationDetailDialog({
  poiId,
  typeLabel,
  onClose,
}: {
  poiId: string;
  typeLabel: string;
  onClose: () => void;
}) {
  const active = useActiveTrip();
  const readOnly = useActiveTripReadOnly();
  const subjects = usePolicySubjects();
  const detail = useQuery({
    ...locationBrowseDetailQueryOptions(poiId),
    throwOnError: true,
  });

  useEffect(() => {
    if (detail.data) {
      tripActions.cacheLocation(detail.data);
    }
  }, [detail.data]);

  const location = detail.data;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        {location ? (
          <LocationCover
            coverPhotoUrl={location.coverPhotoUrl}
            name={location.name}
            typeLabel={typeLabel}
            className="rounded-lg"
          />
        ) : null}
        <DialogHeader>
          <DialogTitle>{location?.name ?? "地点详情"}</DialogTitle>
          <DialogDescription className="flex items-center justify-between gap-2">
            <span>
              {location
                ? `${typeLabel} · ${location.address ?? "地址未收录"}`
                : "正在加载地点详情…"}
            </span>
            {location ? <LocationRating rating={location.rating} /> : null}
          </DialogDescription>
        </DialogHeader>

        {location ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {locationDescription(location)}
            </p>
            <PetFriendlyBadge
              typeGroup={location.typeGroup}
              maxPetsPerPerson={location.petPolicies.maxPetsPerPerson}
            />
            <PolicySubjectNotice subjects={subjects} />
            <PolicyTags
              subjects={subjects}
              match={(pet) =>
                matchLocationPolicyForType(location.typeGroup, location.petPolicies, pet)
              }
            />
            <PetPolicyFields policies={location.petPolicies} typeGroup={location.typeGroup} />
            {active ? (
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <DaySelect
                  label="添加到行程"
                  totalDays={active.totalDays}
                  onSelectDay={(day) => tripActions.addStop(day, location.poiId)}
                  onSelectUnscheduled={() => tripActions.addStop("unscheduled", location.poiId)}
                  disabled={readOnly}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
