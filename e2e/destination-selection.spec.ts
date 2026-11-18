import { expect, test, type Page } from "@playwright/test";
import {
  cityCard,
  confirmTripDialog,
  createTrip,
  openCities,
  openTripDialog,
  pickCalendarDate,
  resetTrips,
  searchCity,
  setTripDates,
  signIn,
} from "./trip-helpers";

async function guestCount(page: Page): Promise<number> {
  const text = await page.getByText(/共 \d+ 个候选/).textContent();
  return Number(text?.match(/共 (\d+) 个候选/)?.[1] ?? NaN);
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("E1 shows city candidates with 我的行程 tab and without duration input", async ({ page }) => {
  await openCities(page);

  expect(await guestCount(page)).toBeGreaterThan(2);
  await expect(page.getByTestId("city-card")).toHaveCount(9);
  await expect(page.getByRole("navigation", { name: "城市分页" })).toBeVisible();
  await expect(page.getByText(/第 1 \/ \d+ 页/)).toBeVisible();
  await expect(page.getByRole("tab", { name: "我的行程" })).toBeVisible();
  await expect(page.getByText("旅游总天数")).toHaveCount(0);
  await expect(page.locator("header").getByText("目的地未选")).toHaveCount(0);
});

test("E2 searches by city or province keyword and shows empty state", async ({ page }) => {
  await openCities(page);

  const search = page.getByRole("textbox", { name: "搜索城市" });
  await search.fill("杭州");
  await expect(page.getByText("共 1 个候选")).toBeVisible();
  await expect(cityCard(page, "杭州市")).toBeVisible();
  await expect(cityCard(page, "珠海市")).toHaveCount(0);

  await search.fill("广东");
  await expect(page.getByTestId("city-card")).toHaveCount(9);
  await expect(cityCard(page, "杭州市")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "城市分页" })).toContainText(
    "第 1 / 3 页",
  );

  await search.fill("不存在的城市");
  await expect(page.getByText("共 0 个候选")).toBeVisible();
  await expect(page.getByText("暂无符合条件的目的地")).toBeVisible();
});

test("E3 pet-friendly filter keeps eligible candidates", async ({ page }) => {
  await openCities(page);
  await searchCity(page, "杭州");

  const total = await guestCount(page);
  const filter = page.getByRole("checkbox", { name: "宠物友好筛选" });
  await filter.click();
  await expect(filter).toBeChecked();
  await expect(page.getByText(`共 ${total} 个候选`)).toBeVisible();
  await expect(cityCard(page, "杭州市")).toBeVisible();
});

test("E4 candidate cards show one tag per pet", async ({ page }) => {
  await openCities(page);
  await searchCity(page, "杭州");

  const card = cityCard(page, "杭州市");
  await expect(card.getByText("豆豆 · 友好")).toBeVisible();
  await expect(card.getByText("毛毛 · 无法判定")).toBeVisible();
});

test("E5 selecting a city opens the trip dialog without POSTing a trip", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/trips"
    ) {
      posts.push(request.url());
    }
  });

  await openCities(page);
  const dialog = await openTripDialog(page, "杭州市");
  const calendar = dialog.locator('[data-slot="calendar-range"]');
  await expect(calendar).toBeVisible();
  await expect(calendar.locator('[data-date][aria-pressed="true"]')).toHaveCount(0);

  await dialog.getByRole("button", { name: "取消" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "搜索城市" })).toBeVisible();
  expect(posts).toHaveLength(0);
});

test("E6 confirming the dialog creates a trip and opens attraction browsing", async ({ page }) => {
  await openCities(page);
  await openTripDialog(page, "珠海市");
  await setTripDates(page, 3);
  await confirmTripDialog(page);

  await expect(page.getByRole("heading", { name: "景点", exact: true })).toBeVisible();
  const panel = page.getByTestId("trip-panel");
  await expect(panel).toContainText("Day 3");

  const activeTripId = await page.evaluate(() =>
    window.localStorage.getItem("pawtrip.activeTripId"),
  );
  expect(activeTripId).not.toBeNull();

  await page.reload();
  await expect(page.getByRole("heading", { name: "景点", exact: true })).toBeVisible();
  await expect(page.getByTestId("trip-panel")).toContainText("Day 3");
});

test("E7 rejects incomplete or overlong date ranges without creating a trip", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/trips"
    ) {
      posts.push(request.url());
    }
  });

  await openCities(page);
  const dialog = await openTripDialog(page, "杭州市");

  await pickCalendarDate(page, "2026-12-01");
  await dialog.getByRole("button", { name: "确定" }).click();
  await expect(dialog.getByRole("alert")).toContainText("请选择开始和结束日期");

  await pickCalendarDate(page, "2026-12-08");
  await dialog.getByRole("button", { name: "确定" }).click();
  await expect(dialog.getByRole("alert")).toContainText("行程需为 1–7 天");

  await expect(dialog).toBeVisible();
  expect(posts).toHaveLength(0);
});

test("E8 city cards expose policy inline without policy links", async ({ page }) => {
  await openCities(page);
  await page.getByRole("textbox", { name: "搜索城市" }).fill("珠海");
  await page.getByText("共 1 个候选").waitFor();

  const card = cityCard(page, "珠海市");
  await expect(
    card.getByRole("link", { name: /查看.*的城市政策/ }),
  ).toHaveCount(0);
  await expect(page.getByText("政策要点")).toHaveCount(0);
  await card.click();
  await expect(page).toHaveURL(/\/cities$/);
  await expect(
    page.getByRole("heading", { name: "珠海市宠物管理政策" }),
  ).toBeVisible();
  await expect(page.getByText("政策要点")).toBeVisible();
});

test("E9 active trip is cleared when selecting another city", async ({
  page,
}) => {
  await createTrip(page, { city: "杭州市", days: 2 });
  await openCities(page);
  await searchCity(page, "杭州");

  await expect(page.getByRole("textbox", { name: "搜索城市" })).toBeVisible();
  const card = cityCard(page, "杭州市");
  const pick = card.getByRole("button", { name: "Pick" });
  await expect(pick).toBeEnabled();
  await pick.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("当前已有激活行程")).toHaveCount(0);
  expect(
    await page.evaluate(() => window.localStorage.getItem("pawtrip.activeTripId")),
  ).toBeNull();
});

test("E11 keeps 我的行程 tab selected on direct access", async ({ page }) => {
  await page.goto("/trips");
  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.getByRole("tab", { name: "我的行程" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("E13 prompts for a pet profile when the user has none", async ({ page }) => {
  await page.route("**/api/pets", (route) => route.fulfill({ json: [] }));
  await page.getByRole("tab", { name: "城市浏览" }).click();
  await searchCity(page, "杭州");

  await expect(page.getByText(/尚未添加宠物档案/)).toBeVisible();
  await expect(page.getByRole("link", { name: "先去添加宠物" })).toBeVisible();
  await expect(cityCard(page, "杭州市").getByText(/·/)).toHaveCount(0);
});

test("E14 reports a pet API failure instead of an empty pet list", async ({ page }) => {
  await page.route("**/api/pets", (route) =>
    route.fulfill({ status: 400, json: { status: 400 } }),
  );
  await page.getByRole("tab", { name: "城市浏览" }).click();

  await expect(page.getByText("暂时无法读取宠物档案，请稍后重试。")).toBeVisible();
  await expect(page.getByText(/尚未添加宠物档案/)).toHaveCount(0);
});

test("E15 selecting a city shows its policy in the sidebar", async ({ page }) => {
  await openCities(page);
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(page.getByText("政策要点")).toHaveCount(0);

  await searchCity(page, "珠海");
  const card = cityCard(page, "珠海市");
  await expect(card.getByRole("link")).toHaveCount(0);
  await card.click();

  const panel = page.getByRole("region", { name: "城市宠物管理政策" });
  await expect(
    panel.getByRole("heading", { name: "珠海市宠物管理政策" }),
  ).toBeVisible();
  await expect(panel.getByText("更新于 2025-07")).toBeVisible();
  await expect(panel.getByText("政策要点")).toBeVisible();
  await expect(panel.locator("li")).toHaveCount(3);
  await expect(panel).toContainText("严格管理区内禁止饲养危险犬");
  await expect(
    panel.getByText(/您的宠物豆豆不在珠海市禁养名单中/),
  ).toBeVisible();
  await expect(
    panel.getByText(/毛毛：宠物未填写犬种，无法判定禁养名单/),
  ).toBeVisible();
  await expect(
    panel.getByText("仍需遵守当地关于数量、牵引、疫苗等其他规定。").first(),
  ).toBeVisible();
  await expect(panel.getByText("禁养犬种名单")).toHaveCount(0);
  await expect(panel.getByText("可携带犬种")).toHaveCount(0);
  await expect(
    panel.getByRole("link", { name: "查看完整政策与来源" }),
  ).toBeVisible();

  await panel.getByRole("button", { name: "关闭城市政策" }).click();
  await expect(panel).toHaveCount(0);
  await card.focus();
  await page.keyboard.press("Enter");
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "关闭城市政策" }).click();
  await expect(panel).toHaveCount(0);
  await card.focus();
  await page.keyboard.press("Space");
  await expect(panel).toBeVisible();

  await panel.getByRole("link", { name: "珠海市禁养犬名单" }).click();
  await expect(page).toHaveURL(
    /\/destinations\/440400\/policy#banned-breeds$/,
  );
  await expect(
    page.getByRole("heading", { name: "珠海市养宠政策" }),
  ).toBeVisible();
  await expect(page.getByText("禁养犬种名单").first()).toBeVisible();
  await expect(page.locator("#banned-breeds")).toBeInViewport();
  expect(
    await page
      .getByTestId("app-scroll")
      .evaluate((element) => element.scrollTop),
  ).toBeGreaterThan(0);
  await expect(
    page.getByText("仅列出部分示例，完整名单请查阅当地政府通告。"),
  ).toBeVisible();
});

test("E16 paginates candidates and resets to the first page on search", async ({
  page,
}) => {
  await openCities(page);

  const pager = page.getByRole("navigation", { name: "城市分页" });
  await expect(pager).toContainText("第 1 /");
  await expect(pager.getByRole("button", { name: "上一页" })).toBeDisabled();
  await expect(pager.getByRole("button", { name: "下一页" })).toBeEnabled();
  const total = await guestCount(page);
  const firstAdcode = await page
    .getByTestId("city-card")
    .first()
    .getAttribute("data-adcode");

  await pager.getByRole("button", { name: "下一页" }).click();
  await expect(pager).toContainText("第 2 /");
  await expect(pager.getByRole("button", { name: "上一页" })).toBeEnabled();
  await expect(page.getByTestId("city-card").first()).not.toHaveAttribute(
    "data-adcode",
    firstAdcode ?? "",
  );
  expect(await guestCount(page)).toBe(total);

  await page.getByRole("textbox", { name: "搜索城市" }).fill("广东");
  await expect(pager).toContainText("第 1 / 3 页");
  await expect(pager.getByRole("button", { name: "上一页" })).toBeDisabled();

  await pager.getByRole("button", { name: "下一页" }).click();
  await expect(pager).toContainText("第 2 / 3 页");
  await pager.getByRole("button", { name: "下一页" }).click();
  await expect(pager).toContainText("第 3 / 3 页");
  await expect(pager.getByRole("button", { name: "下一页" })).toBeDisabled();

  await searchCity(page, "杭州");
  await expect(pager).toHaveCount(0);
  await expect(cityCard(page, "杭州市")).toBeVisible();
});
