import { useSelector } from "@tanstack/react-store";
import { agentStore } from "./store";
import type { AgentProposal } from "./types";

export function useAgentOpen(): boolean {
  return useSelector(agentStore, (state) => state.open);
}

export function useAgentProposals(): AgentProposal[] {
  return useSelector(agentStore, (state) => state.proposals);
}

export function usePendingProposal(): AgentProposal | null {
  return useSelector(
    agentStore,
    (state) => state.proposals.find((proposal) => proposal.status === "pending") ?? null,
  );
}

export function useAgentNewTripFlow() {
  return useSelector(agentStore, (state) => state.newTripFlow);
}

export function useAgentLocationNames(): Record<string, string> {
  return useSelector(agentStore, (state) => state.locationNames);
}
