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