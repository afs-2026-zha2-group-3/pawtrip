import { expect, test, type Page } from "@playwright/test";
import {
  createTripViaApi,
  csrfHeaders,
  pets,
  resetTrips,
  signIn,
} from "./trip-helpers";

const TRIP_NAME = "珠海 · 路线规划";
const CITY_ADCODE = "440400";
const START_DATE = "2026-12-01";

interface RouteStop {
  poiId: string;
  toNext?: "walk" | "drive" | "self_drive";
  toNextEstimate?: {
    durationMinutes: number;
    costLowYuan: number;
    costHighYuan: number;
  } | null;
}

interface FakeRoute {
  distance: number;
  time: number;
  steps: { path: [number, number][] }[];
}

interface FakeRoutePlan {
  driving: { error?: boolean; route?: FakeRoute }[];
  walking: { error?: boolean; route?: FakeRoute }[];
}

interface FakeAmapWindow {
  __amapCalls: { kind: string; origin: [number, number]; destination: [number, number] }[];
  __amapRoutePlan: FakeRoutePlan;
  AMap: unknown;
}

function route(distance: number, time: number): FakeRoute {
  return {
    distance,
    time,
    steps: [{ path: [[113.5, 22.1], [113.55, 22.28]] }],
  };
}

async function installFakeAmap(page: Page) {
  await page.addInitScript(() => {
    // 打印导出用例复用同一初始化脚本，避免测试内再触发整页刷新。
    window.print = () => {};
    const state = window as unknown as FakeAmapWindow;
    state.__amapCalls = [];
    state.__amapRoutePlan = { driving: [], walking: [] };

    class FakeMap {
      container: HTMLElement;
      constructor(container: HTMLElement) {
        this.container = container;
      }
      setFitView() {}
      setZoomAndCenter() {}
      destroy() {}
    }

    class FakeMarker {
      opts: Record<string, unknown>;
      constructor(options: Record<string, unknown>) {
        this.opts = options;
      }
      on() {}
      setMap(map: FakeMap | null) {
        if (!map) return;
        const label = (this.opts.label ?? {}) as { content?: string };
        const element = document.createElement("div");
        element.dataset.testid = "route-marker";
        element.textContent = String(label.content ?? "");
        map.container.appendChild(element);
      }
    }

    class FakePolyline {
      opts: Record<string, unknown>;
      constructor(options: Record<string, unknown>) {
        this.opts = options;
      }
      setMap(map: FakeMap | null) {
        if (!map) return;
        const element = document.createElement("div");
        element.dataset.testid = "route-polyline";
        element.dataset.color = String(this.opts.strokeColor ?? "");
        map.container.appendChild(element);
      }
    }

    class FakeText {
      opts: Record<string, unknown>;
      constructor(options: Record<string, unknown>) {
        this.opts = options;
      }
      setMap(map: FakeMap | null) {
        if (!map) return;
        const element = document.createElement("div");
        element.dataset.testid = "route-label";
        element.textContent = String(this.opts.text ?? "");
        map.container.appendChild(element);
      }
    }

    function service(kind: "driving" | "walking") {
      return class {
        search(
          origin: [number, number],
          destination: [number, number],
          callback: (status: string, result: unknown) => void,
        ) {
          state.__amapCalls.push({ kind, origin, destination });
          const next = state.__amapRoutePlan[kind].shift();
          if (next?.error) {
            callback("error", "failed");
            return;
          }
          const result =
            next?.route ??
            ({ distance: 1000, time: 600, steps: [{ path: [origin, destination] }] } as FakeRoute);
          callback("complete", { routes: [result] });
        }
      };
    }

    state.AMap = {
      Map: FakeMap,
      Marker: FakeMarker,
      Polyline: FakePolyline,
      Text: FakeText,
      InfoWindow: class {
        setContent() {}
        open() {}
        close() {}
      },
      Pixel: class {},
      plugin(_names: string[], callback: () => void) {
        callback();
      },
      Driving: service("driving"),
      Walking: service("walking"),
    };
  });
  // 段行会用服务端估算回填并持久化，导致路线时间与假 AMap 不一致；阻断估算以隔离被测路径。
  await page.route("**/api/trips/*/route-estimate**", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/problem+json",
      body: JSON.stringify({ detail: "route estimate disabled in e2e" }),
    }),
  );
  // addInitScript 只对后续文档加载生效；signIn 之后是 SPA 路由，需整页刷新注入假 AMap。
  await page.reload();
  await page.waitForSelector("html[data-app-ready='true']", {
    timeout: 15_000,
  });
  await expect(page.getByRole("tab", { name: "城市浏览" }).first()).toBeVisible({
    timeout: 15_000,
  });
}

async function setRoutePlan(page: Page, plan: Partial<FakeRoutePlan>) {
  await page.evaluate((value) => {
    const state = window as unknown as FakeAmapWindow;
    state.__amapRoutePlan = {
      driving: value.driving ?? [],
      walking: value.walking ?? [],
    };
  }, plan);
}

async function routeCalls(page: Page) {
  return page.evaluate(
    () => (window as unknown as FakeAmapWindow).__amapCalls,
  );
}

async function seedRouteTrip(page: Page, days: RouteStop[][]) {
  const pet = (await pets(page)).find((candidate) => candidate.name === "豆豆");
  if (!pet) throw new Error("Seed pet 豆豆 not found");
  const trip = await createTripViaApi(page, {
    name: TRIP_NAME,
    cityAdcode: CITY_ADCODE,
    petId: pet.id,
    totalDays: days.length,
    startDate: START_DATE,
  });
  const headers = await csrfHeaders(page);
  const response = await page.request.put(`/api/trips/${trip.id}`, {
    headers,
    data: {
      name: TRIP_NAME,
      totalDays: days.length,
      startDate: START_DATE,
      plan: {
        version: 1,
        days: days.map((stops, index) => ({ day: index + 1, stops })),
        unscheduled: [],
      },
      transportMode: "high_speed_rail",
    },
  });
  expect(response.ok()).toBeTruthy();
}

async function activateTrip(page: Page) {
  const list = await page.request.get("/api/trips");
  expect(list.ok()).toBeTruthy();
  const created = ((await list.json()) as { id: number; name: string }[]).find(
    (trip) => trip.name === TRIP_NAME,
  );
  if (!created) throw new Error(`Trip ${TRIP_NAME} not found`);
  await page.evaluate(
    (tripId) =>
      window.localStorage.setItem("pawtrip.activeTripId", String(tripId)),
    created.id,
  );
  await page.goto("/itinerary");
  await expect(page).toHaveURL(/\/itinerary$/);
}

async function openRouteDialog(page: Page) {
  await page.getByRole("button", { name: "查看当天路线规划" }).click();
  const dialog = page.getByTestId("day-route-dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("opens the route dialog for the selected day and keeps the day after closing", async ({
  page,
}) => {
  await seedRouteTrip(page, [
    [{ poiId: "e2e-zhu-a" }],
    [{ poiId: "e2e-route-b" }, { poiId: "e2e-route-c" }],
  ]);
  await activateTrip(page);

  await page.getByRole("tab", { name: "Day 2" }).click();
  const dialog = await openRouteDialog(page);
  await expect(dialog.getByText("第 2 天路线规划")).toBeVisible();
  await expect(dialog.getByText("12月2日 周三 · 珠海市")).toBeVisible();

  await page.getByRole("button", { name: "关闭弹窗" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Day 2" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("draws driving routes and labels distance with the saved duration snapshot", async ({
  page,
}) => {
  await installFakeAmap(page);
  await seedRouteTrip(page, [
    [
      {
        poiId: "e2e-zhu-a",
        toNext: "drive",
        toNextEstimate: {
          durationMinutes: 20,
          costLowYuan: 27,
          costHighYuan: 40,
        },
      },
      { poiId: "e2e-route-b" },
    ],
  ]);
  await activateTrip(page);
  await setRoutePlan(page, { driving: [{ route: route(1200, 1080) }] });

  const dialog = await openRouteDialog(page);

  await expect(dialog.getByTestId("route-marker")).toHaveCount(2);
  await expect(dialog.getByTestId("route-polyline")).toHaveCount(1);
  await expect(dialog.getByTestId("route-label")).toHaveText(
    "1.2 公里 · 20 分钟",
  );
  const calls = await routeCalls(page);
  expect(calls.map((call) => call.kind)).toEqual(["driving"]);
});

test("keeps the remaining segments when one route request fails", async ({
  page,
}) => {
  await installFakeAmap(page);
  await seedRouteTrip(page, [
    [
      { poiId: "e2e-zhu-a", toNext: "drive" },
      { poiId: "e2e-route-b", toNext: "drive" },
      { poiId: "e2e-route-c" },
    ],
  ]);
  await activateTrip(page);
  await setRoutePlan(page, {
    driving: [{ error: true }, { route: route(700, 240) }],
  });

  const dialog = await openRouteDialog(page);

  await expect(dialog.getByTestId("day-route-failure")).toContainText(
    "部分路段路线获取失败",
  );
  await expect(dialog.getByTestId("route-polyline")).toHaveCount(1);
  await expect(dialog.getByTestId("route-label")).toHaveText("700 米 · 4 分钟");
});

test("shows a placeholder when the AMap key is not configured", async ({
  page,
}) => {
  await seedRouteTrip(page, [
    [{ poiId: "e2e-zhu-a", toNext: "drive" }, { poiId: "e2e-route-b" }],
  ]);
  await activateTrip(page);

  const dialog = await openRouteDialog(page);

  await expect(dialog.getByTestId("day-route-placeholder")).toContainText(
    "地图未配置",
  );
  await expect(page.getByTestId("itinerary-stop")).toHaveCount(2);
});

test("keeps the route dialog out of the exported print view", async ({
  page,
}) => {
  await installFakeAmap(page);
  await seedRouteTrip(page, [
    [
      { poiId: "e2e-zhu-a", toNext: "drive" },
      { poiId: "e2e-route-b" },
    ],
  ]);
  await activateTrip(page);
  await setRoutePlan(page, { driving: [{ route: route(1200, 1080) }] });

  const dialog = await openRouteDialog(page);
  await expect(dialog.getByTestId("route-label")).toHaveCount(1);
  await page.getByRole("button", { name: "关闭弹窗" }).click();

  await page.getByRole("button", { name: "导出 PDF" }).click();
  await page.emulateMedia({ media: "print" });

  await expect(page.getByTestId("day-route-dialog")).toHaveCount(0);
  await expect(page.getByTestId("day-route-map")).toHaveCount(0);
  await expect(page.getByTestId("route-label")).toHaveCount(0);
});
