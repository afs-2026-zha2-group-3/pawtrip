import type { QueryClient } from "@tanstack/react-query";
import { daysBetween } from "@/lib/trip/duration";
import { matchLocationPolicy } from "@/lib/trip/policy-match";
import { MAX_TRIP_DAYS, MIN_TRIP_DAYS, type Trip } from "@/lib/trip/types";
import { destinationsQueryOptions } from "@/queries/destinations";
import {
  locationBrowseDetailQueryOptions,
  type LocationBrowseDetail,
} from "@/queries/locations";
import { petsQueryOptions, type Pet } from "@/queries/pets";
import { tripDetailQueryOptions } from "@/queries/trips";
import { agentActions, agentStore, type PendingNewTripFlow } from "./store";
import { tripStore } from "@/lib/trip/store";
import {
  agentLocationCatalogQueryOptions,
  isSameCity,
  matchLocationCatalog,
} from "./locations";
import {
  findLocationsTool,
  getLocationDetailTool,
  prepareNewTripTool,
  proposeTripPlanTool,
} from "./tools";
import type {
  AgentLocationCandidate,
  AgentTarget,
  FindLocationsOutput,
  GetLocationDetailOutput,
  PrepareNewTripInput,
  PrepareNewTripOutput,
  ProposeTripPlanInput,
  ProposeTripPlanOutput,
} from "./types";
import { validateProposal } from "./proposal";

export function createAgentClientTools(queryClient: QueryClient) {
  return [
    findLocationsTool.client(async (rawInput): Promise<FindLocationsOutput> => {
      const input = asRecord(rawInput);
      const target = agentStore.state.target;
      if (!target) {
        return { status: "no_target", message: "请先在面板中选择规划目标。" };
      }
      const resolved = await resolveTargetTrip(queryClient, target);
      if (!resolved.ok) {
        return { status: "invalid_target", message: resolved.message };
      }
      const regionCode = resolved.cityAdcode;
      if (!regionCode) {
        return { status: "invalid_target", message: "目标城市尚未确定，请先选择城市。" };
      }
      const typeGroup = typeof input.typeGroup === "string" ? input.typeGroup : undefined;
      const catalog = await queryClient.fetchQuery(
        agentLocationCatalogQueryOptions(regionCode, typeGroup),
      );
      if (catalog.items.length === 0) {
        return {
          status: "ok",
          regionCode,
          targetTripId: resolved.trip?.id,
          candidates: [],
          noLocations: true,
          totalMatched: 0,
        };
      }
      const query = typeof input.query === "string" ? input.query : "";
      const matched = matchLocationCatalog(catalog.items, query);
      const pet = await resolvePet(queryClient, target, resolved.trip);
      const candidates = matched.candidates.map((item) =>
        toCandidate(item, pet),
      );
      agentActions.addAllowedPoiIds(candidates.map((candidate) => candidate.poiId));
      agentActions.rememberLocations(
        Object.fromEntries(candidates.map((candidate) => [candidate.poiId, candidate.name])),
      );
      return {
        status: "ok",
        regionCode,
        targetTripId: resolved.trip?.id,
        candidates,
        ambiguous: matched.ambiguous,
        truncated: catalog.truncated,
        noLocations: false,
        totalMatched: matched.totalMatched,
        ...(catalog.truncated
          ? {
              message:
                "地点目录超过抓取上限，匹配可能不完整；可按地点类型缩小范围后重试。",
            }
          : {}),
      };
    }),

    getLocationDetailTool.client(async (rawInput): Promise<GetLocationDetailOutput> => {
      const input = asRecord(rawInput);
      const poiId = typeof input.poiId === "string" ? input.poiId : "";
      if (!poiId) {
        return { status: "not_found", poiId, message: "缺少地点标识。" };
      }
      const target = agentStore.state.target;
      const resolved = target
        ? await resolveTargetTrip(queryClient, target)
        : { ok: true as const, cityAdcode: null, trip: null };
      if (!resolved.ok) {
        return { status: "not_found", poiId, message: resolved.message };
      }
      let detail: LocationBrowseDetail;
      try {
        detail = await queryClient.fetchQuery(locationBrowseDetailQueryOptions(poiId));
      } catch {
        return { status: "not_found", poiId, message: "该地点不存在或已失效。" };
      }
      if (resolved.cityAdcode && !isSameCity(detail.regionCode, resolved.cityAdcode)) {
        return {
          status: "not_found",
          poiId,
          message: "该地点不属于当前规划目标城市。",
        };
      }
      agentActions.addAllowedPoiIds([poiId]);
      agentActions.rememberLocations({ [poiId]: detail.name });
      const pet = await resolvePet(queryClient, target, resolved.trip);
      return {
        status: "ok",
        poiId,
        name: detail.name,
        typeGroup: detail.typeGroup,
        address: detail.address,
        policy: pet ? matchLocationPolicy(detail.petPolicies, pet) : null,
      };
    }),

    prepareNewTripTool.client(async (rawInput): Promise<PrepareNewTripOutput> => {
      if (agentStore.state.newTripFlow) {
        return { status: "needs_input", message: "已有待确认的新行程，请先完成或取消。" };
      }
      const input = rawInput as Partial<PrepareNewTripInput>;
      const cityName = typeof input.cityName === "string" ? input.cityName.trim() : "";
      const startDate = typeof input.startDate === "string" ? input.startDate : "";
      const endDate = typeof input.endDate === "string" ? input.endDate : "";
      if (!cityName) {
        return { status: "needs_input", message: "请提供目标城市。" };
      }
      const days = daysBetween(startDate, endDate);
      if (days == null || days < MIN_TRIP_DAYS || days > MAX_TRIP_DAYS) {
        return { status: "needs_input", message: "行程日期含首尾需为 1–7 天。" };
      }
      const destinations = await queryClient.fetchQuery(
        destinationsQueryOptions({ keyword: cityName }),
      );
      const normalized = cityName.toLowerCase();
      const exact = destinations.filter((candidate) => candidate.name.toLowerCase() === normalized);
      const city = exact.length === 1 ? exact[0] : destinations.length === 1 ? destinations[0] : null;
      if (!city) {
        return {
          status: "needs_input",
          message:
            exact.length > 1 || destinations.length > 1
              ? `城市“${cityName}”匹配到多个候选，请明确城市。`
              : `未找到城市“${cityName}”，请更换城市。`,
        };
      }
      const pets = await queryClient.fetchQuery(petsQueryOptions());
      if (pets.length === 0) {
        return { status: "no_pets", message: "请先在 Paws 页面添加宠物档案。" };
      }
      const petName = typeof input.petName === "string" ? input.petName.trim() : "";
      const pet = petName
        ? pets.find((candidate) => candidate.name === petName) ?? null
        : pets[0];
      if (!pet) {
        return { status: "needs_input", message: `未找到宠物“${petName}”。` };
      }

      return new Promise<PrepareNewTripOutput>((resolve) => {
        const flow: PendingNewTripFlow = {
          city,
          startDate,
          endDate,
          petId: pet.id,
          stage: tripStore.state.active != null ? "confirm-deactivate" : "dialog",
          resolve: (result) => {
            agentActions.setNewTripFlow(null);
            resolve(result);
          },
        };
        agentActions.setNewTripFlow(flow);
      });
    }),

    proposeTripPlanTool.client(async (rawInput, context): Promise<ProposeTripPlanOutput> => {
      const input = rawInput as Partial<ProposeTripPlanInput>;
      const target = agentStore.state.target;
      if (!target || target.kind !== "existing") {
        return { status: "rejected", message: "请先选择要修改的已保存行程。" };
      }
      if (input.target?.tripId !== target.tripId) {
        return { status: "rejected", message: "方案目标与当前规划目标不一致。" };
      }
      const resolved = await resolveTargetTrip(queryClient, target);
      if (!resolved.ok || !resolved.trip) {
        return { status: "rejected", message: resolved.ok ? "目标行程不存在。" : resolved.message };
      }
      const validation = validateProposal(input, {
        tripId: target.tripId,
        totalDays: resolved.trip.totalDays,
        allowedPoiIds: new Set(agentStore.state.allowedPoiIds),
      });
      if (!validation.ok) {
        return { status: "rejected", message: validation.error };
      }
      const proposalId = context?.toolCallId ?? crypto.randomUUID();
      agentActions.addProposal({
        id: proposalId,
        tripId: target.tripId,
        plan: validation.plan,
        summary: validation.summary,
        warnings: validation.warnings,
        baseUpdatedAt: resolved.trip.updatedAt,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      return { status: "proposed", proposalId };
    }),
  ];
}

async function resolveTargetTrip(
  queryClient: QueryClient,
  target: AgentTarget,
): Promise<{ ok: true; cityAdcode: string | null; trip: Trip | null } | { ok: false; message: string }> {
  if (target.kind === "new") {
    return { ok: true, cityAdcode: target.city?.adcode ?? null, trip: null };
  }
  const snapshot = agentStore.state.targetTrip;
  if (snapshot && snapshot.id === target.tripId) {
    return { ok: true, cityAdcode: snapshot.cityAdcode, trip: snapshot };
  }
  try {
    const trip = await queryClient.fetchQuery(tripDetailQueryOptions(target.tripId));
    agentActions.setTargetTrip(trip);
    return { ok: true, cityAdcode: trip.cityAdcode, trip };
  } catch {
    return { ok: false, message: "目标行程不存在或无权访问。" };
  }
}

async function resolvePet(
  queryClient: QueryClient,
  target: AgentTarget | null,
  trip: Trip | null,
): Promise<Pet | null> {
  const petId = trip?.petId ?? (target?.kind === "new" ? target.petId : null);
  if (petId == null) {
    return null;
  }
  const pets = await queryClient.fetchQuery(petsQueryOptions());
  return pets.find((candidate) => candidate.id === petId) ?? null;
}

function toCandidate(
  item: { poiId: string; name: string; typeGroup: string; address: string | null; petPolicies: LocationBrowseDetail["petPolicies"] },
  pet: Pet | null,
): AgentLocationCandidate {
  return {
    poiId: item.poiId,
    name: item.name,
    typeGroup: item.typeGroup,
    address: item.address,
    policy: pet ? matchLocationPolicy(item.petPolicies, pet) : null,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}
