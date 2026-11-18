// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./clipboard";

const writeText = vi.fn<(text: string) => Promise<void>>();

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
}

beforeEach(() => {
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  setClipboard({ writeText });
});

afterEach(() => {
  setClipboard(undefined);
  vi.restoreAllMocks();
});

describe("copyText", () => {
  it("uses the async clipboard API when available", async () => {
    await expect(copyText("0756-1234567")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("0756-1234567");
  });

  it("falls back to execCommand when the clipboard API is absent", async () => {
    setClipboard(undefined);
    const execCommand = vi.fn(() => true);
    document.execCommand = execCommand;

    await expect(copyText("某某路1号")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("falls back to execCommand when the clipboard write rejects", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const execCommand = vi.fn(() => true);
    document.execCommand = execCommand;

    await expect(copyText("text")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("returns false when both mechanisms fail", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    document.execCommand = vi.fn(() => false);

    await expect(copyText("text")).resolves.toBe(false);
  });
});