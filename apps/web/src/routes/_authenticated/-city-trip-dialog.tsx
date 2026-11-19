import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CalendarRange } from "@/components/ui/calendar-range";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { companionActions } from "@/lib/companion/store";
import type { DestinationCandidate } from "@/lib/destination-matching";
import { createTripAndActivate } from "@/lib/trip/create";
import { daysBetween } from "@/lib/trip/duration";
import { MAX_TRIP_DAYS, MIN_TRIP_DAYS } from "@/lib/trip/types";
import { petsQueryOptions } from "@/queries/pets";
import type { Trip } from "@/lib/trip/types";

export function CityTripDialog({
  city,
  onClose,
  initialStartDate = "",
  initialEndDate = "",
  initialPetId = null,
  navigateOnCreate = true,
  onCreated,
  beforeCreate,
}: {
  city: DestinationCandidate;
  onClose: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
  initialPetId?: number | null;
  navigateOnCreate?: boolean;
  onCreated?: (trip: Trip) => void;
  beforeCreate?: () => Promise<boolean>;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const petsQuery = useQuery({ ...petsQueryOptions(), throwOnError: false });
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [petId, setPetId] = useState<number | null>(initialPetId);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pets = petsQuery.data ?? [];
  const pet = pets.find((candidate) => candidate.id === petId) ?? pets[0] ?? null;
  const days = daysBetween(startDate, endDate);
  const rangeValid =
    days != null && days >= MIN_TRIP_DAYS && days <= MAX_TRIP_DAYS;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!startDate || !endDate || days == null) {
      setError("请选择开始和结束日期。");
      return;
    }
    if (!rangeValid) {
      setError(`行程需为 ${MIN_TRIP_DAYS}–${MAX_TRIP_DAYS} 天。`);
      return;
    }
    if (!pet) {
      setError("请先在 Paws 中添加宠物档案，再创建行程。");
      return;
    }

    setSubmitting(true);
    try {
      if (beforeCreate && !(await beforeCreate())) {
        setError("保存当前行程失败，请稍后重试。");
        return;
      }
      const trip = await createTripAndActivate(queryClient, {
        name: `${city.name} · ${days}天 · ${pet.name}`,
        cityAdcode: city.adcode,
        petId: pet.id,
        totalDays: days,
        city,
        startDate,
      });
      companionActions.say(
        `「${trip.name}」建好啦，下一步选一个带我过去的大交通方式吧`,
        "ok",
      );
      if (navigateOnCreate) {
        onClose();
        await navigate({ to: "/transport-rules" });
      } else {
        onCreated?.(trip);
        onClose();
      }
    } catch {
      setError("创建行程失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建行程</DialogTitle>
          <DialogDescription>
            确认目的地与出行日期后，请先选择大交通，再开始选择景点。
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">目的地</span>
            <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-sm">
              {city.name} · {city.province}
            </span>
          </div>

          <Field>
            <FieldLabel>出行日期</FieldLabel>
            <CalendarRange
              startDate={startDate}
              endDate={endDate}
              onSelect={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setError(null);
              }}
            />
            <p className="text-sm text-muted-foreground">
              {days != null
                ? rangeValid
                  ? `行程共 ${days} 天（${startDate} 至 ${endDate}）。`
                  : `行程需为 ${MIN_TRIP_DAYS}–${MAX_TRIP_DAYS} 天，请调整日期。`
                : startDate
                  ? `已选择 ${startDate} 开始，请再选择结束日期。`
                  : "在日历上依次选择开始与结束日期（仅可选择今天及以后）。"}
            </p>
          </Field>

          <Field>
            <FieldLabel>携带宠物</FieldLabel>
            {petsQuery.isPending ? (
              <p className="text-sm text-muted-foreground">正在读取宠物档案…</p>
            ) : petsQuery.isError ? (
              <p className="text-sm text-muted-foreground">
                暂时无法读取宠物档案，请稍后重试。
              </p>
            ) : pets.length > 0 ? (
              <Select
                value={String(pet?.id ?? pets[0].id)}
                onValueChange={(value) => {
                  if (typeof value === "string") setPetId(Number(value));
                }}
              >
                <SelectTrigger aria-label="选择携带宠物" className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      pets.find((candidate) => String(candidate.id) === value)?.name
                      ?? pets[0].name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {pets.map((candidate) => (
                      <SelectItem key={candidate.id} value={String(candidate.id)}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                尚未添加宠物档案，请先在 Paws 中添加宠物。
              </p>
            )}
          </Field>

          {error ? <FieldError role="alert">{error}</FieldError> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={submitting || petsQuery.isPending || !pet}
            >
              {submitting ? "创建中…" : "确定"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
