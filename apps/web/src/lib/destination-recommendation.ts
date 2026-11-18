import type { DestinationCandidate } from "./destination-matching";
import type { PetPersonality, PetPreference } from "@/queries/pets";

// REQ-014 城市特征标签词表（design D1/D6，与后端 CityFeatureTags.KEYS 镜像）
export type CityFeatureTag =
  | "COASTAL"
  | "MOUNTAIN"
  | "LAKE"
  | "GRASSLAND"
  | "CITY_PARK"
  | "SNOW";

// 喜好 → 命中特征映射（design D6）
const preferenceFeatureMap: Record<PetPreference, readonly CityFeatureTag[]> = {
  SWIMMING: ["COASTAL", "LAKE"],
  HIKING: ["MOUNTAIN"],
  GRASS_RUNNING: ["GRASSLAND"],
  CITY_WALKING: ["CITY_PARK"],
  SNOW_PLAY: ["SNOW"],
};

// 性格 → 加成特征映射（任一命中 +1，design D6）
const personalityFeatureMap: Record<PetPersonality, readonly CityFeatureTag[]> = {
  ENERGETIC: ["COASTAL", "MOUNTAIN", "GRASSLAND", "SNOW"],
  CALM: ["LAKE", "CITY_PARK"],
  TIMID: ["CITY_PARK"],
};

// 每个去重后的命中特征 +2（多喜好映射同一特征只计一次）；性格任一命中 +1
export function scoreCity(
  featureTags: readonly string[],
  preferences: readonly PetPreference[],
  personality: PetPersonality | null,
): number {
  const tags = new Set(featureTags);
  const preferenceHits = new Set<CityFeatureTag>();
  for (const preference of preferences) {
    for (const feature of preferenceFeatureMap[preference] ?? []) {
      if (tags.has(feature)) {
        preferenceHits.add(feature);
      }
    }
  }
  let score = preferenceHits.size * 2;
  if (personality != null) {
    const bonusFeatures = personalityFeatureMap[personality] ?? [];
    if (bonusFeatures.some((feature) => tags.has(feature))) {
      score += 1;
    }
  }
  return score;
}

export interface RecommendationProfile {
  preferences: readonly PetPreference[];
  personality: PetPersonality | null;
}

// 得分降序、同分保持输入序（显式比较原始下标，不依赖引擎排序稳定性）；
// profile null 或喜好/性格两字段皆空 → 不重排（design D6）
export function sortByRecommendation(
  candidates: readonly DestinationCandidate[],
  profile: RecommendationProfile | null,
): DestinationCandidate[] {
  if (profile == null || (profile.preferences.length === 0 && profile.personality == null)) {
    return [...candidates];
  }
  return candidates
    .map((candidate, index) => ({
      candidate,
      index,
      score: scoreCity(candidate.featureTags, profile.preferences, profile.personality),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.candidate);
}