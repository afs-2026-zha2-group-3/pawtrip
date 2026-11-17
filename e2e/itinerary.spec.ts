import { expect, test, type Page } from "@playwright/test";
import {
  createTripViaApi,
  csrfHeaders,
  openTrips,
  pets,
  resetTrips,
  signIn,
  tripCard,
} from "./trip-helpers";

interface TripPlanBody {
  version: 1;
  days: {
    day: number;
    stops: {
      poiId: string;
      toNext?: "walk" | "drive" | "transit" | "self_drive";
      toNextEstimate?: {
        durationMinutes: number;
        costLowYuan: number;
        costHighYuan: number;
      };
    }[];
  }[];
  unscheduled: { poiId: string }[];
}

const DEFAULT_TRIP_NAME = "珠海 · 2天 · 豆豆";

const itineraryPlan: TripPlanBody = {
  version: 1,
  days: [
    {
      day: 1,
      stops: [
        {
          poiId: "e2e-zhu-a",
          toNextEstimate: {
            durationMinutes: 20,
            costLowYuan: 27,
            costHighYuan: 40,
          },
        },
        { poiId: "e2e-zhu-b" },
      ],
    },
    { day: 2, stops: [{ poiId: "e2e-zhu-c" }] },
  ],
  unscheduled: [{ poiId: "e2e-zhu-d" }],
};

async function seedItineraryTrip(
  page: Page,
  {
    name = DEFAULT_TRIP_NAME,
    plan = itineraryPlan,
    transportMode = "high_speed_rail",
  }: {
    name?: string;
    plan?: TripPlanBody;
    transportMode?: string | null;
  } = {},
) {
  const pet = (await pets(page)).find((candidate) => candidate.name === "豆豆");
  if (!pet) throw new Error("Seed pet 豆豆 not found");

  const trip = await createTripViaApi(page, {
    name,
    cityAdcode: "440400",
    petId: pet.id,
    totalDays: 2,
    startDate: "2026-12-01",
  });

  const headers = await csrfHeaders(page);
  const response = await page.request.put(`/api/trips/${trip.id}`, {
    headers,
    data: {
      name,
      totalDays: 2,
      startDate: "2026-12-01",
      plan,
      transportMode,
    },
  });
  expect(response.ok()).toBeTruthy();
  return trip;
}

async function activateTrip(page: Page, name = DEFAULT_TRIP_NAME) {
  await openTrips(page);
  await tripCard(page, name).getByRole("button", { name: "激活" }).click();
  await expect(page.getByTestId("trip-panel")).toBeVisible();
}

async function stubWindowPrint(page: Page) {
  await page.addInitScript(() => {
    const state = window as unknown as {
      __printCalls: number;
      __finishPrint: () => void;
    };
    state.__printCalls = 0;
    window.print = () => {
      state.__printCalls += 1;
    };
    state.__finishPrint = () => window.dispatchEvent(new Event("afterprint"));
  });
}

async function openExportView(page: Page) {
  await page.getByRole("button", { name: "导出 PDF" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { __printCalls: number }).__printCalls,
      ),
    )
    .toBe(1);
  await page.emulateMedia({ media: "print" });
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("shows an empty state without an active trip", async ({ page }) => {
  await page.goto("/itinerary");

  await expect(page.getByText("还没有可查看的行程单")).toBeVisible();
  await expect(page.getByRole("link", { name: "去创建行程" })).toBeVisible();
  await expect(page.getByRole("link", { name: "查看我的行程" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Trips" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("redirects unauthenticated visitors to login", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/itinerary");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "行程单" })).toHaveCount(0);
});

test("summarizes the active trip by day from the panel entry", async ({
  page,
}) => {
  await seedItineraryTrip(page);
  await activateTrip(page);
  await page.getByTestId("itinerary-link").click();

  await expect(page).toHaveURL(/\/itinerary$/);
  await expect(page.getByRole("heading", { name: "行程单" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Trips" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  const sectionNav = page.getByRole("navigation", { name: "行程视图" });
  await expect(
    sectionNav.getByRole("link", { name: "行程单" }),
  ).toHaveAttribute("aria-current", "page");
  await sectionNav.getByRole("link", { name: "我的行程" }).click();
  await expect(page).toHaveURL(/\/trips$/);
  await page
    .getByRole("navigation", { name: "行程视图" })
    .getByRole("link", { name: "行程单" })
    .click();
  await expect(page).toHaveURL(/\/itinerary$/);

  await expect(page.getByText("珠海 · 2天 · 豆豆")).toBeVisible();
  await expect(
    page.getByText("珠海市 · 豆豆 · 12月1日 周二 至 12月2日 周三 · 大交通 高铁"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "导出 PDF" }),
  ).toBeVisible();

  await expect(
    page.getByRole("region", { name: "大交通携宠规则" }),
  ).toHaveCount(0);

  const dayOne = page.getByRole("tab", { name: "Day 1" });
  const dayTwo = page.getByRole("tab", { name: "Day 2" });
  await expect(dayOne).toHaveAttribute("aria-selected", "true");

  await expect(page.getByText("12月1日 周二 · 珠海市")).toBeVisible();
  await expect(page.getByTestId("itinerary-stop")).toHaveCount(2);
  const firstStop = page.getByTestId("itinerary-stop").first();
  await expect(firstStop).toContainText("情侣路");
  await expect(firstStop).toContainText("珠海市香洲区");
  await firstStop.getByText("详细携宠政策").click();
  await expect(firstStop).toContainText("单只宠物最大体重");
  await expect(firstStop.getByText("8.5 kg", { exact: true })).toBeVisible();
  await expect(firstStop).toContainText("牵引绳要求");
  await expect(firstStop.getByText("需要", { exact: true })).toBeVisible();
  await expect(firstStop).toContainText("疫苗证明要求");
  await expect(firstStop.getByText("不需要", { exact: true })).toBeVisible();
  await expect(firstStop).toContainText("额外费用");
  await expect(
    firstStop.getByText("10.5 元 / 只 / 次", { exact: true }),
  ).toBeVisible();
  const transport = page.getByTestId("itinerary-transport");
  await expect(transport).toContainText("途内交通 · 打车");
  await expect(transport).toContainText("约 20 分钟");
  await expect(transport).toContainText("¥27–40");
  await expect(transport).toContainText("部分平台提供宠物专车选项");
  await expect(page.getByTestId("itinerary-policy")).toContainText(
    "当天需携带牵引绳",
  );
  await expect(page.getByText("食宿")).toHaveCount(0);
  await expect(page.getByText("应急")).toHaveCount(0);
  await expect(page.getByText("天气")).toHaveCount(0);
  await expect(page.getByText("暂无数据")).toHaveCount(0);
  await expect(page.getByText(/^\d{1,2}:\d{2}$/)).toHaveCount(0);

  await dayTwo.click();
  await expect(dayTwo).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("12月2日 周三 · 珠海市")).toBeVisible();
  await expect(page.getByTestId("itinerary-stop")).toHaveCount(1);
  await expect(page.getByTestId("itinerary-stop")).toContainText(
    "珠海海滨公园",
  );

  const unscheduled = page.getByRole("region", { name: "未排期地点" });
  await expect(
    unscheduled.getByRole("heading", { name: "未排期" }),
  ).toBeVisible();
  await expect(unscheduled).toContainText("珠海无名景点");

  await page.reload();
  await expect(page.getByRole("heading", { name: "行程单" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Day 1" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("opens the itinerary from the active trip card", async ({ page }) => {
  await seedItineraryTrip(page);
  await activateTrip(page);

  const card = tripCard(page, DEFAULT_TRIP_NAME);
  const entry = card.getByRole("link", { name: "行程单" });
  await expect(entry).toBeVisible();
  await entry.click();

  await expect(page).toHaveURL(/\/itinerary$/);
  await expect(page.getByRole("heading", { name: "行程单" })).toBeVisible();
});

test("falls back when the route estimate request fails", async ({ page }) => {
  await page.route(/\/api\/trips\/\d+\/route-estimate/, (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "upstream failed" }),
    }),
  );
  await seedItineraryTrip(page, {
    plan: {
      version: 1,
      days: [
        { day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] },
        { day: 2, stops: [] },
      ],
      unscheduled: [],
    },
  });
  await activateTrip(page);
  await page.goto("/itinerary");

  await expect(page.getByTestId("itinerary-transport")).toContainText(
    "估算暂不可用",
  );
  await expect(page.getByTestId("itinerary-stop").first()).toContainText(
    "情侣路",
  );
  await expect(page.getByTestId("itinerary-policy")).toContainText(
    "当天需携带牵引绳",
  );
});

test("explains adjacent identical stops without an estimate", async ({
  page,
}) => {
  await seedItineraryTrip(page, {
    plan: {
      version: 1,
      days: [
        {
          day: 1,
          stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-a" }],
        },
        { day: 2, stops: [] },
      ],
      unscheduled: [],
    },
  });
  await activateTrip(page);
  await page.goto("/itinerary");

  const transport = page.getByTestId("itinerary-transport");
  await expect(transport).toContainText("与上一景点相同，无需途内交通");
  await expect(transport).not.toContainText("宠物专车");
  await expect(transport).not.toContainText("估算中");
});

test("shows a no-config notice and hides the reminder when nothing applies", async ({
  page,
}) => {
  await seedItineraryTrip(page, {
    plan: {
      version: 1,
      days: [
        { day: 1, stops: [{ poiId: "e2e-zhu-d" }] },
        { day: 2, stops: [] },
      ],
      unscheduled: [],
    },
  });
  await activateTrip(page);
  await page.goto("/itinerary");

  const stop = page.getByTestId("itinerary-stop");
  await expect(stop).toHaveCount(1);
  await stop.getByText("详细携宠政策").click();
  await expect(stop).toContainText("暂无详细规则");
  await expect(page.getByTestId("itinerary-policy")).toHaveCount(0);
});

test("shows only the duration for self-drive segments", async ({ page }) => {
  await seedItineraryTrip(page, {
    plan: {
      version: 1,
      days: [
        {
          day: 1,
          stops: [
            {
              poiId: "e2e-zhu-a",
              toNext: "self_drive",
              toNextEstimate: {
                durationMinutes: 35,
                costLowYuan: 0,
                costHighYuan: 0,
              },
            },
            { poiId: "e2e-zhu-b" },
          ],
        },
        { day: 2, stops: [] },
      ],
      unscheduled: [],
    },
  });
  await activateTrip(page);
  await page.goto("/itinerary");

  const transport = page.getByTestId("itinerary-transport");
  await expect(transport).toContainText("途内交通 · 驾车");
  await expect(transport).toContainText("约 35 分钟");
  await expect(transport).not.toContainText("¥");
  await expect(transport).not.toContainText("宠物专车");
});

test("exports all days through the print dialog", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __printCalls: number }).__printCalls = 0;
    window.print = () => {
      (window as unknown as { __printCalls: number }).__printCalls += 1;
    };
  });
  await seedItineraryTrip(page);
  await activateTrip(page);
  await page.goto("/itinerary");

  await page.getByRole("button", { name: "导出 PDF" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __printCalls: number }).__printCalls))
    .toBe(1);

  await expect(page.getByText("12月1日 周二 · 珠海市")).toBeVisible();
  await expect(page.getByText("12月2日 周三 · 珠海市")).toBeVisible();

  const firstStop = page.getByTestId("itinerary-stop").first();
  await expect(firstStop.getByText("8.5 kg", { exact: true })).toBeVisible();

  await page.emulateMedia({ media: "print" });
  const transportRule = page.getByRole("region", { name: "大交通携宠规则" });
  await expect(transportRule).toContainText("大交通携宠规则 · 高铁");
  await expect(transportRule).toContainText(
    "有条件 · 可同车隔离托运或单独托运，宠物不可进客舱",
  );
  await expect(transportRule).toContainText("体重上限：≤15 kg");
  await expect(transportRule).toContainText("肩高上限：≤40 cm");
  await expect(transportRule).toContainText(
    "容器要求：全程置于中铁快运专用宠物运输箱",
  );
  await expect(transportRule).toContainText("办理流程：12306 App「宠物托运」");
  await expect(transportRule).toContainText(
    "检疫证明：需有效期内《动物检疫合格证明》",
  );
  await expect(transportRule).toContainText(
    "来源：国铁集团：高铁宠物托运「爱宠行」服务",
  );
  await expect(transportRule).toContainText("已复核 2026-11-16");
  await expect(transportRule).toContainText("以承运方最新规则为准");
  await expect(page.getByRole("tablist", { name: "主导航" })).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "行程视图" }),
  ).toBeHidden();
  await expect(page.getByRole("tablist", { name: "按天切换" })).toBeHidden();
  await expect(page.getByRole("button", { name: "导出 PDF" })).toBeHidden();
  await expect(page.getByTestId("trip-panel")).toBeHidden();
  await expect(page.getByText("12月1日 周二 · 珠海市")).toBeVisible();
  await expect(page.getByText("12月2日 周三 · 珠海市")).toBeVisible();
  await expect(firstStop.getByText("8.5 kg", { exact: true })).toBeVisible();
  await expect(firstStop.getByText("不需要", { exact: true })).toBeVisible();
  await expect(
    firstStop.getByText("10.5 元 / 只 / 次", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("itinerary-transport")).toContainText(
    "途内交通 · 打车",
  );
  await expect(page.getByTestId("itinerary-policy").first()).toContainText(
    "当天需携带牵引绳",
  );
  await expect(
    page.getByRole("region", { name: "未排期地点" }),
  ).toContainText("珠海无名景点");
  await expect(page.getByText("食宿")).toHaveCount(0);
  await expect(page.getByText("应急")).toHaveCount(0);
  await expect(page.getByText("天气")).toHaveCount(0);
  await expect(page.getByText("暂无数据")).toHaveCount(0);
  await expect(page.getByText(/^\d{1,2}:\d{2}$/)).toHaveCount(0);
  await expect(transportRule).toBeVisible();
});

test("restores the single-day view after printing ends", async ({ page }) => {
  await stubWindowPrint(page);
  await seedItineraryTrip(page);
  await activateTrip(page);
  await page.goto("/itinerary");

  const dayOneTab = page.getByRole("tab", { name: "Day 1" });
  await expect(dayOneTab).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "导出 PDF" }).click();
  await expect(page.getByText("12月2日 周三 · 珠海市")).toBeVisible();
  await expect(
    page.getByTestId("itinerary-stop").first().locator("details"),
  ).toHaveJSProperty("open", true);

  await page.evaluate(() =>
    (window as unknown as { __finishPrint: () => void }).__finishPrint(),
  );

  await expect(page.getByText("12月2日 周三 · 珠海市")).toHaveCount(0);
  await expect(page.getByText("12月1日 周二 · 珠海市")).toBeVisible();
  await expect(page.getByRole("button", { name: "导出 PDF" })).toBeVisible();
  await expect(
    page.getByTestId("itinerary-stop").first().locator("details"),
  ).toHaveJSProperty("open", false);
  await expect(dayOneTab).toHaveAttribute("aria-selected", "true");
});

test("shows representative airline rules for flights", async ({ page }) => {
  await stubWindowPrint(page);
  await seedItineraryTrip(page, {
    transportMode: "flight",
    plan: {
      version: 1,
      days: [
        { day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] },
        { day: 2, stops: [] },
      ],
      unscheduled: [],
    },
  });
  await activateTrip(page);
  await page.goto("/itinerary");
  await openExportView(page);

  const transportRule = page.getByRole("region", { name: "大交通携宠规则" });
  await expect(transportRule).toContainText(
    "大交通携宠规则 · 飞机（中国国际航空）",
  );
  await expect(transportRule).toContainText("体重上限：≤32 kg");
  await expect(transportRule).toContainText("容器要求：");
  await expect(transportRule).toContainText("办理流程：");
  await expect(transportRule).toContainText(
    "检疫证明：需《动物检疫合格证明》，国际航班另需出入境文件",
  );
  await expect(transportRule).toContainText(
    "来源：国航：作为行李托运的小动物",
  );
  await expect(transportRule).toContainText("已复核 2026-11-16");
  await expect(transportRule).toContainText(
    "飞机规则因航司与航线而异；此处按代表航司展示",
  );
  await expect(transportRule).toContainText("以承运方最新规则为准");
  await expect(transportRule).not.toContainText("肩高上限");
});

test("omits numeric limits when the transport rule has none", async ({
  page,
}) => {
  await stubWindowPrint(page);
  await seedItineraryTrip(page, {
    transportMode: "drive",
    plan: {
      version: 1,
      days: [
        { day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] },
        { day: 2, stops: [] },
      ],
      unscheduled: [],
    },
  });
  await activateTrip(page);
  await page.goto("/itinerary");
  await openExportView(page);

  const transportRule = page.getByRole("region", { name: "大交通携宠规则" });
  await expect(transportRule).toContainText("大交通携宠规则 · 自驾");
  await expect(transportRule).toContainText(
    "体重限制：无统一限制，以车辆空间与安全固定为准",
  );
  await expect(transportRule).not.toContainText("体重上限");
  await expect(transportRule).not.toContainText("肩高上限");
});

test("exports without a transport rule when no transport mode is set", async ({
  page,
}) => {
  await stubWindowPrint(page);
  await seedItineraryTrip(page, {
    transportMode: null,
    plan: {
      version: 1,
      days: [
        { day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] },
        { day: 2, stops: [] },
      ],
      unscheduled: [],
    },
  });
  await activateTrip(page);
  await page.goto("/itinerary");
  await openExportView(page);

  await expect(
    page.getByRole("region", { name: "大交通携宠规则" }),
  ).toHaveCount(0);
  await expect(page.getByText("12月1日 周二 · 珠海市")).toBeVisible();
  await expect(page.getByTestId("itinerary-stop").first()).toContainText(
    "情侣路",
  );
});
