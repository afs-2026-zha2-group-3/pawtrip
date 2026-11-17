import { createStore } from "@tanstack/store";
import type { DestinationCandidate } from "@/lib/destination-matching";
import type { Trip } from "@/lib/trip/types";
import type {
  AgentProposal,
  AgentProposalStatus,
  AgentTarget,
  PrepareNewTripOutput,
} from "./types";

export interface PendingNewTripFlow {
  city: DestinationCandidate;
  startDate: string;
  endDate: string;
  petId: number | null;
  stage: "confirm-deactivate" | "dialog";
  resolve: (result: PrepareNewTripOutput) => void;
}

export interface AgentState {
  open: boolean;
  target: AgentTarget | null;
  targetTrip: Trip | null;
  proposals: AgentProposal[];
  allowedPoiIds: string[];
  locationNames: Record<string, string>;
  newTripFlow: PendingNewTripFlow | null;
}

export const initialAgentState: AgentState = {
  open: false,
  target: null,
  targetTrip: null,
  proposals: [],
  allowedPoiIds: [],
  locationNames: {},
  newTripFlow: null,
};

export const agentStore = createStore<AgentState>(initialAgentState);

function update(updater: (state: AgentState) => AgentState): void {
  agentStore.setState(updater);
}

export const agentActions = {
  setOpen(open: boolean): void {
    update((state) => ({ ...state, open }));
  },
  toggleOpen(): void {
    update((state) => ({ ...state, open: !state.open }));
  },
  setTarget(target: AgentTarget | null, targetTrip: Trip | null = null): void {
    update((state) => ({
      ...state,
      target,
      targetTrip,
      proposals: [],
      allowedPoiIds: [],
    }));
  },
  setTargetTrip(targetTrip: Trip | null): void {
    update((state) => ({ ...state, targetTrip }));
  },
  addAllowedPoiIds(poiIds: readonly string[]): void {
    if (poiIds.length === 0) return;
    update((state) => ({
      ...state,
      allowedPoiIds: [...new Set([...state.allowedPoiIds, ...poiIds])],
    }));
  },
  resetAllowedPoiIds(): void {
    update((state) => (state.allowedPoiIds.length === 0 ? state : { ...state, allowedPoiIds: [] }));
  },
  rememberLocations(names: Record<string, string>): void {
    update((state) => ({
      ...state,
      locationNames: { ...state.locationNames, ...names },
    }));
  },
  addProposal(proposal: AgentProposal): void {
    update((state) => ({
      ...state,
      proposals: [
        ...state.proposals.filter(
          (entry) =>
            entry.id !== proposal.id &&
            !(entry.status === "pending" && entry.tripId === proposal.tripId),
        ),
        proposal,
      ],
    }));
  },
  setProposalStatus(id: string, status: AgentProposalStatus, message?: string): void {
    update((state) => ({
      ...state,
      proposals: state.proposals.map((proposal) =>
        proposal.id === id ? { ...proposal, status, message } : proposal,
      ),
    }));
  },
  setNewTripFlow(flow: PendingNewTripFlow | null): void {
    update((state) => ({ ...state, newTripFlow: flow }));
  },
  setNewTripStage(stage: PendingNewTripFlow["stage"]): void {
    update((state) =>
      state.newTripFlow
        ? { ...state, newTripFlow: { ...state.newTripFlow, stage } }
        : state,
    );
  },
  reset(): void {
    agentStore.setState(() => ({ ...initialAgentState }));
  },
  resetForTests(): void {
    agentStore.setState(() => ({ ...initialAgentState }));
  },
};
