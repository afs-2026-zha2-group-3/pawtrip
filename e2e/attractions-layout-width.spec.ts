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

// US-70：地点浏览页地图收窄、每日景点行程面板加宽。
// 旧布局面板列 220px、地图 lg 42% / xl 1.08fr；新布局面板列 280px、地图 lg 36% / xl 0.9fr。
const TAXI_PET_HINT = "部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带";

async function presetAndOpenAttractions(page: Page) {
  const pet = (await pets(page)).find((candidate) => candidate.name === "豆豆");
  if (!pet) throw new Error("Seed pet 豆豆 not found");
  const created = await createTripViaApi(page, {
    name: "珠海宽度",
    cityAdcode: "440400",
    petId: pet.id,
    totalDays: 1,
  });
  const trip = (await (await page.request.get(`/api/trips/${created.id}`)).json()) as {
    name: string;
    startDate: string | null;
  };
  const headers = await csrfHeaders(page);
  const response = await page.request.put(`/api/trips/${created.id}`, {
    headers,
    data: {
      name: trip.name,
      totalDays: 1,
      startDate: trip.startDate,
      transportMode: null,
      plan: {
        version: 1,
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
        unscheduled: [],
      },
    },
  });
  expect(response.ok()).toBeTruthy();

  await openTrips(page);
  await tripCard(page, "珠海宽度").getByRole("button", { name: "编辑" }).click();
  await expect(page).toHaveURL(/\/attractions$/);
  await expect(page.getByTestId("trip-panel")).toBeVisible();
}

// 地图所在列（e2e 空高德 Key → 渲染 location-map-placeholder 兜底）。
function mapColumn(page: Page) {
  return page.locator("aside").filter({ has: page.getByTestId("location-map-placeholder") });
}

async function widthOf(locator: ReturnType<Page["locator"]>) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("Element not visible");
  return box.width;
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("wide desktop (2xl, agent closed) widens the panel and narrows the map without truncation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await presetAndOpenAttractions(page);

  const panel = page.getByTestId("trip-panel");
  // 面板列由 220px 加宽到 280px
  expect(await widthOf(panel)).toBeGreaterThanOrEqual(270);
  // 地图列（2xl 关闭态 0.8fr）因面板加宽而较上游更窄（上游约 563px）
  const mapWidth = await widthOf(mapColumn(page));
  expect(mapWidth).toBeLessThan(560);
  expect(mapWidth).toBeGreaterThan(300);

  // 面板内容无横向截断：提示与交通段完整可见
  await expect(panel.getByText(TAXI_PET_HINT)).toBeVisible();
  await expect(panel.getByText("¥40–60")).toBeVisible();
  const overflow = await panel.evaluate((node) => node.scrollWidth - node.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
