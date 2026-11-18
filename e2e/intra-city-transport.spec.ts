import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  completeTripViaApi,
  createTripViaApi,
  csrfHeaders,
  openCities,
  openTrips,
  openTripDialog,
  pets,
  resetTrips,
  signIn,
  tripCard,
} from "./trip-helpers";

// 与 apps/web/src/lib/trip/transport-segments.ts、day-policy.ts 的展示文案保持一致。
const TAXI_PET_HINT = "部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带";
const TRANSIT_PET_NOTICE = "地铁/公交：不可携带宠物上车";
const SAME_POI_NOTE = "与上一景点相同，无需途内交通";
const ESTIMATE_UNAVAILABLE = "估算暂不可用";
const LEASH_LINE = "当天需携带牵引绳";
const LEASH_MISSING_LINE = "当天需携带牵引绳（档案未登记牵引绳，请自备）";
const SIZE_LINE_ZHU_A = "您的宠物「毛毛」超出景点 情侣路 限制（≤8.5kg/≤40cm）";

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
  await openTrips(page);
  await expect(tripCard(page, name)).toContainText("编辑中");
  await expect(page.getByTestId("trip-panel")).toBeVisible();
}

async function expandPanel(page: Page) {
  await page.getByRole("button", { name: "展开行程面板" }).click();
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
  const handle = page
    .getByTestId("trip-panel")
    .getByRole("button", { name: `拖动${stopName}` })
    .first();
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
  await expandPanel(page);

  const segments = page.getByTestId("transport-segment");
  await expect(segments).toHaveCount(2);
  await expectBefore(page.locator('[data-stop-id="d1:0:e2e-zhu-a"]'), segments.first());
  await expectBefore(segments.first(), page.locator('[data-stop-id="d1:1:e2e-zhu-b"]'));
  await expectBefore(segments.nth(1), page.locator('[data-stop-id="d1:2:e2e-zhu-c"]'));
  // 段行自身不可拖拽：没有拖拽把手。
  await expect(segments.getByRole("button", { name: /^拖动/ })).toHaveCount(0);
});

test("E1 pre-confirmation state shows no transport segments", async ({ page }) => {
  await openCities(page);
  // main（PR #64/#66）将草稿入口改为行程确认弹窗：确认前状态同样不得渲染段行/公交提示。
  // 原「未确认草稿」面板分支仍在 trip-panel 中保留，但 UI 已无入口，改验弹窗前置态。
  await openTripDialog(page, "珠海市");
  await expect(page.getByTestId("transport-segment")).toHaveCount(0);
  await expect(page.getByTestId("transit-pet-notice")).toHaveCount(0);
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
  await expect(segment.getByTestId("segment-mode")).toHaveText("打车");
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
  await expect(page.getByTestId("save-status")).toContainText("已保存");

  const trip = await getTrip(page, id);
  expect(stopOf(trip, 1, 0).toNext).toBe("walk");
  // CI 无 Key：估算失败仅存方式，不写伪造快照。
  expect(stopOf(trip, 1, 0).toNextEstimate ?? null).toBeNull();

  await page.reload();
  const segment = page.getByTestId("transport-segment").first();
  await expect(segment.getByTestId("segment-mode")).toHaveText("步行");
  await expect(modeSelect(page, false)).toContainText("步行");
});

test("E5 shows one transit notice only for days with segments", async ({ page }) => {
  await presetTrip(page, {
    name: "珠海提示",
    petName: "豆豆",
    totalDays: 3,
    days: [
      { day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] },
      { day: 2, stops: [{ poiId: "e2e-zhu-c" }] },
      { day: 3, stops: [] },
    ],
  });
  await activateTrip(page, "珠海提示");
  await expandPanel(page);

  const notices = page.getByTestId("transit-pet-notice");
  await expect(notices).toHaveCount(1);
  await expect(notices.first()).toHaveText(TRANSIT_PET_NOTICE);
  await expectBefore(notices.first(), page.locator('[data-stop-id="d1:0:e2e-zhu-a"]'));
});

test("E6 taxi pet hint follows the segment mode", async ({ page }) => {
  await presetTrip(page, {
    name: "珠海携宠",
    petName: "豆豆",
    totalDays: 1,
    days: [
      { day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }, { poiId: "e2e-zhu-c" }] },
    ],
  });
  await activateTrip(page, "珠海携宠");
  await expandPanel(page);

  await expect(page.getByText(TAXI_PET_HINT)).toHaveCount(2);
  const put = nextPlanPut(page);
  await chooseMode(page, false, "walk", 0);
  await put;
  await expect(page.getByText(TAXI_PET_HINT)).toHaveCount(1);
  await expect(
    page.getByTestId("transport-segment").first().getByTestId("segment-mode"),
  ).toHaveText("步行");
});

test("E6 self-drive segment shows no taxi hint", async ({ page }) => {
  await presetTrip(page, {
    name: "珠海驾车段",
    petName: "豆豆",
    totalDays: 1,
    days: [
      {
        day: 1,
        stops: [
          {
            poiId: "e2e-zhu-a",
            toNext: "self_drive",
            toNextEstimate: { durationMinutes: 15, costLowYuan: 0, costHighYuan: 0 },
          },
          { poiId: "e2e-zhu-b" },
        ],
      },
    ],
    transportMode: "drive",
  });
  await activateTrip(page, "珠海驾车段");

  const segment = page.getByTestId("transport-segment").first();
  await expect(segment.getByTestId("segment-mode")).toHaveText("驾车");
  await expect(page.getByText(TAXI_PET_HINT)).toHaveCount(0);
});

test("E7 policy reminder keeps leash line; size warning names the pet below its own stop", async ({
  page,
}) => {
  const id = await presetTrip(page, {
    name: "珠海政策",
    petName: "毛毛",
    totalDays: 1,
    days: [{ day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] }],
  });
  await activateTrip(page, "珠海政策");
  const puts = trackPlanPuts(page);

  const reminder = page.getByTestId("day-policy-reminder");
  await expect(reminder.getByText(LEASH_LINE, { exact: true })).toBeVisible();
  // 体型警示点名宠物，位于对应景点行下方（2026-11-17 修订）
  const sizeWarning = page.getByTestId("stop-size-warning");
  await expect(sizeWarning).toHaveText(SIZE_LINE_ZHU_A);
  await expectBefore(page.locator('[data-stop-id="d1:0:e2e-zhu-a"]'), sizeWarning);
  await expect(reminder).not.toContainText("超出景点");
  // 位置：公交提示之后、当天首个景点行之前。
  await expectBefore(page.getByTestId("transit-pet-notice").first(), reminder);
  await expectBefore(reminder, page.locator('[data-stop-id="d1:0:e2e-zhu-a"]'));
  // 提醒纯前端渲染：不触发额外保存。
  expect(puts).toHaveLength(0);
  const trip = await getTrip(page, id);
  expect(stopOf(trip, 1, 0).toNext ?? null).toBeNull();
});

test("E7 pet within limits gets the leash line only", async ({ page }) => {
  await presetTrip(page, {
    name: "珠海未超限",
    petName: "豆豆",
    totalDays: 1,
    days: [{ day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] }],
  });
  await activateTrip(page, "珠海未超限");

  const reminder = page.getByTestId("day-policy-reminder");
  await expect(reminder).toHaveText(LEASH_LINE);
  await expect(page.getByText(/超出景点/)).toHaveCount(0);
});

test("E7 hasLeash=false strengthens the leash line", async ({ page }) => {
  const headers = await csrfHeaders(page);
  const created = await page.request.post("/api/pets", {
    headers,
    data: {
      name: "无绳猫",
      petType: "CAT",
      weightKg: 5,
      shoulderHeightCm: 30,
      hasLeash: false,
      hasVaccinationProof: true,
      photo: null,
      dogBreedId: null,
    },
  });
  expect(created.ok()).toBeTruthy();
  const pet = (await created.json()) as { id: number };
  try {
    const trip = await createTripViaApi(page, {
      name: "珠海无绳",
      cityAdcode: "440400",
      petId: pet.id,
      totalDays: 1,
    });
    await putTripPatch(page, trip.id, {
      plan: { version: 1, days: [{ day: 1, stops: [{ poiId: "e2e-zhu-a" }] }], unscheduled: [] },
    });
    await completeTripViaApi(page, trip.id);
    await activateTrip(page, "珠海无绳");

    const reminder = page.getByTestId("day-policy-reminder");
    await expect(reminder).toHaveText(LEASH_MISSING_LINE);
    await expect(page.getByText(/超出景点/)).toHaveCount(0);
  } finally {
    await resetTrips(page);
    await page.request.delete(`/api/pets/${pet.id}`, { headers: await csrfHeaders(page) });
  }
});

test("E7 null policies, empty days and unscheduled stops never trigger reminders", async ({
  page,
}) => {
  await presetTrip(page, {
    name: "珠海无触发",
    petName: "毛毛",
    totalDays: 2,
    days: [
      { day: 1, stops: [{ poiId: "e2e-zhu-d" }] },
      { day: 2, stops: [] },
    ],
    unscheduled: [{ poiId: "e2e-zhu-a" }],
  });
  await activateTrip(page, "珠海无触发");
  await expandPanel(page);

  await expect(page.locator('[data-stop-id="u:0:e2e-zhu-a"]')).toBeVisible();
  await expect(page.getByTestId("day-policy-reminder")).toHaveCount(0);
  await expect(page.getByTestId("transit-pet-notice")).toHaveCount(0);
});

test("E8 same-POI segment shows note only with zero requests and no writes", async ({ page }) => {
  const counter = countEstimateRequests(page);
  const id = await presetTrip(page, {
    name: "珠海同点",
    petName: "豆豆",
    totalDays: 1,
    days: [{ day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-a" }] }],
  });
  await activateTrip(page, "珠海同点");
  const puts = trackPlanPuts(page);

  await expect(page.getByTestId("same-poi-note")).toHaveText(SAME_POI_NOTE);
  await expect(page.getByTestId("transport-segment")).toHaveCount(0);
  await expect(page.getByLabel("选择途内交通方式", { exact: true })).toHaveCount(0);
  expect(counter.count).toBe(0);
  expect(puts).toHaveLength(0);
  const trip = await getTrip(page, id);
  expect(stopOf(trip, 1, 0).toNext ?? null).toBeNull();
  expect(stopOf(trip, 1, 1).toNext ?? null).toBeNull();
});

test("E9 estimate failure falls back without blocking mode save", async ({ page }) => {
  const id = await presetTrip(page, {
    name: "珠海兜底",
    petName: "豆豆",
    totalDays: 1,
    days: [{ day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] }],
  });
  await activateTrip(page, "珠海兜底");

  const segment = page.getByTestId("transport-segment").first();
  await expect(segment.getByText(ESTIMATE_UNAVAILABLE)).toBeVisible();

  const put = nextPlanPut(page);
  await chooseMode(page, false, "walk");
  expect((await put).status()).toBe(200);
  await expect(page.getByTestId("save-status")).toContainText("已保存");
  await expect(segment.getByTestId("segment-mode")).toHaveText("步行");
  await expect(segment.getByText(ESTIMATE_UNAVAILABLE)).toBeVisible();
  await expect(segment.getByText(/约 \d+ 分钟/)).toHaveCount(0);

  const trip = await getTrip(page, id);
  expect(stopOf(trip, 1, 0).toNext).toBe("walk");
  expect(stopOf(trip, 1, 0).toNextEstimate ?? null).toBeNull();
});

test("E10 drag reorder and cross-day move keep snapshots attached", async ({ page }) => {
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
          { poiId: "e2e-zhu-b" },
        ],
      },
      { day: 2, stops: [{ poiId: "e2e-zhu-c" }] },
    ],
  });
  await activateTrip(page, "珠海拖拽");
  await expandPanel(page);
  await expect(page.getByTestId("transport-segment").first().getByText("约 12 分钟")).toBeVisible();
  // AnimatedList 入场弹簧动画 620ms + 每行 50ms stagger，拖拽前等待行坐标稳定，否则 boundingBox 漂移导致拖放落空。
  await page.waitForTimeout(1200);

  // 同日重排：b 拖到 a 上 → [b, a]，a 的快照随 stop 透传。
  let put = nextPlanPut(page);
  await dragHandleTo(page, "珠海渔女", page.locator('[data-stop-id="d1:0:e2e-zhu-a"]'));
  await put;
  let trip = await getTrip(page, id);
  expect(trip.plan.days.find((entry) => entry.day === 1)?.stops.map((stop) => stop.poiId)).toEqual([
    "e2e-zhu-b",
    "e2e-zhu-a",
  ]);
  expect(stopOf(trip, 1, 1).toNext).toBe("drive");
  expect(stopOf(trip, 1, 1).toNextEstimate).toEqual({
    durationMinutes: 12,
    costLowYuan: 40,
    costHighYuan: 60,
  });

  // 跨天移动：a 拖到第 2 天 → day2 追加 a，快照不丢。
  // 重排后行位置过渡动画同样为 620ms，等待落定后再拖拽。
  await page.waitForTimeout(800);
  put = nextPlanPut(page);
  await dragHandleTo(
    page,
    "情侣路",
    page.getByTestId("trip-panel").getByText("第 2 天", { exact: true }),
  );
  await put;
  trip = await getTrip(page, id);
  expect(trip.plan.days.find((entry) => entry.day === 2)?.stops.map((stop) => stop.poiId)).toEqual([
    "e2e-zhu-c",
    "e2e-zhu-a",
  ]);
  expect(stopOf(trip, 2, 1).toNext).toBe("drive");
  expect(stopOf(trip, 2, 1).toNextEstimate).toEqual({
    durationMinutes: 12,
    costLowYuan: 40,
    costHighYuan: 60,
  });
});

test("E11 self-drive default shows driving duration-only without writing", async ({ page }) => {
  const id = await presetTrip(page, {
    name: "珠海自驾",
    petName: "豆豆",
    totalDays: 1,
    days: [{ day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }] }],
    transportMode: "drive",
  });
  await activateTrip(page, "珠海自驾");
  const puts = trackPlanPuts(page);

  const segment = page.getByTestId("transport-segment").first();
  await expect(segment.getByTestId("segment-mode")).toHaveText("驾车");
  // 坐标 NULL → 驾车时长估算确定性失败兜底；无费用展示。
  await expect(segment.getByText(ESTIMATE_UNAVAILABLE)).toBeVisible();
  await expect(segment.getByText(/¥/)).toHaveCount(0);
  await expect(page.getByText(TAXI_PET_HINT)).toHaveCount(0);
  await expect(page.getByTestId("transit-pet-notice")).toHaveCount(0);
  await modeSelect(page, true).click();
  await expect(modeOptions(page)).toHaveText(["打车", "步行", "驾车"]);
  await page.keyboard.press("Escape");

  expect(puts).toHaveLength(0);
  const trip = await getTrip(page, id);
  expect(stopOf(trip, 1, 0).toNext ?? null).toBeNull();
  expect(stopOf(trip, 1, 0).toNextEstimate ?? null).toBeNull();
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
  await expect(page.getByTestId("save-status")).toContainText("已保存");
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
  await expect(page.getByTestId("transport-segment").first().getByTestId("segment-mode")).toHaveText("驾车");
  await expect(page.getByText(TAXI_PET_HINT)).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId("transport-segment").first().getByTestId("segment-mode")).toHaveText("驾车");
  await expect(modeSelect(page, true)).toContainText("驾车");
});

test("E12 preset self-drive snapshot shows duration only with zero requests", async ({ page }) => {
  const counter = countEstimateRequests(page);
  const id = await presetTrip(page, {
    name: "珠海驾车快照",
    petName: "豆豆",
    totalDays: 1,
    days: [
      {
        day: 1,
        stops: [
          {
            poiId: "e2e-zhu-a",
            toNext: "self_drive",
            toNextEstimate: { durationMinutes: 15, costLowYuan: 0, costHighYuan: 0 },
          },
          { poiId: "e2e-zhu-b" },
        ],
      },
    ],
    transportMode: "drive",
  });
  await activateTrip(page, "珠海驾车快照");

  const segment = page.getByTestId("transport-segment").first();
  await expect(segment.getByText("约 15 分钟")).toBeVisible();
  await expect(segment.getByText(/¥/)).toHaveCount(0);
  expect(counter.count).toBe(0);

  await page.reload();
  await expect(page.getByTestId("transport-segment").first().getByText("约 15 分钟")).toBeVisible();
  expect(counter.count).toBe(0);
  const trip = await getTrip(page, id);
  expect(stopOf(trip, 1, 0).toNext).toBe("self_drive");
  expect(stopOf(trip, 1, 0).toNextEstimate).toEqual({
    durationMinutes: 15,
    costLowYuan: 0,
    costHighYuan: 0,
  });
});

test("E13 drive hides transit notice; switching back restores it without rewriting choices", async ({
  page,
}) => {
  const counter = countEstimateRequests(page);
  const id = await presetTrip(page, {
    name: "珠海联动",
    petName: "豆豆",
    totalDays: 1,
    days: [
      {
        day: 1,
        stops: [
          {
            poiId: "e2e-zhu-a",
            toNext: "self_drive",
            toNextEstimate: { durationMinutes: 15, costLowYuan: 0, costHighYuan: 0 },
          },
          { poiId: "e2e-zhu-b" },
        ],
      },
    ],
    transportMode: "drive",
  });
  await activateTrip(page, "珠海联动");

  // 自驾：公交提示隐藏，政策提醒仍在；已存 self_drive 仅时长展示。
  await expect(page.getByTestId("transit-pet-notice")).toHaveCount(0);
  await expect(page.getByTestId("day-policy-reminder")).toHaveText(LEASH_LINE);
  const segment = page.getByTestId("transport-segment").first();
  await expect(segment.getByTestId("segment-mode")).toHaveText("驾车");
  await expect(segment.getByText("约 15 分钟")).toBeVisible();
  const planBefore = (await getTrip(page, id)).plan;

  // 切回公共交通：仅 PUT transportMode 既有字段。
  await putTripPatch(page, id, { transportMode: "high_speed_rail" });
  await page.reload();

  await expect(page.getByTestId("transit-pet-notice")).toHaveCount(1);
  await expect(page.getByTestId("day-policy-reminder")).toHaveText(LEASH_LINE);
  // 已存 self_drive 段不改写：仍按驾车仅时长展示，零估算请求。
  await expect(segment.getByTestId("segment-mode")).toHaveText("驾车");
  await expect(segment.getByText("约 15 分钟")).toBeVisible();
  await expect(segment.getByText(/¥/)).toHaveCount(0);
  expect(counter.count).toBe(0);
  // 公共交通模式选择器无驾车选项；已存 self_drive 以占位文案展示。
  const select = modeSelect(page, false);
  await expect(select).toContainText("切换方式");
  await select.click();
  await expect(modeOptions(page)).toHaveText(["打车", "步行"]);
  await page.keyboard.press("Escape");

  const trip = await getTrip(page, id);
  expect(trip.transportMode).toBe("high_speed_rail");
  expect(trip.plan).toEqual(planBefore);
});

test("mode selector only offers taxi/walk/self-drive and estimates walk/drive", async ({
  page,
}) => {
  const counter = countEstimateRequests(page);
  await presetTrip(page, {
    name: "珠海反向",
    petName: "豆豆",
    totalDays: 1,
    days: [
      { day: 1, stops: [{ poiId: "e2e-zhu-a" }, { poiId: "e2e-zhu-b" }, { poiId: "e2e-zhu-c" }] },
    ],
    transportMode: "drive",
  });
  await activateTrip(page, "珠海反向");
  await expandPanel(page);

  // 方式选择器无租车/公交/地铁选项；估算只走 walk/drive。
  const selectors = page.getByTestId("transport-segment").getByRole("combobox");
  const selectorCount = await selectors.count();
  expect(selectorCount).toBeGreaterThan(0);
  for (let i = 0; i < selectorCount; i += 1) {
    await selectors.nth(i).click();
    // 弹层挂载后再读选项，避免 allTextContents 无重试导致空读。
    await expect(modeOptions(page).first()).toBeVisible();
    const optionTexts = await modeOptions(page).allTextContents();
    expect(optionTexts.length).toBeGreaterThan(0);
    for (const text of optionTexts) {
      expect(["打车", "步行", "驾车"]).toContain(text);
    }
    await page.keyboard.press("Escape");
  }
  expect(counter.modes.every((mode) => mode === "walk" || mode === "drive")).toBeTruthy();
});