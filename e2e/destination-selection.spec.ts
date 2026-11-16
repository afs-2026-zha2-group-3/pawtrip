import { expect, test, type Page } from "@playwright/test";

const username = "demo";
const password = "123456";
const SELECTED_KEY = "pawtrip.selectedDestination";

async function signIn(page: Page, as: "user" | "admin" = "user") {
  const authResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/me",
  );
  await page.goto("/login");
  await authResponse;
  await page.getByLabel("Username").fill(as === "admin" ? "admin" : username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

async function openCities(page: Page) {
  const candidatesResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/destinations",
  );
  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page).toHaveURL(/\/cities$/);
  await candidatesResponse;
}

function cityCard(page: Page, cityName: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: cityName });
}

// E1 — 候选列表：两城卡片 + 收录 Badge
test("E1 shows both pilot city cards with policy coverage badges", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  await expect(cityCard(page, "杭州市")).toBeVisible();
  await expect(cityCard(page, "珠海市")).toBeVisible();
  await expect(cityCard(page, "杭州市").getByText("政策已收录")).toBeVisible();
  await expect(cityCard(page, "珠海市").getByText("政策已收录")).toBeVisible();
  await expect(page.getByText("共 2 个候选")).toBeVisible();
});

// E2 — 城市搜索：关键词过滤 + 计数 + 空态
test("E2 searches by city or province keyword and shows empty state", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  const search = page.getByRole("textbox", { name: "搜索城市" });
  await search.fill("杭州");
  await expect(page.getByText("共 1 个候选")).toBeVisible();
  await expect(cityCard(page, "杭州市")).toBeVisible();
  await expect(cityCard(page, "珠海市")).toHaveCount(0);

  await search.fill("广东");
  await expect(page.getByText("共 1 个候选")).toBeVisible();
  await expect(cityCard(page, "珠海市")).toBeVisible();
  await expect(cityCard(page, "杭州市")).toHaveCount(0);

  await search.fill("不存在的城市");
  await expect(page.getByText("共 0 个候选")).toBeVisible();
  await expect(page.getByText("暂无符合条件的目的地")).toBeVisible();
});

// E3 — 宠物友好筛选退化：无档案时仅按政策收录过滤
test("E3 degrades filter to coverage-only without a pet profile", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  await page.getByRole("checkbox", { name: "宠物友好筛选" }).click();
  await expect(page.getByRole("checkbox", { name: "宠物友好筛选" })).toBeChecked();
  // 两城均已收录且无档案不做禁养判定 → 全部保留
  await expect(page.getByText("共 2 个候选")).toBeVisible();
  await expect(cityCard(page, "杭州市")).toBeVisible();
  await expect(cityCard(page, "珠海市")).toBeVisible();
});

// E5 — 关闭筛选恢复全部候选
test("E5 turning the filter off restores all candidates", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  const filter = page.getByRole("checkbox", { name: "宠物友好筛选" });
  await filter.click();
  await page.getByRole("textbox", { name: "搜索城市" }).fill("杭州");
  await expect(page.getByText("共 1 个候选")).toBeVisible();

  await filter.click();
  await expect(filter).not.toBeChecked();
  await page.getByRole("textbox", { name: "搜索城市" }).fill("");
  await expect(page.getByText("共 2 个候选")).toBeVisible();
});

// E7 — 选定目的地：确认提示承载规划上下文
test("E7 selecting a city confirms and shows planning context", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();

  const confirmation = page.getByRole("alert").filter({ hasText: "目的地已选定" });
  await expect(confirmation).toContainText("杭州市");
  await expect(confirmation).toContainText("行程规划将使用杭州市");
});

// E8 — 刷新/重进保留选定
test("E8 keeps the selection across reload and re-entry", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "目的地已选定" })).toBeVisible();

  await page.reload();
  await expect(page.locator("header").getByText("杭州市")).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "目的地已选定" })).toContainText("杭州市");

  await page.getByRole("tab", { name: "Home" }).click();
  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "目的地已选定" })).toContainText("杭州市");
});

// E9 — 重选覆盖 + 跨页面 chip 同步
test("E9 reselecting overwrites the destination and syncs the header chip", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  await expect(page.locator("header").getByText("杭州市")).toBeVisible();

  await cityCard(page, "珠海市").getByRole("button", { name: "选定" }).click();
  await expect(page.locator("header").getByText("珠海市")).toBeVisible();
  await expect(page.locator("header").getByText("杭州市")).toHaveCount(0);

  await page.getByRole("tab", { name: "Home" }).click();
  await expect(page.locator("header").getByText("珠海市")).toBeVisible();
});

// E12 — 顶栏 chip：未选/已选
test("E12 header chip shows unset and selected destination", async ({ page }) => {
  await signIn(page);
  await expect(page.locator("header").getByText("目的地未选")).toBeVisible();

  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  await expect(page.locator("header").getByText("杭州市")).toBeVisible();
  await expect(page.locator("header").getByText("目的地未选")).toHaveCount(0);
});

// E13 — 确认登出清除已选目的地与缓存
test("E13 confirmed logout clears the persisted destination", async ({ page }) => {
  await signIn(page);
  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  await expect(page.locator("header").getByText("杭州市")).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), SELECTED_KEY),
  ).not.toBeNull();

  await page.getByRole("button", { name: "Log out" }).click();
  const confirmation = page.getByRole("alertdialog");
  await confirmation.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  expect(
    await page.evaluate((key) => localStorage.getItem(key), SELECTED_KEY),
  ).toBeNull();

  await signIn(page);
  await expect(page.locator("header").getByText("目的地未选")).toBeVisible();
});

// E14 — 导航三 Tab 与 /cities 同步；管理 Tab 守卫（回归）
test("E14 keeps tab navigation, city route sync and admin guard", async ({ page }) => {
  await signIn(page);
  for (const tab of ["Home", "Paws", "城市浏览"]) {
    await expect(page.getByRole("tab", { name: tab })).toBeVisible();
  }
  await expect(page.getByRole("tab", { name: "地点管理" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "城市管理" })).toHaveCount(0);

  await page.getByRole("tab", { name: "城市浏览" }).click();
  await expect(page).toHaveURL(/\/cities$/);
  await expect(page.getByRole("tab", { name: "城市浏览" })).toHaveAttribute("aria-selected", "true");

  // USER 直接访问管理路由 → 返回普通受保护页面
  await page.goto("/admin/cities");
  await expect(page).toHaveURL("/");

  // 未登录访问 /cities → /login
  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/cities");
  await expect(page).toHaveURL(/\/login$/);
});

test("E14 admin sees management tabs synced with admin routes", async ({ page }) => {
  await signIn(page, "admin");
  await expect(page.getByRole("tab", { name: "地点管理" })).toBeVisible();
  await page.getByRole("tab", { name: "城市管理" }).click();
  await expect(page).toHaveURL(/\/admin\/cities$/);
  await expect(page.getByRole("tab", { name: "城市管理" })).toHaveAttribute("aria-selected", "true");
});

// E15 — 反向：/cities 不展示政策条文详情（Non-goal #14）
test("E15 does not expose policy detail content or entry on /cities", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  await expect(page.getByRole("button", { name: "查看政策" })).toHaveCount(0);
  await expect(page.getByText("政策条文")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /养犬政策/ })).toHaveCount(0);
});

// E16 — 反向：筛选仅政策维度，无设施/评价参与（Non-goal Release 2）
test("E16 filter is policy-only without facility or rating dimensions", async ({ page }) => {
  await signIn(page);
  await openCities(page);

  await expect(page.getByText("筛选口径（MVP 仅政策维度）")).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(page.getByText("设施", { exact: true })).toHaveCount(0);
  await expect(page.getByText("评价", { exact: true })).toHaveCount(0);
});

// ---- 外部依赖门控用例（@profile-dependency，US-01 change 交付 breed/读取接口后启用）----
// fixture 方案见 atdd-design §5：向 E2E 库 pet 表写入品种行，或经外部 /paws UI 创建；
// 词表与禁养种子同一词表（比特犬/柯基等）。外部契约落地后核对 adapter 并解除 fixme。

test.fixme("E4 @profile-dependency filter excludes cities banning the profile breed", async ({ page }) => {
  // 前置：档案品种=比特犬（两城均禁养）
  await signIn(page);
  await openCities(page);
  await page.getByRole("checkbox", { name: "宠物友好筛选" }).click();
  await expect(page.getByText("共 0 个候选")).toBeVisible();
  await expect(page.getByText("暂无符合条件的目的地")).toBeVisible();
});

test.fixme("E6 @profile-dependency banned-breed badge shows only on hitting covered cities", async ({ page }) => {
  // 前置：档案品种=比特犬
  await signIn(page);
  await openCities(page);
  await expect(cityCard(page, "杭州市").getByText("档案品种禁养")).toBeVisible();
  await expect(cityCard(page, "珠海市").getByText("档案品种禁养")).toBeVisible();
  // 「其他」/未收录分支：改档案品种=其他 后 Badge 消失（外部 /paws 编辑）
});

test.fixme("E10 @profile-dependency hitting breed can still select with persistent alert", async ({ page }) => {
  // 前置：档案品种=比特犬
  await signIn(page);
  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  const alert = page.getByRole("alert").filter({ hasText: "禁养" });
  await expect(alert).toBeVisible();
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "禁养" })).toBeVisible();
});

test.fixme("E11 @profile-dependency non-hitting breed shows no banned-breed alert", async ({ page }) => {
  // 前置：档案品种=柯基（两城均未禁养）
  await signIn(page);
  await openCities(page);
  await cityCard(page, "杭州市").getByRole("button", { name: "选定" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "目的地已选定" })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "禁养" })).toHaveCount(0);
});