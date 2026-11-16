import { expect, test, type Page } from "@playwright/test";

const username = "demo";
const password = "123456";

async function signIn(page: Page) {
  const authResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/me",
  );
  await page.goto("/login");
  await authResponse;
  const usernameInput = page.getByLabel("Username");
  const passwordInput = page.getByLabel("Password");
  await expect(async () => {
    await usernameInput.fill(username);
    await passwordInput.fill(password);
    await expect(usernameInput).toHaveValue(username, { timeout: 300 });
    await expect(passwordInput).toHaveValue(password, { timeout: 300 });
  }).toPass({ timeout: 5000 });
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

async function openCities(page: Page) {
  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page).toHaveURL(/\/cities$/);
  await expect(page.getByText(/共 \d+ 个候选/)).toBeVisible();
}

function cityCard(page: Page, cityName: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: cityName });
}

async function selectCity(page: Page, cityName: string) {
  const attractionsResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/locations/attractions",
  );
  await cityCard(page, cityName).getByRole("button", { name: "选定" }).click();
  await expect(page).toHaveURL(/\/attractions$/);
  await attractionsResponse;
}

function attractionCard(page: Page, name: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: name });
}

test("E1 selecting a city opens the scenic tab with pet-friendly attractions", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await selectCity(page, "珠海市");

  await expect(page.getByRole("heading", { name: "珠海市景点" })).toBeVisible();
  await expect(attractionCard(page, "情侣路")).toBeVisible();
  await expect(attractionCard(page, "情侣路").getByText("宠物友好")).toBeVisible();
  await expect(attractionCard(page, "珠海渔女")).toHaveCount(0);
  await expect(attractionCard(page, "珠海海滨公园")).toHaveCount(0);
  await expect(attractionCard(page, "珠海某酒店")).toHaveCount(0);
});

test("E2 toggles all saved attractions and shows forbidden/unconfigured states", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await selectCity(page, "珠海市");

  await page.getByRole("checkbox", { name: "显示全部景点" }).click();
  await expect(attractionCard(page, "珠海渔女").getByText("禁止携带")).toBeVisible();
  await expect(attractionCard(page, "珠海海滨公园").getByText("未配置")).toBeVisible();
  await expect(attractionCard(page, "珠海无名景点").getByText("未配置")).toBeVisible();
  await expect(attractionCard(page, "珠海某酒店")).toHaveCount(0);
});

test("E3 shows pet policy fields in attraction detail", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await selectCity(page, "珠海市");

  await attractionCard(page, "情侣路").getByRole("button", { name: "查看详情" }).click();
  await expect(page).toHaveURL(/\/attractions\/e2e-zhu-a$/);
  await expect(page.locator('[data-slot="card-title"]').filter({ hasText: "情侣路" })).toBeVisible();
  await expect(page.getByText("宠物友好", { exact: true })).toBeVisible();
  await expect(page.getByText("1 只 / 人")).toBeVisible();
  await expect(page.getByText("8.5 kg")).toBeVisible();
  await expect(page.getByText("40 cm")).toBeVisible();
  await expect(page.getByText("需要", { exact: true })).toBeVisible();
  await expect(page.getByText("不需要", { exact: true })).toBeVisible();
  await expect(page.getByText("10.5 元 / 只 / 次")).toBeVisible();
  await expect(page.getByText("狗", { exact: true })).toBeVisible();
  await expect(page.getByText("预约要求")).toHaveCount(0);
});

test("E4 shows forbidden detail and empty policy detail", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await selectCity(page, "珠海市");

  await page.getByRole("checkbox", { name: "显示全部景点" }).click();
  await attractionCard(page, "珠海渔女").getByRole("button", { name: "查看详情" }).click();
  await expect(page).toHaveURL(/\/attractions\/e2e-zhu-b$/);
  await expect(page.getByText("禁止携带", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "返回景点列表" }).click();
  await expect(page).toHaveURL(/\/attractions$/);
  await page.getByRole("checkbox", { name: "显示全部景点" }).click();
  await attractionCard(page, "珠海无名景点").getByRole("button", { name: "查看详情" }).click();
  await expect(page).toHaveURL(/\/attractions\/e2e-zhu-d$/);
  await expect(page.getByText("未配置", { exact: true })).toBeVisible();
  await expect(page.getByText("暂无携宠政策")).toBeVisible();
});

test("E5 switches city and refreshes the attraction list", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await selectCity(page, "珠海市");
  await expect(attractionCard(page, "情侣路")).toBeVisible();

  await openCities(page);
  await selectCity(page, "杭州市");

  await expect(attractionCard(page, "西湖")).toBeVisible();
  await expect(attractionCard(page, "西湖").getByText("宠物友好")).toBeVisible();
  await expect(attractionCard(page, "灵隐寺")).toHaveCount(0);
  await expect(attractionCard(page, "情侣路")).toHaveCount(0);

  await page.getByRole("checkbox", { name: "显示全部景点" }).click();
  await expect(attractionCard(page, "灵隐寺").getByText("禁止携带")).toBeVisible();
});

test("E6 prompts for a destination without a selected city", async ({ page }) => {
  await signIn(page);
  const attractionRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/locations/attractions") {
      attractionRequests.push(request.url());
    }
  });

  await page.goto("/attractions");
  await expect(page.getByText("请先选择目的地")).toBeVisible();
  await expect(page.getByRole("button", { name: "去选择目的地" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "景区浏览" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.waitForTimeout(500);
  expect(attractionRequests).toHaveLength(0);
});

test("E7 selects the scenic tab and keeps it selected on detail", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await selectCity(page, "珠海市");

  await expect(page.getByRole("tab", { name: "景区浏览" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("tab", { name: "城市浏览" })).toHaveAttribute(
    "aria-selected",
    "false",
  );

  await attractionCard(page, "情侣路").getByRole("button", { name: "查看详情" }).click();
  await expect(page.getByRole("tab", { name: "景区浏览" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("E8 shows an empty city state", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await selectCity(page, "广州市");

  await expect(page.getByText("该城市暂无已保存景点")).toBeVisible();
});

test("E9 shows no friendly state and toggles all for a city with only forbidden/unconfigured", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await selectCity(page, "南京市");

  await expect(page.getByText("该城市暂无宠物友好的已保存景点")).toBeVisible();
  await page.getByRole("checkbox", { name: "显示全部景点" }).click();
  await expect(attractionCard(page, "中山陵").getByText("禁止携带")).toBeVisible();
  await expect(attractionCard(page, "玄武湖").getByText("未配置")).toBeVisible();
});

test("E10 exposes no city selector, type filter, edit or itinerary controls", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await selectCity(page, "珠海市");

  await expect(page.getByRole("textbox", { name: "搜索城市" })).toHaveCount(0);
  await expect(page.getByLabel("地点类型筛选")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /编辑|保存|删除|加入行程/ })).toHaveCount(0);

  await attractionCard(page, "情侣路").getByRole("button", { name: "查看详情" }).click();
  await expect(page.getByRole("button", { name: /编辑|保存|删除/ })).toHaveCount(0);
});

test("E11 clears the selected destination on logout", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await selectCity(page, "珠海市");
  await expect(page.locator("header").getByText("珠海市")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await signIn(page);
  await page.goto("/attractions");
  await expect(page.getByText("请先选择目的地")).toBeVisible();
});

test("E12 shows no scenic entry inside city browsing", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  await expect(page.getByRole("button", { name: /查看.*景点/ })).toHaveCount(0);
  await expect(page.locator('[data-slot="card"]').filter({ hasText: "情侣路" })).toHaveCount(0);
});
