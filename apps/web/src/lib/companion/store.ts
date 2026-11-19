import { createStore } from "@tanstack/store";

export type CompanionMood = "ok" | "info" | "warn" | "danger";

export type CompanionBubbleKind = "hint" | "event";

export interface CompanionBubble {
  id: number;
  text: string;
  mood: CompanionMood;
  kind: CompanionBubbleKind;
  createdAt: number;
}

export interface CompanionHint {
  text: string;
  path: string;
}

export interface CompanionState {
  hint: CompanionHint | null;
  bubble: CompanionBubble | null;
  nextId: number;
}

export const initialCompanionState: CompanionState = {
  hint: null,
  bubble: null,
  nextId: 1,
};

export const companionStore = createStore<CompanionState>(initialCompanionState);

function update(updater: (state: CompanionState) => CompanionState): void {
  companionStore.setState(updater);
}

function withBubble(
  state: CompanionState,
  text: string,
  mood: CompanionMood,
  kind: CompanionBubbleKind,
): CompanionState {
  return {
    ...state,
    bubble: {
      id: state.nextId,
      text,
      mood,
      kind,
      createdAt: Date.now(),
    },
    nextId: state.nextId + 1,
  };
}

export const companionActions = {
  setHint(text: string, path: string): void {
    update((state) =>
      state.hint?.text === text && state.hint.path === path
        ? state
        : { ...state, hint: { text, path } },
    );
  },
  clearHint(path: string): void {
    update((state) => (state.hint?.path === path ? { ...state, hint: null } : state));
  },
  showHint(): void {
    update((state) =>
      state.hint ? withBubble(state, state.hint.text, "info", "hint") : state,
    );
  },
  say(text: string, mood: CompanionMood = "info"): void {
    update((state) => withBubble(state, text, mood, "event"));
  },
  dismiss(id?: number): void {
    update((state) =>
      state.bubble && (id === undefined || state.bubble.id === id)
        ? { ...state, bubble: null }
        : state,
    );
  },
  resetForTests(): void {
    companionStore.setState(() => ({ ...initialCompanionState }));
  },
};
