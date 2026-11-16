import { expect, test, type Page } from "@playwright/test";
import {
  createTrip,
  createTripViaApi,
  openCities,
  openTrips,
  pets,
  resetTrips,
  selectCity,
  signIn,
  tripCard,
} from "./trip-helpers";

async function dragHandleTo(page: Page, stopName: string, target: ReturnType<Page["locator"]>) {
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

async function addDayAttraction(page: Page, name: string, day: number) {
  const put = page.waitForResponse(
    (response) =>
      /\/api\/trips\/\d+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "PUT",
  );
  const card = page.locator('[data-slot="card"]').filter({ hasText: name });
  await card.getByRole("combobox", { name: "添加到行程" }).click();
  await page.getByRole("option", { name: `第 ${day} 天` }).click();
  await put;
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("shows an empty state without trips", async ({ page }) => {
  await openTrips(page);
  await expect(page.getByText("还没有行程")).toBeVisible();
  await expect(page.getByRole("link", { name: "去创建行程" })).toBeVisible();
});

test("lists trips in id order and supports activate, deactivate and delete", async ({
  page,
}) => {
  const pet = (await pets(page))[0];
  await createTripViaApi(page, {
    name: "杭州两日",
    cityAdcode: "330100",
    petId: pet.id,
    totalDays: 2,
  });
  await createTripViaApi(page, {
    name: "珠海三日",
    cityAdcode: "440400",
    petId: pet.id,
    totalDays: 3,
  });

  await openTrips(page);
  const cards = page.getByTestId("trip-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText("杭州两日");
  await expect(cards.nth(1)).toContainText("珠海三日");
  await expect(cards.nth(0)).toContainText("2 天");

  await tripCard(page, "杭州两日").getByRole("button", { name: "激活" }).click();
  await expect(tripCard(page, "杭州两日")).toContainText("激活中");
  await expect(page.getByTestId("trip-panel")).toContainText("2 天");
  await expect(tripCard(page, "珠海三日").getByRole("button", { name: "激活" })).toBeDisabled();

  await tripCard(page, "杭州两日").getByRole("button", { name: "取消激活" }).click();
  await expect(tripCard(page, "杭州两日")).not.toContainText("激活中");
  await expect(tripCard(page, "珠海三日").getByRole("button", { name: "激活" })).toBeEnabled();

  await tripCard(page, "珠海三日").getByRole("button", { name: "删除" }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: "删除" }).click();
  await expect(tripCard(page, "珠海三日")).toHaveCount(0);

  await tripCard(page, "杭州两日").getByRole("button", { name: "激活" }).click();
  await expect(page.getByTestId("trip-panel")).toContainText("2 天");
  await page.getByRole("button", { name: "展开行程面板" }).click();
  await tripCard(page, "杭州两日").getByRole("button", { name: "删除" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "删除" }).click();
  await expect(page.getByText("还没有行程")).toBeVisible();
  await expect(page.getByTestId("trip-panel")).toHaveCount(0);
  const paddingLeft = await page.evaluate(() => {
    const main = document.querySelector("main");
    return main?.parentElement ? getComputedStyle(main.parentElement).paddingLeft : null;
  });
  expect(paddingLeft).toBe("0px");
  expect(
    await page.evaluate(() => window.localStorage.getItem("pawtrip.activeTripId")),
  ).toBeNull();
});

test("blocks activation while an unconfirmed draft exists", async ({ page }) => {
  const pet = (await pets(page))[0];
  await createTripViaApi(page, {
    name: "珠海两日",
    cityAdcode: "440400",
    petId: pet.id,
    totalDays: 2,
  });

  await openCities(page);
  await selectCity(page, "杭州市");
  await openTrips(page);

  await expect(page.getByText("存在未确认草稿")).toBeVisible();
  await expect(tripCard(page, "珠海两日").getByRole("button", { name: "激活" })).toBeDisabled();
});

test("reports a missing trip when activation returns 404", async ({ page }) => {
  const pet = (await pets(page))[0];
  const created = await createTripViaApi(page, {
    name: "已删除行程",
    cityAdcode: "330100",
    petId: pet.id,
    totalDays: 1,
  });
  await page.route(`**/api/trips/${created.id}`, (route) =>
    route.fulfill({ status: 404, json: { status: 404, code: "TRIP_NOT_FOUND" } }),
  );

  await openTrips(page);
  await tripCard(page, "已删除行程").getByRole("button", { name: "激活" }).click();
  await expect(page.getByText("激活行程失败，请稍后重试。")).toBeVisible();
});

test("evaluates transport rules only for the active trip pet", async ({ page }) => {
  await createTrip(page, { city: "杭州市", days: 1, pet: "毛毛" });
  await page.getByRole("tab", { name: "交通规则" }).click();
  await expect(page.getByRole("table", { name: "交通携宠规则对比" })).toBeVisible();

  await expect(page.getByText(/^毛毛 · /).first()).toBeVisible();
  await expect(page.getByText(/^豆豆 · /)).toHaveCount(0);
});

test("blocks attraction browsing before confirmation and offers add actions after", async ({
  page,
}) => {
  await openCities(page);
  await selectCity(page, "杭州市");

  const locationListRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/locations") {
      locationListRequests.push(request.url());
    }
  });
  await page.getByRole("tab", { name: "地点浏览" }).click();
  await expect(page.getByText("先创建或激活行程")).toBeVisible();
  expect(locationListRequests).toHaveLength(0);
  await expect(
    page.getByTestId("trip-panel").getByRole("button", { name: /拖动/ }),
  ).toHaveCount(0);

  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page.getByTestId("trip-panel-confirm")).toBeEnabled();
  await page.getByTestId("trip-panel-confirm").click();
  await expect(page.getByTestId("save-status")).toContainText("已保存");

  await page.getByRole("tab", { name: "地点浏览" }).click();
  await expect(page.getByRole("heading", { name: "杭州市地点" })).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "添加到行程" }).first(),
  ).toBeVisible();
});

test("adds stops to the selected day and to unscheduled with debounced saving", async ({
  page,
}) => {
  await createTrip(page, { city: "杭州市", days: 3, pet: "豆豆" });
  await page.getByRole("tab", { name: "地点浏览" }).click();
  const westLake = page.locator('[data-slot="card"]').filter({ hasText: "西湖" });
  await westLake.getByRole("combobox", { name: "添加到行程" }).click();
  await expect(page.getByRole("option", { name: "第 3 天" })).toBeVisible();
  await expect(page.getByRole("option", { name: "第 4 天" })).toHaveCount(0);
  await page.keyboard.press("Escape");

  await addDayAttraction(page, "西湖", 2);
  await expect(page.getByTestId("trip-panel")).toContainText("西湖");
  await expect(page.locator('[data-stop-id^="d2:"]')).toContainText("西湖");

  const allLocations = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/locations",
  );
  await page.getByRole("checkbox", { name: "显示全部地点" }).click();
  await allLocations;

  const put = page.waitForResponse(
    (response) =>
      /\/api\/trips\/\d+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "PUT",
  );
  const card = page.locator('[data-slot="card"]').filter({ hasText: "灵隐寺" });
  await card.getByRole("button", { name: "暂不排期" }).click();
  await put;
  await expect(page.locator('[data-stop-id^="u:"]')).toContainText("灵隐寺");
  await expect(page.getByTestId("save-status")).toContainText("已保存");

  await page.reload();
  await expect(page.getByTestId("trip-panel")).toContainText("西湖");
  await expect(page.getByTestId("trip-panel")).toContainText("灵隐寺");
});

test("allows duplicate stops on the same day", async ({ page }) => {
  await createTrip(page, { city: "杭州市", days: 2, pet: "豆豆" });
  await page.getByRole("tab", { name: "地点浏览" }).click();

  await addDayAttraction(page, "西湖", 1);
  await addDayAttraction(page, "西湖", 1);

  await expect(page.locator('[data-stop-id^="d1:"]')).toHaveCount(2);
  await expect(page.getByTestId("trip-panel").getByText("西湖", { exact: true })).toHaveCount(2);
});

test("drags a stop across days and into unscheduled", async ({ page }) => {
  await createTrip(page, { city: "杭州市", days: 2, pet: "豆豆" });
  await page.getByRole("tab", { name: "地点浏览" }).click();
  await addDayAttraction(page, "西湖", 1);

  await dragHandleTo(
    page,
    "西湖",
    page.getByTestId("trip-panel").getByText("第 2 天", { exact: true }),
  );
  await expect(page.locator('[data-stop-id^="d2:"]')).toContainText("西湖");

  await dragHandleTo(
    page,
    "西湖",
    page.getByTestId("trip-panel").getByText("未排期", { exact: true }),
  );
  await expect(page.locator('[data-stop-id^="u:"]')).toContainText("西湖");
});

test("keeps local edits when saving fails and retries", async ({ page }) => {
  await createTrip(page, { city: "杭州市", days: 2, pet: "豆豆" });
  await page.getByRole("tab", { name: "地点浏览" }).click();

  let failSaving = true;
  await page.route("**/api/trips/*", async (route) => {
    if (failSaving && route.request().method() === "PUT") {
      await route.abort();
      return;
    }
    await route.continue();
  });

  const card = page.locator('[data-slot="card"]').filter({ hasText: "西湖" });
  await card.getByRole("combobox", { name: "添加到行程" }).click();
  await page.getByRole("option", { name: "第 1 天" }).click();
  await expect(page.getByTestId("save-status")).toContainText("保存失败");
  await expect(page.getByTestId("trip-panel")).toContainText("西湖");

  failSaving = false;
  await page.getByRole("button", { name: "重试" }).click();
  await expect(page.getByTestId("save-status")).toContainText("已保存");
});

test("expands on the left for desktop and full screen on mobile", async ({ page }) => {
  await createTrip(page, { city: "杭州市", days: 2, pet: "豆豆" });
  const panel = page.getByTestId("trip-panel");
  await expect(panel.getByText("第 1 天", { exact: true })).toBeVisible();
  await expect(panel.getByText("第 2 天", { exact: true })).toBeVisible();
  await expect(panel.getByText("未排期", { exact: true })).toBeVisible();
  const desktop = await panel.boundingBox();
  expect(desktop?.width).toBeGreaterThan(300);
  expect(desktop?.width).toBeLessThan(500);
  expect(desktop?.x).toBeLessThan(30);

  await page.setViewportSize({ width: 800, height: 700 });
  await page.reload();
  await expect(panel).toBeVisible();
  await page.getByRole("button", { name: "展开行程面板" }).click();
  const mobile = await panel.boundingBox();
  expect(mobile?.width).toBeGreaterThanOrEqual(790);
  expect(mobile?.height).toBeGreaterThanOrEqual(690);
});

test("does not render the panel on the login page", async ({ page }) => {
  await createTrip(page, { city: "杭州市", days: 1, pet: "豆豆" });
  await expect(page.getByTestId("trip-panel")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId("trip-panel")).toHaveCount(0);
});

test("shows active-pet location policy tags", async ({ page }) => {
  await createTrip(page, { city: "杭州市", days: 1, pet: "豆豆" });
  await page.getByRole("tab", { name: "地点浏览" }).click();

  const xiHu = page.locator('[data-slot="card"]').filter({ hasText: "西湖" });
  await expect(xiHu.getByText("豆豆 · 不友好")).toBeVisible();
  await expect(xiHu.getByText(/毛毛/)).toHaveCount(0);
});
