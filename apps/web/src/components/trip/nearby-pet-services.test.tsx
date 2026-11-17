// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NearbyPetServices } from "./nearby-pet-services";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NearbyPetServices poiId="poi-a" attractionName="香炉湾沙滩" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("NearbyPetServices", () => {
  it("loads the nearest services after expanding", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse({
          hospital: {
            poiId: "hospital-a",
            name: "宠物医院A",
            address: "某某路1号",
            distanceMeters: 1100,
            openingHours: "周一至周日 09:00-20:00",
          },
          supplies: {
            poiId: "supplies-a",
            name: "宠物用品店B",
            address: "某某路2号",
            distanceMeters: 2200,
            openingHours: "24小时营业",
          },
        }),
      ),
    );

    renderComponent();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("附近宠物服务"));

    await waitFor(() => {
      expect(screen.getByText("宠物医院 · 宠物医院A")).toBeTruthy();
    });
    expect(screen.getByText("距香炉湾沙滩约 1.1km")).toBeTruthy();
    expect(screen.getByText("某某路1号")).toBeTruthy();
    expect(
      screen.getByText("营业时间：周一至周日 09:00-20:00"),
    ).toBeTruthy();
    expect(screen.getByText("宠物用品店 · 宠物用品店B")).toBeTruthy();
    expect(screen.getByText("营业时间：24小时营业")).toBeTruthy();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/locations/poi-a/nearby-services",
    );
  });

  it("shows an empty state when no nearby service exists", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse({ hospital: null, supplies: null })),
    );

    renderComponent();
    fireEvent.click(screen.getByText("附近宠物服务"));

    await waitFor(() => {
      expect(screen.getByText("暂无附近宠物服务")).toBeTruthy();
    });
  });
});
