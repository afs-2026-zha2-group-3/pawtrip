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

export function isPetFriendlyDestination(
  candidate: DestinationCandidate,
  breed: string | null | undefined,
): boolean {
  if (!candidate.policyCovered) {
    return false;
  }
  return !breedHitsBanList(breed, candidate.bannedBreeds);
}

export function matchesDestinationKeyword(candidate: DestinationCandidate, keyword: string): boolean {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return true;
  }
  return candidate.name.includes(trimmed) || candidate.province.includes(trimmed);
}