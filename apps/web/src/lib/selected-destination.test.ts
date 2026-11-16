import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SELECTED_DESTINATION_KEY,
  createSelectedDestinationStore,
  type StorageLike,
} from "./selected-destination";

function fakeStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

describe("selected destination store", () => {
  let storage: ReturnType<typeof fakeStorage>;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it("returns null when nothing is persisted", () => {
    const store = createSelectedDestinationStore(storage);
    expect(store.get()).toBeNull();
  });

  it("persists selection under the agreed key and reads it back", () => {
    const store = createSelectedDestinationStore(storage);
    store.select({ adcode: "330100", cityName: "杭州市", province: "浙江省" });

    const raw = storage.map.get(SELECTED_DESTINATION_KEY);
    expect(raw).toBeDefined();
    const persisted = JSON.parse(raw!);
    expect(persisted.adcode).toBe("330100");
    expect(persisted.cityName).toBe("杭州市");
    expect(persisted.province).toBe("浙江省");
    expect(typeof persisted.selectedAt).toBe("string");

    const reopened = createSelectedDestinationStore(storage);
    expect(reopened.get()).toEqual(persisted);
  });

  it("overwrites the previous selection on reselect", () => {
    const store = createSelectedDestinationStore(storage);
    store.select({ adcode: "330100", cityName: "杭州市", province: "浙江省" });
    store.select({ adcode: "440400", cityName: "珠海市", province: "广东省" });

    expect(store.get()?.adcode).toBe("440400");
    expect(store.get()?.cityName).toBe("珠海市");
    expect(JSON.parse(storage.map.get(SELECTED_DESTINATION_KEY)!).adcode).toBe("440400");
  });

  it("clears persisted selection", () => {
    const store = createSelectedDestinationStore(storage);
    store.select({ adcode: "330100", cityName: "杭州市", province: "浙江省" });
    store.clear();

    expect(store.get()).toBeNull();
    expect(storage.map.has(SELECTED_DESTINATION_KEY)).toBe(false);
  });

  it("notifies subscribers on select and clear, and stops after unsubscribe", () => {
    const store = createSelectedDestinationStore(storage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.select({ adcode: "330100", cityName: "杭州市", province: "浙江省" });
    expect(listener).toHaveBeenCalledTimes(1);
    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.select({ adcode: "440400", cityName: "珠海市", province: "广东省" });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("keeps a referentially stable snapshot between mutations", () => {
    const store = createSelectedDestinationStore(storage);
    store.select({ adcode: "330100", cityName: "杭州市", province: "浙江省" });
    expect(store.get()).toBe(store.get());
  });

  it("treats corrupted persisted JSON as unselected", () => {
    storage.map.set(SELECTED_DESTINATION_KEY, "{not-json");
    const store = createSelectedDestinationStore(storage);
    expect(store.get()).toBeNull();
  });
});