import { expect, test, type Page } from "@playwright/test";
import {
  confirmDraft,
  openCities,
  resetTrips,
  selectCity,
  setDraftDays,
  signIn,
} from "./trip-helpers";

async function openDraft(page: Page, city = "杭州市") {
  await openCities(page);
  await selectCity(page, city);
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("defaults to one day and confirms a one-day trip", async ({ page }) => {
  await openDraft(page);
  const panel = page.getByTestId("trip-panel");
  const input = panel.getByRole("textbox", { name: "行程天数" });
  await expect(input).toHaveValue("1");
  await expect(page.getByTestId("trip-panel-confirm")).toBeEnabled();

  await confirmDraft(page);
  await expect(panel).toContainText("1 天");

  await page.getByRole("tab", { name: "景区浏览" }).click();
  await page.getByRole("combobox", { name: "添加到行程" }).first().click();
  await expect(page.getByRole("option", { name: "第 1 天" })).toBeVisible();
  await expect(page.getByRole("option", { name: "第 2 天" })).toHaveCount(0);
});

test("edits the draft duration and applies it to the trip", async ({ page }) => {
  await openDraft(page);
  const panel = page.getByTestId("trip-panel");
  await setDraftDays(page, 3);
  await expect(panel.getByRole("textbox", { name: "行程天数" })).toHaveValue("3");

  await confirmDraft(page);
  await expect(panel).toContainText("3 天");

  await page.getByRole("tab", { name: "景区浏览" }).click();
  await page.getByRole("combobox", { name: "添加到行程" }).first().click();
  await expect(page.getByRole("option", { name: "第 1 天" })).toBeVisible();
  await expect(page.getByRole("option", { name: "第 2 天" })).toBeVisible();
  await expect(page.getByRole("option", { name: "第 3 天" })).toBeVisible();
  await expect(page.getByRole("option", { name: "第 4 天" })).toHaveCount(0);
});

test("rejects invalid durations without overwriting the last legal value", async ({ page }) => {
  await openDraft(page);
  const panel = page.getByTestId("trip-panel");
  const input = panel.getByRole("textbox", { name: "行程天数" });

  await setDraftDays(page, 4);
  for (const invalid of ["0", "8", "1.5", "abc"]) {
    await input.fill(invalid);
    await expect(panel.getByRole("alert")).toContainText("旅游总天数需为 1–7 的整数");
    await expect(input).toHaveValue("4");
  }
});

test("steppers clamp the draft duration to 1 and 7", async ({ page }) => {
  await openDraft(page);
  const panel = page.getByTestId("trip-panel");
  const input = panel.getByRole("textbox", { name: "行程天数" });

  await panel.getByRole("button", { name: "减少行程天数" }).click();
  await expect(input).toHaveValue("1");
  for (let index = 0; index < 8; index += 1) {
    await panel.getByRole("button", { name: "增加行程天数" }).click();
  }
  await expect(input).toHaveValue("7");
  await panel.getByRole("button", { name: "减少行程天数" }).click();
  await expect(input).toHaveValue("6");
});
