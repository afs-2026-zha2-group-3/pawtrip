import { expect, test, type Page } from "@playwright/test";
import { createTrip, resetTrips, signIn } from "./trip-helpers";

// 每个 Playwright worker 由 seed-users.mjs 预置独立的 petowner-wN 账号（各两只档案），
// 用于验证推荐列；admin 无档案，用于验证隐藏列。demo 保持无档案，供 /paws 的空档案流程使用。
const tableName = "交通携宠规则对比";

async function openTransportRules(page: Page) {
  await signIn(page);
  await resetTrips(page);
  await createTrip(page, { city: "杭州市", days: 1 });
  await page.getByRole("tab", { name: "交通规则" }).click();
  await expect(page.getByRole("table", { name: tableName })).toBeVisible();
}

function ruleRow(page: Page, mode: string) {
  return page.getByRole("row", { name: new RegExp(mode) });
}

test.describe("anonymous", () => {
  test("sends guests from the rules route to the login page", async ({ page }) => {
    await page.goto("/transport-rules");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("table", { name: tableName })).toHaveCount(0);
  });
});

test.describe("tab-and-routing", () => {
  test("navigates to the rules route when the tab is selected", async ({ page }) => {
    await signIn(page);
    await page.getByRole("tab", { name: "交通规则" }).click();

    await expect(page).toHaveURL("/transport-rules");
    await expect(page.getByRole("tab", { name: "交通规则" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

test.describe("no-active-trip", () => {
  test("prompts users to create or activate a trip instead of showing the rules", async ({
    page,
  }) => {
    await signIn(page);
    await resetTrips(page);
    await page.getByRole("tab", { name: "交通规则" }).click();

    await expect(page.getByText("先创建或激活行程")).toBeVisible();
    await expect(page.getByRole("table", { name: tableName })).toHaveCount(0);
    await expect(page.getByRole("radio")).toHaveCount(0);

    await page.getByRole("button", { name: "去创建行程" }).click();
    await expect(page).toHaveURL("/cities");
    await page.goto("/transport-rules");
    await expect(page.getByText("先创建或激活行程")).toBeVisible();
    await page.getByRole("button", { name: "查看我的行程" }).click();
    await expect(page).toHaveURL("/trips");
  });
});

test.describe("comparison-table", () => {
  test.beforeEach(async ({ page }) => {
    await openTransportRules(page);
    // worker 账号有宠物档案：等待推荐列出现，避免档案请求未完成时列数不稳定
    await expect(
      page.getByRole("columnheader", { name: "是否推荐" }),
    ).toBeVisible();
  });

  test("renders the status badge and note from rule data", async ({ page }) => {
    await expect(ruleRow(page, "高铁")).toContainText("有条件");
    await expect(ruleRow(page, "高铁")).toContainText("不可进客舱");
    await expect(ruleRow(page, "自驾")).toContainText("可携带");
  });

  test("switches only the flight row when another airline is selected", async ({
    page,
  }) => {
    const flightRow = ruleRow(page, "飞机");
    await expect(flightRow).toContainText("逾重行李");
    const untouchedRow = await ruleRow(page, "高铁").innerText();

    await page.getByRole("combobox", { name: "选择航司" }).click();
    await page.getByRole("option", { name: "中国东方航空" }).click();

    await expect(page.getByRole("combobox", { name: "选择航司" })).toContainText(
      "中国东方航空",
    );
    await expect(flightRow).toContainText("小动物运输申请书");
    expect(await ruleRow(page, "高铁").innerText()).toBe(untouchedRow);
  });

  test("renders sources, review state, disclaimer and booking note in the footer", async ({
    page,
  }) => {
    const footer = page.getByRole("region", { name: "规则说明" });

    await expect(footer).toContainText("数据来源");
    await expect(footer).toContainText("人工复核");
    await expect(footer).toContainText("以承运方最新规则为准");
    await expect(footer).toContainText("不提供站内订票");
    await expect(footer).toContainText("官方或第三方渠道");
    expect(await footer.getByRole("link").count()).toBeGreaterThan(3);
  });
});

test.describe("unavailable-pet-data", () => {
  test("keeps the active-trip rules table and mode selector when pet data fails", async ({
    page,
  }) => {
    await openTransportRules(page);
    await page.route("**/api/pets**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/problem+json",
        body: JSON.stringify({ status: 500, code: "INTERNAL_ERROR" }),
      }),
    );
    await page.reload();

    await expect(page.getByRole("table", { name: tableName })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "是否推荐" }),
    ).toHaveCount(0);
    await expect(page.getByText("宠物档案加载失败，请刷新重试。")).toBeVisible();
    await expect(page.getByRole("radio", { name: "选择自驾" })).toBeEnabled();
  });
});

test.describe("no-backend-coupling", () => {
  test("loads and switches airlines without rule API requests", async ({ page }) => {
    const ruleRequests: string[] = [];
    const otherApiRequests: string[] = [];
    page.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;
      if (!pathname.startsWith("/api/")) {
        return;
      }
      if (pathname.includes("rule")) {
        ruleRequests.push(pathname);
      } else if (!pathname.startsWith("/api/auth/")) {
        otherApiRequests.push(pathname);
      }
    });

    await openTransportRules(page);
    otherApiRequests.length = 0;
    await page.getByRole("combobox", { name: "选择航司" }).click();
    await page.getByRole("option", { name: "中国南方航空" }).click();
    await expect(ruleRow(page, "飞机")).toContainText("县区级以上");

    await page.waitForTimeout(500);
    expect(ruleRequests).toEqual([]);
    expect(otherApiRequests).toEqual([]);
  });
});
