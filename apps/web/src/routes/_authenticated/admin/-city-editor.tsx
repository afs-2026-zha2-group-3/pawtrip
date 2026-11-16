import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  emptyPetPolicyDraft,
  petPoliciesFromDraft,
  petPolicyDraftFrom,
  type PetPolicyDraft,
  type PetPolicyField,
} from "../../../lib/pet-policy";
import {
  adminCityQueryKeys,
  cityDetailQueryOptions,
  updateCityMutationOptions,
  type CityListItem,
} from "../../../queries/admin-cities";
import { dogBreedsQueryOptions, type DogBreed } from "../../../queries/pets";
import { PetPolicyFields } from "./-pet-policy-fields";

const cityListsQueryKey = ["admin", "cities", "list"] as const;

export function CityEditor({
  city,
  onClose,
}: {
  city: CityListItem;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const detailQuery = useQuery(cityDetailQueryOptions(city.adcode));
  const breedsQuery = useQuery(dogBreedsQueryOptions());
  const [petPolicyDraft, setPetPolicyDraft] = useState<PetPolicyDraft>(emptyPetPolicyDraft);
  const [selectedBreedIds, setSelectedBreedIds] = useState<number[]>([]);
  const [breedSearch, setBreedSearch] = useState("");
  const [invalidPolicyField, setInvalidPolicyField] = useState<PetPolicyField>();
  const [validationError, setValidationError] = useState<string>();
  const updateMutation = useMutation({
    ...updateCityMutationOptions(city.adcode),
    onSuccess: (updated) => {
      queryClient.setQueryData(adminCityQueryKeys.detail(updated.adcode), updated);
      queryClient.setQueriesData<{ items: CityListItem[] }>(
        { queryKey: cityListsQueryKey },
        (current) => current && ({
          ...current,
          items: current.items.map((item) => item.adcode === updated.adcode
            ? { ...item, petPolicies: updated.petPolicies }
            : item),
        }),
      );
    },
  });

  const detail = detailQuery.data;

  useEffect(() => {
    if (!detail) return;
    setPetPolicyDraft(petPolicyDraftFrom(detail.petPolicies));
    setSelectedBreedIds(detail.allowedDogBreedIds);
    setInvalidPolicyField(undefined);
    setValidationError(undefined);
  }, [detail]);

  const filteredBreeds = useMemo(() => {
    const keyword = breedSearch.trim();
    const breeds = breedsQuery.data ?? [];
    return keyword
      ? breeds.filter((breed) => breed.name.includes(keyword))
      : breeds;
  }, [breedSearch, breedsQuery.data]);

  function toggleBreed(breedId: number, checked: boolean) {
    setSelectedBreedIds((current) => checked
      ? [...current, breedId]
      : current.filter((id) => id !== breedId));
  }

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

    updateMutation.mutate({
      petPolicies: policyResult.policies,
      allowedDogBreedIds: selectedBreedIds,
    });
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{city.name}</DialogTitle>
          <DialogDescription>
            {city.provinceName} · {city.level === "city" ? "城市级" : "省级叶节点"}；仅维护数据库中的政策，不调用高德。
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isPending ? <p role="status">正在读取城市政策…</p> : null}
        {detailQuery.isError ? <FieldError>读取城市政策失败，请关闭后重试。</FieldError> : null}
        {detail ? (
          <form className="flex flex-col gap-5" noValidate onSubmit={submit}>
            <section aria-labelledby="city-pet-policy-heading" className="flex flex-col gap-3">
              <h3 id="city-pet-policy-heading" className="text-sm font-semibold">携宠政策</h3>
              <PetPolicyFields
                idPrefix={`city-${city.adcode}`}
                draft={petPolicyDraft}
                invalidField={invalidPolicyField}
                onChange={(next) => {
                  setPetPolicyDraft(next);
                  setInvalidPolicyField(undefined);
                }}
              />
            </section>

            <section aria-labelledby="city-dog-breeds-heading" className="flex flex-col gap-3">
              <h3 id="city-dog-breeds-heading" className="text-sm font-semibold">允许饲养犬种</h3>
              <p className="text-sm text-muted-foreground">
                不选择任何犬种表示未限制；已选 {selectedBreedIds.length} 个犬种。
              </p>
              <Field>
                <FieldLabel htmlFor="city-breed-search">搜索犬种</FieldLabel>
                <Input
                  id="city-breed-search"
                  placeholder="输入犬种名称"
                  value={breedSearch}
                  onChange={(event) => setBreedSearch(event.target.value)}
                />
              </Field>
              {breedsQuery.isPending ? <p role="status">正在加载犬种…</p> : null}
              {breedsQuery.isError ? <FieldError>加载犬种列表失败，请稍后重试。</FieldError> : null}
              {breedsQuery.data ? (
                filteredBreeds.length > 0 ? (
                  <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                    {filteredBreeds.map((breed) => (
                      <DogBreedOption
                        key={breed.id}
                        breed={breed}
                        checked={selectedBreedIds.includes(breed.id)}
                        onChange={(checked) => toggleBreed(breed.id, checked)}
                      />
                    ))}
                  </div>
                ) : (
                  <p role="status" className="text-sm text-muted-foreground">没有匹配的犬种。</p>
                )
              ) : null}
            </section>

            {validationError ? <FieldError>{validationError}</FieldError> : null}
            {updateMutation.isError ? <FieldError>保存失败，请检查网络或稍后重试。</FieldError> : null}
            {updateMutation.isSuccess ? (
              <p role="status" className="text-sm text-muted-foreground">城市政策已更新。</p>
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
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DogBreedOption({
  breed,
  checked,
  onChange,
}: {
  breed: DogBreed;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox
        aria-label={breed.name}
        checked={checked}
        onCheckedChange={(next) => onChange(next === true)}
      />
      <span>{breed.name}</span>
      {breed.officialAggressive ? (
        <span className="text-xs text-muted-foreground">（官方烈性犬）</span>
      ) : null}
    </label>
  );
}
