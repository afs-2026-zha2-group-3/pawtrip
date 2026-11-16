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
import { matchAttractionPolicy } from "@/lib/trip/policy-match";
import { useActiveTrip, usePolicySubjects } from "@/lib/trip/selectors";
import { tripActions } from "@/lib/trip/store";
import { attractionDetailQueryOptions } from "../../../queries/attractions";
import { DaySelect } from "./-day-select";
import { PetFriendlyBadge } from "./-pet-friendly-badge";
import { PetPolicyFields } from "./-pet-policy-fields";

export function AttractionDetailDialog({
  poiId,
  onClose,
}: {
  poiId: string;
  onClose: () => void;
}) {
  const active = useActiveTrip();
  const subjects = usePolicySubjects();
  const detail = useQuery({
    ...attractionDetailQueryOptions(poiId),
    throwOnError: true,
  });

  useEffect(() => {
    if (detail.data) {
      tripActions.cacheLocation(detail.data);
    }
  }, [detail.data]);

  const attraction = detail.data;

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
          <DialogTitle>{attraction?.name ?? "景点详情"}</DialogTitle>
          <DialogDescription>
            {attraction
              ? `景点 · ${attraction.address ?? "地址未收录"}`
              : "正在加载景点详情…"}
          </DialogDescription>
        </DialogHeader>

        {attraction ? (
          <div className="flex flex-col gap-4">
            <PetFriendlyBadge maxPetsPerPerson={attraction.petPolicies.maxPetsPerPerson} />
            <PolicySubjectNotice subjects={subjects} />
            <PolicyTags
              subjects={subjects}
              match={(pet) => matchAttractionPolicy(attraction.petPolicies, pet)}
            />
            <PetPolicyFields policies={attraction.petPolicies} />
            {active ? (
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <DaySelect
                  label="添加到行程"
                  totalDays={active.totalDays}
                  onSelectDay={(day) => tripActions.addStop(day, attraction.poiId)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => tripActions.addStop("unscheduled", attraction.poiId)}
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
