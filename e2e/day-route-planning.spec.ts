import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  completeTripViaApi,
  createTripViaApi,
  csrfHeaders,
  openTrips,
  pets,
  resetTrips,
  signIn,
  tripCard,
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
  // 本地 .env 可能带真实高德 Key，阻断后端估算，保证标签只来自假 AMap。
  await page.route("**/api/trips/*/route-estimate*", (route) => route.abort());
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

    // 面板常驻会随地点详情加载多次重绘；假覆盖物需在 setMap(null) 时真正移除，
    // 否则重复绘制会累积 DOM 节点，与真实 AMap 的覆盖物清理语义不符。
    class FakeOverlay {
      element: HTMLElement | null = null;
      detach() {
        this.element?.remove();
        this.element = null;
      }
      attach(map: FakeMap | null, element: HTMLElement) {
        if (!map) {
          this.detach();
          return;
        }
        this.element = element;
        map.container.appendChild(element);
      }
    }

    class FakeMarker extends FakeOverlay {
      opts: Record<string, unknown>;
      constructor(options: Record<string, unknown>) {
        super();
        this.opts = options;
      }
      on() {}
      setMap(map: FakeMap | null) {
        const label = (this.opts.label ?? {}) as { content?: string };
        const element = document.createElement("div");
        element.dataset.testid = "route-marker";
        element.textContent = String(label.content ?? "");
        this.attach(map, element);
      }
    }

    class FakePolyline extends FakeOverlay {
      opts: Record<string, unknown>;
      constructor(options: Record<string, unknown>) {
        super();
        this.opts = options;
      }
      setMap(map: FakeMap | null) {
        const element = document.createElement("div");
        element.dataset.testid = "route-polyline";
        element.dataset.color = String(this.opts.strokeColor ?? "");
        this.attach(map, element);
      }
    }

    class FakeText extends FakeOverlay {
      opts: Record<string, unknown>;
      constructor(options: Record<string, unknown>) {
        super();
        this.opts = options;
      }
      setMap(map: FakeMap | null) {
        const element = document.createElement("div");
        element.dataset.testid = "route-label";
        element.textContent = String(this.opts.text ?? "");
        this.attach(map, element);
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
  const hydratedAuth = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/auth/me" &&
      response.request().method() === "GET" &&
      response.ok(),
  );
  await page.reload();
  await hydratedAuth;
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
    state.__amapCalls = [];
  }, plan);
}

// 面板常驻后地图会在地点详情加载过程中多次重绘并提前消耗假算路队列；
// 先等首次绘制稳定，再设置算路计划，并用空天往返切换触发一次干净的重绘。
async function redrawWithRoutePlan(
  page: Page,
  panel: Locator,
  markers: number,
  plan: Partial<FakeRoutePlan>,
) {
  await expect(panel.getByTestId("route-marker")).toHaveCount(markers);
  await setRoutePlan(page, plan);
  await page.getByRole("tab", { name: "Day 2" }).click();
  await expect(panel.getByTestId("day-route-empty")).toBeVisible();
  await page.getByRole("tab", { name: "Day 1" }).click();
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
  await completeTripViaApi(page, trip.id);
}

async function activateTrip(page: Page) {
  await openTrips(page);
  await tripCard(page, TRIP_NAME).getByRole("button", { name: "查看行程单" }).click();
  await expect(page).toHaveURL(/\/itinerary$/);
}

async function openRoutePanel(page: Page) {
  const panel = page.getByTestId("day-route-panel");
  await expect(panel).toBeVisible();
  return panel;
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("shows the route panel for the selected day without opening a dialog", async ({
  page,
}) => {
  await seedRouteTrip(page, [
    [{ poiId: "e2e-zhu-a" }],
    [{ poiId: "e2e-route-b" }, { poiId: "e2e-route-c" }],
  ]);
  await activateTrip(page);

  await expect(
    page.getByRole("button", { name: "查看当天路线规划" }),
  ).toHaveCount(0);
  const panel = await openRoutePanel(page);
  await expect(
    panel.getByRole("heading", { name: "第 1 天路线规划" }),
  ).toBeVisible();
  await expect(panel.getByText("12月1日 周二 · 珠海市")).toBeVisible();

  await page.getByRole("tab", { name: "Day 2" }).click();

  await expect(
    panel.getByRole("heading", { name: "第 2 天路线规划" }),
  ).toBeVisible();
  await expect(panel.getByText("12月2日 周三 · 珠海市")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Day 2" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
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
    [],
  ]);
  await activateTrip(page);

  const panel = await openRoutePanel(page);
  await redrawWithRoutePlan(page, panel, 2, {
    driving: [{ route: route(1200, 1080) }],
  });

  await expect(panel.getByTestId("route-marker")).toHaveCount(2);
  await expect(panel.getByTestId("route-polyline")).toHaveCount(1);
  await expect(panel.getByTestId("route-label")).toHaveText(
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
    [],
  ]);
  await activateTrip(page);

  const panel = await openRoutePanel(page);
  await redrawWithRoutePlan(page, panel, 3, {
    driving: [{ error: true }, { route: route(700, 240) }],
  });

  await expect(panel.getByTestId("day-route-failure")).toContainText(
    "部分路段路线获取失败",
  );
  await expect(panel.getByTestId("route-polyline")).toHaveCount(1);
  await expect(panel.getByTestId("route-label")).toHaveText("700 米 · 4 分钟");
});

test("shows the empty state when the selected day has no stops", async ({
  page,
}) => {
  await seedRouteTrip(page, [[{ poiId: "e2e-zhu-a" }], []]);
  await activateTrip(page);
  await page.getByRole("tab", { name: "Day 2" }).click();

  const panel = await openRoutePanel(page);
  await expect(panel.getByTestId("day-route-empty")).toHaveText("当天暂无地点");
  await expect(panel.getByTestId("day-route-map")).toHaveCount(0);
});

test("shows the single-stop note for a one-stop day", async ({ page }) => {
  await installFakeAmap(page);
  await seedRouteTrip(page, [[{ poiId: "e2e-zhu-a" }]]);
  await activateTrip(page);

  const panel = await openRoutePanel(page);
  await expect(panel.getByTestId("route-marker")).toHaveCount(1);
  await expect(panel.getByTestId("day-route-single")).toHaveText(
    "当天只有一个地点，无需路线",
  );
  expect(await routeCalls(page)).toHaveLength(0);
});

test("stacks the route panel after the day detail on narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await seedRouteTrip(page, [
    [{ poiId: "e2e-zhu-a" }],
    [{ poiId: "e2e-route-b" }],
  ]);
  await activateTrip(page);

  const panel = await openRoutePanel(page);
  await expect(panel.getByText("第 1 天路线规划")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const dayBox = await page
    .getByRole("region", { name: "按天行程" })
    .boundingBox();
  const panelBox = await panel.boundingBox();
  expect(dayBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  expect(panelBox!.y).toBeGreaterThan(dayBox!.y);
});

test("keeps the route panel out of the exported print view and image surface", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (
      callback: BlobCallback,
      ...args: unknown[]
    ) {
      window.setTimeout(() => {
        original.call(this, callback, ...(args as [string?, number?]));
      }, 1500);
    };
  });
  await installFakeAmap(page);
  await seedRouteTrip(page, [
    [
      { poiId: "e2e-zhu-a", toNext: "drive" },
      { poiId: "e2e-route-b" },
    ],
    [],
  ]);
  await activateTrip(page);

  const panel = await openRoutePanel(page);
  await redrawWithRoutePlan(page, panel, 2, {
    driving: [{ route: route(1200, 1080) }],
  });
  await expect(panel.getByTestId("route-label")).toHaveCount(1);

  await page.getByRole("button", { name: "导出图片" }).click();
  const surface = page.getByTestId("image-export-surface");
  await expect(surface).toBeAttached();
  await expect(surface.getByTestId("day-route-panel")).toHaveCount(0);
  await expect(surface.getByTestId("day-route-map")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "导出图片" }),
  ).toBeEnabled({ timeout: 20_000 });

  await page.getByRole("button", { name: "导出 PDF" }).click();
  await page.emulateMedia({ media: "print" });

  await expect(page.getByTestId("day-route-panel")).toBeHidden();
  await expect(page.getByTestId("day-route-map")).toBeHidden();
});
