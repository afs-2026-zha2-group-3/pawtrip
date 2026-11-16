import { expect, test, type Page } from "@playwright/test";

const username = "demo";
const password = "123456";

async function signIn(page: Page, user = username) {
  const authResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/me",
  );
  await page.goto("/login");
  await authResponse;
  await page.getByLabel("Username").fill(user);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

function policyUrl(adcode: string, breed?: string) {
  const query = breed ? `?breed=${encodeURIComponent(breed)}` : "";
  return `/destinations/${adcode}/policy${query}`;
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("warns when the pet breed is on the banned list", async ({ page }) => {
  await page.goto(policyUrl("440400", "比特斗牛梗犬"));

  await expect(page.getByText(/禁养犬种提醒/)).toBeVisible();
  await expect(page.getByText(/比特斗牛梗犬/).first()).toBeVisible();
  await expect(page.getByText(/可能面临/)).toBeVisible();
});

test("reports an unmatched breed without promising entry", async ({ page }) => {
  await page.goto(policyUrl("440400", "柯基犬"));

  await expect(page.getByText(/未命中禁养名单/)).toBeVisible();
  await expect(page.getByText(/以当地政府最新文件为准/)).toBeVisible();
});

test("does not judge when no breed is available", async ({ page }) => {
  await page.goto(policyUrl("440400"));

  await expect(page.getByText(/尚未填写宠物档案/)).toBeVisible();
});

test("does not judge when the breed is 其他", async ({ page }) => {
  await page.goto(policyUrl("440400", "其他"));

  await expect(page.getByText(/「其他」/)).toBeVisible();
  await expect(page.getByText(/精确比较/)).toBeVisible();
});

test("shows an empty state for a city without policy", async ({ page }) => {
  await page.goto(policyUrl("440300"));

  await expect(page.getByText("暂无当地政策数据")).toBeVisible();
});

test("shows an error for an unknown city", async ({ page }) => {
  await page.goto(policyUrl("999999"));

  await expect(page.getByText(/City was not found/)).toBeVisible();
});

test("shows source, update month and area scope", async ({ page }) => {
  await page.goto(policyUrl("440400", "柯基犬"));

  await expect(page.getByText(/更新于 2025-07/)).toBeVisible();
  await expect(page.getByText(/适用范围：严格管理区/)).toBeVisible();
  await expect(page.getByText(/以当地政府最新文件为准/)).toBeVisible();
});

test("does not render a destination list or filter", async ({ page }) => {
  await page.goto(policyUrl("440400", "柯基犬"));
  await expect(page.getByText(/未命中禁养名单/)).toBeVisible();

  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);
});

test("does not render a pet profile form", async ({ page }) => {
  await page.goto(policyUrl("440400", "柯基犬"));
  await expect(page.getByText(/未命中禁养名单/)).toBeVisible();

  await expect(page.getByRole("button", { name: /保存档案/ })).toHaveCount(0);
});

test("does not expose the admin policy endpoint", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
  });
  const page = await context.newPage();

  try {
    await signIn(page, "admin");
    const response = await page.request.get("/api/admin/pet-policies");

    expect(response.status()).toBe(404);
  } finally {
    await context.close();
  }
});

test("does not render a booking entry", async ({ page }) => {
  await page.goto(policyUrl("440400", "柯基犬"));
  await expect(page.getByText(/未命中禁养名单/)).toBeVisible();

  await expect(page.getByRole("link", { name: /订票|预订/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /订票|预订/ })).toHaveCount(0);
});
