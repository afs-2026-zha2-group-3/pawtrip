import { expect, test, type Page } from "@playwright/test";
import { createTrip, resetTrips, signIn } from "./trip-helpers";

// 每个 Playwright worker 由 seed-users.mjs 预置独立的 petowner-wN 账号（各两只档案），
// 用于验证推荐列；admin 无档案，用于验证隐藏列。demo 保持无档案，供 /paws 的空档案流程使用。
const tableName = "交通携宠规则对比";
const modeLabels = ["飞机", "高铁", "火车", "自驾"] as const;

async function openTransportRules(page: Page) {
  await signIn(page);
  await resetTrips(page);
  await createTrip(page, { city: "杭州市", days: 1 });
  await page.getByRole("tab", { name: "交通规则" }).click();
  await expect(page.getByRole("table", { name: tableName })).toBeVisible();
}

function ruleRow(page: Page, mode: (typeof modeLabels)[number]) {
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
  test("shows the rules tab after the cities tab for a standard user", async ({
    page,
  }) => {
    await signIn(page);

    const labels = await page.getByRole("tab").allTextContents();
    expect(labels.slice(0, 5)).toEqual(["Home", "Paws", "城市浏览", "地点浏览", "交通规则"]);
    await expect(page.getByRole("tab", { name: "地点管理" })).toHaveCount(0);
  });

  test("navigates to the rules route when the tab is selected", async ({ page }) => {
    await signIn(page);
    await page.getByRole("tab", { name: "交通规则" }).click();

    await expect(page).toHaveURL("/transport-rules");
    await expect(page.getByRole("tab", { name: "交通规则" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("keeps only the rules tab selected on a direct visit", async ({ page }) => {
    await signIn(page);
    await page.goto("/transport-rules");

    await expect(page.getByRole("tab", { name: "交通规则" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tab", { name: "城市浏览" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  test("keeps admin tabs ordered after the rules tab for administrators", async ({
    page,
  }) => {
    await signIn(page, "admin");

    const labels = await page.getByRole("tab").allTextContents();
    expect(labels.slice(0, 8)).toEqual([
      "Home",
      "Paws",
      "城市浏览",
      "地点浏览",
      "交通规则",
      "Trips",
      "地点管理",
      "城市管理",
    ]);
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

  test("renders four modes with the base columns in a stable order", async ({
    page,
  }) => {
    await expect(page.getByRole("row")).toHaveCount(5);
    const headers = await page.getByRole("columnheader").allTextContents();
    expect(headers.slice(0, 6)).toEqual([
      "选择",
      "方式",
      "是否推荐",
      "能否携带",
      "体重上限",
      "容器要求",
    ]);

    for (const mode of modeLabels) {
      await expect(ruleRow(page, mode)).toHaveCount(1);
    }
  });

  test("appends the extension column after the base columns for every row", async ({
    page,
  }) => {
    const headers = await page.getByRole("columnheader").allTextContents();
    expect(headers.slice(0, 6)).toEqual([
      "选择",
      "方式",
      "是否推荐",
      "能否携带",
      "体重上限",
      "容器要求",
    ]);
    expect(headers.at(-1)).toBe("检疫证明");

    for (const mode of modeLabels) {
      await expect(ruleRow(page, mode).getByRole("cell").last()).not.toBeEmpty();
    }
  });

  test("renders the status badge and note from rule data", async ({ page }) => {
    await expect(ruleRow(page, "高铁")).toContainText("有条件");
    await expect(ruleRow(page, "高铁")).toContainText("不可进客舱");
    await expect(ruleRow(page, "自驾")).toContainText("可携带");
  });

  test("shows no unified weight limit for driving", async ({ page }) => {
    const weightCell = ruleRow(page, "自驾").getByRole("cell").nth(4);

    await expect(weightCell).toContainText("无统一限制");
    await expect(weightCell).not.toContainText("kg");
  });

  test("shows a review state for every row", async ({ page }) => {
    for (const mode of modeLabels) {
      await expect(ruleRow(page, mode)).toContainText(/已复核|待复核/);
    }
  });

  test("defaults to the first airline without leaving empty cells", async ({
    page,
  }) => {
    const flightRow = ruleRow(page, "飞机");
    await expect(page.getByRole("combobox", { name: "选择航司" })).toContainText(
      "中国国际航空",
    );

    // 第 0 格是单选控件所在列，本就不含文本，从「方式」列开始检查空单元格
    const cellCount = await flightRow.getByRole("cell").count();
    for (let index = 1; index < cellCount; index += 1) {
      await expect(flightRow.getByRole("cell").nth(index)).not.toBeEmpty();
    }
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

  test("shows the airline disclaimer inside the flight row", async ({ page }) => {
    await expect(ruleRow(page, "飞机")).toContainText("以航司最新规则为准");
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

  test("shows no booking action on the page", async ({ page }) => {
    await expect(page.getByRole("button", { name: /预订|购票/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /预订|购票/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /刷新/ })).toHaveCount(0);
  });

  test("keeps the cities page available without a transport rules entry", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "城市浏览" }).click();

    await expect(page).toHaveURL("/cities");
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "交通规则" })).toHaveCount(0);
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
