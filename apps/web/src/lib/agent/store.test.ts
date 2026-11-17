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

  it("switching target invalidates proposals and allowed locations", () => {
    agentActions.setTarget({ kind: "existing", tripId: 4 });
    agentActions.addAllowedPoiIds(["a", "b"]);
    agentActions.addProposal(proposal);

    agentActions.setTarget({ kind: "new", city: null, startDate: null, endDate: null, petId: null });

    expect(agentStore.state.proposals).toEqual([]);
    expect(agentStore.state.allowedPoiIds).toEqual([]);
    expect(agentStore.state.target?.kind).toBe("new");
  });

  it("selecting a target does not activate a trip", () => {
    agentActions.setTarget({ kind: "existing", tripId: 4 });

    expect(agentStore.state.target).toEqual({ kind: "existing", tripId: 4 });
    expect(tripStore.state.active).toBeNull();
  });

  it("keeps only the latest pending proposal for a trip", () => {
    agentActions.addProposal(proposal);
    agentActions.addProposal({ ...proposal, id: "call-2" });

    expect(agentStore.state.proposals.map((entry) => entry.id)).toEqual(["call-2"]);
  });

  it("replaceActivePlan bumps revision while setPlan does not", () => {
    tripActions.setActive({
      id: 4,
      name: "珠海",
      cityAdcode: "440400",
      petId: 1,
      totalDays: 1,
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
