import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DestinationCandidate } from "@/lib/destination-matching";
import { daysBetween } from "@/lib/trip/duration";
import { createEmptyPlan } from "@/lib/trip/plan";
import { tripActions } from "@/lib/trip/store";
import { MAX_TRIP_DAYS, MIN_TRIP_DAYS } from "@/lib/trip/types";
import { petsQueryOptions } from "@/queries/pets";
import { createTrip, tripQueryKeys } from "@/queries/trips";

export function CityTripDialog({
  city,
  onClose,
}: {
  city: DestinationCandidate;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const petsQuery = useQuery({ ...petsQueryOptions(), throwOnError: false });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [petId, setPetId] = useState<number | null>(null);
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

    if (!startDate || !endDate) {
      setError("请选择开始和结束日期。");
      return;
    }
    if (days == null) {
      setError("结束日期不能早于开始日期。");
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
      const trip = await createTrip({
        name: `${city.name} · ${days}天 · ${pet.name}`,
        cityAdcode: city.adcode,
        petId: pet.id,
        totalDays: days,
        plan: createEmptyPlan(days),
      });
      tripActions.cacheCity({
        adcode: city.adcode,
        name: city.name,
        province: city.province,
      });
      tripActions.discardDraft();
      tripActions.setActive(trip);
      tripActions.setSaveStatus("saved");
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
      onClose();
      await navigate({ to: "/attractions" });
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
            确认目的地与出行日期后，即可开始选择景点。
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">目的地</span>
            <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-sm">
              {city.name} · {city.province}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="trip-start-date">开始日期</FieldLabel>
              <Input
                id="trip-start-date"
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setError(null);
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="trip-end-date">结束日期</FieldLabel>
              <Input
                id="trip-end-date"
                type="date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setError(null);
                }}
              />
            </Field>
          </div>

          <p className="text-sm text-muted-foreground">
            {days == null
              ? "选择开始与结束日期后自动计算行程天数。"
              : rangeValid
                ? `行程共 ${days} 天。`
                : `行程需为 ${MIN_TRIP_DAYS}–${MAX_TRIP_DAYS} 天，请调整日期。`}
          </p>

          <Field>
            <FieldLabel>携带宠物</FieldLabel>
            {petsQuery.isPending ? (
              <p className="text-sm text-muted-foreground">正在读取宠物档案…</p>
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
