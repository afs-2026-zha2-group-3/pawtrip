import { expect, test, type Page } from "@playwright/test";
import {
  createTrip,
  openCities,
  openTrips,
  resetTrips,
  signIn,
  tripCard,
} from "./trip-helpers";

function attractionCard(page: Page, name: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: name });
}

async function openAttractions(page: Page) {
  await page.getByRole("tab", { name: "地点浏览" }).click();
  await expect(page).toHaveURL(/\/attractions$/);
}

async function tripTo(page: Page, city: string) {
  await createTrip(page, { city, days: 1, pet: "豆豆" });
  await openAttractions(page);
}

test.beforeEach(async ({ page }) => {
  await interceptMediaPhotos(page);
  await signIn(page);
  await resetTrips(page);
});

test("E1 trip city shows pet-friendly attractions", async ({ page }) => {
  await tripTo(page, "珠海市");

  await expect(page.getByRole("heading", { name: "珠海市地点" })).toBeVisible();
  await expect(attractionCard(page, "情侣路")).toBeVisible();
  await expect(attractionCard(page, "情侣路").getByText("宠物友好")).toBeVisible();
  await expect(attractionCard(page, "珠海渔女")).toHaveCount(0);
  await expect(attractionCard(page, "珠海海滨公园")).toHaveCount(0);
  await expect(attractionCard(page, "珠海某酒店")).toHaveCount(0);
});

test("E2 toggles all saved attractions and shows forbidden/unconfigured states", async ({
  page,
}) => {
  await tripTo(page, "珠海市");

  await page.getByRole("checkbox", { name: "显示全部地点" }).click();
  await expect(attractionCard(page, "珠海渔女").getByText("禁止携带")).toBeVisible();
  await expect(
    attractionCard(page, "珠海海滨公园").getByText("未配置", { exact: true }),
  ).toBeVisible();
  await expect(
    attractionCard(page, "珠海无名景点").getByText("未配置", { exact: true }),
  ).toBeVisible();
  await expect(attractionCard(page, "珠海某酒店")).toHaveCount(0);
});

test("E2b can filter, inspect and add a hotel location", async ({ page }) => {
  await tripTo(page, "珠海市");

  const typeFilter = page.getByRole("combobox", { name: "地点类型筛选" });
  await typeFilter.click();
  await page.getByRole("option", { name: "住宿", exact: true }).click();

  const hotel = attractionCard(page, "珠海某酒店");
  await expect(hotel).toBeVisible();
  await expect(attractionCard(page, "情侣路")).toHaveCount(0);
  await hotel.getByRole("button", { name: "查看详情" }).click();

  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog.getByText("住宿 · 珠海市香洲区")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "暂不排期" })).toBeVisible();
  await dialog.getByRole("combobox", { name: "添加到行程" }).click();
  await page.getByRole("option", { name: "第 1 天" }).click();
  await expect(page.getByTestId("trip-panel")).toContainText("珠海某酒店");
  await expect(page.locator('[data-stop-id^="d1:"]')).toContainText("珠海某酒店");
});

test("E3 shows pet policy fields in location detail", async ({ page }) => {
  await tripTo(page, "珠海市");

  await attractionCard(page, "情侣路").getByRole("button", { name: "查看详情" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/attractions$/);
  await expect(dialog.getByText("情侣路", { exact: true })).toBeVisible();
  await expect(dialog.getByText("宠物友好", { exact: true })).toBeVisible();
  await expect(dialog.getByText("1 只 / 人")).toBeVisible();
  await expect(dialog.getByText("8.5 kg")).toBeVisible();
  await expect(dialog.getByText("40 cm")).toBeVisible();
  await expect(dialog.getByText("需要", { exact: true })).toBeVisible();
  await expect(dialog.getByText("不需要", { exact: true })).toBeVisible();
  await expect(dialog.getByText("10.5 元 / 只 / 次")).toBeVisible();
  await expect(dialog.getByText("狗", { exact: true })).toBeVisible();
  await expect(dialog.getByText("预约要求")).toHaveCount(0);
});

test("E4 shows forbidden detail and empty policy detail", async ({ page }) => {
  await tripTo(page, "珠海市");

  await page.getByRole("checkbox", { name: "显示全部地点" }).click();
  await attractionCard(page, "珠海渔女").getByRole("button", { name: "查看详情" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("禁止携带", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "关闭弹窗" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "显示全部地点" })).toBeChecked();

  await attractionCard(page, "珠海无名景点").getByRole("button", { name: "查看详情" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("未配置", { exact: true })).toBeVisible();
  await expect(dialog.getByText("暂无携宠政策")).toBeVisible();
});

test("E5 switching city requires deactivating the current trip", async ({ page }) => {
  await tripTo(page, "珠海市");
  await expect(attractionCard(page, "情侣路")).toBeVisible();

  await openTrips(page);
  await tripCard(page, "珠海市 · 1天 · 豆豆").getByRole("button", { name: "取消激活" }).click();
  await createTrip(page, { city: "杭州市", days: 1, pet: "豆豆" });
  await openAttractions(page);

  await expect(attractionCard(page, "西湖")).toBeVisible();
  await expect(attractionCard(page, "情侣路")).toHaveCount(0);
});

test("E6 prompts to create or activate a trip without an active trip", async ({ page }) => {
  const attractionRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/locations") {
      attractionRequests.push(request.url());
    }
  });

  await page.goto("/attractions");
  await expect(page.getByText("先创建或激活行程")).toBeVisible();
  await expect(page.getByRole("button", { name: "去创建行程" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看我的行程" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "地点浏览" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.waitForTimeout(500);
  expect(attractionRequests).toHaveLength(0);
});

test("E7 keeps the location tab selected on list and detail", async ({ page }) => {
  await tripTo(page, "珠海市");

  await expect(page.getByRole("tab", { name: "地点浏览" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "城市浏览" })).toHaveAttribute(
    "aria-selected",
    "false",
  );

  await attractionCard(page, "情侣路").getByRole("button", { name: "查看详情" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/attractions$/);
  await page.getByRole("button", { name: "关闭弹窗" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "地点浏览" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("E8 shows an empty city state", async ({ page }) => {
  await tripTo(page, "广州市");

  await expect(page.getByText("该城市暂无已保存景点")).toBeVisible();
});

test("E9 shows no friendly state and toggles all for a city with only forbidden/unconfigured", async ({
  page,
}) => {
  await tripTo(page, "南京市");

  await expect(page.getByText("该城市暂无宠物友好的已保存景点")).toBeVisible();
  await page.getByRole("checkbox", { name: "显示全部地点" }).click();
  await expect(attractionCard(page, "中山陵").getByText("禁止携带")).toBeVisible();
  await expect(attractionCard(page, "玄武湖").getByText("未配置")).toBeVisible();
});

test("E10 exposes no city selector or admin controls but offers add actions", async ({
  page,
}) => {
  await tripTo(page, "珠海市");

  await expect(page.getByRole("textbox", { name: "搜索城市" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "地点类型筛选" })).toBeVisible();
  await expect(page.getByRole("button", { name: /编辑|保存|删除/ })).toHaveCount(0);
  await expect(
    attractionCard(page, "情侣路").getByRole("combobox", { name: "添加到行程" }),
  ).toBeVisible();
  await expect(
    attractionCard(page, "情侣路").getByRole("button", { name: "暂不排期" }),
  ).toBeVisible();

  await attractionCard(page, "情侣路").getByRole("button", { name: "查看详情" }).click();
  await expect(page.getByRole("button", { name: /编辑|保存|删除/ })).toHaveCount(0);
});

test("E11 clears the active trip on logout", async ({ page }) => {
  await tripTo(page, "珠海市");
  expect(
    await page.evaluate(() => window.localStorage.getItem("pawtrip.activeTripId")),
  ).not.toBeNull();

  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => window.localStorage.getItem("pawtrip.activeTripId")),
  ).toBeNull();

  await signIn(page);
  await page.goto("/attractions");
  await expect(page.getByText("先创建或激活行程")).toBeVisible();
});

test("E12 shows no scenic entry inside city browsing", async ({ page }) => {
  await openCities(page);

  await expect(page.getByRole("button", { name: /查看.*景点/ })).toHaveCount(0);
  await expect(page.locator('[data-slot="card"]').filter({ hasText: "情侣路" })).toHaveCount(0);
});

// --- REQ-013 地点卡片媒体（add-location-card-media，ATDD E1–E9） ---

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

async function interceptMediaPhotos(page: Page) {
  await page.route("https://photos.e2e.test/**", (route) => {
    if (new URL(route.request().url()).pathname === "/broken.png") {
      return route.abort();
    }
    return route.fulfill({ status: 200, contentType: "image/png", body: PNG_1PX });
  });
}

async function showAllAttractions(page: Page) {
  await page.getByRole("checkbox", { name: "显示全部地点" }).click();
}

async function selectType(page: Page, label: string) {
  await page.getByRole("combobox", { name: "地点类型筛选" }).click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

test("media E1 card shows first cover photo and rating", async ({ page }) => {
  await tripTo(page, "珠海市");

  const card = attractionCard(page, "情侣路");
  const cover = card.getByRole("img", { name: "情侣路", exact: true });
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute("src", "https://photos.e2e.test/a-0.png");
  await expect(cover).toHaveAttribute("referrerpolicy", "no-referrer");
  await expect
    .poll(() => cover.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  const box = await cover.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width / box!.height).toBeCloseTo(16 / 9, 1);

  const rating = card.getByTestId("location-rating");
  await expect(rating).toBeVisible();
  await expect(rating).toContainText("4.6");
});

test("media E2 card without photo shows neutral placeholder", async ({ page }) => {
  await tripTo(page, "珠海市");
  await showAllAttractions(page);

  const card = attractionCard(page, "珠海渔女");
  await expect(card.locator("img")).toHaveCount(0);
  const placeholder = card.getByRole("img", { name: "珠海渔女暂无图片" });
  await expect(placeholder).toBeVisible();
  await expect(placeholder).toContainText("景点");
  await expect(card.getByText("珠海渔女")).toBeVisible();
  await expect(card.getByText("宠物友好")).toHaveCount(0);
  await expect(card.getByRole("button", { name: "查看详情" })).toBeVisible();
});

test("media E3 failed image falls back to placeholder without retry", async ({ page }) => {
  await tripTo(page, "珠海市");
  await selectType(page, "住宿");

  const card = attractionCard(page, "珠海某酒店");
  await expect(card.getByRole("img", { name: "珠海某酒店暂无图片" })).toBeVisible();
  await expect(card.locator("img")).toHaveCount(0);
  await expect(card.getByRole("button", { name: /重试|获取图片/ })).toHaveCount(0);
  await expect(card.getByTestId("location-rating")).toContainText("4.8");
});

test("media E4 hides rating when snapshot missing", async ({ page }) => {
  await tripTo(page, "珠海市");
  await showAllAttractions(page);

  const card = attractionCard(page, "珠海渔女");
  await expect(card.getByTestId("location-rating")).toHaveCount(0);
  await expect(card.getByText("珠海市香洲区")).toBeVisible();
});

test("media E5 restriction and fee row renders values or hides", async ({ page }) => {
  await tripTo(page, "珠海市");

  const loverCard = attractionCard(page, "情侣路");
  await expect(loverCard.getByText("≤8.5 kg")).toBeVisible();
  await expect(loverCard.getByText("≤40 cm")).toBeVisible();
  await expect(loverCard.getByText("附加费 ¥10.5")).toBeVisible();

  await selectType(page, "住宿");
  const hotel = attractionCard(page, "珠海某酒店");
  await expect(hotel.getByText("≤15 kg")).toBeVisible();
  await expect(hotel.getByText("附加费 ¥80")).toBeVisible();
  await expect(hotel.getByText("cm")).toHaveCount(0);

  await selectType(page, "景点");
  await showAllAttractions(page);
  const emptyCard = attractionCard(page, "珠海渔女");
  await expect(emptyCard.getByText(/≤|附加费/)).toHaveCount(0);
});

test("media E6 policy note row renders generated phrases or hides", async ({ page }) => {
  await tripTo(page, "珠海市");

  const loverCard = attractionCard(page, "情侣路");
  await expect(loverCard.getByText("公共区域需牵引")).toBeVisible();
  await expect(loverCard.getByText("需疫苗证明")).toHaveCount(0);

  await selectType(page, "住宿");
  const hotel = attractionCard(page, "珠海某酒店");
  await expect(hotel.getByText("公共区域需牵引")).toBeVisible();
  await expect(hotel.getByText("需疫苗证明")).toBeVisible();

  await selectType(page, "景点");
  await showAllAttractions(page);
  const emptyCard = attractionCard(page, "珠海渔女");
  await expect(emptyCard.getByText(/公共区域需牵引|需疫苗证明|需提前预约/)).toHaveCount(0);
});

test("media E7 detail dialog carries cover and rating with fallback", async ({ page }) => {
  await tripTo(page, "珠海市");

  await attractionCard(page, "情侣路").getByRole("button", { name: "查看详情" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  const cover = dialog.getByRole("img", { name: "情侣路", exact: true });
  await expect(cover).toBeVisible();
  await expect(cover).toHaveAttribute("src", "https://photos.e2e.test/a-0.png");
  await expect(dialog.getByTestId("location-rating")).toContainText("4.6");
  await expect(dialog.getByText("8.5 kg")).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "添加到行程" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "暂不排期" })).toBeVisible();
  await page.getByRole("button", { name: "关闭弹窗" }).click();

  await showAllAttractions(page);
  await attractionCard(page, "珠海渔女").getByRole("button", { name: "查看详情" }).click();
  await expect(dialog.getByRole("img", { name: "珠海渔女暂无图片" })).toBeVisible();
  await expect(dialog.getByTestId("location-rating")).toHaveCount(0);
});

test("media E8 type switch keeps card structure and add actions", async ({ page }) => {
  await tripTo(page, "珠海市");
  await selectType(page, "住宿");

  const hotel = attractionCard(page, "珠海某酒店");
  await expect(hotel.getByRole("img", { name: "珠海某酒店暂无图片" })).toBeVisible();
  await expect(hotel.getByTestId("location-rating")).toContainText("4.8");
  await hotel.getByRole("button", { name: "暂不排期" }).click();
  await expect(page.locator('[data-stop-id^="u:"]')).toContainText("珠海某酒店");
  await hotel.getByRole("combobox", { name: "添加到行程" }).click();
  await page.getByRole("option", { name: "第 1 天" }).click();
  await expect(page.locator('[data-stop-id^="d1:"]')).toContainText("珠海某酒店");
  await expect(page.locator('[data-stop-id^="u:"]')).toHaveCount(0);
  await expect(hotel.getByText("第 1 天")).toBeVisible();

  await selectType(page, "餐厅");
  await expect(page.getByText("该城市暂无已保存餐厅")).toBeVisible();
});

test("media E9 no deposit/cleaning fee copy or rating controls", async ({ page }) => {
  await tripTo(page, "珠海市");
  await showAllAttractions(page);

  await expect(page.getByText("押金")).toHaveCount(0);
  await expect(page.getByText("清洁费")).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: /评分|排序/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /上一张|下一张/ })).toHaveCount(0);

  await attractionCard(page, "情侣路").getByRole("button", { name: "查看详情" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("押金")).toHaveCount(0);
  await expect(dialog.getByText("清洁费")).toHaveCount(0);
});
