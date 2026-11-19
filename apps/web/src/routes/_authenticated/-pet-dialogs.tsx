import { useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PetProfileCard,
  petCardTitleClass,
  petLabelClass,
  petPillOutlineClass,
  petPillPrimaryClass,
  petRowClass,
  personalityLabels,
  preferenceLabels,
} from "@/components/pet/pet-profile-card";
import { companionActions } from "@/lib/companion/store";
import { ApiError } from "@/lib/http/api-error";
import { photoDataUrl, readPhotoFile } from "@/lib/pet-photo";
import { tripStatus } from "@/lib/trip/status";
import { packingChecklistQueryKeys } from "@/queries/packing-checklist";
import { tripQueryKeys, tripsQueryOptions } from "@/queries/trips";
import {
  createPetMutationOptions,
  deletePetMutationOptions,
  dogBreedsQueryOptions,
  petQueryKeys,
  updatePetMutationOptions,
  type Pet,
  type PetPersonality,
  type PetPreference,
  type PetType,
  type SavePetInput,
} from "@/queries/pets";

// REQ-014 词表键（design D1/D8，键与后端枚举镜像；标签文案见 pet-profile-card）
const preferenceKeys: PetPreference[] = [
  "SWIMMING",
  "HIKING",
  "GRASS_RUNNING",
  "CITY_WALKING",
  "SNOW_PLAY",
];

// 性格 Select 的「未设置」哨兵值，仅 UI 使用，提交时映射 null（design D8）
const PERSONALITY_UNSET = "UNSET";

type PetDraft = {
  name: string;
  petType: PetType | "";
  dogBreedId: string;
  weightKg: string;
  shoulderHeightCm: string;
  hasLeash: boolean;
  hasVaccinationProof: boolean;
  photo: string | null;
  preferences: PetPreference[];
  personality: PetPersonality | typeof PERSONALITY_UNSET;
};

type DraftErrors = Partial<
  Record<
    "name" | "petType" | "dogBreedId" | "weightKg" | "shoulderHeightCm",
    string
  >
>;

const underlineInputClass =
  "h-auto rounded-none border-0 border-b border-input bg-transparent px-0 py-1 shadow-none focus-visible:border-foreground focus-visible:ring-0 dark:bg-transparent";
const underlineSelectClass =
  "h-auto w-full rounded-none border-0 border-b border-input bg-transparent px-0 py-1 shadow-none focus-visible:border-foreground focus-visible:ring-0 data-[size=default]:h-auto dark:bg-transparent";

function draftFromPet(pet: Pet | null): PetDraft {
  return {
    name: pet?.name ?? "",
    petType: pet?.petType ?? "",
    dogBreedId: pet?.dogBreed ? String(pet.dogBreed.id) : "",
    weightKg: pet ? String(pet.weightKg) : "",
    shoulderHeightCm: pet ? String(pet.shoulderHeightCm) : "",
    hasLeash: pet?.hasLeash ?? false,
    hasVaccinationProof: pet?.hasVaccinationProof ?? false,
    photo: pet?.photo ?? null,
    preferences: pet?.preferences ?? [],
    personality: pet?.personality ?? PERSONALITY_UNSET,
  };
}

function validateDraft(draft: PetDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.name.trim()) {
    errors.name = "请输入宠物名字。";
  }
  if (draft.petType !== "CAT" && draft.petType !== "DOG") {
    errors.petType = "请选择宠物类型。";
  }
  if (draft.petType === "DOG" && !draft.dogBreedId) {
    errors.dogBreedId = "请选择狗的品种。";
  }
  const weight = Number(draft.weightKg);
  if (!draft.weightKg.trim() || !Number.isFinite(weight) || weight <= 0) {
    errors.weightKg = "体重必须为大于 0 的数字。";
  }
  const height = Number(draft.shoulderHeightCm);
  if (!draft.shoulderHeightCm.trim() || !Number.isFinite(height) || height <= 0) {
    errors.shoulderHeightCm = "肩高必须为大于 0 的数字。";
  }
  return errors;
}

function mutationErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }
  if (error instanceof ApiError && error.isRetryable) {
    return "网络异常，请稍后重试。";
  }
  return "保存失败，请检查填写内容。";
}

export function PetDialog({
  initialPet,
  onClose,
}: {
  initialPet: Pet | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PetDraft>(() => draftFromPet(initialPet));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);

  const notifySaved = (saved: Pet) => {
    const incomplete =
      (saved.petType === "DOG" && !saved.dogBreed) ||
      !Number.isFinite(saved.weightKg) ||
      saved.weightKg <= 0;
    if (incomplete) {
      companionActions.say(
        `${saved.name}的档案我记好啦，补全品种和体重后推荐会更准`,
        "warn",
      );
      return;
    }
    companionActions.say(
      `${saved.name}的档案我记好啦，下一步我们去城市浏览挑目的地吧`,
      "ok",
    );
  };

  const createMutation = useMutation({
    ...createPetMutationOptions(),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: petQueryKeys.all });
      await queryClient.invalidateQueries({
        queryKey: packingChecklistQueryKeys.all,
      });
      notifySaved(saved);
      onClose();
    },
  });
  const updateMutation = useMutation({
    ...updatePetMutationOptions(),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: petQueryKeys.all });
      await queryClient.invalidateQueries({
        queryKey: packingChecklistQueryKeys.all,
      });
      notifySaved(saved);
      onClose();
    },
  });

  const pending = createMutation.isPending || updateMutation.isPending;
  const saveError = mutationErrorMessage(
    createMutation.error ?? updateMutation.error,
  );
  const photoPreview = photoDataUrl(draft.photo);
  const dogBreedsQuery = useQuery({
    ...dogBreedsQueryOptions(),
    enabled: draft.petType === "DOG",
  });

  function updateDraft(patch: Partial<PetDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors({});
    createMutation.reset();
    updateMutation.reset();
  }

  function togglePreference(key: PetPreference, checked: boolean) {
    updateDraft({
      preferences: checked
        ? [...draft.preferences, key]
        : draft.preferences.filter((preference) => preference !== key),
    });
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setPhotoError(null);
    try {
      const result = await readPhotoFile(file);
      updateDraft({ photo: result.base64 });
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : "无法读取图片。",
      );
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const input: SavePetInput = {
      name: draft.name.trim(),
      petType: draft.petType as PetType,
      weightKg: Number(draft.weightKg),
      shoulderHeightCm: Number(draft.shoulderHeightCm),
      hasLeash: draft.hasLeash,
      hasVaccinationProof: draft.hasVaccinationProof,
      photo: draft.photo,
      dogBreedId:
        draft.petType === "DOG" ? Number(draft.dogBreedId) : null,
      preferences: draft.preferences,
      personality:
        draft.personality === PERSONALITY_UNSET ? null : draft.personality,
    };

    if (initialPet) {
      updateMutation.mutate({ id: initialPet.id, input });
    } else {
      createMutation.mutate(input);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-3xl gap-0 rounded-[26px] bg-transparent p-0 shadow-none ring-0"
      >
        <DialogDescription className="sr-only">
          填写宠物资料并保存。
        </DialogDescription>
        <form onSubmit={handleSubmit} noValidate>
          <PetProfileCard
            title={
              <DialogTitle className={petCardTitleClass}>
                {initialPet ? `${initialPet.name}的档案` : "添加宠物"}
              </DialogTitle>
            }
            photo={photoPreview}
            photoAlt="宠物照片预览"
            onPhotoSelect={handlePhotoChange}
            photoError={photoError}
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className={petPillOutlineClass}
                  disabled={pending}
                  onClick={onClose}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className={petPillPrimaryClass}
                  disabled={pending}
                >
                  <Check aria-hidden="true" />
                  {pending ? "保存中…" : initialPet ? "保存" : "创建宠物"}
                </Button>
              </>
            }
          >
            <div className={petRowClass}>
              <FieldLabel htmlFor="pet-name" className={petLabelClass}>
                名字
              </FieldLabel>
              <div className="flex flex-col gap-1">
                <Input
                  id="pet-name"
                  className={underlineInputClass}
                  value={draft.name}
                  aria-invalid={Boolean(errors.name)}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                />
                {errors.name ? <FieldError>{errors.name}</FieldError> : null}
              </div>
            </div>

            <div className={petRowClass}>
              <FieldLabel htmlFor="pet-type" className={petLabelClass}>
                类型
              </FieldLabel>
              <div className="flex flex-col gap-1">
                <Select
                  value={draft.petType}
                  onValueChange={(value) => {
                    if (value === "CAT") {
                      updateDraft({ petType: value, dogBreedId: "" });
                    } else if (value === "DOG") {
                      updateDraft({ petType: value });
                    }
                  }}
                >
                  <SelectTrigger
                    id="pet-type"
                    aria-label="宠物类型"
                    aria-invalid={Boolean(errors.petType)}
                    className={underlineSelectClass}
                  >
                    <SelectValue>
                      {(value: string | null) =>
                        value === "CAT" ? "猫" : value === "DOG" ? "狗" : "选择类型"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="CAT">猫</SelectItem>
                      <SelectItem value="DOG">狗</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.petType ? (
                  <FieldError>{errors.petType}</FieldError>
                ) : null}
              </div>
            </div>

            {draft.petType === "DOG" ? (
              <div className={petRowClass}>
                <FieldLabel htmlFor="pet-breed" className={petLabelClass}>
                  品种
                </FieldLabel>
                <div className="flex flex-col gap-1">
                  <Select
                    value={draft.dogBreedId}
                    onValueChange={(value) => {
                      if (typeof value === "string") {
                        updateDraft({ dogBreedId: value });
                      }
                    }}
                  >
                    <SelectTrigger
                      id="pet-breed"
                      aria-label="狗的品种"
                      aria-invalid={Boolean(errors.dogBreedId)}
                      className={underlineSelectClass}
                    >
                      <SelectValue>
                        {(value: string | null) =>
                          dogBreedsQuery.data?.find(
                            (breed) => String(breed.id) === value,
                          )?.name ?? "选择品种"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(dogBreedsQuery.data ?? []).map((breed) => (
                          <SelectItem key={breed.id} value={String(breed.id)}>
                            {breed.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {dogBreedsQuery.isPending ? (
                    <FieldDescription>正在加载品种…</FieldDescription>
                  ) : null}
                  {dogBreedsQuery.isError ? (
                    <FieldError>品种加载失败，请稍后重试。</FieldError>
                  ) : null}
                  {errors.dogBreedId ? (
                    <FieldError>{errors.dogBreedId}</FieldError>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className={petRowClass}>
              <FieldLabel htmlFor="pet-weight" className={petLabelClass}>
                体重（kg）
              </FieldLabel>
              <div className="flex flex-col gap-1">
                <Input
                  id="pet-weight"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  className={underlineInputClass}
                  value={draft.weightKg}
                  aria-invalid={Boolean(errors.weightKg)}
                  onChange={(event) =>
                    updateDraft({ weightKg: event.target.value })
                  }
                />
                {errors.weightKg ? (
                  <FieldError>{errors.weightKg}</FieldError>
                ) : null}
              </div>
            </div>

            <div className={petRowClass}>
              <FieldLabel htmlFor="pet-height" className={petLabelClass}>
                肩高（cm）
              </FieldLabel>
              <div className="flex flex-col gap-1">
                <Input
                  id="pet-height"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  className={underlineInputClass}
                  value={draft.shoulderHeightCm}
                  aria-invalid={Boolean(errors.shoulderHeightCm)}
                  onChange={(event) =>
                    updateDraft({ shoulderHeightCm: event.target.value })
                  }
                />
                {errors.shoulderHeightCm ? (
                  <FieldError>{errors.shoulderHeightCm}</FieldError>
                ) : null}
              </div>
            </div>

            <div className={petRowClass}>
              <FieldLabel className={petLabelClass}>喜好（可选）</FieldLabel>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {preferenceKeys.map((key) => (
                  <span key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`pet-preference-${key.toLowerCase()}`}
                      checked={draft.preferences.includes(key)}
                      onCheckedChange={(checked) =>
                        togglePreference(key, checked)
                      }
                    />
                    <FieldLabel
                      htmlFor={`pet-preference-${key.toLowerCase()}`}
                    >
                      {preferenceLabels[key]}
                    </FieldLabel>
                  </span>
                ))}
              </div>
            </div>

            <div className={petRowClass}>
              <FieldLabel htmlFor="pet-personality" className={petLabelClass}>
                性格（可选）
              </FieldLabel>
              <div className="flex flex-col gap-1">
                <Select
                  value={draft.personality}
                  onValueChange={(value) => {
                    if (typeof value === "string") {
                      updateDraft({
                        personality: value as PetDraft["personality"],
                      });
                    }
                  }}
                >
                  <SelectTrigger
                    id="pet-personality"
                    aria-label="宠物性格"
                    className={underlineSelectClass}
                  >
                    <SelectValue>
                      {(value: string | null) =>
                        value && value !== PERSONALITY_UNSET
                          ? personalityLabels[value as PetPersonality]
                          : "未设置"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={PERSONALITY_UNSET}>
                        未设置
                      </SelectItem>
                      {(Object.keys(personalityLabels) as PetPersonality[]).map(
                        (key) => (
                          <SelectItem key={key} value={key}>
                            {personalityLabels[key]}
                          </SelectItem>
                        ),
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <span className="flex items-center gap-2">
                <Checkbox
                  id="pet-leash"
                  checked={draft.hasLeash}
                  onCheckedChange={(checked) =>
                    updateDraft({ hasLeash: checked })
                  }
                />
                <FieldLabel htmlFor="pet-leash">有牵引绳</FieldLabel>
              </span>
              <span className="flex items-center gap-2">
                <Checkbox
                  id="pet-vaccination"
                  checked={draft.hasVaccinationProof}
                  onCheckedChange={(checked) =>
                    updateDraft({ hasVaccinationProof: checked })
                  }
                />
                <FieldLabel htmlFor="pet-vaccination">有免疫证明</FieldLabel>
              </span>
            </div>

            {saveError ? <FieldError>{saveError}</FieldError> : null}
          </PetProfileCard>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PetDeleteDialog({
  pet,
  onClose,
}: {
  pet: Pet;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const tripsQuery = useQuery({
    ...tripsQueryOptions(),
    throwOnError: false,
    staleTime: 0,
  });
  const mutation = useMutation({
    ...deletePetMutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: petQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: tripQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: packingChecklistQueryKeys.all,
        }),
      ]);
      onClose();
    },
  });
  const petTrips = (tripsQuery.data ?? []).filter(
    (trip) => trip.petId === pet.id,
  );
  const ongoingTrips = petTrips.filter((trip) => tripStatus(trip) !== "ended");
  const endedTrips = petTrips.filter((trip) => tripStatus(trip) === "ended");
  const blockedMessage =
    ongoingTrips.length > 0
      ? `该宠物正在被行程${ongoingTrips.map((trip) => `「${trip.name}」`).join("")}使用，暂时无法删除。请先删除这些行程，或等待行程结束后再试。`
      : null;
  const cascadeMessage =
    endedTrips.length > 0
      ? `删除后，引用该宠物的已结束行程${endedTrips.map((trip) => `「${trip.name}」`).join("")}也会一并删除。`
      : null;
  const error = mutation.error
    ? mutation.error instanceof ApiError && mutation.error.code === "PET_IN_USE"
      ? (blockedMessage ??
        "该宠物正在被行程使用，暂时无法删除。请先删除相关行程，或等待行程结束后再试。")
      : mutation.error instanceof ApiError && mutation.error.isRetryable
        ? "网络异常，请稍后重试。"
        : "删除失败，请稍后重试。"
    : null;

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除宠物？</AlertDialogTitle>
          <AlertDialogDescription>
            “{pet.name}”将从你的宠物列表中移除，此操作无法撤销。
            {cascadeMessage && !blockedMessage ? cascadeMessage : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {blockedMessage ? <FieldError>{blockedMessage}</FieldError> : null}
        {error && error !== blockedMessage ? (
          <FieldError>{error}</FieldError>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={mutation.isPending || blockedMessage !== null}
            onClick={() => mutation.mutate(pet.id)}
          >
            {mutation.isPending ? "删除中…" : "删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}