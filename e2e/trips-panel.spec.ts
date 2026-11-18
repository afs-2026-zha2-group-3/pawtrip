import { expect, test, type Page } from "@playwright/test";
import {
  completeTripInPastViaApi,
  completeTripViaApi,
  createActiveTripViaApi,
  createTrip,
  createTripViaApi,
  csrfHeaders,
  openCities,
  openTrips,
  pets,
  resetTrips,
  signIn,
  tripCard,
  withTripPanelNotBlocking,
} from "./trip-helpers";

async function dragHandleTo(page: Page, stopName: string, target: ReturnType<Page["locator"]>) {
  const handleButton = page
    .getByTestId("trip-panel")
    .getByRole("button", { name: `拖动${stopName}` })
    .first();
  const handle = (await handleButton.count()) > 0
    ? handleButton
    : page
        .getByTestId("trip-panel")
        .locator('[data-stop-id]')
        .filter({ hasText: stopName })
        .first();
  // 面板嵌入页面流后可能位于折叠线下方，先滚入视口再取坐标。
  await handle.scrollIntoViewIfNeeded();
  await target.first().scrollIntoViewIfNeeded();
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
  await page.waitForTimeout(150);
  await page.mouse.move(endX, endY, { steps: 20 });
  await page.waitForTimeout(150);
  await page.mouse.move(endX, endY + 2, { steps: 3 });
  await page.waitForTimeout(150);
  await page.mouse.up();
}

async function addDayAttraction(page: Page, name: string, day: number) {
  const put = page.waitForResponse(
    (response) =>
      /\/api\/trips\/\d+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "PUT",
  );
  const card = page.locator('[data-slot="card"]').filter({ hasText: name });
  await withTripPanelNotBlocking(page, async () => {
    await card.getByRole("combobox", { name: "添加到行程" }).click();
    await page.getByRole("option", { name: `第 ${day} 天` }).click();
  });
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

test("groups trips by status, filters them, and supports editing and delete", async ({
  page,
}) => {
  // 覆盖四种状态与多轮编辑/查看切换，交互步骤多，30s 默认超时在慢机上不够。
  test.setTimeout(60_000);
  // 默认 1280x720 下固定行程面板会遮住第三张卡片的按钮，改用更高视口避免遮挡。
  await page.setViewportSize({ width: 1440, height: 900 });
  const pet = (await pets(page))[0];
  const ended = await createTripViaApi(page, {
    name: "已结束行程",
    cityAdcode: "330100",
    petId: pet.id,
    totalDays: 1,
  });
  await completeTripInPastViaApi(page, ended);
  await createTripViaApi(page, {
    name: "杭州两日",
    cityAdcode: "330100",
    petId: pet.id,
    totalDays: 2,
  });
  const completed = await createTripViaApi(page, {
    name: "已完成行程",
    cityAdcode: "330100",
    petId: pet.id,
    totalDays: 3,
  });
  await completeTripViaApi(page, completed.id);
  await createTripViaApi(page, {
    name: "珠海三日",
    cityAdcode: "440400",
    petId: pet.id,
    totalDays: 3,
  });

  await openTrips(page);
  const cards = page.getByTestId("trip-card");
  await expect(cards).toHaveCount(4);
  // 待完成在前，已完成其次，行程结束最后；同组内按 id 升序。
  await expect(cards.nth(0)).toContainText("杭州两日");
  await expect(cards.nth(1)).toContainText("珠海三日");
  await expect(cards.nth(2)).toContainText("已完成行程");
  await expect(cards.nth(3)).toContainText("已结束行程");
  await expect(cards.nth(0)).toContainText("2 天");
  await expect(cards.nth(0)).toContainText("待完成");
  await expect(cards.nth(2)).toContainText("已完成");
  await expect(cards.nth(3)).toContainText("行程结束");

  const filters = page.getByRole("group", { name: "行程状态筛选" });
  await filters.getByRole("button", { name: "待完成", exact: true }).click();
  await expect(cards).toHaveCount(2);
  await filters.getByRole("button", { name: "已完成", exact: true }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.nth(0)).toContainText("已完成行程");
  await filters.getByRole("button", { name: "行程结束", exact: true }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.nth(0)).toContainText("已结束行程");
  await filters.getByRole("button", { name: "全部", exact: true }).click();
  await expect(cards).toHaveCount(4);

  await tripCard(page, "杭州两日").getByRole("button", { name: "编辑" }).click();
  await expect(page).toHaveURL(/\/attractions$/);
  await expect
    .poll(() =>
      page.evaluate(() => window.localStorage.getItem("pawtrip.activeTripId")),
    )
    .not.toBeNull();

  await openTrips(page);
  await expect(tripCard(page, "杭州两日")).toContainText("编辑中");
  await expect(tripCard(page, "珠海三日")).not.toContainText("编辑中");

  await tripCard(page, "珠海三日").getByRole("button", { name: "编辑" }).click();
  await expect(page).toHaveURL(/\/attractions$/);
  await openTrips(page);
  await expect(tripCard(page, "珠海三日")).toContainText("编辑中");
  await expect(tripCard(page, "杭州两日")).not.toContainText("编辑中");

  await tripCard(page, "珠海三日").getByRole("button", { name: "结束编辑" }).click();
  await expect(tripCard(page, "珠海三日")).not.toContainText("编辑中");
  await expect(page.getByTestId("trip-panel")).toHaveCount(0);

  await tripCard(page, "已完成行程").getByRole("button", { name: "查看行程单" }).click();
  await expect(page).toHaveURL(/\/itinerary$/);
  await openTrips(page);
  await expect(tripCard(page, "已完成行程")).not.toContainText("编辑中");
  await tripCard(page, "已完成行程").getByRole("button", { name: "编辑" }).click();
  await expect(page).toHaveURL(/\/attractions$/);

  await openTrips(page);
  await tripCard(page, "杭州两日").getByRole("button", { name: "删除" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "删除" }).click();
  await expect(tripCard(page, "杭州两日")).toHaveCount(0);
});

test("hides the itinerary until the plan is completed", async ({ page }) => {
  await createTrip(page, { city: "杭州市", days: 1 });

  await openTrips(page);
  await expect(page.getByTestId("trip-card").first()).toContainText("待完成");

  await page.goto("/itinerary");
  await expect(page.getByText("尚未创建行程单")).toBeVisible();
  await expect(page.getByRole("link", { name: "继续规划" })).toBeVisible();
});

test("keeps ended trips read-only while completed trips stay editable", async ({
  page,
}) => {
  const pet = (await pets(page))[0];
  const ended = await createTripViaApi(page, {
    name: "已结束行程",
    cityAdcode: "330100",
    petId: pet.id,
    totalDays: 2,
  });
  await completeTripInPastViaApi(page, ended);
  const completed = await createTripViaApi(page, {
    name: "即将出行",
    cityAdcode: "330100",
    petId: pet.id,
    totalDays: 2,
  });
  await completeTripViaApi(page, completed.id);

  await openTrips(page);
  const endedCard = tripCard(page, "已结束行程");
  await expect(endedCard).toContainText("行程结束");
  await expect(endedCard).toContainText("已结束，仅可查看");
  await expect(endedCard.getByRole("button", { name: "编辑" })).toHaveCount(0);
  await expect(endedCard.getByRole("button", { name: "查看行程单" })).toBeVisible();

  const completedCard = tripCard(page, "即将出行");
  await expect(completedCard).toContainText("已完成");
  await expect(completedCard.getByRole("button", { name: "编辑" })).toBeVisible();

  await endedCard.getByRole("button", { name: "查看行程单" }).click();
  await expect(page).toHaveURL(/\/itinerary$/);
  await expect(page.getByText(/仅可查看与导出/)).toBeVisible();
  await expect(page.getByTestId("trip-panel")).toContainText(
    "行程已结束，仅可查看，无法修改行程内容。",
  );

  const headers = await csrfHeaders(page);
  const response = await page.request.put(`/api/trips/${ended.id}`, {
    headers,
    data: {
      name: "改名",
      totalDays: 2,
      plan: { version: 1, days: [], unscheduled: [] },
    },
  });
  expect(response.status()).toBe(409);
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
  await tripCard(page, "已删除行程").getByRole("button", { name: "编辑" }).click();
  await expect(page.getByText("打开行程失败，请稍后重试。")).toBeVisible();
});

test("adds stops to the selected day and to unscheduled with debounced saving", async ({
  page,
}) => {
  await createActiveTripViaApi(page, { cityAdcode: "330100", totalDays: 3 });
  await page.goto("/attractions");
  await expect(page).toHaveURL(/\/attractions$/);
  const westLake = page.locator('[data-slot="card"]').filter({ hasText: "西湖" });
  await withTripPanelNotBlocking(page, async () => {
    await westLake.getByRole("combobox", { name: "添加到行程" }).click();
  });
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
  await withTripPanelNotBlocking(page, async () => {
    await card.getByRole("combobox", { name: "添加到行程" }).click();
    await page.getByRole("option", { name: "暂不排期" }).click();
  });
  await put;
  await expect(page.locator('[data-stop-id^="u:"]')).toContainText("灵隐寺");

  await page.reload();
  await expect(page.getByTestId("trip-panel")).toContainText("西湖");
  await expect(page.getByTestId("trip-panel")).toContainText("灵隐寺");
});

test("allows duplicate stops on the same day", async ({ page }) => {
  await createActiveTripViaApi(page, { cityAdcode: "330100", totalDays: 2 });
  await page.goto("/attractions");
  await expect(page).toHaveURL(/\/attractions$/);
  await addDayAttraction(page, "西湖", 1);
  await addDayAttraction(page, "西湖", 1);

  await expect(page.locator('[data-stop-id^="d1:"]')).toHaveCount(2);
  await expect(page.getByTestId("trip-panel").getByText("西湖", { exact: true })).toHaveCount(2);
});

test("drags a stop across days and into unscheduled", async ({ page }) => {
  await createActiveTripViaApi(page, { cityAdcode: "330100", totalDays: 2 });
  await page.goto("/attractions");
  await expect(page).toHaveURL(/\/attractions$/);
  await addDayAttraction(page, "西湖", 1);
  await page.waitForTimeout(600);

  await dragHandleTo(
    page,
    "西湖",
    page.getByTestId("trip-panel").getByText("Day 2", { exact: true }),
  );
  await expect(page.locator('[data-stop-id^="d2:"]')).toContainText("西湖");

  await dragHandleTo(
    page,
    "西湖",
    page.getByTestId("trip-panel").getByText("待安排", { exact: true }),
  );
  await expect(page.locator('[data-stop-id^="u:"]')).toContainText("西湖");
});

test("keeps local edits when saving fails and retries", async ({ page }) => {
  await createActiveTripViaApi(page, { cityAdcode: "330100", totalDays: 2 });
  await page.goto("/attractions");
  await expect(page).toHaveURL(/\/attractions$/);

  let failSaving = true;
  await page.route("**/api/trips/*", async (route) => {
    if (failSaving && route.request().method() === "PUT") {
      await route.abort();
      return;
    }
    await route.continue();
  });

  const card = page.locator('[data-slot="card"]').filter({ hasText: "西湖" });
  await withTripPanelNotBlocking(page, async () => {
    await card.getByRole("combobox", { name: "添加到行程" }).click();
    await page.getByRole("option", { name: "第 1 天" }).click();
  });
  await expect(page.getByTestId("trip-panel")).toContainText("西湖");

  failSaving = false;
});

test("shows active-pet location policy tags", async ({ page }) => {
  await createActiveTripViaApi(page, { cityAdcode: "330100", petName: "豆豆" });
  await page.goto("/attractions");
  await expect(page).toHaveURL(/\/attractions$/);

  const xiHu = page.locator('[data-slot="card"]').filter({ hasText: "西湖" });
  await expect(xiHu.getByText("豆豆 · 不友好")).toBeVisible();
  await expect(xiHu.getByText(/毛毛/)).toHaveCount(0);
});
