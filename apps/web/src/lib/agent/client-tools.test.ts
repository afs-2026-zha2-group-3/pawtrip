import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import type { Pet } from "@/queries/pets";
import { agentActions, agentStore } from "./store";
import { createAgentClientTools } from "./client-tools";
import type { FindLocationsOutput, GetLocationDetailOutput, ProposeTripPlanOutput } from "./types";

const pet: Pet = {
  id: 1,
  name: "豆豆",
  petType: "DOG",
  weightKg: 5,
  shoulderHeightCm: 30,
  hasLeash: true,
  hasVaccinationProof: true,
  photo: null,
  dogBreed: null,
};

const trip = {
  id: 4,
  name: "珠海两日",
  cityAdcode: "440400",
  petId: 1,
  totalDays: 2,
  transportMode: null,
  plan: { version: 1 as const, days: [], unscheduled: [] },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function location(poiId: string, name: string, regionCode = "440402") {
  return {
    poiId,
    name,
    typeCode: "110000",
    typeGroup: "attraction",
    address: "珠海市香洲区",
    longitude: null,
    latitude: null,
    regionCode,
    minVisitHours: null,
    maxVisitHours: null,
    maxPetsPerPerson: 1,
    petPolicies: {
      allowedPetTypes: "DOG",
      maxPetsPerPerson: 1,
      maxSinglePetWeightKg: null,
      maxSinglePetShoulderHeightCm: null,
      leashRequired: null,
      vaccinationProofRequired: null,
      extraFeeCents: null,
      reservationRequired: null,
    },
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function tool<T>(tools: ReturnType<typeof createAgentClientTools>, name: string): { execute: (input: unknown, context: unknown) => Promise<T> } {
  const found = tools.find((entry) => entry.name === name);
  if (!found?.execute) throw new Error(`missing tool ${name}`);
  return found as unknown as { execute: (input: unknown, context: unknown) => Promise<T> };
}

const context = {
  toolCallId: "call-1",
  threadId: "t",
  context: undefined,
  abortSignal: new AbortController().signal,
  emitCustomEvent: () => undefined,
};

describe("agent client tools", () => {
  beforeEach(() => {
    agentActions.resetForTests();
    agentActions.setTarget({ kind: "existing", tripId: 4 }, trip);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/api/pets")) return json([pet]);
        if (url.startsWith("/api/locations?")) {
          const parsed = new URL(url, "http://localhost");
          const page = Number(parsed.searchParams.get("page") ?? "1");
          const items =
            page === 1
              ? [location("a", "珠海渔女"), location("b", "珠海渔女"), location("c", "海滨公园")]
              : [];
          return json({
            page,
            pageSize: 100,
            totalElements: items.length,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
            items,
          });
        }
        if (url.startsWith("/api/locations/detail")) {
          return json(location("detail", "详情地点"));
        }
        if (url.startsWith("/api/locations/other-city")) {
          return json(location("other-city", "西湖", "330106"));
        }
        if (url.startsWith("/api/locations/")) {
          return json({ code: "LOCATION_NOT_FOUND" }, 404);
        }
        if (url.startsWith("/api/trips/4")) return json(trip);
        return json([]);
      }),
    );
  });

  it("matches locations locally and marks ambiguous names", async () => {
    const tools = createAgentClientTools(new QueryClient());
    const output = await tool<FindLocationsOutput>(tools, "find_locations").execute(
      { query: "珠海渔女" },
      context,
    );

    expect(output.status).toBe("ok");
    expect(output.ambiguous).toBe(true);
    expect(output.candidates?.map((candidate) => candidate.poiId)).toEqual(["a", "b"]);
    expect(output.targetTripId).toBe(4);
    expect(new Set(agentStore.state.allowedPoiIds)).toEqual(new Set(["a", "b"]));
  });

  it("reports cities without saved locations", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ page: 1, pageSize: 100, totalElements: 0, totalPages: 0, hasNext: false, hasPrevious: false, items: [] })));
    const tools = createAgentClientTools(new QueryClient());
    const output = await tool<FindLocationsOutput>(tools, "find_locations").execute({}, context);

    expect(output.noLocations).toBe(true);
    expect(output.candidates).toEqual([]);
  });

  it("rejects a location from another city in details", async () => {
    const tools = createAgentClientTools(new QueryClient());
    const output = await tool<GetLocationDetailOutput>(tools, "get_location_detail").execute(
      { poiId: "other-city" },
      context,
    );

    expect(output.status).toBe("not_found");
    expect(output.message).toContain("目标城市");
  });

  it("rejects a proposal that references a poiId outside location tool results", async () => {
    const tools = createAgentClientTools(new QueryClient());
    await tool<FindLocationsOutput>(tools, "find_locations").execute({ query: "渔女" }, context);

    const output = await tool<ProposeTripPlanOutput>(tools, "propose_trip_plan").execute(
      {
        target: { kind: "existing", tripId: 4 },
        plan: { version: 1, days: [{ day: 1, stops: [{ poiId: "zzz" }] }], unscheduled: [] },
        summary: "测试",
      },
      context,
    );

    expect(output.status).toBe("rejected");
    expect(agentStore.state.proposals).toEqual([]);
  });

  it("stores a valid proposal for the target trip", async () => {
    const tools = createAgentClientTools(new QueryClient());
    await tool<FindLocationsOutput>(tools, "find_locations").execute({ query: "渔女" }, context);

    const output = await tool<ProposeTripPlanOutput>(tools, "propose_trip_plan").execute(
      {
        target: { kind: "existing", tripId: 4 },
        plan: { version: 1, days: [{ day: 1, stops: [{ poiId: "a" }] }], unscheduled: [] },
        summary: "测试",
      },
      context,
    );

    expect(output.status).toBe("proposed");
    expect(agentStore.state.proposals).toHaveLength(1);
    expect(agentStore.state.proposals[0].baseUpdatedAt).toBe(trip.updatedAt);
  });

  it("includes deterministic pet policy in location results", async () => {
    const tools = createAgentClientTools(new QueryClient());
    const output = await tool<FindLocationsOutput>(tools, "find_locations").execute(
      { query: "海滨公园" },
      context,
    );

    expect(output.candidates?.[0]?.policy).toEqual({
      status: "friendly",
      reasons: [],
    });
  });

  it("asks for valid dates when creating a new trip", async () => {
    const tools = createAgentClientTools(new QueryClient());
    const output = await tool<{ status: string }>(tools, "prepare_new_trip").execute(
      { cityName: "珠海", startDate: "2026-12-01", endDate: "2026-12-09" },
      context,
    );

    expect(output.status).toBe("needs_input");
    expect(agentStore.state.newTripFlow).toBeNull();
  });

  it("refuses to create a new trip without pets", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("/api/pets")) return json([]);
        if (url.startsWith("/api/destinations")) {
          return json([
            {
              adcode: "440400",
              name: "珠海",
              province: "广东省",
              policyCovered: true,
              bannedBreeds: [],
              allowedPetTypes: "DOG",
              allowedDogBreedIds: [],
              maxSinglePetShoulderHeightCm: null,
            },
          ]);
        }
        return json([]);
      }),
    );
    const tools = createAgentClientTools(new QueryClient());
    const output = await tool<{ status: string }>(tools, "prepare_new_trip").execute(
      { cityName: "珠海", startDate: "2026-12-01", endDate: "2026-12-02" },
      context,
    );

    expect(output.status).toBe("no_pets");
    expect(agentStore.state.newTripFlow).toBeNull();
  });
});
