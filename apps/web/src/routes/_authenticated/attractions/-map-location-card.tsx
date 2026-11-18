import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPinned, Phone, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PolicyTags } from "@/components/trip/policy-tags";
import { petRulesApplyTo } from "@/lib/attraction-pet-rules";
import { formatDistanceKm } from "@/lib/distance";
import { matchLocationPolicyForType } from "@/lib/trip/policy-match";
import {
  useActiveTrip,
  useActiveTripReadOnly,
  usePolicySubjects,
} from "@/lib/trip/selectors";
import { tripActions } from "@/lib/trip/store";
import { cn } from "@/lib/utils";
import {
  locationBrowseDetailQueryOptions,
  type LocationSummary,
  type PetPolicies,
} from "../../../queries/locations";
import { DaySelect } from "./-day-select";
import { LocationRating } from "./-location-rating";
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

function visitHoursLabel(point: LocationSummary | null): string | null {
  if (!point) {
    return null;
  }
  const { minVisitHours, maxVisitHours } = point;
  if (minVisitHours != null && maxVisitHours != null && minVisitHours !== maxVisitHours) {
    return `建议游玩 ${minVisitHours}–${maxVisitHours} 小时`;
  }
  const hours = maxVisitHours ?? minVisitHours;
  return hours != null ? `建议游玩 ${hours} 小时` : null;
}

const TAB_CLASS =
  "inline-flex h-8 items-center rounded-full px-3 text-sm font-medium transition-colors";

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
  const readOnly = useActiveTripReadOnly();
  const subjects = usePolicySubjects();
  const [tab, setTab] = useState<"detail" | "policy">("detail");
  const detail = useQuery({
    ...locationBrowseDetailQueryOptions(poiId),
    throwOnError: false,
  });

  useEffect(() => {
    if (detail.data) {
      tripActions.cacheLocation(detail.data);
    }
  }, [detail.data]);

  useEffect(() => {
    setTab("detail");
  }, [poiId]);

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
  const addedDays = active
    ? active.plan.days
        .filter((entry) => entry.stops.some((stop) => stop.poiId === poiId))
        .map((entry) => entry.day)
    : [];
  const hoursLabel = visitHoursLabel(point);
  const infoRows: { icon: typeof Clock; text: string }[] = [];
  if (location?.openTime) {
    infoRows.push({ icon: Clock, text: location.openTime });
  } else if (hoursLabel) {
    infoRows.push({ icon: Clock, text: hoursLabel });
  }
  if (location?.tel) {
    infoRows.push({ icon: Phone, text: location.tel });
  }
  if (location?.businessArea) {
    infoRows.push({ icon: Tag, text: `商圈 · ${location.businessArea}` });
  }
  if (infoRows.length === 0) {
    infoRows.push({ icon: MapPinned, text: address });
  }

  const addControls = active ? (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {addedDays.map((day) => (
        <span
          key={day}
          className="inline-flex h-9 items-center rounded-full border border-[#404040] bg-[#0A0A0A] px-3 text-sm font-medium text-[#FAFAFA]"
        >
          第 {day} 天
        </span>
      ))}
      <DaySelect
        label="添加到行程"
        totalDays={active.totalDays}
        onSelectDay={(day) => tripActions.addStop(day, poiId)}
        onSelectUnscheduled={() => tripActions.addStop("unscheduled", poiId)}
        disabled={readOnly}
      />
    </div>
  ) : null;

  return (
    <article className="paw-scroll paw-rise absolute inset-x-4 bottom-4 z-20 mx-auto max-h-[75%] max-w-[640px] overflow-y-auto rounded-[22px] bg-card p-6 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={tab === "detail"}
            onClick={() => setTab("detail")}
            className={cn(
              TAB_CLASS,
              tab === "detail"
                ? "bg-[#171717] text-[#FAFAFA]"
                : "border border-[#E5E5E5] bg-card text-foreground hover:bg-muted",
            )}
          >
            详情
          </button>
          <button
            type="button"
            aria-pressed={tab === "policy"}
            onClick={() => setTab("policy")}
            className={cn(
              TAB_CLASS,
              tab === "policy"
                ? "bg-[#171717] text-[#FAFAFA]"
                : "border border-[#E5E5E5] bg-card text-foreground hover:bg-muted",
            )}
          >
            携宠政策
          </button>
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

      {tab === "detail" ? (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex gap-5">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <MapPinned aria-hidden="true" className="size-6 shrink-0" />
                <h2 className="text-xl leading-7 font-semibold">{name}</h2>
                <span className="inline-flex h-[21px] items-center rounded-md bg-[#FFDFB5] px-1.5 text-xs font-medium text-paw-accent-strong">
                  {location?.keytag ?? typeLabel}
                </span>
                <LocationRating rating={location?.rating ?? point?.rating ?? null} />
              </div>
              <p className="text-base leading-6 text-foreground">{address}</p>
              {point?.distanceMeters != null && anchorName ? (
                <p className="text-xs text-muted-foreground">
                  距{anchorName}约 {formatDistanceKm(point.distanceMeters)}
                </p>
              ) : null}
            </div>
            {location?.coverPhotoUrl ? (
              <img
                src={location.coverPhotoUrl}
                alt={name}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-[169px] w-[180px] shrink-0 rounded-[22px] object-cover"
              />
            ) : (
              <div
                role="img"
                aria-label={`${name}暂无图片`}
                className="flex h-[169px] w-[180px] shrink-0 items-center justify-center rounded-[22px] bg-muted text-xs text-muted-foreground"
              >
                {typeLabel}
              </div>
            )}
          </div>
          <div aria-hidden="true" className="h-px bg-[#E8E8E8]" />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2.5">
              {infoRows.map((row) => (
                <span key={row.text} className="flex items-center gap-3 text-base">
                  <row.icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{row.text}</span>
                </span>
              ))}
            </div>
            {addControls}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {policies ? (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                <PetFriendlyBadge
                  typeGroup={typeGroup}
                  maxPetsPerPerson={policies.maxPetsPerPerson}
                />
                <PolicyTags
                  subjects={subjects}
                  match={(pet) => matchLocationPolicyForType(typeGroup, policies, pet)}
                />
              </div>
              <PetPolicyFields policies={policies} typeGroup={typeGroup} />
              {chips.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex h-6 items-center rounded-full bg-[#F0F0F0] px-2.5 text-xs text-[#838383]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">暂无携宠政策</p>
          )}
          {addControls ? <div className="border-t pt-3">{addControls}</div> : null}
        </div>
      )}

      {detail.isPending ? (
        <p className="mt-2 text-xs text-muted-foreground">正在加载地点详情…</p>
      ) : null}
      {detail.isError ? (
        <p className="mt-2 text-xs text-destructive">加载地点详情失败</p>
      ) : null}
    </article>
  );
}
