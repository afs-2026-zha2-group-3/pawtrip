import { createStore } from "@tanstack/store";
import type { TransportMode } from "@/data/transport-rules";
import type { LocationBrowseDetail } from "@/queries/locations";
import type { Pet } from "@/queries/pets";
import {
  removeLegacyKeys,
  removePersistedActiveTripId,
  persistActiveTripId,
} from "./persistence";
import {
  createEmptyPlan,
  stoppablePoiIds,
  type StopContainer,
  type StopRef,
} from "./plan";
import type {
  DraftTrip,
  HydrationStatus,
  SaveStatus,
  ToNextEstimate,
  Trip,
  TripCache,
  TripCity,
  TripPlan,
  TripState,
  TripStop,
} from "./types";

const initialCache: TripCache = { city: null, pets: {}, locations: {} };

export const initialTripState: TripState = {
  draft: null,
  active: null,
  cache: initialCache,
  panel: { expanded: false },
  save: { status: "idle" },
  hydration: "idle",
  saveRevision: 0,
};

export const tripStore = createStore<TripState>(initialTripState);

function update(updater: (state: TripState) => TripState): void {
  tripStore.setState(updater);
}

function bumpRevision(state: TripState): Pick<TripState, "saveRevision"> {
  return { saveRevision: state.saveRevision + 1 };
}

function withDay(plan: TripPlan, day: number): TripPlan["days"] {
  if (plan.days.some((entry) => entry.day === day)) {
    return plan.days;
  }
  return [...plan.days, { day, stops: [] }].sort((a, b) => a.day - b.day);
}

export const tripActions = {
  startDraft(cityAdcode: string, totalDays: number | null = 1, petId: number | null = null): void {
    update((state) => ({
      ...state,
      draft: { cityAdcode, totalDays, petId },
      panel: { expanded: true },
    }));
  },
  updateDraft(patch: Partial<DraftTrip>): void {
    update((state) =>
      state.draft ? { ...state, draft: { ...state.draft, ...patch } } : state,
    );
  },
  discardDraft(): void {
    update((state) => ({ ...state, draft: null }));
  },
  setActive(trip: Trip): void {
    persistActiveTripId(trip.id);
    update((state) => ({ ...state, active: trip, hydration: "ready" }));
  },
  clearActive(): void {
    removePersistedActiveTripId();
    update((state) => ({
      ...state,
      active: null,
      panel: { expanded: false },
      hydration: state.hydration === "missing" ? "missing" : "ready",
    }));
  },
  clearTripContext(): void {
    removePersistedActiveTripId();
    removeLegacyKeys();
    tripStore.setState(() => ({ ...initialTripState, cache: { ...initialCache } }));
  },
  addStop(container: StopContainer, poiId: string): void {
    update((state) => {
      if (!state.active) return state;
      const plan = state.active.plan;
      if (container === "unscheduled") {
        if (stoppablePoiIds(plan).has(poiId)) return state;
        if (plan.unscheduled.some((stop) => stop.poiId === poiId)) return state;
        return {
          ...state,
          active: {
            ...state.active,
            plan: { ...plan, unscheduled: [...plan.unscheduled, { poiId }] },
          },
          ...bumpRevision(state),
        };
      }
      const days = withDay(plan, container).map((entry) =>
        entry.day === container
          ? { ...entry, stops: [...entry.stops, { poiId }] }
          : entry,
      );
      return {
        ...state,
        active: {
          ...state.active,
          plan: {
            version: 1,
            days,
            unscheduled: plan.unscheduled.filter((stop) => stop.poiId !== poiId),
          },
        },
        ...bumpRevision(state),
      };
    });
  },
  moveStop(from: StopRef, to: StopRef): void {
    update((state) => {
      if (!state.active) return state;
      const plan = state.active.plan;
      const stop = takeStop(plan, from);
      if (!stop) return state;
      let targetIndex = to.index;
      if (from.container === to.container && from.index < to.index) {
        targetIndex -= 1;
      }
      const next = insertStop(stop.plan, to.container, stop.stop, targetIndex);
      return {
        ...state,
        active: { ...state.active, plan: next },
        ...bumpRevision(state),
      };
    });
  },
  removeStop(ref: StopRef): void {
    update((state) => {
      if (!state.active) return state;
      const removed = takeStop(state.active.plan, ref);
      if (!removed) return state;
      return {
        ...state,
        active: { ...state.active, plan: removed.plan },
        ...bumpRevision(state),
      };
    });
  },
  setTransportMode(transportMode: TransportMode): void {
    update((state) => {
      if (!state.active || state.active.transportMode === transportMode) return state;
      return {
        ...state,
        active: { ...state.active, transportMode },
        ...bumpRevision(state),
      };
    });
  },
  setStopTransport(
    ref: StopRef,
    toNext: "walk" | "drive" | "self_drive",
    estimate: ToNextEstimate | null,
  ): void {
    update((state) => {
      if (!state.active) return state;
      const plan = state.active.plan;
      const stop = scheduledStop(plan, ref);
      if (!stop) return state;
      return {
        ...state,
        active: {
          ...state.active,
          plan: replaceStop(plan, ref, { ...stop, toNext, toNextEstimate: estimate }),
        },
        ...bumpRevision(state),
      };
    });
  },
  backfillStopEstimate(ref: StopRef, estimate: ToNextEstimate): void {
    update((state) => {
      if (!state.active) return state;
      const plan = state.active.plan;
      const stop = scheduledStop(plan, ref);
      if (!stop || !stop.toNext || stop.toNextEstimate) return state;
      return {
        ...state,
        active: {
          ...state.active,
          plan: replaceStop(plan, ref, { ...stop, toNextEstimate: estimate }),
        },
        ...bumpRevision(state),
      };
    });
  },
  setPlan(plan: TripPlan): void {
    update((state) =>
      state.active
        ? { ...state, active: { ...state.active, plan } }
        : state,
    );
  },
  setStartDate(startDate: string | null): void {
    update((state) =>
      state.active && state.active.startDate !== startDate
        ? {
            ...state,
            active: { ...state.active, startDate },
            ...bumpRevision(state),
          }
        : state,
    );
  },
  setPanelExpanded(expanded: boolean): void {
    update((state) => ({ ...state, panel: { expanded } }));
  },
  setSaveStatus(status: SaveStatus, message?: string): void {
    update((state) => ({
      ...state,
      save: {
        status,
        message,
        ...(status === "saved" ? { lastSavedAt: new Date().toISOString() } : {}),
      },
    }));
  },
  setHydration(hydration: HydrationStatus): void {
    update((state) => ({ ...state, hydration }));
  },
  cacheCity(city: TripCity | null): void {
    update((state) => ({ ...state, cache: { ...state.cache, city } }));
  },
  cachePets(pets: Pet[]): void {
    const record: Record<number, Pet> = {};
    for (const pet of pets) {
      record[pet.id] = pet;
    }
    update((state) => ({ ...state, cache: { ...state.cache, pets: record } }));
  },
  cacheLocation(location: LocationBrowseDetail): void {
    update((state) => ({
      ...state,
      cache: {
        ...state.cache,
        locations: { ...state.cache.locations, [location.poiId]: location },
      },
    }));
  },
  resetForTests(): void {
    tripStore.setState(() => ({ ...initialTripState, cache: { ...initialCache } }));
  },
};

function scheduledStop(plan: TripPlan, ref: StopRef): TripStop | null {
  if (ref.container === "unscheduled") return null;
  const day = plan.days.find((entry) => entry.day === ref.container);
  return day?.stops[ref.index] ?? null;
}

function replaceStop(plan: TripPlan, ref: StopRef, stop: TripStop): TripPlan {
  return {
    ...plan,
    days: plan.days.map((entry) =>
      entry.day === ref.container
        ? {
            ...entry,
            stops: entry.stops.map((existing, index) => (index === ref.index ? stop : existing)),
          }
        : entry,
    ),
  };
}

function takeStop(plan: TripPlan, ref: StopRef): { plan: TripPlan; stop: TripStop } | null {
  if (ref.container === "unscheduled") {
    const stop = plan.unscheduled[ref.index];
    if (!stop) return null;
    return {
      plan: {
        ...plan,
        unscheduled: plan.unscheduled.filter((_, index) => index !== ref.index),
      },
      stop: { poiId: stop.poiId },
    };
  }
  const day = plan.days.find((entry) => entry.day === ref.container);
  const stop = day?.stops[ref.index];
  if (!day || !stop) return null;
  return {
    plan: {
      ...plan,
      days: plan.days.map((entry) =>
        entry.day === ref.container
          ? { ...entry, stops: entry.stops.filter((_, index) => index !== ref.index) }
          : entry,
      ),
    },
    stop: { poiId: stop.poiId, toNext: stop.toNext, toNextEstimate: stop.toNextEstimate },
  };
}

function insertStop(
  plan: TripPlan,
  container: StopContainer,
  stop: TripStop,
  index: number,
): TripPlan {
  const poiId = stop.poiId;
  if (container === "unscheduled") {
    if (stoppablePoiIds(plan).has(poiId)) {
      return plan;
    }
    const unscheduled = [...plan.unscheduled];
    const clamped = Math.max(0, Math.min(index, unscheduled.length));
    unscheduled.splice(clamped, 0, { poiId });
    const seen = new Set<string>();
    return {
      ...plan,
      unscheduled: unscheduled.filter((stop) => {
        if (seen.has(stop.poiId)) return false;
        seen.add(stop.poiId);
        return true;
      }),
    };
  }
  const days = withDay(plan, container).map((entry) => {
    if (entry.day !== container) return entry;
    const stops = [...entry.stops];
    const clamped = Math.max(0, Math.min(index, stops.length));
    const inserted: TripStop = { poiId };
    if (stop.toNext !== undefined) inserted.toNext = stop.toNext;
    if (stop.toNextEstimate !== undefined) inserted.toNextEstimate = stop.toNextEstimate;
    stops.splice(clamped, 0, inserted);
    return { ...entry, stops };
  });
  return {
    ...plan,
    days,
    unscheduled: plan.unscheduled.filter((stop) => stop.poiId !== poiId),
  };
}

export { createEmptyPlan };
