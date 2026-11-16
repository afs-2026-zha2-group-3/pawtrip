export interface BannedBreed {
  breedName: string;
  source: string;
  updated: string;
}

export interface DestinationCandidate {
  adcode: string;
  name: string;
  province: string;
  policyCovered: boolean;
  bannedBreeds: BannedBreed[];
  allowedPetTypes: string | null;
  allowedDogBreedIds: number[];
  maxSinglePetShoulderHeightCm: number | null;
}

export interface CityMatchProfile {
  petType: "CAT" | "DOG";
  breedId: number | null;
  shoulderHeightCm: number | null;
}

// 与服务端叠加筛选同语义（design D8/D9）：类型 null=不允许；品种空列表/肩高 null=未配置放行
export function matchesCityPetPolicy(
  candidate: DestinationCandidate,
  profile: CityMatchProfile,
): boolean {
  if (candidate.allowedPetTypes == null || !candidate.allowedPetTypes.includes(profile.petType)) {
    return false;
  }
  if (
    profile.petType === "DOG" &&
    profile.breedId != null &&
    candidate.allowedDogBreedIds.length > 0 &&
    !candidate.allowedDogBreedIds.includes(profile.breedId)
  ) {
    return false;
  }
  if (
    profile.shoulderHeightCm != null &&
    candidate.maxSinglePetShoulderHeightCm != null &&
    profile.shoulderHeightCm > candidate.maxSinglePetShoulderHeightCm
  ) {
    return false;
  }
  return true;
}

export function breedHitsBanList(
  breed: string | null | undefined,
  bannedBreeds: readonly { breedName: string }[],
): boolean {
  if (!breed || breed === "其他") {
    return false;
  }
  return bannedBreeds.some((banned) => banned.breedName === breed);
}