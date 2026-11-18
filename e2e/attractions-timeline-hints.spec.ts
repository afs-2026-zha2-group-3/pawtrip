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
  // US-73：未选择方式时不显示耗时
  await expect(panel.getByText(/约 \d+ 分钟/)).toHaveCount(0);

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

test("timeline panel hides transit notice in self-drive but keeps reminder and segment", async ({
  page,
}) => {
  await presetTwoStopTrip(page, "drive");
  await activateAndOpenAttractions(page, "珠海提示还原");

  const panel = page.getByTestId("trip-panel");
  await expect(panel.getByTestId("day-policy-reminder")).toHaveText(LEASH_LINE);
  await expect(panel.getByTestId("transit-pet-notice")).toHaveCount(0);
  await expect(panel.getByTestId("transport-segment")).toHaveCount(1);
});

test("timeline taxi segment shows price range and pet hint from a saved snapshot", async ({
  page,
}) => {
  await presetTwoStopTrip(page, null, {
    poiId: "e2e-zhu-a",
    toNext: "drive",
    toNextEstimate: { durationMinutes: 12, costLowYuan: 40, costHighYuan: 60 },
  });
  await activateAndOpenAttractions(page, "珠海提示还原");

  const segment = page.getByTestId("trip-panel").getByTestId("transport-segment").first();
  await expect(segment.getByText("约 12 分钟")).toBeVisible();
  await expect(segment.getByText("¥40–60")).toBeVisible();
  await expect(segment.getByText(TAXI_PET_HINT)).toBeVisible();
});

test("compact mode selector keeps a constant narrow width across taxi and walk", async ({
  page,
}) => {
  await presetTwoStopTrip(page, null, {
    poiId: "e2e-zhu-a",
    toNext: "drive",
    toNextEstimate: { durationMinutes: 12, costLowYuan: 40, costHighYuan: 60 },
  });
  await activateAndOpenAttractions(page, "珠海提示还原");

  const select = page
    .getByTestId("trip-panel")
    .getByLabel("选择途内交通方式", { exact: true });
  await expect(select).toHaveValue("drive");
  const driveWidth = (await select.boundingBox())!.width;

  await select.selectOption("walk");
  await expect(select).toHaveValue("walk");
  const walkWidth = (await select.boundingBox())!.width;

  // 选择器按内容（两字方式名）定宽，不随耗时/价格文本伸缩
  expect(Math.abs(driveWidth - walkWidth)).toBeLessThanOrEqual(1);
  expect(driveWidth).toBeLessThan(120);
});