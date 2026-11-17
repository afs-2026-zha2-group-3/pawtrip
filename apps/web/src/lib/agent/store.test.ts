import { beforeEach, describe, expect, it } from "vitest";
import { agentActions, agentStore } from "./store";
import { tripActions, tripStore } from "@/lib/trip/store";
import type { AgentProposal } from "./types";

const proposal: AgentProposal = {
  id: "call-1",
  tripId: 4,
  plan: { version: 1, days: [{ day: 1, stops: [{ poiId: "a" }] }], unscheduled: [] },
  summary: "方案",
  warnings: [],
  baseUpdatedAt: "2026-01-01T00:00:00Z",
  status: "pending",
  createdAt: "2026-01-01T00:00:00Z",
};

describe("agent workspace store", () => {
  beforeEach(() => {
    agentActions.resetForTests();
    tripActions.resetForTests();
  });

  it("keeps allowed locations scoped to the trip that queried them", () => {
    agentActions.addAllowedPoiIds(4, ["a", "b"]);
    expect(agentStore.state.allowedPoi).toEqual({ tripId: 4, poiIds: ["a", "b"] });

    agentActions.addAllowedPoiIds(9, ["c"]);
    expect(agentStore.state.allowedPoi).toEqual({ tripId: 9, poiIds: ["c"] });

    agentActions.resetAllowedPoiIds();
    expect(agentStore.state.allowedPoi).toBeNull();
  });

  it("does not activate a trip when recording allowed locations", () => {
    agentActions.addAllowedPoiIds(4, ["a"]);

    expect(tripStore.state.active).toBeNull();
  });

  it("keeps only the latest pending proposal for a trip", () => {
    agentActions.addProposal(proposal);
    agentActions.addProposal({ ...proposal, id: "call-2" });

    expect(agentStore.state.proposals.map((entry) => entry.id)).toEqual(["call-2"]);
  });

  it("clears an applied proposal from the workspace", () => {
    agentActions.addProposal(proposal);
    agentActions.clearProposals();

    expect(agentStore.state.proposals).toEqual([]);
  });

  it("clears stale proposals when the active trip changes", () => {
    tripActions.setActive({
      id: 4,
      name: "珠海",
      cityAdcode: "440400",
      petId: 1,
      totalDays: 1,
      startDate: null,
      transportMode: null,
      plan: { version: 1, days: [{ day: 1, stops: [] }], unscheduled: [] },
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    agentActions.addProposal(proposal);
    agentActions.addAllowedPoiIds(4, ["a"]);

    agentActions.clearProposals();
    agentActions.resetAllowedPoiIds();

    expect(agentStore.state.proposals).toEqual([]);
    expect(agentStore.state.allowedPoi).toBeNull();
  });

  it("replaceActivePlan bumps revision while setPlan does not", () => {
    tripActions.setActive({
      id: 4,
      name: "珠海",
      cityAdcode: "440400",
      petId: 1,
      totalDays: 1,
      startDate: null,
      transportMode: null,
      plan: { version: 1, days: [{ day: 1, stops: [] }], unscheduled: [] },
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    const before = tripStore.state.saveRevision;
    const plan = { version: 1 as const, days: [{ day: 1, stops: [{ poiId: "a" }] }], unscheduled: [] };

    tripActions.setPlan(plan);
    expect(tripStore.state.saveRevision).toBe(before);

    tripActions.replaceActivePlan(plan);
    expect(tripStore.state.saveRevision).toBe(before + 1);
    expect(tripStore.state.active?.plan).toEqual(plan);
  });
});
