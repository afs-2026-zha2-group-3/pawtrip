import { expect, test, type Locator, type Page, type Request } from "@playwright/test";
import {
  createTripViaApi,
  csrfHeaders,
  openTrips,
  pets,
  resetTrips,
  signIn,
  tripCard,
} from "./trip-helpers";

// US-69：地点浏览页「每日景点行程」面板还原行程面板的提示与途内交通。
// 文案与 apps/web/src/lib/trip/transport-segments.ts、day-policy.ts 保持一致。
const TRANSIT_PET_NOTICE = "地铁/公交：不可携带宠物上车";
const LEASH_LINE = "当天需携带牵引绳";
const TAXI_PET_HINT = "部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带";

interface TripDetail {
  id: number;
  name: string;
  totalDays: number;
  startDate: string | null;
  transportMode: string | null;
}

async function getTrip(page: Page, id: number): Promise<TripDetail> {
  const response = await page.request.get(`/api/trips/${id}`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as TripDetail;
}

async function presetTwoStopTrip(
  page: Page,
  transportMode: string | null,
  firstStop: Record<string, unknown> = { poiId: "e2e-zhu-a" },
) {
  const pet = (await pets(page)).find((candidate) => candidate.name === "豆豆");
  if (!pet) throw new Error("Seed pet 豆豆 not found");
  const created = await createTripViaApi(page, {
    name: "珠海提示还原",
    cityAdcode: "440400",
    petId: pet.id,
    totalDays: 1,
  });
  const trip = await getTrip(page, created.id);
  const headers = await csrfHeaders(page);
  const response = await page.request.put(`/api/trips/${created.id}`, {
    headers,
    data: {
      name: trip.name,
      totalDays: trip.totalDays,
      startDate: trip.startDate,
      transportMode,
      plan: {
        version: 1,
        days: [{ day: 1, stops: [firstStop, { poiId: "e2e-zhu-b" }] }],
        unscheduled: [],
      },
    },
  });
  expect(response.ok()).toBeTruthy();
  return created.id;
}

async function activateAndOpenAttractions(page: Page, name: string) {
  await openTrips(page);
  await tripCard(page, name).getByRole("button", { name: "编辑" }).click();
  await expect(page).toHaveURL(/\/attractions$/);
  await expect(page.getByTestId("trip-panel")).toBeVisible();
}

async function dragStop(page: Page, from: Locator, to: Locator) {
  const fromBox = (await from.boundingBox())!;
  const toBox = (await to.boundingBox())!;
  await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    fromBox.x + fromBox.width / 2,
    fromBox.y + fromBox.height / 2 + 12,
    { steps: 5 },
  );
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, { steps: 10 });
  await page.mouse.up();
}

async function savedStopOrder(request: Request): Promise<string[]> {
  const body = request.postDataJSON() as {
    plan: { days: { stops: { poiId: string }[] }[] };
  };
  return body.plan.days[0].stops.map((stop) => stop.poiId);
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("timeline panel shows transit notice, leash reminder and a transport segment", async ({
  page,
}) => {
  await presetTwoStopTrip(page, null);
  await activateAndOpenAttractions(page, "珠海提示还原");

  const panel = page.getByTestId("trip-panel");
  await expect(panel.getByTestId("transit-pet-notice")).toHaveText(TRANSIT_PET_NOTICE);
  await expect(panel.getByTestId("day-policy-reminder")).toHaveText(LEASH_LINE);

  const segments = panel.getByTestId("transport-segment");
  await expect(segments).toHaveCount(1);
  await expect(panel.getByLabel("选择途内交通方式", { exact: true })).toBeVisible();
  // CI 无高德 Key：默认打车估算失败，段行展示兜底文案而非耗时。
  await expect(panel.getByText(/约 \d+ 分钟/)).toHaveCount(0);
  await expect(panel.getByText("估算暂不可用")).toBeVisible();

  // 顺序与行程面板一致：公交提示 → 政策提醒 → 首个景点 → 交通段 → 第二个景点
  const notice = panel.getByTestId("transit-pet-notice");
  const reminder = panel.getByTestId("day-policy-reminder");
  const firstStop = panel.locator('[data-stop-id="d1:0:e2e-zhu-a"]');
  const secondStop = panel.locator('[data-stop-id="d1:1:e2e-zhu-b"]');
  await expect(firstStop).toBeVisible();
  await expect(secondStop).toBeVisible();
  const follows = async (a: ReturnType<typeof panel.locator>, b: ReturnType<typeof panel.locator>) => {
    const handle = await b.elementHandle();
    return a.evaluate(
      (node, other) =>
        !!other && !!(node.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING),
      handle,
    );
  };
  expect(await follows(notice, reminder)).toBeTruthy();
  expect(await follows(reminder, firstStop)).toBeTruthy();
  expect(await follows(firstStop, segments.first())).toBeTruthy();
  expect(await follows(segments.first(), secondStop)).toBeTruthy();
});
test("timeline rail connects both stop dots through taxi and walk segments", async ({
  page,
}) => {
  await presetTwoStopTrip(page, null, {
    poiId: "e2e-zhu-a",
    toNext: "drive",
    toNextEstimate: { durationMinutes: 12, costLowYuan: 40, costHighYuan: 60 },
  });
  await activateAndOpenAttractions(page, "珠海提示还原");

  const panel = page.getByTestId("trip-panel");
  const firstStop = panel.locator('[data-stop-id="d1:0:e2e-zhu-a"]');
  const secondStop = panel.locator('[data-stop-id="d1:1:e2e-zhu-b"]');
  const segment = panel.getByTestId("transport-segment").first();
  const select = segment.getByRole("combobox", { name: "选择途内交通方式" });

  const assertRailConnected = async () => {
    const first = (await firstStop.boundingBox())!;
    const second = (await secondStop.boundingBox())!;
    // 圆点位于景点行（h-11）垂直中心；行左缘 -23px 起、直径 10px，故中心在左缘 -18px
    const topDotY = first.y + first.height / 2;
    const bottomDotY = second.y + second.height / 2;
    const dotCenterX = first.x - 18;
    const rails = await panel.getByTestId("timeline-rail").all();
    expect(rails.length).toBe(3);
    const boxes = [];
    for (const rail of rails) {
      const box = (await rail.boundingBox())!;
      expect(Math.abs(box.x + box.width / 2 - dotCenterX)).toBeLessThanOrEqual(1);
      boxes.push(box);
    }
    boxes.sort((a, b) => a.y - b.y);
    expect(Math.abs(boxes[0].y - topDotY)).toBeLessThanOrEqual(1);
    expect(
      Math.abs(boxes[boxes.length - 1].y + boxes[boxes.length - 1].height - bottomDotY),
    ).toBeLessThanOrEqual(1);
    for (let index = 1; index < boxes.length; index += 1) {
      expect(boxes[index].y).toBeLessThanOrEqual(boxes[index - 1].y + boxes[index - 1].height + 1);
    }
  };

  await expect(segment.getByTestId("segment-mode")).toContainText("打车");
  await expect(panel.getByText(TAXI_PET_HINT)).toBeVisible();
  await assertRailConnected();

  await select.click();
  await page.getByRole("option", { name: "步行", exact: true }).click();
  await expect(segment.getByTestId("segment-mode")).toContainText("步行");
  await assertRailConnected();
});

test("reorders timeline stops downward and upward", async ({ page }) => {
  await presetTwoStopTrip(page, null);
  await activateAndOpenAttractions(page, "珠海提示还原");

  const panel = page.getByTestId("trip-panel");
  const first = panel.locator('[data-stop-id="d1:0:e2e-zhu-a"]');
  const second = panel.locator('[data-stop-id="d1:1:e2e-zhu-b"]');
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();

  const waitForSave = () =>
    page.waitForRequest(
      (candidate) =>
        candidate.method() === "PUT" && /\/api\/trips\/\d+$/.test(candidate.url()),
      { timeout: 15000 },
    );

  // 从上往下拖：此前该方向是空操作，顺序必须互换并提交。
  const downSave = waitForSave();
  await dragStop(page, first, second);
  expect(await savedStopOrder(await downSave)).toEqual(["e2e-zhu-b", "e2e-zhu-a"]);
  const movedFirst = panel.locator('[data-stop-id="d1:0:e2e-zhu-b"]');
  const movedSecond = panel.locator('[data-stop-id="d1:1:e2e-zhu-a"]');
  await expect(movedFirst).toBeVisible();
  await expect(movedSecond).toBeVisible();

  // 从下往上拖回：恢复原顺序。
  const upSave = waitForSave();
  await dragStop(page, movedFirst, movedSecond);
  expect(await savedStopOrder(await upSave)).toEqual(["e2e-zhu-a", "e2e-zhu-b"]);
  await expect(panel.locator('[data-stop-id="d1:0:e2e-zhu-a"]')).toBeVisible();
});
