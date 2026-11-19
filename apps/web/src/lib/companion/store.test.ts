import { beforeEach, describe, expect, it, vi } from "vitest";
import { companionActions, companionStore, initialCompanionState } from "./store";

describe("companion store", () => {
  beforeEach(() => {
    companionActions.resetForTests();
  });

  it("say creates an event bubble with the requested mood", () => {
    companionActions.say("保存成功", "ok");

    expect(companionStore.state.bubble).toMatchObject({
      id: 1,
      text: "保存成功",
      mood: "ok",
      kind: "event",
    });
    expect(typeof companionStore.state.bubble?.createdAt).toBe("number");
  });

  it("replaces the previous bubble and increments the id", () => {
    companionActions.say("第一条", "info");
    companionActions.say("第二条", "danger");

    expect(companionStore.state.bubble?.id).toBe(2);
    expect(companionStore.state.bubble?.text).toBe("第二条");
    expect(companionStore.state.nextId).toBe(3);
  });

  it("dismisses by default and keeps a newer bubble when the id differs", () => {
    companionActions.say("旧气泡", "info");
    companionActions.dismiss(99);
    expect(companionStore.state.bubble?.text).toBe("旧气泡");

    companionActions.say("新气泡", "warn");
    companionActions.dismiss(1);
    expect(companionStore.state.bubble?.text).toBe("新气泡");

    companionActions.dismiss();
    expect(companionStore.state.bubble).toBeNull();
  });

  it("showHint is a no-op without a hint and uses info mood with one", () => {
    companionActions.showHint();
    expect(companionStore.state.bubble).toBeNull();

    companionActions.setHint("点城市看政策", "/cities");
    companionActions.showHint();

    expect(companionStore.state.bubble).toMatchObject({
      text: "点城市看政策",
      mood: "info",
      kind: "hint",
    });
  });

  it("setHint ignores the same text and path", () => {
    companionActions.setHint("点城市看政策", "/cities");
    const first = companionStore.state.hint;

    companionActions.setHint("点城市看政策", "/cities");
    expect(companionStore.state.hint).toBe(first);

    companionActions.setHint("换个说法", "/cities");
    expect(companionStore.state.hint?.text).toBe("换个说法");
  });

  it("clearHint only clears the matching path", () => {
    companionActions.setHint("旧页面", "/paws");
    companionActions.clearHint("/cities");
    expect(companionStore.state.hint?.text).toBe("旧页面");

    companionActions.clearHint("/paws");
    expect(companionStore.state.hint).toBeNull();
  });

  it("resetForTests restores the initial state", () => {
    companionActions.setHint("提示", "/");
    companionActions.say("事件", "ok");
    companionActions.resetForTests();

    expect(companionStore.state).toEqual(initialCompanionState);
  });

  it("never reads or writes browser storage", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const getItem = vi.spyOn(Storage.prototype, "getItem");

    companionActions.setHint("提示", "/");
    companionActions.showHint();
    companionActions.say("事件", "ok");
    companionActions.dismiss();

    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
  });
});
