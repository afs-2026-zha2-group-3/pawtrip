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
  await page.waitForSelector("html[data-app-ready='true']");
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

async function chooseType(page: Page, label: "景点" | "酒店" | "餐厅") {
  await page.getByRole("combobox", { name: "地点选择" }).click();
  await page
    .getByRole("option", { name: label === "景点" ? "景点" : "酒店和餐厅", exact: true })
    .click();
  if (label !== "景点") {
    await page.getByRole("tab", { name: label, exact: true }).click();
  }
}

async function chooseAnchor(page: Page, name: string) {
  const anchor = page.getByRole("combobox", { name: "离景点最近" });
  await expect(anchor).toBeEnabled();
  await anchor.click();
  await page.getByRole("option", { name, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("shows city-wide hotel and restaurant lists without an anchor", async ({ page }) => {
  await tripToZhuhai(page);

  await chooseType(page, "酒店");
  await expect(page).toHaveURL(/\/attractions\?type=hotel$/);
  await expect(page.getByRole("heading", { name: "酒店" })).toBeVisible();
  for (const name of ["珠海某酒店", "附近酒店", "远处酒店"]) {
    await expect(locationCard(page, name)).toBeVisible();
  }
  await expect(page.getByRole("checkbox", { name: "显示全部地点" })).toHaveCount(0);

  await chooseType(page, "餐厅");
  await expect(page).toHaveURL(/\/attractions\?type=restaurant$/);
  await expect(page.getByRole("heading", { name: "餐厅" })).toBeVisible();
  for (const name of ["附近餐厅", "远处餐厅", "无坐标餐厅"]) {
    await expect(locationCard(page, name)).toBeVisible();
  }
  // 默认宠物友好筛选保持不变（REQ-019 非目标），「禁止携带」的最近餐厅仍被过滤。
  await expect(locationCard(page, "最近餐厅")).toHaveCount(0);
  await expect(page.getByText("请先在景点页选择行程景点", { exact: true })).toHaveCount(0);
});

test("filters hotels by anchor and shares the anchor with restaurants", async ({ page }) => {
  await tripToZhuhai(page);
  await addAttractionToDay(page, "情侣路", 1);

  await chooseType(page, "酒店");
  await expect(locationCard(page, "远处酒店")).toBeVisible();

  await chooseAnchor(page, "情侣路");
  await expect(locationCard(page, "远处酒店")).toHaveCount(0);
  await expect(locationCard(page, "珠海某酒店")).toContainText("距情侣路约 0.6km");
  await expect(locationCard(page, "附近酒店")).toContainText("距情侣路约 0.7km");

  await chooseType(page, "餐厅");
  await expect(locationCard(page, "附近餐厅")).toBeVisible();
  await expect(locationCard(page, "最近餐厅")).toHaveCount(0);
  await expect(locationCard(page, "远处餐厅")).toHaveCount(0);
  await expect(locationCard(page, "无坐标餐厅")).toHaveCount(0);

  await chooseType(page, "酒店");
  await expect(locationCard(page, "远处酒店")).toHaveCount(0);
  await expect(locationCard(page, "附近酒店")).toContainText("距情侣路约 0.7km");
});

test("clears the anchor and restores the hotel list after the anchor leaves the trip", async ({
  page,
}) => {
  await tripToZhuhai(page);
  await addAttractionToDay(page, "情侣路", 1);
  await chooseType(page, "酒店");
  await chooseAnchor(page, "情侣路");
  await expect(locationCard(page, "远处酒店")).toHaveCount(0);

  await page.getByRole("combobox", { name: "离景点最近" }).click();
  await page.getByRole("option", { name: "不限景点" }).click();
  await expect(locationCard(page, "远处酒店")).toBeVisible();
  await expect(page.getByText(/距情侣路约/)).toHaveCount(0);

  await chooseAnchor(page, "情侣路");
  await expect(locationCard(page, "远处酒店")).toHaveCount(0);

  const removeButton = page.getByRole("button", { name: "移除情侣路", exact: true });
  if (!(await removeButton.isVisible())) {
    await page.getByTestId("trip-panel-toggle").click();
  }
  await removeButton.click();

  await expect(page.getByRole("combobox", { name: "离景点最近" })).toBeDisabled();
  await expect(locationCard(page, "远处酒店")).toBeVisible();
  await expect(page.getByText("该景点缺少坐标，无法计算距离")).toHaveCount(0);
});

test("shows a clear error when the hotel anchor has no coordinates", async ({ page }) => {
  await tripToZhuhai(page);
  await addAttractionToDay(page, "无坐标景点", 1);
  await chooseType(page, "酒店");
  await chooseAnchor(page, "无坐标景点");

  await expect(page.getByText("该景点缺少坐标，无法计算距离", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "清除锚点" }).click();
  await expect(locationCard(page, "珠海某酒店")).toBeVisible();
  await expect(locationCard(page, "远处酒店")).toBeVisible();
  await expect(page.getByText("请先在景点页选择行程景点", { exact: true })).toHaveCount(0);
});
