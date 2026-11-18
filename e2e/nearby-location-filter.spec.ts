import { expect, test, type Page } from "@playwright/test";
import { createTrip, resetTrips, signIn, withTripPanelNotBlocking } from "./trip-helpers";

async function openAttractions(page: Page) {
  await page.getByRole("tab", { name: "地点浏览" }).click();
  await expect(page).toHaveURL(/\/attractions$/);
}

function locationCard(page: Page, name: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: name });
}

async function addAttractionToDay(page: Page, name: string, day: number) {
  const put = page.waitForResponse(
    (response) =>
      /\/api\/trips\/\d+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "PUT",
  );
  await withTripPanelNotBlocking(page, async () => {
    await locationCard(page, name).getByRole("combobox", { name: "添加到行程" }).click();
    await page.getByRole("option", { name: `第 ${day} 天` }).click();
  });
  await put;
}

async function chooseType(page: Page, label: string) {
  await page.getByRole("combobox", { name: "地点类型筛选" }).click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

async function chooseAnchor(page: Page, name: string) {
  const anchor = page.getByRole("combobox", { name: "行程景点锚点" });
  await expect(anchor).toBeEnabled();
  await anchor.click();
  await page.getByRole("option", { name, exact: true }).click();
}

async function chooseHotelAnchor(page: Page, name: string) {
  const anchor = page.getByRole("combobox", { name: "离景点最近" });
  await expect(anchor).toBeEnabled();
  await anchor.click();
  await page.getByRole("option", { name, exact: true }).click();
}

async function clearAnchor(page: Page) {
  await page.getByRole("combobox", { name: "行程景点锚点" }).click();
  await page.getByRole("option", { name: "不限距离", exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("shows the map placeholder when the AMap JS key is not configured", async ({ page }) => {
  await createTrip(page, { city: "珠海市", days: 1, pet: "豆豆" });
  await openAttractions(page);

  await expect(page.getByTestId("location-map-placeholder")).toBeVisible();
  await expect(locationCard(page, "情侣路")).toBeVisible();
});

test("filters restaurants to 5km around the selected scheduled attraction", async ({ page }) => {
  await createTrip(page, { city: "珠海市", days: 1, pet: "豆豆" });
  await openAttractions(page);
  await addAttractionToDay(page, "情侣路", 1);
  await chooseAnchor(page, "情侣路");
  await chooseType(page, "餐厅");

  await expect(locationCard(page, "附近餐厅")).toBeVisible();
  await expect(locationCard(page, "附近餐厅")).toContainText("距情侣路约 0.2km");
  await expect(locationCard(page, "最近餐厅")).toHaveCount(0);
  await expect(locationCard(page, "远处餐厅")).toHaveCount(0);
  await expect(locationCard(page, "无坐标餐厅")).toHaveCount(0);

  await page.getByRole("checkbox", { name: "显示全部地点" }).click();
  const cards = page.locator('[data-slot="card"]');
  await expect(cards.nth(0)).toContainText("最近餐厅");
  await expect(cards.nth(1)).toContainText("附近餐厅");
  await expect(locationCard(page, "最近餐厅")).toContainText("距情侣路约 0.1km");
  await expect(locationCard(page, "远处餐厅")).toHaveCount(0);
});

test("requires an anchor before browsing restaurants but shows hotels by default", async ({ page }) => {
  await createTrip(page, { city: "珠海市", days: 1, pet: "豆豆" });
  await openAttractions(page);

  await expect(page.getByRole("combobox", { name: "行程景点锚点" })).toBeDisabled();

  await chooseType(page, "餐厅");
  await expect(page.getByText("请先在景点页选择行程景点", { exact: true })).toBeVisible();
  await expect(locationCard(page, "附近餐厅")).toHaveCount(0);

  await chooseType(page, "住宿");
  await expect(page.getByText("请先在景点页选择行程景点", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "离景点最近" })).toBeDisabled();
  await expect(page.getByText("行程中还没有已排期的景点")).toBeVisible();
  await expect(locationCard(page, "珠海某酒店")).toBeVisible();
  await expect(locationCard(page, "附近酒店")).toBeVisible();
  await expect(locationCard(page, "远处酒店")).toBeVisible();
});

test("filters hotels by 离景点最近 and shares the anchor with restaurants", async ({ page }) => {
  await createTrip(page, { city: "珠海市", days: 1, pet: "豆豆" });
  await openAttractions(page);
  await addAttractionToDay(page, "情侣路", 1);

  await chooseType(page, "住宿");
  await expect(locationCard(page, "珠海某酒店")).toBeVisible();
  await expect(locationCard(page, "附近酒店")).toBeVisible();
  await expect(locationCard(page, "远处酒店")).toBeVisible();

  await chooseHotelAnchor(page, "情侣路");

  await expect(locationCard(page, "珠海某酒店")).toBeVisible();
  await expect(locationCard(page, "附近酒店")).toBeVisible();
  await expect(locationCard(page, "远处酒店")).toHaveCount(0);
  const cards = page.locator('[data-slot="card"]');
  await expect(cards.nth(0)).toContainText("珠海某酒店");
  await expect(cards.nth(1)).toContainText("附近酒店");
  await expect(locationCard(page, "珠海某酒店")).toContainText("距情侣路约 0.6km");
  await expect(locationCard(page, "附近酒店")).toContainText("距情侣路约 0.7km");

  await chooseType(page, "餐厅");
  await expect(page.getByText("请先在景点页选择行程景点", { exact: true })).toHaveCount(0);
  await expect(locationCard(page, "附近餐厅")).toBeVisible();
});

test("clears the anchor and restores the gate when the anchor leaves the trip", async ({ page }) => {
  await createTrip(page, { city: "珠海市", days: 1, pet: "豆豆" });
  await openAttractions(page);
  await addAttractionToDay(page, "情侣路", 1);
  await chooseAnchor(page, "情侣路");
  await chooseType(page, "餐厅");
  await expect(locationCard(page, "附近餐厅")).toBeVisible();

  const removeButton = page.getByRole("button", { name: "移除情侣路" });
  if (!(await removeButton.isVisible())) {
    await page.getByTestId("trip-panel-toggle").click();
  }
  await removeButton.click();

  await expect(page.getByText("请先在景点页选择行程景点", { exact: true })).toBeVisible();
  await expect(locationCard(page, "附近餐厅")).toHaveCount(0);
});

test("keeps an already-added nearby restaurant in the result", async ({ page }) => {
  await createTrip(page, { city: "珠海市", days: 1, pet: "豆豆" });
  await openAttractions(page);
  await addAttractionToDay(page, "情侣路", 1);
  await chooseAnchor(page, "情侣路");
  await chooseType(page, "餐厅");

  const restaurant = locationCard(page, "附近餐厅");
  await expect(restaurant).toBeVisible();
  const put = page.waitForResponse(
    (response) =>
      /\/api\/trips\/\d+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "PUT",
  );
  await withTripPanelNotBlocking(page, async () => {
    await restaurant.getByRole("combobox", { name: "添加到行程" }).click();
    await page.getByRole("option", { name: "第 1 天" }).click();
  });
  await put;
  await expect(restaurant).toContainText("第 1 天");
  await expect(restaurant).toContainText("距情侣路约 0.2km");
});

test("does not gate pet hospitals or pet supplies without an anchor", async ({ page }) => {
  await createTrip(page, { city: "珠海市", days: 1, pet: "豆豆" });
  await openAttractions(page);

  for (const label of ["宠物医院", "宠物用品店"]) {
    await chooseType(page, label);
    await expect(page.getByText("请先在景点页选择行程景点", { exact: true })).toHaveCount(0);
    await expect(page.getByText(new RegExp(`暂无已保存${label}`))).toBeVisible();
  }
});

test("shows a clear error when the hotel anchor has no coordinates", async ({ page }) => {
  await createTrip(page, { city: "珠海市", days: 1, pet: "豆豆" });
  await openAttractions(page);
  await addAttractionToDay(page, "无坐标景点", 1);
  await chooseType(page, "住宿");
  await chooseHotelAnchor(page, "无坐标景点");

  await expect(page.getByText("该景点缺少坐标，无法计算距离", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "清除锚点" }).click();
  await expect(locationCard(page, "珠海某酒店")).toBeVisible();
});

test("clears the anchor and restores the restaurant gate", async ({ page }) => {
  await createTrip(page, { city: "珠海市", days: 1, pet: "豆豆" });
  await openAttractions(page);
  await addAttractionToDay(page, "情侣路", 1);
  await chooseAnchor(page, "情侣路");
  await chooseType(page, "餐厅");
  await expect(locationCard(page, "附近餐厅")).toBeVisible();

  await chooseType(page, "景点");
  await clearAnchor(page);
  await chooseType(page, "餐厅");

  await expect(page.getByText("请先在景点页选择行程景点", { exact: true })).toBeVisible();
  await expect(locationCard(page, "附近餐厅")).toHaveCount(0);
});
