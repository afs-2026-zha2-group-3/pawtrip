import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PolicyTags } from "@/components/trip/policy-tags";
import { petRulesApplyTo } from "@/lib/attraction-pet-rules";
import { formatDistanceKm } from "@/lib/distance";
import { matchLocationPolicyForType } from "@/lib/trip/policy-match";
import { useActiveTrip, usePolicySubjects } from "@/lib/trip/selectors";
import { tripActions } from "@/lib/trip/store";
import {
  locationBrowseDetailQueryOptions,
  type LocationSummary,
  type PetPolicies,
} from "../../../queries/locations";
import { DaySelect } from "./-day-select";
import { PetFriendlyBadge } from "./-pet-friendly-badge";
import { PetPolicyFields } from "./-pet-policy-fields";

function policyChips(policies: PetPolicies): string[] {
  const chips: string[] = [];
  if (policies.maxPetsPerPerson != null && policies.maxPetsPerPerson >= 1) {
    chips.push("可携带宠物");
  }
  if (policies.allowedPetTypes) {
    const labels = policies.allowedPetTypes
      .split(",")
      .map((type) => (type === "CAT" ? "猫" : type === "DOG" ? "狗" : type));
    chips.push(labels.join("、"));
  }
  if (policies.maxPetsPerPerson != null && policies.maxPetsPerPerson > 0) {
    chips.push(`≤ ${policies.maxPetsPerPerson} 只/人`);
  }
  if (policies.maxSinglePetWeightKg != null) {
    chips.push(`≤ ${policies.maxSinglePetWeightKg}kg`);
  }
  if (policies.maxSinglePetShoulderHeightCm != null) {
    chips.push(`肩高 ≤ ${policies.maxSinglePetShoulderHeightCm}cm`);
  }
  if (policies.extraFeeCents != null) {
    chips.push(`额外费用 ¥${(policies.extraFeeCents / 100).toFixed(0)}`);
  }
  if (policies.leashRequired) {
    chips.push("需牵引");
  }
  if (policies.vaccinationProofRequired) {
    chips.push("需疫苗证明");
  }
  return chips;
}

export function MapLocationCard({
  poiId,
  point,
  typeLabel,
  anchorName,
  onClose,
}: {
  poiId: string;
  point: LocationSummary | null;
  typeLabel: string;
  anchorName?: string | null;
  onClose: () => void;
}) {
  const active = useActiveTrip();
  const subjects = usePolicySubjects();
  const detail = useQuery({
    ...locationBrowseDetailQueryOptions(poiId),
    throwOnError: false,
  });

  useEffect(() => {
    if (detail.data) {
      tripActions.cacheLocation(detail.data);
    }
  }, [detail.data]);

  const location = detail.data;
  const name = location?.name ?? point?.name ?? "地点详情";
  const address = location?.address ?? point?.address ?? "地址未收录";
  const policies = location?.petPolicies;
  const typeGroup = location?.typeGroup ?? point?.typeGroup ?? "";
  const chips =
    policies && !petRulesApplyTo(typeGroup) && policyChips(policies).length === 0
      ? ["允许所有宠物"]
      : policies
        ? policyChips(policies)
        : [];

  return (
    <article className="absolute inset-x-3 bottom-3 z-20 max-h-[72%] overflow-y-auto rounded-2xl border bg-card p-3 shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">详情</span>
          {location?.rating ? <Badge variant="secondary">★ {location.rating}</Badge> : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="关闭地图详情"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-1 flex gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold">{name}</h2>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge variant="outline">{typeLabel}</Badge>
            {location?.businessArea ? (
              <Badge variant="outline">{location.businessArea}</Badge>
            ) : null}
            {location?.keytag ? <Badge variant="outline">{location.keytag}</Badge> : null}
          </div>
          {point?.distanceMeters != null && anchorName ? (
            <p className="mt-1 text-xs text-muted-foreground">
              距{anchorName}约 {formatDistanceKm(point.distanceMeters)}
            </p>
          ) : null}
          {policies ? (
            <>
              <div className="mt-2">
                <PetFriendlyBadge
                  typeGroup={typeGroup}
                  maxPetsPerPerson={policies.maxPetsPerPerson}
                />
              </div>
              <PolicyTags
                subjects={subjects}
                match={(pet) => matchLocationPolicyForType(typeGroup, policies, pet)}
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {chips.map((chip) => (
                  <Badge key={chip} variant="secondary">
                    {chip}
                  </Badge>
                ))}
              </div>
            </>
          ) : null}
        </div>
        {location?.coverPhotoUrl ? (
          <img
            src={location.coverPhotoUrl}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-24 w-32 shrink-0 rounded-xl object-cover"
          />
        ) : null}
      </div>

      {policies ? (
        <div className="mt-3">
          <h3 className="text-xs font-medium text-muted-foreground">携宠政策</h3>
          <PetPolicyFields policies={policies} typeGroup={typeGroup} />
        </div>
      ) : null}

      <div className="mt-3 text-sm">
        <span className="text-muted-foreground">地址：</span>
        {address}
      </div>

      {detail.isPending ? (
        <p className="mt-2 text-xs text-muted-foreground">正在加载地点详情…</p>
      ) : null}
      {detail.isError ? (
        <p className="mt-2 text-xs text-destructive">加载地点详情失败</p>
      ) : null}

      {active && policies ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          <DaySelect
            label="添加到行程"
            totalDays={active.totalDays}
            onSelectDay={(day) => tripActions.addStop(day, poiId)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => tripActions.addStop("unscheduled", poiId)}
          >
            暂不排期
          </Button>
        </div>
      ) : null}
    </article>
  );
}
