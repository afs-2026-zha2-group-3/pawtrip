import type { PolicyVerdict } from "@/lib/trip/policy-match";
import type { TransportMode } from "@/data/transport-rules";
import type { TripPlan } from "@/lib/trip/types";

export interface AgentTripCity {
  adcode: string;
  name: string;
  province: string;
}

export type AgentTarget =
  | {
      kind: "new";
      city: AgentTripCity | null;
      startDate: string | null;
      endDate: string | null;
      petId: number | null;
    }
  | {
      kind: "existing";
      tripId: number;
    };

export interface AgentPetContext {
  id: number;
  name: string;
  petType: "CAT" | "DOG";
  weightKg: number;
  shoulderHeightCm: number;
  hasLeash: boolean;
  hasVaccinationProof: boolean;
  dogBreedName: string | null;
}

export interface AgentContext {
  mode: "new" | "existing";
  targetTripId: number | null;
  activeTripId: number | null;
  city: AgentTripCity | null;
  totalDays: number | null;
  transportMode: TransportMode | null;
  pet: AgentPetContext | null;
  startDate: string | null;
  endDate: string | null;
  constraints: string[];
}

export interface AgentLocationCandidate {
  poiId: string;
  name: string;
  typeGroup: string;
  address: string | null;
  policy: PolicyVerdict | null;
}

export interface FindLocationsOutput {
  status: "ok" | "no_target" | "invalid_target";
  regionCode?: string;
  targetTripId?: number;
  candidates?: AgentLocationCandidate[];
  ambiguous?: boolean;
  truncated?: boolean;
  noLocations?: boolean;
  totalMatched?: number;
  message?: string;
}

export interface GetLocationDetailOutput {
  status: "ok" | "not_found";
  poiId: string;
  name?: string;
  typeGroup?: string;
  address?: string | null;
  policy?: PolicyVerdict | null;
  message?: string;
}

export interface PrepareNewTripInput {
  cityName: string;
  startDate: string;
  endDate: string;
  petName?: string;
}

export interface PrepareNewTripOutput {
  status:
    | "created"
    | "cancelled"
    | "needs_input"
    | "no_pets"
    | "save_failed"
    | "failed";
  tripId?: number;
  city?: AgentTripCity;
  totalDays?: number;
  petId?: number;
  message?: string;
}

export interface ProposeTripPlanInput {
  target: { kind: "existing"; tripId: number };
  plan: TripPlan;
  summary: string;
  warnings?: string[];
}

export interface ProposeTripPlanOutput {
  status: "proposed" | "rejected";
  proposalId?: string;
  message?: string;
}

export type AgentProposalStatus = "pending" | "applied" | "rejected" | "error";

export interface AgentProposal {
  id: string;
  tripId: number;
  plan: TripPlan;
  summary: string;
  warnings: string[];
  baseUpdatedAt: string;
  status: AgentProposalStatus;
  message?: string;
  createdAt: string;
}
