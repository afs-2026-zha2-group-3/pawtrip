// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NearbyPetServices } from "./nearby-pet-services";
import type { NearbyPetService } from "@/queries/locations";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
const writeText = vi.fn<(text: string) => Promise<void>>();

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function service(overrides: Partial<NearbyPetService> = {}): NearbyPetService {
  return {
    poiId: "hospital-a",
    name: "宠物医院A",
    address: "某某路1号",
    distanceMeters: 1100,
    openingHours: "周一至周日 09:00-20:00",
    tel: "0756-1234567",
    ...overrides,
  };
}

function renderWithServices(hospital: NearbyPetService | null, supplies: NearbyPetService | null) {
  fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ hospital, supplies })));
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <NearbyPetServices poiId="poi-a" attractionName="香炉湾沙滩" />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByText("附近宠物服务"));
  return utils;
}

beforeEach(() => {
  fetchMock.mockReset();
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("NearbyPetServices", () => {
  it("loads the nearest services after expanding", async () => {
    renderWithServices(
      service(),
      service({
        poiId: "supplies-a",
        name: "宠物用品店B",
        address: "某某路2号",
        distanceMeters: 2200,
        openingHours: "24小时营业",
        tel: null,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("宠物医院 · 宠物医院A")).toBeTruthy();
    });
    expect(screen.getByText("距香炉湾沙滩约 1.1km")).toBeTruthy();
    expect(screen.getByText("0756-1234567")).toBeTruthy();
    expect(screen.getByText("某某路1号")).toBeTruthy();
    expect(screen.getByText("营业时间：周一至周日 09:00-20:00")).toBeTruthy();
    expect(screen.getByText("宠物用品店 · 宠物用品店B")).toBeTruthy();
    expect(screen.getByText("营业时间：24小时营业")).toBeTruthy();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/locations/poi-a/nearby-services");
  });

  it("shows an empty state when no nearby service exists", async () => {
    renderWithServices(null, null);
    await waitFor(() => {
      expect(screen.getByText("暂无附近宠物服务")).toBeTruthy();
    });
  });

  it("copies the phone number and confirms success (AC-1)", async () => {
    renderWithServices(service(), null);
    await waitFor(() => expect(screen.getByText("0756-1234567")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "复制宠物医院A电话" }));

    await waitFor(() => expect(screen.getByText("已复制")).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith("0756-1234567");
  });

  it("copies the address and confirms success (AC-2)", async () => {
    renderWithServices(service(), null);
    await waitFor(() => expect(screen.getByText("某某路1号")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "复制宠物医院A地址" }));

    await waitFor(() => expect(screen.getByText("已复制")).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith("某某路1号");
  });

  it("hides the phone copy entry and shows 暂无电话 when tel is missing (AC-3)", async () => {
    renderWithServices(service({ tel: null }), null);
    await waitFor(() => expect(screen.getByText("电话：暂无电话")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "复制宠物医院A电话" })).toBeNull();
  });

  it("treats a digit-free phone value as invalid (AC-3)", async () => {
    renderWithServices(service({ tel: "暂无" }), null);
    await waitFor(() => expect(screen.getByText("电话：暂无电话")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "复制宠物医院A电话" })).toBeNull();
  });

  it("hides the address copy entry and shows 暂无地址 when address is missing (AC-4)", async () => {
    renderWithServices(service({ address: null }), null);
    await waitFor(() => expect(screen.getByText("地址：暂无地址")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "复制宠物医院A地址" })).toBeNull();
  });

  it("reports failure when the clipboard write is rejected", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    document.execCommand = vi.fn(() => false);
    renderWithServices(service(), null);
    await waitFor(() => expect(screen.getByText("0756-1234567")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "复制宠物医院A电话" }));

    await waitFor(() => expect(screen.getByText("复制失败")).toBeTruthy());
  });
});