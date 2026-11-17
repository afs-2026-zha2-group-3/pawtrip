import { expect, test } from "@playwright/test";
import {
  activeTripDetail,
  confirmTripDialog,
  openCities,
  openTripDialog,
  pickCalendarDate,
  resetTrips,
  setTripDates,
  signIn,
} from "./trip-helpers";

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("defaults to a one-day trip when start and end are the same day", async ({
  page,
}) => {
  await openCities(page);
  const dialog = await openTripDialog(page, "杭州市");
  await pickCalendarDate(page, "2026-12-01");
  await pickCalendarDate(page, "2026-12-01");
  await expect(dialog.getByText("行程共 1 天")).toBeVisible();

  await confirmTripDialog(page);
  const panel = page.getByTestId("trip-panel");
  await expect(panel).toContainText("1 天");

  await page.getByRole("combobox", { name: "添加到行程" }).first().click();
  await expect(page.getByRole("option", { name: "第 1 天" })).toBeVisible();
  await expect(page.getByRole("option", { name: "第 2 天" })).toHaveCount(0);
});

test("derives the duration from the selected date range", async ({ page }) => {
  await openCities(page);
  await openTripDialog(page, "杭州市");
  const startDate = await setTripDates(page, 3);
  await confirmTripDialog(page);

  const detail = await activeTripDetail(page);
  expect(detail.startDate).toBe(startDate);
  expect(detail.totalDays).toBe(3);

  const panel = page.getByTestId("trip-panel");
  await expect(panel).toContainText("3 天");

  await page.getByRole("combobox", { name: "添加到行程" }).first().click();
  await expect(page.getByRole("option", { name: "第 1 天" })).toBeVisible();
  await expect(page.getByRole("option", { name: "第 2 天" })).toBeVisible();
  await expect(page.getByRole("option", { name: "第 3 天" })).toBeVisible();
  await expect(page.getByRole("option", { name: "第 4 天" })).toHaveCount(0);

  await page.reload();
  expect((await activeTripDetail(page)).startDate).toBe(startDate);
});

test("rejects ranges longer than seven days", async ({ page }) => {
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
  await pickCalendarDate(page, "2026-12-08");
  await expect(dialog.getByText(/行程需为 1–7 天/)).toBeVisible();

  await dialog.getByRole("button", { name: "确定" }).click();
  await expect(dialog.getByRole("alert")).toContainText("行程需为 1–7 天");
  await expect(dialog).toBeVisible();
  expect(posts).toHaveLength(0);
});

test("restarts the range when an earlier date is clicked", async ({ page }) => {
  await openCities(page);
  const dialog = await openTripDialog(page, "杭州市");
  await pickCalendarDate(page, "2026-12-10");
  await pickCalendarDate(page, "2026-12-09");
  await expect(dialog.getByText(/请再选择结束日期/)).toBeVisible();

  await pickCalendarDate(page, "2026-12-11");
  await expect(dialog.getByText("行程共 3 天")).toBeVisible();
});
