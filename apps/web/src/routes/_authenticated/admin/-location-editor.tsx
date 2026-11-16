import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  adminLocationQueryKeys,
  createLocationMutationOptions,
  locationDetailQueryOptions,
  updateLocationMutationOptions,
  type AmapCandidate,
  type AmapLocationParams,
  type JsonValue,
  type LocationPhoto,
  type Page,
  type SavedLocation,
} from "../../../queries/admin-locations";
import { locationQueryKeys } from "../../../queries/locations";
import {
  emptyPetPolicyDraft,
  petPoliciesFromDraft,
  petPolicyDraftFrom,
  type PetPolicyDraft,
  type PetPolicyField,
} from "../../../lib/pet-policy";
import { PetPolicyFields } from "./-pet-policy-fields";

const savedListsQueryKey = locationQueryKeys.listRoot;

export function AmapCandidateEditor({
  candidate,
  typeGroup,
  listParams,
  onClose,
}: {
  candidate: AmapCandidate;
  typeGroup: string;
  listParams: AmapLocationParams;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [minVisitHours, setMinVisitHours] = useState("");
  const [maxVisitHours, setMaxVisitHours] = useState("");
  const [petPolicyDraft, setPetPolicyDraft] = useState<PetPolicyDraft>(emptyPetPolicyDraft);
  const [invalidPolicyField, setInvalidPolicyField] = useState<PetPolicyField>();
  const [validationError, setValidationError] = useState<string>();
  const createMutation = useMutation({
    ...createLocationMutationOptions(),
    onSuccess: async (created) => {
      queryClient.setQueryData(adminLocationQueryKeys.detail(created.poiId), created);
      queryClient.setQueryData<Page<AmapCandidate>>(
        adminLocationQueryKeys.amapList(listParams),
        (current) => current && ({
          ...current,
          items: current.items.map((item) =>
            item.poiId === created.poiId ? { ...item, saved: true } : item,
          ),
        }),
      );
      await queryClient.invalidateQueries({ queryKey: savedListsQueryKey });
      onClose();
    },
  });
  const isAttraction = typeGroup === "attraction";

  useEffect(() => {
    setMinVisitHours("");
    setMaxVisitHours("");
    setPetPolicyDraft(emptyPetPolicyDraft);
    setInvalidPolicyField(undefined);
    setValidationError(undefined);
    createMutation.reset();
  }, [candidate, createMutation.reset]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(undefined);
    setInvalidPolicyField(undefined);

    const min = parseVisitHours(minVisitHours);
    const max = parseVisitHours(maxVisitHours);
    if (isAttraction && (min.error || max.error)) {
      setValidationError(min.error ?? max.error);
      return;
    }
    if (isAttraction && min.value !== null && max.value !== null && min.value > max.value) {
      setValidationError("最少游玩时间不能大于最多游玩时间。");
      return;
    }
    const policyResult = petPoliciesFromDraft(petPolicyDraft);
    if ("error" in policyResult) {
      setValidationError(policyResult.error.message);
      setInvalidPolicyField(policyResult.error.field);
      return;
    }

    createMutation.mutate({
      poiId: candidate.poiId,
      typeGroup,
      ...(isAttraction ? {
        minVisitHours: min.value,
        maxVisitHours: max.value,
      } : {}),
      petPolicies: policyResult.policies,
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl" aria-describedby="candidate-editor-description">
        <DialogHeader>
          <DialogTitle>保存地点</DialogTitle>
          <DialogDescription id="candidate-editor-description">
            确认高德地点基础信息，并补充 Pawtrip 的额外信息。
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" noValidate onSubmit={submit}>
          <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
            <dt className="font-medium">地点名称</dt>
            <dd>{candidate.name || "—"}</dd>
            <dt className="font-medium">类型编码</dt>
            <dd>{candidate.typeCode || "—"}</dd>
            <dt className="font-medium">地址</dt>
            <dd>{candidate.address || "—"}</dd>
            <dt className="font-medium">坐标</dt>
            <dd>{candidate.location || "—"}</dd>
            <dt className="font-medium">行政区编码</dt>
            <dd>{candidate.regionCode || "—"}</dd>
          </dl>

          {isAttraction ? (
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <VisitHoursField
                  id="candidate-min-visit-hours"
                  label="最少游玩时间（小时）"
                  value={minVisitHours}
                  invalid={Boolean(validationError && validationError.includes("最少"))}
                  onChange={setMinVisitHours}
                />
                <VisitHoursField
                  id="candidate-max-visit-hours"
                  label="最多游玩时间（小时）"
                  value={maxVisitHours}
                  invalid={Boolean(validationError && validationError.includes("最多"))}
                  onChange={setMaxVisitHours}
                />
              </div>
              <FieldDescription>可留空；填写时须为不小于 0 的整数小时。</FieldDescription>
            </FieldGroup>
          ) : null}

          <section aria-labelledby="candidate-pet-policy-heading" className="flex flex-col gap-3">
            <h3 id="candidate-pet-policy-heading" className="text-sm font-semibold">携宠政策</h3>
            <PetPolicyFields
              idPrefix="candidate"
              draft={petPolicyDraft}
              invalidField={invalidPolicyField}
              onChange={(next) => {
                setPetPolicyDraft(next);
                setInvalidPolicyField(undefined);
              }}
            />
          </section>

          {validationError ? <FieldError>{validationError}</FieldError> : null}
          {createMutation.isError ? (
            <FieldError>保存失败，请检查网络或稍后重试。</FieldError>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "保存中…" : "保存地点"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SavedLocationEditor({
  location,
  onClose,
}: {
  location: SavedLocation;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const detailQuery = useQuery({
    ...locationDetailQueryOptions(location.poiId),
    enabled: true,
  });
  const [minVisitHours, setMinVisitHours] = useState("");
  const [maxVisitHours, setMaxVisitHours] = useState("");
  const [petPolicyDraft, setPetPolicyDraft] = useState<PetPolicyDraft>(emptyPetPolicyDraft);
  const [invalidPolicyField, setInvalidPolicyField] = useState<PetPolicyField>();
  const [validationError, setValidationError] = useState<string>();
  const updateMutation = useMutation({
    ...updateLocationMutationOptions(location.poiId),
    onSuccess: (updated) => {
      queryClient.setQueryData(adminLocationQueryKeys.detail(updated.poiId), updated);
      queryClient.setQueriesData<Page<SavedLocation>>(
        { queryKey: savedListsQueryKey },
        (current) => current && ({
          ...current,
          items: current.items.map((item) => item.poiId === updated.poiId
            ? {
                ...item,
                minVisitHours: updated.minVisitHours,
                maxVisitHours: updated.maxVisitHours,
                maxPetsPerPerson: updated.petPolicies.maxPetsPerPerson,
                petPolicies: updated.petPolicies,
              }
            : item),
        }),
      );
    },
  });

  const detail = detailQuery.data;
  const isAttraction = location.typeGroup === "attraction";

  useEffect(() => {
    if (!detail) return;
    setMinVisitHours(detail.minVisitHours === null ? "" : String(detail.minVisitHours));
    setMaxVisitHours(detail.maxVisitHours === null ? "" : String(detail.maxVisitHours));
    setPetPolicyDraft(petPolicyDraftFrom(detail.petPolicies));
    setInvalidPolicyField(undefined);
    setValidationError(undefined);
  }, [detail]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(undefined);
    setInvalidPolicyField(undefined);

    const policyResult = petPoliciesFromDraft(petPolicyDraft);
    if ("error" in policyResult) {
      setValidationError(policyResult.error.message);
      setInvalidPolicyField(policyResult.error.field);
      return;
    }

    if (isAttraction) {
      const min = parseVisitHours(minVisitHours);
      const max = parseVisitHours(maxVisitHours);
      if (min.error || max.error) {
        setValidationError(min.error ?? max.error);
        return;
      }
      if (min.value !== null && max.value !== null && min.value > max.value) {
        setValidationError("最少游玩时间不能大于最多游玩时间。");
        return;
      }
      updateMutation.mutate({
        minVisitHours: min.value,
        maxVisitHours: max.value,
        petPolicies: policyResult.policies,
      });
      return;
    }

    updateMutation.mutate({ petPolicies: policyResult.policies });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{getPoiName(detail?.poi) || location.name}</DialogTitle>
          <DialogDescription>
            已保存地点详情来自 Pawtrip 数据库；编辑仅更新额外信息。
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isPending ? <p role="status">正在读取地点详情…</p> : null}
        {detailQuery.isError ? <FieldError>读取地点详情失败，请关闭后重试。</FieldError> : null}
        {detail ? (
          <div className="flex flex-col gap-6">
            <section aria-labelledby="location-poi-heading" className="flex flex-col gap-2">
              <h3 id="location-poi-heading" className="text-sm font-semibold">POI 完整数据</h3>
              <JsonPreview value={detail.poi} />
            </section>
            <section aria-labelledby="location-business-heading" className="flex flex-col gap-2">
              <h3 id="location-business-heading" className="text-sm font-semibold">商业信息</h3>
              <JsonPreview value={detail.business} />
            </section>
            <section aria-labelledby="location-photos-heading" className="flex flex-col gap-3">
              <h3 id="location-photos-heading" className="text-sm font-semibold">地点照片</h3>
              {detail.photos.length ? (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {detail.photos.map((photo) => (
                    <li key={photo.photoId} className="flex flex-col gap-2 rounded-lg border p-3">
                      <span className="text-sm font-medium">{photo.title || `照片 ${photo.order + 1}`}</span>
                      <LocationPhotoPreview photo={photo} />
                      <JsonPreview value={photo.metadata} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">没有照片数据。</p>
              )}

            </section>

            <form className="flex flex-col gap-4 border-t pt-4" noValidate onSubmit={submit}>
              {isAttraction ? (
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <VisitHoursField
                      id="saved-min-visit-hours"
                      label="最少游玩时间（小时）"
                      value={minVisitHours}
                      invalid={Boolean(validationError && validationError.includes("最少"))}
                      onChange={setMinVisitHours}
                    />
                    <VisitHoursField
                      id="saved-max-visit-hours"
                      label="最多游玩时间（小时）"
                      value={maxVisitHours}
                      invalid={Boolean(validationError && validationError.includes("最多"))}
                      onChange={setMaxVisitHours}
                    />
                  </div>
                  <FieldDescription>可留空；填写时须为不小于 0 的整数小时。</FieldDescription>
                </FieldGroup>
              ) : null}
              <section aria-labelledby="saved-pet-policy-heading" className="flex flex-col gap-3">
                <h3 id="saved-pet-policy-heading" className="text-sm font-semibold">携宠政策</h3>
                <PetPolicyFields
                  idPrefix="saved"
                  draft={petPolicyDraft}
                  invalidField={invalidPolicyField}
                  onChange={(next) => {
                    setPetPolicyDraft(next);
                    setInvalidPolicyField(undefined);
                  }}
                />
              </section>
              {validationError ? <FieldError>{validationError}</FieldError> : null}
              {updateMutation.isError ? <FieldError>更新失败，请检查网络或稍后重试。</FieldError> : null}
              {updateMutation.isSuccess ? (
                <p role="status" className="text-sm text-muted-foreground">地点信息已更新。</p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  关闭
                </Button>
                <Button type="submit" disabled={updateMutation.isPending || detailQuery.isPending}>
                  {updateMutation.isPending ? "保存中…" : "保存修改"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function VisitHoursField({
  id,
  label,
  value,
  invalid,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        step="any"
        inputMode="numeric"
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function LocationPhotoPreview({ photo }: { photo: LocationPhoto }) {
  const imageUrl = safeImageUrl(photo.sourceUrl);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => setHasLoadError(false), [imageUrl]);

  if (!imageUrl || hasLoadError) {
    return <p role="status" className="text-sm text-muted-foreground">图片暂不可用。</p>;
  }

  return (
    <img
      src={imageUrl}
      alt={photo.title || `照片 ${photo.order + 1}`}
      referrerPolicy="no-referrer"
      onError={() => setHasLoadError(true)}
      className="max-h-56 w-full rounded-md object-contain"
    />
  );
}

function safeImageUrl(sourceUrl: string): string | undefined {
  try {
    const parsedUrl = new URL(sourceUrl);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.href;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function JsonPreview({ value }: { value: JsonValue }) {
  return (
    <pre className="max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap break-all">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function getPoiName(value: JsonValue | undefined): string | undefined {
  if (!value || Array.isArray(value) || typeof value !== "object") return undefined;
  const name = value.name;
  return typeof name === "string" && name.length ? name : undefined;
}

function parseVisitHours(value: string): { value: number | null; error?: string } {
  if (!value.trim()) return { value: null };
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return { value: null, error: "游玩时间必须为不小于 0 的整数小时。" };
  }
  return { value: parsed };
}


