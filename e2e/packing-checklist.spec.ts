import { expect, test, type Page } from "@playwright/test";
import {
  createTripViaApi,
  csrfHeaders,
  openTrips,
  pets,
  resetTrips,
  signIn,
  tripCard,
} from "./trip-helpers";

const DEFAULT_TRIP_NAME = "珠海 · 2天 · 豆豆";
const TEMPLATE_ITEM_NAMES = [
  "疫苗证明",
  "主粮（份）",
  "折叠食盆",
  "便携水碗",
  "猫用运输包（S 码）",
  "牵引绳（S 码）",
  "宠物急救包",
  "尿垫",
  "清洁湿巾",
];

async function seedPackingTrip(
  page: Page,
  { name = DEFAULT_TRIP_NAME }: { name?: string } = {},
) {
  const pet = (await pets(page)).find((candidate) => candidate.name === "豆豆");
  if (!pet) throw new Error("Seed pet 豆豆 not found");

  const trip = await createTripViaApi(page, {
    name,
    cityAdcode: "440400",
    petId: pet.id,
    totalDays: 2,
    startDate: "2026-12-01",
  });

  const headers = await csrfHeaders(page);
  const response = await page.request.put(`/api/trips/${trip.id}`, {
    headers,
    data: {
      name,
      totalDays: 2,
      startDate: "2026-12-01",
      plan: { version: 1, days: [], unscheduled: [] },
      transportMode: "high_speed_rail",
    },
  });
  expect(response.ok()).toBeTruthy();
  return trip;
}

async function activateTrip(page: Page, name = DEFAULT_TRIP_NAME) {
  await openTrips(page);
  await tripCard(page, name).getByRole("button", { name: "激活" }).click();
  await expect(page.getByTestId("trip-panel")).toBeVisible();
}

async function openItinerary(page: Page) {
  await page.goto("/itinerary");
  await expect(page.getByRole("heading", { name: "行程单" })).toBeVisible();
}

async function openChecklistDialog(page: Page) {
  await page.getByRole("button", { name: "携带清单" }).click();
  const dialog = page.getByTestId("packing-checklist-dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

async function generateChecklist(page: Page) {
  const dialog = await openChecklistDialog(page);
  await expect(dialog.getByText("尚未生成携带清单")).toBeVisible();
  await dialog.getByRole("button", { name: "生成携带清单" }).click();
  await expect(dialog.getByTestId("packing-dialog-progress")).toHaveText(
    "已打包 0 / 9 件",
  );
  return dialog;
}

async function updatePetWeight(page: Page, weightKg: number) {
  const pet = (await pets(page)).find((candidate) => candidate.name === "豆豆");
  if (!pet) throw new Error("Seed pet 豆豆 not found");
  const headers = await csrfHeaders(page);
  const detail = (await (
    await page.request.get(`/api/pets/${pet.id}`)
  ).json()) as {
    name: string;
    petType: string;
    weightKg: number;
    shoulderHeightCm: number;
    hasLeash: boolean;
    hasVaccinationProof: boolean;
    photo: string | null;
    dogBreed: { id: number } | null;
    preferences: string[];
    personality: string | null;
  };
  const response = await page.request.put(`/api/pets/${pet.id}`, {
    headers,
    data: {
      name: detail.name,
      petType: detail.petType,
      weightKg,
      shoulderHeightCm: detail.shoulderHeightCm,
      hasLeash: detail.hasLeash,
      hasVaccinationProof: detail.hasVaccinationProof,
      photo: detail.photo,
      dogBreedId: detail.dogBreed?.id ?? null,
      preferences: detail.preferences,
      personality: detail.personality,
    },
  });
  expect(response.ok()).toBeTruthy();
  return detail.weightKg;
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await resetTrips(page);
});

test("generates the checklist and keeps checked progress after reload", async ({
  page,
}) => {
  await seedPackingTrip(page);
  await activateTrip(page);
  await openItinerary(page);

  await expect(page.getByTestId("packing-progress")).toHaveText("未生成");

  const dialog = await generateChecklist(page);
  for (const category of ["证件", "饮食", "出行", "健康", "清洁"]) {
    await expect(
      dialog.getByRole("heading", { name: category }),
    ).toBeVisible();
  }
  await expect(dialog.getByTestId("packing-item")).toHaveCount(9);
  await expect(dialog.getByText("主粮（份）")).toBeVisible();
  await expect(dialog.getByText("猫用运输包（S 码）")).toBeVisible();

  await dialog.getByRole("checkbox", { name: "勾选 疫苗证明" }).click();
  await expect(dialog.getByTestId("packing-dialog-progress")).toHaveText(
    "已打包 1 / 9 件",
  );

  for (const name of TEMPLATE_ITEM_NAMES.slice(1)) {
    await dialog.getByRole("checkbox", { name: `勾选 ${name}` }).click();
  }
  await expect(dialog.getByTestId("packing-dialog-progress")).toHaveText(
    "已打包 9 / 9 件",
  );
  await expect(dialog.getByText("全部打包完成，可以出发啦！")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId("packing-progress")).toHaveText(
    "已打包 9 / 9 件",
  );

  await page.reload();
  await expect(page.getByTestId("packing-progress")).toHaveText(
    "已打包 9 / 9 件",
  );
  const reopened = await openChecklistDialog(page);
  await expect(
    reopened.getByRole("checkbox", { name: "勾选 疫苗证明" }),
  ).toBeChecked();
  await expect(reopened.getByTestId("packing-dialog-progress")).toHaveText(
    "已打包 9 / 9 件",
  );
});

test("persists custom items, quantity edits and deletions", async ({ page }) => {
  await seedPackingTrip(page);
  await activateTrip(page);
  await openItinerary(page);

  const dialog = await generateChecklist(page);

  await dialog.getByLabel("新物品名称").fill("备用雨衣");
  await dialog.getByLabel("新物品数量").fill("2");
  await dialog.getByRole("button", { name: "新增" }).click();
  await expect(dialog.getByTestId("packing-dialog-progress")).toHaveText(
    "已打包 0 / 10 件",
  );
  await expect(dialog.getByText("备用雨衣")).toBeVisible();

  const foodQuantity = dialog.getByLabel("修改 主粮（份） 数量");
  await foodQuantity.fill("8");
  await foodQuantity.press("Enter");
  await expect(foodQuantity).toHaveValue("8");

  await dialog.getByRole("button", { name: "删除 尿垫" }).click();
  await expect(dialog.getByTestId("packing-item")).toHaveCount(9);
  await expect(dialog.getByText("尿垫")).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId("packing-progress")).toHaveText(
    "已打包 0 / 9 件",
  );
  const reopened = await openChecklistDialog(page);
  await expect(reopened.getByText("备用雨衣")).toBeVisible();
  await expect(reopened.getByLabel("修改 主粮（份） 数量")).toHaveValue("8");
  await expect(reopened.getByText("尿垫")).toHaveCount(0);
  await expect(reopened.getByLabel("修改 备用雨衣 数量")).toHaveValue("2");
});

test("refreshes template items on profile change and preserves user edits", async ({
  page,
}) => {
  await seedPackingTrip(page);
  await activateTrip(page);
  await openItinerary(page);

  let previousWeight: number | null = null;
  try {
    const dialog = await generateChecklist(page);
    await dialog.getByRole("checkbox", { name: "勾选 疫苗证明" }).click();
    await expect(dialog.getByTestId("packing-dialog-progress")).toHaveText(
      "已打包 1 / 9 件",
    );
    await dialog.getByLabel("新物品名称").fill("狗牌");
    await dialog.getByRole("button", { name: "新增" }).click();
    await expect(dialog.getByTestId("packing-dialog-progress")).toHaveText(
      "已打包 1 / 10 件",
    );

    previousWeight = await updatePetWeight(page, 12);

    await page.reload();
    await expect(page.getByTestId("packing-progress")).toHaveText(
      "已打包 1 / 10 件",
    );
    const reopened = await openChecklistDialog(page);
    await expect(reopened.getByText("猫用运输包（M 码）")).toBeVisible();
    await expect(reopened.getByText("猫用运输包（S 码）")).toHaveCount(0);
    await expect(
      reopened.getByRole("checkbox", { name: "勾选 疫苗证明" }),
    ).toBeChecked();
    await expect(reopened.getByText("狗牌")).toBeVisible();
    await expect(reopened.getByTestId("packing-item")).toHaveCount(10);
  } finally {
    if (previousWeight !== null) {
      await updatePetWeight(page, previousWeight);
    }
  }
});

test("opening the checklist dialog keeps the selected day and trip plan", async ({
  page,
}) => {
  const trip = await seedPackingTrip(page);
  await activateTrip(page);
  await openItinerary(page);

  const dayTwo = page.getByRole("tab", { name: "Day 2" });
  await dayTwo.click();
  await expect(dayTwo).toHaveAttribute("aria-selected", "true");

  let tripWrites = 0;
  page.on("request", (request) => {
    if (
      request.method() === "PUT" &&
      new URL(request.url()).pathname === `/api/trips/${trip.id}`
    ) {
      tripWrites += 1;
    }
  });

  const dialog = await openChecklistDialog(page);
  await expect(dialog.getByText("尚未生成携带清单")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  await expect(dayTwo).toHaveAttribute("aria-selected", "true");
  expect(tripWrites).toBe(0);
});

test("hides the checklist entry and dialog when printing", async ({ page }) => {
  await seedPackingTrip(page);
  await activateTrip(page);
  await openItinerary(page);

  const dialog = await generateChecklist(page);
  await page.emulateMedia({ media: "print" });
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "携带清单" })).toBeHidden();
  await expect(page.getByTestId("packing-progress")).toBeHidden();

  await page.emulateMedia({ media: "screen" });
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId("packing-progress")).toHaveText(
    "已打包 0 / 9 件",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "携带清单" })).toBeVisible();
  await expect(page.getByTestId("packing-progress")).toBeVisible();
});
