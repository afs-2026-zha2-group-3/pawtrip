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

// 与 apps/web/src/lib/trip/transport-segments.ts、day-policy.ts 的展示文案保持一致。
const TAXI_PET_HINT = "部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带";
const ESTIMATE_UNAVAILABLE = "估算暂不可用";
const LEASH_LINE = "当天需携带牵引绳";

interface EstimateSnapshot {
  durationMinutes: number;
  costLowYuan: number;
  costHighYuan: number;
}

interface PresetStop {
  poiId: string;
  toNext?: "walk" | "drive" | "transit" | "self_drive" | null;
  toNextEstimate?: EstimateSnapshot | null;
}

interface TripDetail {
  id: number;
  name: string;
  totalDays: number;
  startDate: string | null;
  transportMode: string | null;
  plan: {
    version: 1;
    days: { day: number; stops: PresetStop[] }[];
    unscheduled: { poiId: string }[];
  };
}

async function getTrip(page: Page, id: number): Promise<TripDetail> {
  const response = await page.request.get(`/api/trips/${id}`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as TripDetail;
}

async function putTripPatch(
  page: Page,
  id: number,
  patch: { plan?: TripDetail["plan"]; transportMode?: string | null },
) {
  const trip = await getTrip(page, id);
  const headers = await csrfHeaders(page);
  const response = await page.request.put(`/api/trips/${id}`, {
    headers,
    data: {
      name: trip.name,
      totalDays: trip.totalDays,
      // main 新增 startDate（可空）：透传现值，避免 PUT 全量覆盖语义下意外清空。
      startDate: trip.startDate,
      plan: patch.plan ?? trip.plan,
      transportMode:
        patch.transportMode !== undefined ? patch.transportMode : trip.transportMode,
    },
  });
  expect(response.ok()).toBeTruthy();
}

async function presetTrip(
  page: Page,
  input: {
    name: string;
    petName: string;
    totalDays: number;
    days: { day: number; stops: PresetStop[] }[];
    unscheduled?: { poiId: string }[];
    transportMode?: string | null;
  },
) {
  const pet = (await pets(page)).find((candidate) => candidate.name === input.petName);
  if (!pet) throw new Error(`Seed pet ${input.petName} not found`);
  const created = await createTripViaApi(page, {
    name: input.name,
    cityAdcode: "440400",
    petId: pet.id,
    totalDays: input.totalDays,
  });
  await putTripPatch(page, created.id, {
    plan: { version: 1, days: input.days, unscheduled: input.unscheduled ?? [] },
    transportMode: input.transportMode ?? null,
  });
  await completeTripViaApi(page, created.id);
  return created.id;
}

async function activateTrip(page: Page, name: string) {
  await openTrips(page);
  await tripCard(page, name).getByRole("button", { name: "编辑" }).click();
  await expect(page).toHaveURL(/\/attractions$/);
  await expect(page.getByTestId("trip-panel")).toBeVisible();
}

function nextPlanPut(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      /\/api\/trips\/\d+$/.test(new URL(response.url()).pathname),
  );
}

function trackPlanPuts(page: Page) {
  const puts: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "PUT" &&
      /\/api\/trips\/\d+$/.test(new URL(request.url()).pathname)
    ) {
      puts.push(request.url());
    }
  });
  return puts;
}

function countEstimateRequests(page: Page) {
  const counter = { count: 0, modes: [] as string[] };
  page.route(/\/api\/trips\/\d+\/route-estimate/, async (route) => {
    counter.count += 1;
    counter.modes.push(new URL(route.request().url()).searchParams.get("mode") ?? "");
    await route.continue();
  });
  return counter;
}

function stopOf(trip: TripDetail, day: number, index: number): PresetStop {
  const entry = trip.plan.days.find((candidate) => candidate.day === day);
  if (!entry || !entry.stops[index]) throw new Error(`Stop d${day}:${index} missing`);
  return entry.stops[index];
}

async function expectBefore(first: Locator, second: Locator) {
  const handle = await second.elementHandle();
  const follows = await first.evaluate(
    (node, other) =>
      !!other && !!(node.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING),
    handle,
  );
  expect(follows).toBeTruthy();
}

async function dragHandleTo(page: Page, stopName: string, target: Locator) {
  const handleButton = page
    .getByTestId("trip-panel")
    .getByRole("button", { name: `拖动${stopName}` })
    .first();
  const handle = (await handleButton.count()) > 0
    ? handleButton
    : page
        .getByTestId("trip-panel")
        .locator("[data-stop-id]")
        .filter({ hasText: stopName })
        .first();
  await handle.scrollIntoViewIfNeeded();
  await target.first().scrollIntoViewIfNeeded();
  const handleBox = await handle.boundingBox();
  const targetBox = await target.first().boundingBox();
  if (!handleBox || !targetBox) {
    throw new Error("Drag source or target is not visible");
  }
  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + 12, { steps: 5 });
  await page.mouse.move(endX, endY, { steps: 12 });
  await page.mouse.move(endX, endY + 2, { steps: 3 });
  await page.mouse.up();
}

function modeSelect(page: Page, selfDrive: boolean, index = 0) {
  return page
    .getByRole("combobox", {
      name: selfDrive ? "选择其他途内交通方式" : "选择途内交通方式",
      exact: true,
    })
    .nth(index);
}

// 面板景点排序列表（animated-list）也暴露 role=option；方式选项断言限定在打开的 Select 弹层内。
function modeOptions(page: Page) {
  return page.locator('[data-slot="select-content"]').getByRole("option");
}

const MODE_LABELS: Record<string, string> = { walk: "步行", drive: "打车", self_drive: "驾车" };

// 共享 Select（base-ui）交互：点开 combobox 后按文案选中 option
async function chooseMode(page: Page, selfDrive: boolean, mode: string, index = 0) {
  await modeSelect(page, selfDrive, index).click();
  await page.getByRole("option", { name: MODE_LABELS[mode], exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("E1 renders n-1 segment rows between stops, none for single/empty/unscheduled, not draggable", async ({
  page,
}) => {
  await presetTrip(page, {
    name: "珠海三日",
    petName: "豆豆",
    totalDays: 3,
    days: [
      { day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }, { poiId: "e2e-zhu-c" }] },
      { day: 2, stops: [{ poiId: "e2e-zhu-b" }] },
      { day: 3, stops: [] },
    ],
    unscheduled: [{ poiId: "e2e-zhu-c" }],
  });
  await activateTrip(page, "珠海三日");

  const segments = page.getByTestId("transport-segment");
  await expect(segments).toHaveCount(2);
  await expectBefore(page.locator('[data-stop-id="d1:0:e2e-zhu-a"]'), segments.first());
  await expectBefore(segments.first(), page.locator('[data-stop-id="d1:1:e2e-zhu-b"]'));
  await expectBefore(segments.nth(1), page.locator('[data-stop-id="d1:2:e2e-zhu-c"]'));
  // 段行自身不可拖拽：没有拖拽把手。
  await expect(segments.getByRole("button", { name: /^拖动/ })).toHaveCount(0);
});

test("E2 default taxi display never writes toNext or snapshot", async ({ page }) => {
  const id = await presetTrip(page, {
    name: "珠海两日",
    petName: "豆豆",
    totalDays: 1,
    days: [{ day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] }],
  });
  await activateTrip(page, "珠海两日");
  const puts = trackPlanPuts(page);

  const segment = page.getByTestId("transport-segment").first();
  await expect(segment.getByTestId("segment-mode")).toContainText("打车");
  // 坐标 NULL → 估算确定性失败，证明查询已走完仍未写库。
  await expect(segment.getByText(ESTIMATE_UNAVAILABLE)).toBeVisible();
  await expect(segment.getByText(TAXI_PET_HINT)).toBeVisible();

  expect(puts).toHaveLength(0);
  const trip = await getTrip(page, id);
  expect(stopOf(trip, 1, 0).toNext ?? null).toBeNull();
  expect(stopOf(trip, 1, 0).toNextEstimate ?? null).toBeNull();
});

test("E3 snapshot-first display issues zero estimate requests and survives reload", async ({
  page,
}) => {
  const counter = countEstimateRequests(page);
  const id = await presetTrip(page, {
    name: "珠海快照",
    petName: "豆豆",
    totalDays: 1,
    days: [
      {
        day: 1,
        stops: [
          {
            poiId: "e2e-zhu-a",
            toNext: "drive",
            toNextEstimate: { durationMinutes: 12, costLowYuan: 40, costHighYuan: 60 },
          },
          { poiId: "e2e-zhu-b" },
        ],
      },
    ],
  });
  await activateTrip(page, "珠海快照");

  const segment = page.getByTestId("transport-segment").first();
  await expect(segment.getByText("约 12 分钟")).toBeVisible();
  await expect(segment.getByText("¥40–60")).toBeVisible();
  expect(counter.count).toBe(0);

  await page.reload();
  await page.waitForSelector("html[data-app-ready='true']", {
    timeout: 15_000,
  });
  await expect(page.getByTestId("transport-segment").first().getByText("约 12 分钟")).toBeVisible();
  expect(counter.count).toBe(0);
  const trip = await getTrip(page, id);
  expect(stopOf(trip, 1, 0).toNextEstimate).toEqual({
    durationMinutes: 12,
    costLowYuan: 40,
    costHighYuan: 60,
  });
});

test("E4 switching to walk saves mode only and restores after reload", async ({ page }) => {
  const id = await presetTrip(page, {
    name: "珠海切换",
    petName: "豆豆",
    totalDays: 1,
    days: [{ day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] }],
  });
  await activateTrip(page, "珠海切换");

  const put = nextPlanPut(page);
  await chooseMode(page, false, "walk");
  expect((await put).status()).toBe(200);

  const trip = await getTrip(page, id);
  expect(stopOf(trip, 1, 0).toNext).toBe("walk");
  // CI 无 Key：估算失败仅存方式，不写伪造快照。
  expect(stopOf(trip, 1, 0).toNextEstimate ?? null).toBeNull();

  await page.reload();
  const segment = page.getByTestId("transport-segment").first();
  await expect(segment.getByTestId("segment-mode")).toContainText("步行");
  await expect(modeSelect(page, false)).toContainText("步行");
});

test("E10 drag reorder and cross-day move reset the moved stop's transport", async ({ page }) => {
  const id = await presetTrip(page, {
    name: "珠海拖拽",
    petName: "豆豆",
    totalDays: 2,
    days: [
      {
        day: 1,
        stops: [
          {
            poiId: "e2e-zhu-a",
            toNext: "drive",
            toNextEstimate: { durationMinutes: 12, costLowYuan: 40, costHighYuan: 60 },
          },
          {
            poiId: "e2e-zhu-b",
            toNext: "walk",
            toNextEstimate: { durationMinutes: 8, costLowYuan: 0, costHighYuan: 0 },
          },
        ],
      },
      { day: 2, stops: [{ poiId: "e2e-zhu-c" }] },
    ],
  });
  await activateTrip(page, "珠海拖拽");
  await expect(page.getByTestId("transport-segment").first().getByText("约 12 分钟")).toBeVisible();
  // AnimatedList 入场弹簧动画 620ms + 每行 50ms stagger，拖拽前等待行坐标稳定，否则 boundingBox 漂移导致拖放落空。
  await page.waitForTimeout(1200);

  // 同日重排：b 拖到 a 上 → [b, a]，被拖动的 b 丢弃原方式与快照，等待用户重新选择；未移动的 a 保留。
  let put = nextPlanPut(page);
  await dragHandleTo(page, "珠海渔女", page.locator('[data-stop-id="d1:0:e2e-zhu-a"]'));
  await put;
  let trip = await getTrip(page, id);
  expect(trip.plan.days.find((entry) => entry.day === 1)?.stops.map((stop) => stop.poiId)).toEqual([
    "e2e-zhu-b",
    "e2e-zhu-a",
  ]);
  const moved = stopOf(trip, 1, 0);
  expect(moved.poiId).toBe("e2e-zhu-b");
  expect(moved.toNext ?? null).toBeNull();
  expect(moved.toNextEstimate ?? null).toBeNull();
  expect(stopOf(trip, 1, 1).toNext).toBe("drive");
  expect(stopOf(trip, 1, 1).toNextEstimate).toEqual({
    durationMinutes: 12,
    costLowYuan: 40,
    costHighYuan: 60,
  });
  // 段行回到默认方式（打车），原步行快照不再展示。
  const segment = page.getByTestId("transport-segment").first();
  await expect(segment.getByTestId("segment-mode")).toContainText("打车");
  await expect(segment.getByText("约 8 分钟")).toHaveCount(0);

  // 跨天移动：a 拖到第 2 天 → day2 追加 a，a 的旧快照同样清空。
  // 重排后行位置过渡动画同样为 620ms，等待落定后再拖拽。
  await page.waitForTimeout(800);
  put = nextPlanPut(page);
  await dragHandleTo(
    page,
    "情侣路",
    page.getByTestId("trip-panel").getByText("Day 2", { exact: true }),
  );
  await put;
  trip = await getTrip(page, id);
  expect(trip.plan.days.find((entry) => entry.day === 2)?.stops.map((stop) => stop.poiId)).toEqual([
    "e2e-zhu-c",
    "e2e-zhu-a",
  ]);
  const movedCrossDay = stopOf(trip, 2, 1);
  expect(movedCrossDay.poiId).toBe("e2e-zhu-a");
  expect(movedCrossDay.toNext ?? null).toBeNull();
  expect(movedCrossDay.toNextEstimate ?? null).toBeNull();
});

test("E12 drive-mode dropdown saves taxi and explicit self-drive, restores after reload", async ({
  page,
}) => {
  const id = await presetTrip(page, {
    name: "珠海自驾切换",
    petName: "豆豆",
    totalDays: 1,
    days: [{ day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] }],
    transportMode: "drive",
  });
  await activateTrip(page, "珠海自驾切换");

  // 下拉选打车 → 仅存方式（CI 无 Key），携宠提示展示。
  let put = nextPlanPut(page);
  await chooseMode(page, true, "drive");
  expect((await put).status()).toBe(200);
  let trip = await getTrip(page, id);
  expect(stopOf(trip, 1, 0).toNext).toBe("drive");
  expect(stopOf(trip, 1, 0).toNextEstimate ?? null).toBeNull();
  await expect(page.getByText(TAXI_PET_HINT)).toHaveCount(1);

  // 显式切回驾车 → toNext=self_drive 写库。
  put = nextPlanPut(page);
  await chooseMode(page, true, "self_drive");
  await put;
  trip = await getTrip(page, id);
  expect(stopOf(trip, 1, 0).toNext).toBe("self_drive");
  await expect(page.getByTestId("transport-segment").first().getByTestId("segment-mode")).toContainText("驾车");
  await expect(page.getByText(TAXI_PET_HINT)).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId("transport-segment").first().getByTestId("segment-mode")).toContainText("驾车");
  await expect(modeSelect(page, true)).toContainText("驾车");
});
