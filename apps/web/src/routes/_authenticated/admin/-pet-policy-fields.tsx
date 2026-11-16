import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
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
  type AllowedPetTypesSelection,
  type PetPolicyDraft,
  type PetPolicyField,
  type PetPolicyTriState,
} from "@/lib/pet-policy";

const TRI_STATE_OPTIONS: { value: PetPolicyTriState; label: string }[] = [
  { value: "unset", label: "未配置" },
  { value: "required", label: "需要" },
  { value: "not-required", label: "不需要" },
];

const ALLOWED_PET_TYPES_OPTIONS: { value: AllowedPetTypesSelection; label: string }[] = [
  { value: "unset", label: "未配置" },
  { value: "cat", label: "仅猫" },
  { value: "dog", label: "仅狗" },
  { value: "cat-dog", label: "猫和狗" },
];

export function PetPolicyFields({
  idPrefix,
  draft,
  invalidField,
  onChange,
}: {
  idPrefix: string;
  draft: PetPolicyDraft;
  invalidField?: PetPolicyField;
  onChange: (draft: PetPolicyDraft) => void;
}) {
  function update<K extends PetPolicyField>(field: K, value: PetPolicyDraft[K]) {
    onChange({ ...draft, [field]: value });
  }

  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <AllowedPetTypesField
          id={`${idPrefix}-allowed-pet-types`}
          value={draft.allowedPetTypes}
          invalid={invalidField === "allowedPetTypes"}
          onChange={(value) => update("allowedPetTypes", value)}
        />
        <NumberPolicyField
          id={`${idPrefix}-max-pets`}
          label="每位游客最多携带宠物数（只）"
          value={draft.maxPetsPerPerson}
          step="1"
          inputMode="numeric"
          invalid={invalidField === "maxPetsPerPerson"}
          onChange={(value) => update("maxPetsPerPerson", value)}
        />
        <NumberPolicyField
          id={`${idPrefix}-max-weight`}
          label="单只宠物最大体重（kg）"
          value={draft.maxSinglePetWeightKg}
          step="0.01"
          inputMode="decimal"
          invalid={invalidField === "maxSinglePetWeightKg"}
          onChange={(value) => update("maxSinglePetWeightKg", value)}
        />
        <NumberPolicyField
          id={`${idPrefix}-max-shoulder-height`}
          label="单只宠物最大肩高（cm）"
          value={draft.maxSinglePetShoulderHeightCm}
          step="0.01"
          inputMode="decimal"
          invalid={invalidField === "maxSinglePetShoulderHeightCm"}
          onChange={(value) => update("maxSinglePetShoulderHeightCm", value)}
        />
        <NumberPolicyField
          id={`${idPrefix}-extra-fee`}
          label="额外费用（元 / 只 / 次）"
          value={draft.extraFeeYuan}
          step="0.01"
          inputMode="decimal"
          invalid={invalidField === "extraFeeYuan"}
          onChange={(value) => update("extraFeeYuan", value)}
        />
        <TriStatePolicyField
          id={`${idPrefix}-leash`}
          label="牵引绳要求"
          value={draft.leashRequired}
          invalid={invalidField === "leashRequired"}
          onChange={(value) => update("leashRequired", value)}
        />
        <TriStatePolicyField
          id={`${idPrefix}-vaccination`}
          label="疫苗证明要求"
          value={draft.vaccinationProofRequired}
          invalid={invalidField === "vaccinationProofRequired"}
          onChange={(value) => update("vaccinationProofRequired", value)}
        />
        <TriStatePolicyField
          id={`${idPrefix}-reservation`}
          label="预约要求"
          value={draft.reservationRequired}
          invalid={invalidField === "reservationRequired"}
          onChange={(value) => update("reservationRequired", value)}
        />
      </div>
      <FieldDescription>留空表示未配置；填写 0 表示明确的零值。</FieldDescription>
    </FieldGroup>
  );
}

function AllowedPetTypesField({
  id,
  value,
  invalid,
  onChange,
}: {
  id: string;
  value: AllowedPetTypesSelection;
  invalid: boolean;
  onChange: (value: AllowedPetTypesSelection) => void;
}) {
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>允许宠物类型</FieldLabel>
      <Select
        value={value}
        onValueChange={(next) => {
          if (typeof next === "string") {
            onChange(next as AllowedPetTypesSelection);
          }
        }}
      >
        <SelectTrigger id={id} aria-label="允许宠物类型" className="w-full">
          <SelectValue>
            {(selected: string | null) =>
              ALLOWED_PET_TYPES_OPTIONS.find((option) => option.value === selected)?.label ?? "未配置"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {ALLOWED_PET_TYPES_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

function NumberPolicyField({
  id,
  label,
  value,
  step,
  inputMode,
  invalid,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  step: string;
  inputMode: "numeric" | "decimal";
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        min="0"
        step={step}
        inputMode={inputMode}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function TriStatePolicyField({
  id,
  label,
  value,
  invalid,
  onChange,
}: {
  id: string;
  label: string;
  value: PetPolicyTriState;
  invalid: boolean;
  onChange: (value: PetPolicyTriState) => void;
}) {
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value}
        onValueChange={(next) => {
          if (typeof next === "string") {
            onChange(next as PetPolicyTriState);
          }
        }}
      >
        <SelectTrigger id={id} aria-label={label} className="w-full">
          <SelectValue>
            {(selected: string | null) =>
              TRI_STATE_OPTIONS.find((option) => option.value === selected)?.label ?? "未配置"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {TRI_STATE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
