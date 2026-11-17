import { createStore } from "@tanstack/store";
import type { DestinationCandidate } from "@/lib/destination-matching";
import type {
  AgentProposal,
  AgentProposalStatus,
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
  proposals: AgentProposal[];
  allowedPoi: { tripId: number; poiIds: string[] } | null;
  locationNames: Record<string, string>;
  newTripFlow: PendingNewTripFlow | null;
}

export const initialAgentState: AgentState = {
  open: false,
  proposals: [],
  allowedPoi: null,
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
  addAllowedPoiIds(tripId: number, poiIds: readonly string[]): void {
    if (poiIds.length === 0) return;
    update((state) => {
      const existing = state.allowedPoi?.tripId === tripId ? state.allowedPoi.poiIds : [];
      return {
        ...state,
        allowedPoi: { tripId, poiIds: [...new Set([...existing, ...poiIds])] },
      };
    });
  },
  resetAllowedPoiIds(): void {
    update((state) => (state.allowedPoi === null ? state : { ...state, allowedPoi: null }));
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
  setProposalStatus(id: string, status: AgentProposalStatus): void {
    update((state) => ({
      ...state,
      proposals: state.proposals.map((proposal) =>
        proposal.id === id ? { ...proposal, status } : proposal,
      ),
    }));
  },
  clearProposals(): void {
    update((state) => (state.proposals.length === 0 ? state : { ...state, proposals: [] }));
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
