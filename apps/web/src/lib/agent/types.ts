import type { PolicyVerdict } from "@/lib/trip/policy-match";
import type { TransportMode } from "@/data/transport-rules";
import type { TripPlan } from "@/lib/trip/types";
import type { PetPersonality, PetPreference } from "@/queries/pets";

export interface AgentTripCity {
  adcode: string;
  name: string;
  province: string;
  featureTags: string[];
}

export interface AgentPetContext {
  id: number;
  name: string;
  petType: "CAT" | "DOG";
  weightKg: number;
  shoulderHeightCm: number;
  hasLeash: boolean;
  hasVaccinationProof: boolean;
  dogBreedName: string | null;
  preferences: PetPreference[];
  personality: PetPersonality | null;
}

export interface AgentContext {
  mode: "new" | "existing";
  targetTripId: number | null;
  city: AgentTripCity | null;
  totalDays: number | null;
  transportMode: TransportMode | null;
  pet: AgentPetContext | null;
  constraints: string[];
}

export interface AgentPlanStopView {
  poiId: string;
  name?: string;
  toNext?: string;
}

export interface AgentPlanView {
  days: Array<{ day: number; stops: AgentPlanStopView[] }>;
  unscheduled: AgentPlanStopView[];
}

export interface GetTripPlanOutput {
  status: "ok" | "no_active_trip";
  tripId?: number;
  name?: string;
  totalDays?: number;
  transportMode?: TransportMode | null;
  updatedAt?: string;
  revision?: string;
  plan?: AgentPlanView;
  message?: string;
}

export interface AgentLocationCandidate {
  poiId: string;
  name: string;
  typeGroup: string;
  address: string | null;
  keytag?: string | null;
  rating?: string | null;
  policy: PolicyVerdict | null;
}

export interface FindLocationsOutput {
  status: "ok" | "invalid_target";
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
  typeName?: string | null;
  regionName?: string | null;
  address?: string | null;
  rating?: string | null;
  keytag?: string | null;
  businessArea?: string | null;
  openingHours?: string | null;
  openTime?: string | null;
  tel?: string | null;
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

export interface UpdateTripPlanInput {
  targetTripId: number;
  baseRevision: string;
  operations: PlanEditOperation[];
  summary: string;
  warnings?: string[];
}

export type PlanEditOperation =
  | {
      op: "add_stop";
      poiId: string;
      day: number;
      position?: number;
      toNext?: "walk" | "drive" | "transit";
    }
  | { op: "remove_stop"; poiId: string; day?: number }
  | { op: "add_unscheduled"; poiId: string }
  | { op: "remove_unscheduled"; poiId: string };

export interface UpdateTripPlanOutput {
  status: "proposed" | "rejected";
  proposalId?: string;
  message?: string;
}

export type AgentProposalStatus = "pending" | "error";

export interface AgentProposal {
  id: string;
  tripId: number;
  plan: TripPlan;
  summary: string;
  warnings: string[];
  baseUpdatedAt: string;
  status: AgentProposalStatus;
  createdAt: string;
}
