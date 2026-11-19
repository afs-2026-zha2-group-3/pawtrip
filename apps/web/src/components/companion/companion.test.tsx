// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CompanionBubble } from "./companion";
import { useCompanionHint } from "@/lib/companion/use-companion-hint";
import { companionActions, companionStore } from "@/lib/companion/store";

function HintPage({ hint, path }: { hint: string | null; path: string }) {
  useCompanionHint(hint, path);
  return null;
}

function Harness({
  pathname,
  hint,
  name = "豆豆",
}: {
  pathname: string;
  hint: string | null;
  name?: string;
}) {
  return (
    <>
      <HintPage key={pathname} hint={hint} path={pathname} />
      <CompanionBubble pathname={pathname} name={name} />
    </>
  );
}

function switchTo(rerender: () => void) {
  act(() => {
    rerender();
  });
}

describe("CompanionBubble", () => {
  beforeEach(() => {
    companionActions.resetForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not auto-show on the first mount", () => {
    companionActions.setHint("初始提示", "/");

    render(<Harness pathname="/" hint="初始提示" />);

    expect(screen.queryByTestId("companion-bubble")).toBeNull();
  });

  it("auto-shows once after the pathname changes", async () => {
    const view = render(<Harness pathname="/" hint={null} />);
    switchTo(() =>
      view.rerender(<Harness pathname="/paws" hint="宠物页提示" />),
    );

    expect(await screen.findByText("宠物页提示")).toBeTruthy();
    expect(screen.getByText("豆豆 · 伙伴提示")).toBeTruthy();
  });

  it("does not show the same page hint twice on rerender", async () => {
    const view = render(<Harness pathname="/" hint={null} />);
    switchTo(() =>
      view.rerender(<Harness pathname="/paws" hint="宠物页提示" />),
    );
    await screen.findByText("宠物页提示");
    const shown = companionStore.state.bubble;

    view.rerender(<Harness pathname="/paws" hint="宠物页提示" />);
    expect(companionStore.state.bubble).toBe(shown);
  });

  it("ignores an outgoing page that re-renders under the next pathname", () => {
    const view = render(
      <>
        <HintPage hint="宠物页提示" path="/paws" />
        <CompanionBubble pathname="/paws" name="豆豆" />
      </>,
    );

    view.rerender(
      <>
        <HintPage hint="宠物页提示" path="/paws" />
        <CompanionBubble pathname="/cities" name="豆豆" />
      </>,
    );

    expect(companionStore.state.hint?.path).toBe("/paws");
    expect(screen.queryByTestId("companion-bubble")).toBeNull();
  });

  it("dismisses the bubble after 5000ms", () => {
    vi.useFakeTimers();
    companionActions.say("五秒提示", "ok");

    render(<Harness pathname="/" hint={null} />);
    expect(screen.getByTestId("companion-bubble")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByTestId("companion-bubble")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId("companion-bubble")).toBeNull();
  });

  it("replaces an existing bubble with a new event and restarts the timer", () => {
    vi.useFakeTimers();
    companionActions.setHint("页面提示", "/");
    companionActions.showHint();

    render(<Harness pathname="/" hint={null} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => {
      companionActions.say("导出成功", "ok");
    });

    expect(screen.queryByText("页面提示")).toBeNull();
    expect(screen.getByText("导出成功")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByTestId("companion-bubble")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId("companion-bubble")).toBeNull();
  });

  it("keeps an unexpired cross-page event ahead of the page hint", async () => {
    companionActions.say("行程创建成功", "ok");
    const view = render(<Harness pathname="/" hint={null} />);

    switchTo(() =>
      view.rerender(<Harness pathname="/paws" hint="宠物页提示" />),
    );
    expect(await screen.findByText("行程创建成功")).toBeTruthy();
    expect(screen.queryByText("宠物页提示")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "关闭伙伴提示" }));

    expect(await screen.findByText("宠物页提示")).toBeTruthy();
  });

  it("uses the first pet name and falls back to 豆包", () => {
    companionActions.say("提示", "info");
    const view = render(<Harness pathname="/" hint={null} name="豆豆" />);
    expect(screen.getByText("豆豆 · 伙伴提示")).toBeTruthy();

    view.rerender(<Harness pathname="/" hint={null} name="豆包" />);
    expect(screen.getByText("豆包 · 伙伴提示")).toBeTruthy();
  });

  it("closes the bubble from its close button", () => {
    companionActions.say("提示", "info");
    render(<Harness pathname="/" hint={null} />);

    fireEvent.click(screen.getByRole("button", { name: "关闭伙伴提示" }));

    expect(screen.queryByTestId("companion-bubble")).toBeNull();
  });

  it("does not render a bubble on admin pages", () => {
    companionActions.say("不应展示", "danger");

    render(<Harness pathname="/admin/locations" hint={null} />);

    expect(screen.queryByTestId("companion-bubble")).toBeNull();
  });

  it("is a non-modal status region without an AI action", () => {
    companionActions.say("提示", "ok");
    render(<Harness pathname="/" hint={null} />);

    const bubble = screen.getByTestId("companion-bubble");
    expect(bubble.getAttribute("role")).toBe("status");
    expect(bubble.getAttribute("aria-live")).toBe("polite");
    expect(bubble.getAttribute("data-mood")).toBe("ok");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("button", { name: "AI 规划" })).toBeNull();
  });

  it("narrows the bubble and anchors it above the entry", () => {
    companionActions.say("提示", "warn");
    render(<Harness pathname="/" hint={null} />);

    const className = screen.getByTestId("companion-bubble").className;
    expect(className).toContain("w-[min(20rem,calc(100vw-2rem))]");
    expect(className).toContain("bottom-full");
    expect(className).toContain("border-amber-400");
  });

  it("does not steal focus or block underlying controls", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    companionActions.say("提示", "info");

    render(
      <div>
        <button type="button" onClick={onClick}>
          底层按钮
        </button>
        <Harness pathname="/" hint={null} />
      </div>,
    );

    const bubble = screen.getByTestId("companion-bubble");
    expect(bubble.contains(document.activeElement)).toBe(false);

    await user.click(screen.getByRole("button", { name: "底层按钮" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(bubble.contains(document.activeElement)).toBe(false);
  });

  it("does not show a bubble when the hint is not ready", async () => {
    const view = render(<Harness pathname="/" hint={null} />);
    switchTo(() =>
      view.rerender(<Harness pathname="/paws" hint={null} />),
    );
    await act(async () => {});

    expect(screen.queryByTestId("companion-bubble")).toBeNull();
  });
});
