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
  await page.getByRole("tab", { name: "景区浏览" }).click();
  await expect(page).toHaveURL(/\/attractions$/);
}

async function tripTo(page: Page, city: string) {
  await createTrip(page, { city, days: 1, pet: "豆豆" });
  await openAttractions(page);
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("E1 trip city shows pet-friendly attractions", async ({ page }) => {
  await tripTo(page, "珠海市");

  await expect(page.getByRole("heading", { name: "珠海市景点" })).toBeVisible();
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

  await page.getByRole("checkbox", { name: "显示全部景点" }).click();
  await expect(attractionCard(page, "珠海渔女").getByText("禁止携带")).toBeVisible();
  await expect(
    attractionCard(page, "珠海海滨公园").getByText("未配置", { exact: true }),
  ).toBeVisible();
  await expect(
    attractionCard(page, "珠海无名景点").getByText("未配置", { exact: true }),
  ).toBeVisible();
  await expect(attractionCard(page, "珠海某酒店")).toHaveCount(0);
});

test("E3 shows pet policy fields in attraction detail", async ({ page }) => {
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

  await page.getByRole("checkbox", { name: "显示全部景点" }).click();
  await attractionCard(page, "珠海渔女").getByRole("button", { name: "查看详情" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("禁止携带", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "关闭弹窗" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "显示全部景点" })).toBeChecked();

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
    if (new URL(request.url()).pathname === "/api/locations/attractions") {
      attractionRequests.push(request.url());
    }
  });

  await page.goto("/attractions");
  await expect(page.getByText("先创建或激活行程")).toBeVisible();
  await expect(page.getByRole("button", { name: "去创建行程" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看我的行程" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "景区浏览" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.waitForTimeout(500);
  expect(attractionRequests).toHaveLength(0);
});

test("E7 keeps the scenic tab selected on list and detail", async ({ page }) => {
  await tripTo(page, "珠海市");

  await expect(page.getByRole("tab", { name: "景区浏览" })).toHaveAttribute(
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
  await expect(page.getByRole("tab", { name: "景区浏览" })).toHaveAttribute(
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
  await page.getByRole("checkbox", { name: "显示全部景点" }).click();
  await expect(attractionCard(page, "中山陵").getByText("禁止携带")).toBeVisible();
  await expect(attractionCard(page, "玄武湖").getByText("未配置")).toBeVisible();
});

test("E10 exposes no city selector or admin controls but offers add actions", async ({
  page,
}) => {
  await tripTo(page, "珠海市");

  await expect(page.getByRole("textbox", { name: "搜索城市" })).toHaveCount(0);
  await expect(page.getByLabel("地点类型筛选")).toHaveCount(0);
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
