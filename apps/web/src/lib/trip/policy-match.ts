import {
  isPetPolicyConfigured,
  petRulesApplyTo,
  type AttractionPetPolicies,
} from "@/lib/attraction-pet-rules";
import type { DestinationCandidate } from "@/lib/destination-matching";
import type { CityPetPolicy } from "@/queries/city-pet-policy";
import type { Pet } from "@/queries/pets";

export type PolicyStatus = "friendly" | "unfriendly" | "unjudgeable" | "unconfigured";

export interface PolicyVerdict {
  status: PolicyStatus;
  reasons: string[];
}

const PET_TYPE_LABELS: Record<Pet["petType"], string> = {
  CAT: "猫",
  DOG: "狗",
};

function verdict(status: PolicyStatus, reasons: string[] = []): PolicyVerdict {
  return { status, reasons };
}

function typeAllows(allowedPetTypes: string | null, pet: Pet): boolean {
  return allowedPetTypes != null && allowedPetTypes.includes(pet.petType);
}

export function matchCityCandidate(
  candidate: DestinationCandidate,
  pet: Pet,
): PolicyVerdict {
  if (!typeAllows(candidate.allowedPetTypes, pet)) {
    return verdict("unfriendly", [`该城市不允许携带${PET_TYPE_LABELS[pet.petType]}`]);
  }
  if (pet.petType === "CAT") {
    return verdict("friendly", ["城市禁养犬种名单不适用于猫，未限制携带猫"]);
  }
  if (pet.dogBreed == null) {
    return verdict("unjudgeable", ["宠物未填写犬种，无法判定禁养名单"]);
  }
  const reasons: string[] = [];
  if (
    candidate.allowedDogBreedIds.length > 0 &&
    !candidate.allowedDogBreedIds.includes(pet.dogBreed.id)
  ) {
    reasons.push(`${pet.dogBreed.name}不在该城市允许犬种名单内`);
  }
  if (
    candidate.maxSinglePetShoulderHeightCm != null &&
    pet.shoulderHeightCm > candidate.maxSinglePetShoulderHeightCm
  ) {
    reasons.push(
      `肩高 ${pet.shoulderHeightCm}cm 超过城市上限 ${candidate.maxSinglePetShoulderHeightCm}cm`,
    );
  }
  return reasons.length > 0 ? verdict("unfriendly", reasons) : verdict("friendly");
}

export function matchCityPolicy(policy: CityPetPolicy, pet: Pet): PolicyVerdict {
  if (pet.petType === "CAT") {
    if (!typeAllows(policy.allowedPetTypes, pet)) {
      return verdict("unfriendly", ["该城市不允许携带猫"]);
    }
    return verdict("friendly", ["城市禁养犬种名单不适用于猫，未限制携带猫"]);
  }
  if (pet.dogBreed == null) {
    return verdict("unjudgeable", ["宠物未填写犬种，无法判定禁养名单"]);
  }
  const breedName = pet.dogBreed.name;
  if (policy.bannedBreeds.includes(breedName)) {
    return verdict("unfriendly", [`${breedName}属于当地禁养犬种`]);
  }
  if (policy.allowedBreeds.length === 0) {
    return verdict("unconfigured", ["该城市暂未收录可携带犬种名单"]);
  }
  if (policy.allowedBreeds.includes(breedName)) {
    return verdict("friendly");
  }
  return verdict("unjudgeable", [`${breedName}未列入当地可携带犬种名单`]);
}

export function matchLocationPolicy(
  policies: AttractionPetPolicies,
  pet: Pet,
): PolicyVerdict {
  if (!isPetPolicyConfigured(policies)) {
    return verdict("unconfigured", ["该地点暂未配置携宠政策"]);
  }

  const reasons: string[] = [];
  if (policies.allowedPetTypes != null && !policies.allowedPetTypes.includes(pet.petType)) {
    reasons.push(`该地点不允许携带${PET_TYPE_LABELS[pet.petType]}`);
  }
  if (policies.maxPetsPerPerson === 0) {
    reasons.push("该地点不允许携带宠物");
  }
  if (
    policies.maxSinglePetWeightKg != null &&
    pet.weightKg > policies.maxSinglePetWeightKg
  ) {
    reasons.push(
      `体重 ${pet.weightKg}kg 超过地点上限 ${policies.maxSinglePetWeightKg}kg`,
    );
  }
  if (
    pet.petType === "DOG" &&
    policies.maxSinglePetShoulderHeightCm != null &&
    pet.shoulderHeightCm > policies.maxSinglePetShoulderHeightCm
  ) {
    reasons.push(
      `肩高 ${pet.shoulderHeightCm}cm 超过地点上限 ${policies.maxSinglePetShoulderHeightCm}cm`,
    );
  }
  if (policies.leashRequired === true && !pet.hasLeash) {
    reasons.push("该地点要求牵引绳，宠物档案未记录牵引");
  }
  if (policies.vaccinationProofRequired === true && !pet.hasVaccinationProof) {
    reasons.push("该地点要求疫苗证明，宠物档案未记录疫苗证明");
  }
  return reasons.length > 0 ? verdict("unfriendly", reasons) : verdict("friendly");
}

export function matchLocationPolicyForType(
  typeGroup: string,
  policies: AttractionPetPolicies,
  pet: Pet,
): PolicyVerdict {
  if (!petRulesApplyTo(typeGroup) && !isPetPolicyConfigured(policies)) {
    return verdict("friendly");
  }
  return matchLocationPolicy(policies, pet);
}
