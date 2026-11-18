// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarRange } from "./calendar-range";

function dayButton(label: string): HTMLButtonElement {
  return screen.getByRole("button", { name: label }) as HTMLButtonElement;
}

describe("CalendarRange", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(2026, 10, 18, 10, 0, 0) });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("disables dates before today and keeps today selectable", () => {
    const onSelect = vi.fn();
    render(<CalendarRange startDate="" endDate="" onSelect={onSelect} />);

    const yesterday = dayButton("2026年11月17日");
    expect(yesterday.disabled).toBe(true);
    fireEvent.click(yesterday);
    expect(onSelect).not.toHaveBeenCalled();

    const today = dayButton("2026年11月18日");
    expect(today.disabled).toBe(false);
  });

  it("selects a start date and a later end date", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <CalendarRange startDate="" endDate="" onSelect={onSelect} />,
    );

    fireEvent.click(dayButton("2026年11月18日"));
    expect(onSelect).toHaveBeenLastCalledWith("2026-11-18", "");

    rerender(
      <CalendarRange startDate="2026-11-18" endDate="" onSelect={onSelect} />,
    );
    fireEvent.click(dayButton("2026年11月20日"));
    expect(onSelect).toHaveBeenLastCalledWith("2026-11-18", "2026-11-20");
  });
});
