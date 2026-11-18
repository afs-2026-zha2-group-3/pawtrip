import { expect, test, type Page } from "@playwright/test";
import {
  createActiveTripViaApi,
  resetTrips,
  signIn,
} from "./trip-helpers";

const tableName = "交通携宠规则对比";

async function openRules(page: Page, pet = "豆豆") {
  await signIn(page);
  await resetTrips(page);
  await createActiveTripViaApi(page, {
    cityAdcode: "330100",
    petName: pet,
    transportMode: "drive",
  });
  await page.goto("/transport-rules");
  await expect(page.getByRole("table", { name: tableName })).toBeVisible();
}

function ruleRow(page: Page, mode: string) {
  return page.getByRole("row", { name: new RegExp(mode) });
}

test.describe("rule recommendation", () => {
  test("evaluates only the active-trip pet and explains its rule failures", async ({
    page,
  }) => {
    await openRules(page, "毛毛");
    await expect(
      page.getByRole("columnheader", { name: "是否推荐" }),
    ).toBeVisible();

    const flightRow = ruleRow(page, "飞机");
    await expect(flightRow).toContainText("毛毛 · 不推荐");
    await expect(flightRow).not.toContainText("豆豆");
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
});

test.describe("mode selection", () => {
  test("keeps the picker usable when pet data is unavailable", async ({
    page,
  }) => {
    await signIn(page);
    await resetTrips(page);
    await createActiveTripViaApi(page, {
      cityAdcode: "330100",
      petName: "豆豆",
      transportMode: "drive",
    });
    await page.goto("/transport-rules");
    await page.route("**/api/pets", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: "INTERNAL_ERROR", message: "boom" }),
      }),
    );
    await page.reload();

    const trainOption = page.getByRole("radio", { name: "选择火车" });
    await expect(trainOption).toBeEnabled();

    const saved = page.waitForResponse(
      (response) =>
        /\/api\/trips\/\d+$/.test(new URL(response.url()).pathname) &&
        response.request().method() === "PUT",
    );
    await trainOption.check();
    const response = await saved;
    expect(response.request().postDataJSON()).toMatchObject({
      transportMode: "train",
    });
  });

  test("saves one selected mode to the active trip and restores it after reload", async ({
    page,
  }) => {
    await openRules(page);

    const flightRadio = page.getByRole("radio", { name: "选择飞机" });
    const railRadio = page.getByRole("radio", { name: "选择高铁" });

    await expect(flightRadio).not.toBeChecked();
    const saved = page.waitForResponse(
      (response) =>
        /\/api\/trips\/\d+$/.test(new URL(response.url()).pathname) &&
        response.request().method() === "PUT",
    );
    await railRadio.check();
    await expect(railRadio).toBeChecked();
    await expect(flightRadio).not.toBeChecked();
    const response = await saved;
    expect(response.ok()).toBeTruthy();
    expect(response.request().postDataJSON()).toMatchObject({
      transportMode: "high_speed_rail",
    });
    expect(
      await page.evaluate(() =>
        window.sessionStorage.getItem("pawtrip:selected-transport-mode"),
      ),
    ).toBeNull();

    await page.reload();
    await expect(page.getByRole("table", { name: tableName })).toBeVisible();
    await expect(page.getByRole("radio", { name: "选择高铁" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "选择飞机" })).not.toBeChecked();
  });
});
