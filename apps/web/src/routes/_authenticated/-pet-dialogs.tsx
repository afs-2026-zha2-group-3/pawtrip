import { useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PawPrint } from "lucide-react";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/http/api-error";
import { photoDataUrl, readPhotoFile } from "@/lib/pet-photo";
import {
  createPetMutationOptions,
  deletePetMutationOptions,
  dogBreedsQueryOptions,
  petQueryKeys,
  updatePetMutationOptions,
  type Pet,
  type PetType,
  type SavePetInput,
} from "@/queries/pets";

const petTypeLabels: Record<PetType, string> = {
  CAT: "猫",
  DOG: "狗",
};

type PetDraft = {
  name: string;
  petType: PetType | "";
  dogBreedId: string;
  weightKg: string;
  shoulderHeightCm: string;
  hasLeash: boolean;
  hasVaccinationProof: boolean;
  photo: string | null;
};

type DraftErrors = Partial<
  Record<
    "name" | "petType" | "dogBreedId" | "weightKg" | "shoulderHeightCm",
    string
  >
>;

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
  onRequestDelete,
}: {
  initialPet: Pet | null;
  onClose: () => void;
  onRequestDelete: (pet: Pet) => void;
}) {
  const queryClient = useQueryClient();
  const [pet, setPet] = useState<Pet | null>(initialPet);
  const [mode, setMode] = useState<"view" | "edit">(
    initialPet ? "view" : "edit",
  );
  const [draft, setDraft] = useState<PetDraft>(() => draftFromPet(initialPet));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);

  const createMutation = useMutation({
    ...createPetMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: petQueryKeys.all });
      onClose();
    },
  });
  const updateMutation = useMutation({
    ...updatePetMutationOptions(),
    onSuccess: async (updated) => {
      setPet(updated);
      setDraft(draftFromPet(updated));
      setMode("view");
      setErrors({});
      setPhotoError(null);
      await queryClient.invalidateQueries({ queryKey: petQueryKeys.all });
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

  function startEdit() {
    setDraft(draftFromPet(pet));
    setErrors({});
    setPhotoError(null);
    updateMutation.reset();
    setMode("edit");
  }

  function cancelEdit() {
    if (!pet) {
      onClose();
      return;
    }
    setDraft(draftFromPet(pet));
    setErrors({});
    setPhotoError(null);
    updateMutation.reset();
    setMode("view");
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
    };

    if (pet) {
      updateMutation.mutate({ id: pet.id, input });
    } else {
      createMutation.mutate(input);
    }
  }

  const editing = mode === "edit" || !pet;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pet ? (editing ? `编辑 ${pet.name}` : pet.name) : "添加宠物"}
          </DialogTitle>
          <DialogDescription>
            {editing ? "填写宠物资料并保存。" : "查看宠物资料，或进入编辑。"}
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="pet-name">名字</FieldLabel>
                  <Input
                    id="pet-name"
                    value={draft.name}
                    aria-invalid={Boolean(errors.name)}
                    onChange={(event) => updateDraft({ name: event.target.value })}
                  />
                  {errors.name ? <FieldError>{errors.name}</FieldError> : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="pet-type">类型</FieldLabel>
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
                      className="w-full"
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
                </Field>

                <Field>
                  <FieldLabel htmlFor="pet-weight">体重（kg）</FieldLabel>
                  <Input
                    id="pet-weight"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={draft.weightKg}
                    aria-invalid={Boolean(errors.weightKg)}
                    onChange={(event) =>
                      updateDraft({ weightKg: event.target.value })
                    }
                  />
                  {errors.weightKg ? (
                    <FieldError>{errors.weightKg}</FieldError>
                  ) : null}
                </Field>

                <Field>
                  <FieldLabel htmlFor="pet-height">肩高（cm）</FieldLabel>
                  <Input
                    id="pet-height"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={draft.shoulderHeightCm}
                    aria-invalid={Boolean(errors.shoulderHeightCm)}
                    onChange={(event) =>
                      updateDraft({ shoulderHeightCm: event.target.value })
                    }
                  />
                  {errors.shoulderHeightCm ? (
                    <FieldError>{errors.shoulderHeightCm}</FieldError>
                  ) : null}
                </Field>
              </div>

              {draft.petType === "DOG" ? (
                <Field>
                  <FieldLabel htmlFor="pet-breed">品种</FieldLabel>
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
                      className="w-full"
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
                </Field>
              ) : null}

              <div className="flex flex-wrap gap-6">
                <Field>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="pet-leash"
                      checked={draft.hasLeash}
                      onCheckedChange={(checked) =>
                        updateDraft({ hasLeash: checked })
                      }
                    />
                    <FieldLabel htmlFor="pet-leash">有牵引绳</FieldLabel>
                  </div>
                </Field>
                <Field>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="pet-vaccination"
                      checked={draft.hasVaccinationProof}
                      onCheckedChange={(checked) =>
                        updateDraft({ hasVaccinationProof: checked })
                      }
                    />
                    <FieldLabel htmlFor="pet-vaccination">有免疫证明</FieldLabel>
                  </div>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="pet-photo">照片</FieldLabel>
                <Input
                  id="pet-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handlePhotoChange}
                />
                <FieldDescription>
                  可选，支持 JPEG、PNG、GIF、WebP，最大 5MB。
                </FieldDescription>
                {photoError ? <FieldError>{photoError}</FieldError> : null}
                {photoPreview ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={photoPreview}
                      alt="宠物照片预览"
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateDraft({ photo: null })}
                    >
                      移除照片
                    </Button>
                  </div>
                ) : null}
              </Field>
            </FieldGroup>

            {saveError ? <FieldError>{saveError}</FieldError> : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={cancelEdit}
              >
                取消
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "保存中…" : pet ? "保存" : "创建宠物"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <PetDetails pet={pet} photo={photoPreview} />
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                关闭
              </Button>
              <Button
                variant="destructive"
                onClick={() => onRequestDelete(pet)}
              >
                删除
              </Button>
              <Button onClick={startEdit}>编辑</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PetDetails({ pet, photo }: { pet: Pet; photo: string | null }) {
  return (
    <div className="flex flex-col gap-5">
      {photo ? (
        <img
          src={photo}
          alt={`${pet.name}的照片`}
          className="h-56 w-full rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-56 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-secondary">
          <PawPrint
            aria-hidden="true"
            className="size-16 text-muted-foreground/40"
          />
        </div>
      )}
      <dl className="grid gap-3 text-sm sm:grid-cols-[7rem_1fr]">
        <dt className="font-medium">名字</dt>
        <dd>{pet.name}</dd>
        <dt className="font-medium">类型</dt>
        <dd>{petTypeLabels[pet.petType]}</dd>
        {pet.petType === "DOG" ? (
          <>
            <dt className="font-medium">品种</dt>
            <dd>{pet.dogBreed?.name ?? "未设置"}</dd>
          </>
        ) : null}
        <dt className="font-medium">体重</dt>
        <dd>{pet.weightKg} kg</dd>
        <dt className="font-medium">肩高</dt>
        <dd>{pet.shoulderHeightCm} cm</dd>
        <dt className="font-medium">牵引绳</dt>
        <dd>{pet.hasLeash ? "有" : "无"}</dd>
        <dt className="font-medium">免疫证明</dt>
        <dd>{pet.hasVaccinationProof ? "有" : "无"}</dd>
      </dl>
    </div>
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
  const mutation = useMutation({
    ...deletePetMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: petQueryKeys.all });
      onClose();
    },
  });
  const error = mutation.error
    ? mutation.error instanceof ApiError && mutation.error.isRetryable
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <FieldError>{error}</FieldError> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(pet.id)}
          >
            {mutation.isPending ? "删除中…" : "删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}