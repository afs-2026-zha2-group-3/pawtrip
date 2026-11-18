import { expect, test } from "@playwright/test";
import {
  createTrip,
  createTripViaApi,
  openCities,
  openTrips,
  pets,
  resetTrips,
  signIn,
  tripCard,
} from "./trip-helpers";

test.describe("app shell scrolling", () => {
  test.use({ viewport: { width: 1280, height: 500 } });

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await resetTrips(page);
  });

  test("E1 keeps the header fixed and only scrolls the content area", async ({
    page,
  }) => {
    await createTrip(page, { city: "珠海市", days: 1, pet: "豆豆" });
    await page.getByRole("tab", { name: "交通规则" }).click();
    await expect(page).toHaveURL(/\/transport-rules$/);

    const scroller = page.getByTestId("app-scroll");
    await expect
      .poll(() =>
        scroller.evaluate((element) => element.scrollHeight > element.clientHeight),
      )
      .toBe(true);

    const header = page.locator("header");
    const headerBefore = await header.boundingBox();

    await scroller.evaluate((element) => element.scrollTo(0, 400));
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);

    expect(await header.boundingBox()).toEqual(headerBefore);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollHeight <=
          document.documentElement.clientHeight,
      ),
    ).toBe(true);

    await page.getByRole("tab", { name: "城市浏览" }).click();
    await expect(page).toHaveURL(/\/cities$/);
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollTop))
      .toBe(0);
  });

  test("E2 keeps only the location list and trip panel scrolling on the attractions page", async ({
    page,
  }) => {
    const locationsResponse = await page.request.get(
      "/api/locations?regionCode=440400&typeGroup=attraction&petFriendlyOnly=false&page=1&pageSize=20",
    );
    const locations = (await locationsResponse.json()) as {
      items: { poiId: string }[];
    };
    expect(locations.items.length).toBeGreaterThan(0);

    const pet = (await pets(page)).find((candidate) => candidate.name === "豆豆");
    if (!pet) throw new Error("Seed pet 豆豆 not found");

    const tripName = "珠海 · 滚动布局";
    await createTripViaApi(page, {
      name: tripName,
      cityAdcode: "440400",
      petId: pet.id,
      totalDays: 1,
      plan: {
        version: 1,
        days: [
          {
            day: 1,
            stops: Array.from({ length: 12 }, (_, index) => ({
              poiId: locations.items[index % locations.items.length].poiId,
            })),
          },
        ],
        unscheduled: [],
      },
    });

    await openTrips(page);
    await tripCard(page, tripName).getByRole("button", { name: "激活" }).click();
    await expect(page.getByTestId("trip-panel")).toBeVisible();
    await page.getByRole("tab", { name: "地点浏览" }).click();
    await expect(page).toHaveURL(/\/attractions$/);
    await page.getByRole("checkbox", { name: "显示全部地点" }).click();

    const map = page.getByTestId("attractions-map");
    const list = page.getByTestId("location-list");
    const panel = page.getByTestId("trip-panel");
    const mapBox = await map.boundingBox();
    expect(mapBox).not.toBeNull();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await expect
      .poll(() =>
        list.evaluate((element) => element.scrollHeight > element.clientHeight),
      )
      .toBe(true);
    await list.evaluate((element) => element.scrollTo(0, 200));
    await expect
      .poll(() => list.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    expect(await map.boundingBox()).toEqual(mapBox);

    const panelList = panel.getByRole("listbox");
    await expect
      .poll(() =>
        panelList.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        ),
      )
      .toBe(true);
    await panelList.evaluate((element) => element.scrollTo(0, 120));
    await expect
      .poll(() => panelList.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await expect(panel.getByTestId("trip-next-step")).toBeVisible();
    expect(await map.boundingBox()).toEqual(mapBox);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe("narrow navigation", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("E3 keeps all admin tabs reachable through horizontal scrolling", async ({
    page,
  }) => {
    await signIn(page, "admin");

    const nav = page.getByTestId("app-nav-scroll");
    await expect
      .poll(() =>
        nav.evaluate((element) => element.scrollWidth > element.clientWidth),
      )
      .toBe(true);

    await nav.evaluate((element) => element.scrollTo(element.scrollWidth, 0));
    await expect(page.getByRole("tab", { name: "城市管理" })).toBeInViewport();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe("narrow attractions", () => {
  test.use({ viewport: { width: 900, height: 700 } });

  test("E7 stacks the attractions columns into one scrolling page", async ({
    page,
  }) => {
    await signIn(page);
    await resetTrips(page);
    await createTrip(page, { city: "珠海市", days: 1, pet: "豆豆" });
    await page.getByRole("tab", { name: "地点浏览" }).click();
    await expect(page).toHaveURL(/\/attractions$/);
    await page.getByRole("checkbox", { name: "显示全部地点" }).click();

    const list = page.getByTestId("location-list");
    const scroller = page.getByTestId("app-scroll");
    await expect
      .poll(() =>
        scroller.evaluate((element) => element.scrollHeight > element.clientHeight),
      )
      .toBe(true);
    expect(
      await list.evaluate((element) => getComputedStyle(element).overflowY),
    ).toBe("visible");

    await scroller.evaluate((element) => element.scrollTo(0, 200));
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe("regular desktop viewport", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("E4 shows no scrollbar on the paws page and falls back on short viewports", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "我的宠物" }).click();
    await expect(page).toHaveURL(/\/paws$/);

    const scroller = page.getByTestId("app-scroll");
    await expect
      .poll(() =>
        scroller.evaluate((element) => element.scrollHeight <= element.clientHeight),
      )
      .toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.setViewportSize({ width: 1920, height: 480 });
    await expect
      .poll(() =>
        scroller.evaluate((element) => element.scrollHeight > element.clientHeight),
      )
      .toBe(true);
    await scroller.evaluate((element) => element.scrollTo(0, 100));
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await expect(page.getByTestId("app-scroll")).toBeVisible();
  });

  test("E5 releases the shell in print media", async ({ page }) => {
    await page.emulateMedia({ media: "print" });

    const styles = await page.getByTestId("app-scroll").evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        display: computed.display,
        overflowY: computed.overflowY,
      };
    });
    expect(styles).toEqual({
      display: "block",
      overflowY: "visible",
    });
    await expect(page.locator("header")).toBeHidden();
  });

  test("E6 keeps the selected city policy panel sticky inside the content viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 500 });
    await openCities(page);
    await page.getByTestId("city-card").first().click();

    const pane = page.getByRole("region", { name: "城市宠物管理政策" });
    await expect(pane).toBeVisible();
    const scroller = page.getByTestId("app-scroll");
    await expect
      .poll(() =>
        scroller.evaluate((element) => element.scrollHeight > element.clientHeight),
      )
      .toBe(true);

    await scroller.evaluate((element) => element.scrollTo(0, 300));
    await expect
      .poll(() => scroller.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    const stuck = await pane.boundingBox();
    await scroller.evaluate((element) => element.scrollTo(0, 400));
    expect(await pane.boundingBox()).toEqual(stuck);

    const header = await page.locator("header").boundingBox();
    expect(stuck).not.toBeNull();
    expect(header).not.toBeNull();
    expect(Math.abs(stuck!.y - (header!.y + header!.height + 24))).toBeLessThanOrEqual(1);
  });
});
