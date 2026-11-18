// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PackingChecklistDialog } from "./packing-checklist-dialog";
import type {
  PackingChecklist,
  PackingItem,
} from "@/queries/packing-checklist";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function item(overrides: Partial<PackingItem> & { id: number }): PackingItem {
  return {
    category: "TRAVEL",
    name: "物品",
    quantity: 1,
    checked: false,
    source: "TEMPLATE",
    templateKey: null,
    ...overrides,
  };
}

function checklist(items: PackingItem[]): PackingChecklist {
  return {
    tripId: 7,
    transportMode: "high_speed_rail",
    totalDays: 2,
    createdAt: "2026-11-18T00:00:00Z",
    updatedAt: "2026-11-18T00:00:00Z",
    progress: {
      checked: items.filter((candidate) => candidate.checked).length,
      total: items.length,
    },
    items,
  };
}

function defaultItems(): PackingItem[] {
  return [
    item({
      id: 1,
      category: "DOCUMENTS",
      name: "疫苗证明",
      templateKey: "vaccination-proof",
    }),
    item({
      id: 2,
      category: "FOOD",
      name: "主粮（份）",
      quantity: 4,
      checked: true,
      templateKey: "food",
    }),
  ];
}

function renderDialog({ generateStatus = 201 }: { generateStatus?: number } = {}) {
  let serverChecklist: PackingChecklist | null = null;
  let nextId = 99;

  fetchMock.mockImplementation((input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    if (url === "/api/trips/7/packing-checklist" && method === "GET") {
      return Promise.resolve(
        serverChecklist
          ? jsonResponse(serverChecklist)
          : jsonResponse({ code: "PACKING_CHECKLIST_NOT_FOUND" }, 404),
      );
    }
    if (url === "/api/trips/7/packing-checklist" && method === "POST") {
      if (generateStatus >= 400) {
        return Promise.resolve(
          jsonResponse({ code: "PET_PROFILE_REQUIRED" }, generateStatus),
        );
      }
      serverChecklist = checklist(defaultItems());
      return Promise.resolve(jsonResponse(serverChecklist, 201));
    }
    if (url.endsWith("/items") && method === "POST") {
      const body = JSON.parse(String(init?.body)) as {
        name: string;
        category: PackingItem["category"];
        quantity: number;
      };
      const created = item({
        id: nextId++,
        name: body.name,
        category: body.category,
        quantity: body.quantity,
        source: "CUSTOM",
      });
      const items = [...(serverChecklist?.items ?? []), created];
      serverChecklist = checklist(items);
      return Promise.resolve(jsonResponse(created, 201));
    }
    const match = url.match(/\/items\/(\d+)$/);
    if (match) {
      const id = Number(match[1]);
      if (method === "DELETE") {
        const items = (serverChecklist?.items ?? []).filter(
          (candidate) => candidate.id !== id,
        );
        serverChecklist = checklist(items);
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (method === "PUT") {
        const body = JSON.parse(String(init?.body)) as Partial<PackingItem>;
        const items = (serverChecklist?.items ?? []).map((candidate) =>
          candidate.id === id ? { ...candidate, ...body } : candidate,
        );
        serverChecklist = checklist(items);
        const updated = items.find((candidate) => candidate.id === id)!;
        return Promise.resolve(jsonResponse(updated));
      }
    }
    return Promise.resolve(jsonResponse({ code: "NOT_FOUND" }, 404));
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <PackingChecklistDialog open onOpenChange={() => undefined} tripId={7} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  document.cookie = "XSRF-TOKEN=test-token";
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PackingChecklistDialog", () => {
  it("guides generation and renders generated items by category", async () => {
    renderDialog();

    expect(await screen.findByText("尚未生成携带清单")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /生成携带清单/ }));

    expect(await screen.findByText("疫苗证明")).toBeTruthy();
    expect(screen.getByText("主粮（份）")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "证件" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "饮食" })).toBeTruthy();
    expect(
      screen.getByTestId("packing-dialog-progress").textContent,
    ).toContain("已打包 1 / 2 件");
  });

  it("guides to create a pet profile when the profile is missing", async () => {
    renderDialog({ generateStatus: 409 });

    expect(await screen.findByText("尚未生成携带清单")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /生成携带清单/ }));

    expect(
      await screen.findByText(/先创建档案才能按档案生成携带清单/),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "去创建宠物档案" }).getAttribute("href"),
    ).toBe("/paws");
    expect(screen.queryByRole("button", { name: /生成携带清单/ })).toBeNull();
  });

  it("persists checks and shows the completion state", async () => {
    renderDialog();
    await screen.findByText("尚未生成携带清单");
    fireEvent.click(screen.getByRole("button", { name: /生成携带清单/ }));
    await screen.findByText("疫苗证明");

    fireEvent.click(screen.getByRole("checkbox", { name: "勾选 疫苗证明" }));

    await waitFor(() => {
      expect(
        screen.getByTestId("packing-dialog-progress").textContent,
      ).toContain("已打包 2 / 2 件");
    });
    expect(screen.getByText("全部打包完成，可以出发啦！")).toBeTruthy();
    const putCall = fetchMock.mock.calls.find(
      ([input, init]) =>
        String(input).endsWith("/items/1") && init?.method === "PUT",
    );
    expect(putCall).toBeTruthy();
    expect(String(putCall?.[1]?.body)).toContain('"checked":true');
  });

  it("adds a custom item and rejects blank names", async () => {
    renderDialog();
    await screen.findByText("尚未生成携带清单");
    fireEvent.click(screen.getByRole("button", { name: /生成携带清单/ }));
    await screen.findByText("疫苗证明");

    fireEvent.click(screen.getByRole("button", { name: "新增" }));
    expect(await screen.findByText("请填写物品名称。")).toBeTruthy();
    expect(
      fetchMock.mock.calls.filter(
        ([input, init]) =>
          String(input).endsWith("/items") && init?.method === "POST",
      ),
    ).toHaveLength(0);

    fireEvent.change(screen.getByLabelText("新物品名称"), {
      target: { value: "宠物雨衣" },
    });
    fireEvent.click(screen.getByRole("button", { name: "新增" }));

    expect(await screen.findByText("宠物雨衣")).toBeTruthy();
    expect(
      screen.getByTestId("packing-dialog-progress").textContent,
    ).toContain("已打包 1 / 3 件");
  });
});
