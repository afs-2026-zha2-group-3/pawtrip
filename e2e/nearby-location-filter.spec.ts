import { expect, test, type Page } from "@playwright/test";
import {
  createActiveTripViaApi,
  resetTrips,
  signIn,
  withTripPanelNotBlocking,
} from "./trip-helpers";

async function tripToZhuhai(page: Page) {
  await createActiveTripViaApi(page, { cityAdcode: "440400", petName: "豆豆" });
  await page.goto("/attractions");
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
  if (label === "景点") {
    const back = page.getByRole("button", { name: "返回景点选择" });
    if (await back.isVisible()) {
      await back.click();
    }
    return;
  }
  const entry = page.getByRole("button", { name: "选择住宿/餐厅" });
  if (await entry.isVisible()) {
    await entry.click();
  }
  await page.getByRole("combobox", { name: "地点类型筛选" }).click();
  await page.getByRole("option", { name: label, exact: true }).click();
}

async function chooseAnchor(page: Page, name: string) {
  const entry = page.getByRole("button", { name: "选择住宿/餐厅" });
  if (await entry.isVisible()) {
    await entry.click();
  }
  const anchor = page.getByRole("combobox", { name: "离景点最近" });
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
  await page.getByRole("button", { name: "返回景点选择" }).click();
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("filters restaurants to 5km around the selected scheduled attraction", async ({ page }) => {
  await tripToZhuhai(page);
  await addAttractionToDay(page, "情侣路", 1);
  await chooseAnchor(page, "情侣路");
  await chooseType(page, "餐厅");

  await expect(locationCard(page, "附近餐厅")).toBeVisible();
  await expect(locationCard(page, "附近餐厅")).toContainText("距情侣路约 0.2km");
  await expect(locationCard(page, "最近餐厅")).toHaveCount(0);
  await expect(locationCard(page, "远处餐厅")).toHaveCount(0);
  await expect(locationCard(page, "无坐标餐厅")).toHaveCount(0);

  await expect(page.getByRole("checkbox", { name: "显示全部地点" })).toHaveCount(0);
});

test("switches to hotel browsing from the itinerary panel next step", async ({ page }) => {
  await tripToZhuhai(page);

  const nextStep = page.getByTestId("trip-next-step");
  await expect(nextStep).toBeDisabled();
  await expect(page.getByTestId("trip-next-step-hint")).toContainText("先在行程中添加景点");

  await addAttractionToDay(page, "情侣路", 1);
  await expect(nextStep).toBeEnabled();
  await expect(page.getByTestId("trip-next-step-hint")).toContainText(
    "按评分推荐 5km 内的住宿与餐厅",
  );
  await nextStep.click();

  await expect(page.getByRole("combobox", { name: "地点类型筛选" })).toContainText("住宿");
  await expect(page.getByRole("combobox", { name: "离景点最近" })).toContainText("离情侣路最近");
  await expect(locationCard(page, "附近酒店")).toBeVisible();
});

test("filters hotels by 离景点最近 and shares the anchor with restaurants", async ({ page }) => {
  await tripToZhuhai(page);
  await addAttractionToDay(page, "情侣路", 1);

  await chooseType(page, "住宿");
  await expect(locationCard(page, "珠海某酒店")).toBeVisible();
  await expect(locationCard(page, "附近酒店")).toBeVisible();
  await expect(locationCard(page, "远处酒店")).toHaveCount(0);

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
  await tripToZhuhai(page);
  await addAttractionToDay(page, "情侣路", 1);
  await chooseAnchor(page, "情侣路");
  await chooseType(page, "餐厅");
  await expect(locationCard(page, "附近餐厅")).toBeVisible();

  const removeButton = page.getByRole("button", { name: "移除情侣路", exact: true });
  if (!(await removeButton.isVisible())) {
    await page.getByTestId("trip-panel-toggle").click();
  }
  await removeButton.click();

  await expect(page.getByText("请先在景点页选择行程景点", { exact: true })).toBeVisible();
  await expect(locationCard(page, "附近餐厅")).toHaveCount(0);
});

test("disables the anchor controls when no attraction is scheduled", async ({ page }) => {
  await tripToZhuhai(page);

  await expect(page.getByRole("button", { name: "选择住宿/餐厅" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "地点类型筛选" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "离景点最近" })).toHaveCount(0);
  await expect(locationCard(page, "珠海某酒店")).toHaveCount(0);
});

test("keeps an already-added nearby restaurant in the result", async ({ page }) => {
  await tripToZhuhai(page);
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

test("shows a clear error when the hotel anchor has no coordinates", async ({ page }) => {
  await tripToZhuhai(page);
  await addAttractionToDay(page, "无坐标景点", 1);
  await chooseType(page, "住宿");
  await chooseHotelAnchor(page, "无坐标景点");

  await expect(page.getByText("该景点缺少坐标，无法计算距离", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "清除锚点" }).click();
  await expect(page.getByText("请先在景点页选择行程景点", { exact: true })).toBeVisible();
  await expect(locationCard(page, "珠海某酒店")).toHaveCount(0);
});

test("clears the anchor and restores the restaurant gate", async ({ page }) => {
  await tripToZhuhai(page);
  await addAttractionToDay(page, "情侣路", 1);
  await chooseAnchor(page, "情侣路");
  await chooseType(page, "餐厅");
  await expect(locationCard(page, "附近餐厅")).toBeVisible();

  await clearAnchor(page);
  await expect(page.getByRole("button", { name: "选择住宿/餐厅" })).toBeVisible();
  await expect(locationCard(page, "附近餐厅")).toHaveCount(0);
});
