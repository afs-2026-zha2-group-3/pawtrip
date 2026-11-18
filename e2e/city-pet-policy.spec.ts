import { expect, test, type Page } from "@playwright/test";
import { csrfHeaders, signIn as signInWithApi } from "./trip-helpers";

const username = "admin";

async function signIn(page: Page, user = username) {
  await signInWithApi(page, user);
}

function policyUrl(adcode: string) {
  return `/destinations/${adcode}/policy`;
}

function dogInput(breedId: number) {
  return {
    name: "豆豆",
    petType: "DOG",
    weightKg: 10,
    shoulderHeightCm: 40,
    hasLeash: true,
    hasVaccinationProof: true,
    photo: null,
    dogBreedId: breedId,
  };
}

async function clearPets(page: Page) {
  const existing = await page.request.get("/api/pets");
  if (!existing.ok()) return;
  const headers = await csrfHeaders(page);
  for (const pet of (await existing.json()) as { id: number }[]) {
    const deleted = await page.request.delete(`/api/pets/${pet.id}`, {
      headers,
    });
    expect(deleted.ok()).toBeTruthy();
  }
}

async function resetPets(page: Page, breedId?: number | null) {
  await clearPets(page);

  if (breedId === undefined) {
    return;
  }
  const headers = await csrfHeaders(page);
  const created = await page.request.post("/api/pets", {
    headers,
    data:
      breedId === null
        ? {
            name: "咪咪",
            petType: "CAT",
            weightKg: 4,
            shoulderHeightCm: 25,
            hasLeash: false,
            hasVaccinationProof: false,
            photo: null,
            dogBreedId: null,
          }
        : dogInput(breedId),
  });
  expect(created.ok()).toBeTruthy();
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

// admin 的「无宠物档案」是其他用例的前置条件，本文件创建的宠物必须清理
test.afterEach(async ({ page }) => {
  await clearPets(page);
});

test("warns when the pet breed is on the banned list", async ({ page }) => {
  await resetPets(page, 18);
  await page.goto(policyUrl("440400"));

  await expect(page.getByText(/禁养犬种提醒/)).toBeVisible();
  await expect(page.getByText(/豆豆/).first()).toBeVisible();
  await expect(page.getByText(/比特犬属于当地禁养犬种/)).toBeVisible();
  await expect(page.getByText(/禁养犬种名单/)).toBeVisible();
});

async function editZhuhaiAllowedBreeds(page: Page, breedName: string, checked: boolean) {
  await page.goto("/admin/cities");
  await page.getByRole("textbox", { name: "搜索城市" }).fill("珠海");
  await page.getByRole("button", { name: "编辑 珠海市" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "搜索犬种" }).fill(breedName);
  const checkbox = dialog.getByRole("checkbox", { name: breedName });
  await expect(checkbox).toBeVisible();
  if ((await checkbox.isChecked()) !== checked) {
    await checkbox.click();
  }
  await dialog.getByRole("button", { name: "保存修改" }).click();
  await expect(dialog.getByText("城市政策已更新。")).toBeVisible();
}

async function removeZhuhaiAllowedBreed(breedId: number | undefined) {
  const dbPath = process.env.PAWTRIP_E2E_DB_PATH;
  if (!dbPath || breedId === undefined) return;
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA busy_timeout = 10000");
    db.prepare(
      "DELETE FROM city_allowed_dog_breed WHERE adcode = ? AND dog_breed_id = ?",
    ).run("440400", breedId);
  } finally {
    db.close();
  }
}

test("admin configures allowed breeds and the policy page reflects it", async ({
  page,
}) => {
  const breeds = (await (
    await page.request.get("/api/dog-breeds")
  ).json()) as { id: number; name: string }[];
  const samoyed = breeds.find((breed) => breed.name === "萨摩耶犬");
  if (!samoyed) throw new Error("Dog breed fixture missing: 萨摩耶犬");

  try {
    await editZhuhaiAllowedBreeds(page, samoyed.name, true);

    await resetPets(page, samoyed.id);
    await page.goto(policyUrl("440400"));
    await expect(page.getByText("珠海市养宠政策")).toBeVisible();
    await expect(page.getByText("豆豆 · 友好")).toBeVisible();
    await expect(page.getByText(/萨摩耶犬/).first()).toBeVisible();

    await editZhuhaiAllowedBreeds(page, samoyed.name, false);

    await page.goto(policyUrl("440400"));
    await expect(page.getByText("珠海市养宠政策")).toBeVisible();
    await expect(page.getByText("豆豆 · 无法判定")).toBeVisible();
  } finally {
    await removeZhuhaiAllowedBreed(samoyed.id);
  }
});
