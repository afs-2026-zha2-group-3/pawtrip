import { expect, test, type Page } from "@playwright/test";
import {
  completeTripViaApi,
  createTripViaApi,
  csrfHeaders,
  openTrips,
  pets,
  resetTrips,
  signIn,
  tripCard,
} from "./trip-helpers";

const TRIP_NAME = "珠海 · 1天 · 豆豆";
const HOSPITAL_TEL = "0756-8886666";
const HOSPITAL_ADDRESS = "珠海市香洲区情侣中路88号";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

async function seedHospitalTrip(page: Page) {
  const pet = (await pets(page)).find((candidate) => candidate.name === "豆豆");
  if (!pet) throw new Error("Seed pet 豆豆 not found");

  const trip = await createTripViaApi(page, {
    name: TRIP_NAME,
    cityAdcode: "440400",
    petId: pet.id,
    totalDays: 1,
    startDate: "2026-12-01",
  });

  const headers = await csrfHeaders(page);
  const response = await page.request.put(`/api/trips/${trip.id}`, {
    headers,
    data: {
      name: TRIP_NAME,
      totalDays: 1,
      startDate: "2026-12-01",
      plan: {
        version: 1,
        days: [{ day: 1, stops: [{ poiId: "e2e-zhu-a" }] }],
        unscheduled: [],
      },
      transportMode: null,
    },
  });
  expect(response.ok()).toBeTruthy();
  await completeTripViaApi(page, trip.id);
}

async function openHospitalServices(page: Page) {
  await openTrips(page);
  await tripCard(page, TRIP_NAME).getByRole("button", { name: "查看行程单" }).click();
  await expect(page).toHaveURL(/\/itinerary$/);
  await expect(page.getByTestId("trip-panel")).toBeVisible();

  const stop = page.getByTestId("itinerary-stop").first();
  await expect(stop).toContainText("情侣路");
  await stop.getByText("附近宠物服务").click();
  await expect(page.getByText("宠物医院 · 珠海宠物医院")).toBeVisible();
}

test("copies the hospital phone and address with success feedback (AC-1, AC-2)", async ({
  page,
}) => {
  await seedHospitalTrip(page);
  await openHospitalServices(page);

  const copyPhone = page.getByRole("button", { name: "复制珠海宠物医院电话" });
  await copyPhone.click();
  await expect(copyPhone.getByText("已复制")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(HOSPITAL_TEL);

  const copyAddress = page.getByRole("button", { name: "复制珠海宠物医院地址" });
  await copyAddress.click();
  await expect(copyAddress.getByText("已复制")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(HOSPITAL_ADDRESS);
});

test("hides copy entries and shows placeholders when contact is missing (AC-3, AC-4)", async ({
  page,
}) => {
  await seedHospitalTrip(page);
  await openHospitalServices(page);

  await expect(page.getByText("宠物用品店 · 珠海宠物用品店")).toBeVisible();
  await expect(page.getByText("电话：暂无电话")).toBeVisible();
  await expect(page.getByText("地址：暂无地址")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "复制珠海宠物用品店电话" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "复制珠海宠物用品店地址" }),
  ).toHaveCount(0);
});