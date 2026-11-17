import type { QueryClient } from "@tanstack/react-query";
import { daysBetween } from "@/lib/trip/duration";
import { normalizePlan } from "@/lib/trip/plan";
import { matchLocationPolicy } from "@/lib/trip/policy-match";
import { MAX_TRIP_DAYS, MIN_TRIP_DAYS, type Trip } from "@/lib/trip/types";
import { destinationsQueryOptions } from "@/queries/destinations";
import {
  locationBrowseDetailQueryOptions,
  type LocationBrowseDetail,
} from "@/queries/locations";
import { petsQueryOptions, type Pet } from "@/queries/pets";
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
  getTripPlanTool,
  prepareNewTripTool,
  updateTripPlanTool,
} from "./tools";
import type {
  AgentLocationCandidate,
  FindLocationsOutput,
  GetLocationDetailOutput,
  GetTripPlanOutput,
  PrepareNewTripInput,
  PrepareNewTripOutput,
  UpdateTripPlanInput,
  UpdateTripPlanOutput,
} from "./types";
import { validatePlanEdits } from "./proposal";

export function createAgentClientTools(queryClient: QueryClient) {
  return [
    findLocationsTool.client(async (rawInput): Promise<FindLocationsOutput> => {
      const input = asRecord(rawInput);
      const trip = tripStore.state.active;
      if (!trip) {
        return {
          status: "invalid_target",
          message: "请先在 Trips 页面创建或激活行程，再查找地点。",
        };
      }
      const regionCode = trip.cityAdcode;
      const typeGroup = typeof input.typeGroup === "string" ? input.typeGroup : undefined;
      const catalog = await queryClient.fetchQuery(
        agentLocationCatalogQueryOptions(regionCode, typeGroup),
      );
      if (catalog.items.length === 0) {
        return {
          status: "ok",
          regionCode,
          targetTripId: trip.id,
          candidates: [],
          noLocations: true,
          totalMatched: 0,
        };
      }
      const query = typeof input.query === "string" ? input.query : "";
      const matched = matchLocationCatalog(catalog.items, query);
      const pet = await resolvePet(queryClient, trip);
      const candidates = matched.candidates.map((item) => toCandidate(item, pet));
      agentActions.addAllowedPoiIds(
        trip.id,
        candidates.map((candidate) => candidate.poiId),
      );
      agentActions.rememberLocations(
        Object.fromEntries(candidates.map((candidate) => [candidate.poiId, candidate.name])),
      );
      return {
        status: "ok",
        regionCode,
        targetTripId: trip.id,
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
      const trip = tripStore.state.active;
      let detail: LocationBrowseDetail;
      try {
        detail = await queryClient.fetchQuery(locationBrowseDetailQueryOptions(poiId));
      } catch {
        return { status: "not_found", poiId, message: "该地点不存在或已失效。" };
      }
      if (trip && !isSameCity(detail.regionCode, trip.cityAdcode)) {
        return {
          status: "not_found",
          poiId,
          message: "该地点不属于当前激活行程城市。",
        };
      }
      if (trip) {
        agentActions.addAllowedPoiIds(trip.id, [poiId]);
      }
      agentActions.rememberLocations({ [poiId]: detail.name });
      const pet = trip ? await resolvePet(queryClient, trip) : null;
      return {
        status: "ok",
        poiId,
        name: detail.name,
        typeGroup: detail.typeGroup,
        address: detail.address,
        policy: pet ? matchLocationPolicy(detail.petPolicies, pet) : null,
      };
    }),

    getTripPlanTool.client(async (): Promise<GetTripPlanOutput> => {
      const trip = tripStore.state.active;
      if (!trip) {
        return {
          status: "no_active_trip",
          message: "当前没有激活行程，请先在 Trips 页面创建或激活。",
        };
      }
      const plan = normalizePlan(trip.plan, trip.totalDays);
      const nameOf = (poiId: string) =>
        agentStore.state.locationNames[poiId] ??
        tripStore.state.cache.locations[poiId]?.name;
      return {
        status: "ok",
        tripId: trip.id,
        name: trip.name,
        totalDays: trip.totalDays,
        transportMode: trip.transportMode,
        updatedAt: trip.updatedAt,
        revision: tripRevision(trip, tripStore.state.saveRevision),
        plan: {
          days: plan.days.map((day) => ({
            day: day.day,
            stops: day.stops.map((stop) => {
              const name = nameOf(stop.poiId);
              return {
                poiId: stop.poiId,
                ...(name ? { name } : {}),
                ...(stop.toNext ? { toNext: stop.toNext } : {}),
              };
            }),
          })),
          unscheduled: plan.unscheduled.map((stop) => {
            const name = nameOf(stop.poiId);
            return {
              poiId: stop.poiId,
              ...(name ? { name } : {}),
            };
          }),
        },
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

    updateTripPlanTool.client(async (rawInput, context): Promise<UpdateTripPlanOutput> => {
      const trip = tripStore.state.active;
      if (!trip) {
        return { status: "rejected", message: "请先创建或激活行程，再调整计划。" };
      }
      const input = rawInput as Partial<UpdateTripPlanInput>;
      if (input.targetTripId !== trip.id) {
        return {
          status: "rejected",
          message: "方案目标不是当前激活行程，请重新生成方案。",
        };
      }
      if (input.baseRevision !== tripRevision(trip, tripStore.state.saveRevision)) {
        return {
          status: "rejected",
          message: "行程已发生变化，请先调用 get_trip_plan 读取最新行程后再修改。",
        };
      }
      const allowedPoiIds =
        agentStore.state.allowedPoi?.tripId === trip.id
          ? new Set(agentStore.state.allowedPoi.poiIds)
          : new Set<string>();
      const validation = validatePlanEdits(input, trip.plan, {
        tripId: trip.id,
        totalDays: trip.totalDays,
        allowedPoiIds,
      });
      if (!validation.ok) {
        return { status: "rejected", message: validation.error };
      }
      const proposalId = context?.toolCallId ?? crypto.randomUUID();
      agentActions.addProposal({
        id: proposalId,
        tripId: trip.id,
        plan: validation.plan,
        summary: validation.summary,
        warnings: validation.warnings,
        baseUpdatedAt: trip.updatedAt,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      return { status: "proposed", proposalId };
    }),
  ];
}

async function resolvePet(queryClient: QueryClient, trip: { petId: number }): Promise<Pet | null> {
  const pets = await queryClient.fetchQuery(petsQueryOptions());
  return pets.find((candidate) => candidate.id === trip.petId) ?? null;
}

function tripRevision(trip: Trip, saveRevision: number): string {
  const payload = `${trip.id}|${trip.updatedAt}|${saveRevision}|${JSON.stringify(trip.plan)}`;
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${trip.id}.${saveRevision}.${(hash >>> 0).toString(36)}`;
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
