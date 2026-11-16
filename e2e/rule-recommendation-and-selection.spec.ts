import { expect, test, type Page } from "@playwright/test";

const password = "123456";
const tableName = "交通携宠规则对比";
const storageKey = "pawtrip:selected-transport-mode";

async function signIn(page: Page, username = "demo") {
  const authResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/auth/me",
  );
  await page.goto("/login");
  await authResponse;
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("tab", { name: "城市浏览" })).toBeVisible();
}

async function openRules(page: Page, username = "demo") {
  await signIn(page, username);
  await page.getByRole("tab", { name: "交通规则" }).click();
  await expect(page.getByRole("table", { name: tableName })).toBeVisible();
}

function ruleRow(page: Page, mode: string) {
  return page.getByRole("row", { name: new RegExp(mode) });
}

function readStoredMode(page: Page) {
  return page.evaluate((key) => window.sessionStorage.getItem(key), storageKey);
}

test.describe("rule recommendation", () => {
  test("recommends the pet that meets every rule and explains the failures of the other", async ({
    page,
  }) => {
    await openRules(page);
    await expect(
      page.getByRole("columnheader", { name: "是否推荐" }),
    ).toBeVisible();

    const flightRow = ruleRow(page, "飞机");
    await expect(flightRow).toContainText("豆豆 · 推荐");
    await expect(flightRow).toContainText("毛毛 · 不推荐");
    await expect(flightRow).toContainText("体重 38kg 超过上限 32kg");
    await expect(flightRow).toContainText("缺少动物检疫合格证明");
    await expect(flightRow).not.toContainText("肩高");

    const railRow = ruleRow(page, "高铁");
    await expect(railRow).toContainText("体重 38kg 超过上限 15kg");
    await expect(railRow).toContainText("肩高 55cm 超过上限 40cm");
    await expect(railRow).toContainText("缺少动物检疫合格证明");

    const driveRow = ruleRow(page, "自驾");
    await expect(driveRow).toContainText("毛毛 · 不推荐");
    await expect(driveRow).toContainText("缺少动物检疫合格证明");
    await expect(driveRow).not.toContainText("超过上限");
  });

  test("recomputes the flight row when another airline is selected", async ({
    page,
  }) => {
    await openRules(page);
    const flightRow = ruleRow(page, "飞机");
    await expect(flightRow).toContainText("豆豆 · 推荐");

    await page.getByRole("combobox", { name: "选择航司" }).click();
    await page.getByRole("option", { name: "中国东方航空" }).click();

    await expect(flightRow).toContainText("中国东方航空");
    await expect(flightRow).toContainText("毛毛 · 不推荐");
    await expect(flightRow).toContainText("体重 38kg 超过上限 32kg");
  });
});

test.describe("mode selection", () => {
  test("keeps a single selected mode and caches it for the itinerary", async ({
    page,
  }) => {
    await openRules(page);

    const flightRadio = page.getByRole("radio", { name: "选择飞机" });
    const railRadio = page.getByRole("radio", { name: "选择高铁" });

    await expect(flightRadio).not.toBeChecked();
    await railRadio.check();
    await expect(railRadio).toBeChecked();
    await expect(flightRadio).not.toBeChecked();
    expect(await readStoredMode(page)).toBe("high_speed_rail");

    await page.reload();
    await expect(page.getByRole("table", { name: tableName })).toBeVisible();
    await expect(page.getByRole("radio", { name: "选择高铁" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "选择飞机" })).not.toBeChecked();
  });

  test("lets a user without pets pick a mode", async ({ page }) => {
    await openRules(page, "admin");
    await expect(
      page.getByRole("columnheader", { name: "是否推荐" }),
    ).toHaveCount(0);

    const driveRadio = page.getByRole("radio", { name: "选择自驾" });
    await driveRadio.check();
    await expect(driveRadio).toBeChecked();
    expect(await readStoredMode(page)).toBe("drive");
  });
});
