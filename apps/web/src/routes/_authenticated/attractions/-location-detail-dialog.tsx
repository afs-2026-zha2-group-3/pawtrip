import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PolicySubjectNotice, PolicyTags } from "@/components/trip/policy-tags";
import { matchLocationPolicy } from "@/lib/trip/policy-match";
import { useActiveTrip, usePolicySubjects } from "@/lib/trip/selectors";
import { tripActions } from "@/lib/trip/store";
import { locationBrowseDetailQueryOptions } from "../../../queries/locations";
import { DaySelect } from "./-day-select";
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
        <DialogHeader>
          <DialogTitle>{location?.name ?? "地点详情"}</DialogTitle>
          <DialogDescription>
            {location
              ? `${typeLabel} · ${location.address ?? "地址未收录"}`
              : "正在加载地点详情…"}
          </DialogDescription>
        </DialogHeader>

        {location ? (
          <div className="flex flex-col gap-4">
            <PetFriendlyBadge maxPetsPerPerson={location.petPolicies.maxPetsPerPerson} />
            <PolicySubjectNotice subjects={subjects} />
            <PolicyTags
              subjects={subjects}
              match={(pet) => matchLocationPolicy(location.petPolicies, pet)}
            />
            <PetPolicyFields policies={location.petPolicies} />
            {active ? (
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <DaySelect
                  label="添加到行程"
                  totalDays={active.totalDays}
                  onSelectDay={(day) => tripActions.addStop(day, location.poiId)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => tripActions.addStop("unscheduled", location.poiId)}
                >
                  暂不排期
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
