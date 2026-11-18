import { expect, test, type Page } from "@playwright/test";
import {
  createTripViaApi,
  csrfHeaders,
  resetTrips,
  signIn as signInWithApi,
} from "./trip-helpers";

const username = "demo";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function signIn(page: Page) {
  await signInWithApi(page, username);
}

async function openPaws(page: Page) {
  await page.getByRole("tab", { name: "我的宠物" }).click();
  await expect(page).toHaveURL(/\/paws$/);
}

async function deleteAllPetsViaApi(page: Page) {
  const headers = await csrfHeaders(page);
  const response = await page.request.get("/api/pets");
  const pets = (await response.json()) as { id: number }[];
  for (const pet of pets) {
    await page.request.delete(`/api/pets/${pet.id}`, { headers });
  }
}

test("creates, switches, edits and deletes pets", async ({ page }) => {
  await signIn(page);
  await openPaws(page);
  await expect(page.getByText("还没有宠物")).toBeVisible();

  await page.getByRole("button", { name: "添加第一只宠物" }).click();
  const createDialog = page.getByRole("dialog");
  await createDialog.getByLabel("名字").fill("Mimi");
  await createDialog.getByRole("combobox", { name: "宠物类型" }).click();
  await page.getByRole("option", { name: "狗" }).click();
  await createDialog.getByRole("combobox", { name: "狗的品种" }).click();
  await page.getByRole("option", { name: "柯基犬" }).click();
  await createDialog.getByLabel("体重（kg）").fill("6.5");
  await createDialog.getByLabel("肩高（cm）").fill("35");
  await createDialog.getByRole("checkbox", { name: "有牵引绳" }).click();
  await createDialog.getByRole("checkbox", { name: "有免疫证明" }).click();
  await createDialog.getByLabel("更换照片").setInputFiles({
    name: "pet.png",
    mimeType: "image/png",
    buffer: onePixelPng,
  });
  await expect(
    createDialog.getByRole("img", { name: "宠物照片预览" }),
  ).toBeVisible();
  await createDialog.getByRole("button", { name: "创建宠物" }).click();
  await expect(createDialog).toHaveCount(0);

  await expect(
    page.getByRole("button", { name: "Mimi", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mimi的档案" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Mimi的照片" })).toBeVisible();
  await expect(page.getByText("柯基犬", { exact: true })).toBeVisible();
  await expect(page.getByText("6.5", { exact: true })).toBeVisible();
  await expect(page.getByText("35", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "有牵引绳" })).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "有免疫证明" }),
  ).toBeChecked();

  await page.getByRole("button", { name: "添加宠物", exact: true }).click();
  const secondDialog = page.getByRole("dialog");
  await secondDialog.getByLabel("名字").fill("Luna");
  await secondDialog.getByRole("combobox", { name: "宠物类型" }).click();
  await page.getByRole("option", { name: "猫" }).click();
  await secondDialog.getByLabel("体重（kg）").fill("4");
  await secondDialog.getByLabel("肩高（cm）").fill("25");
  await secondDialog.getByRole("button", { name: "创建宠物" }).click();
  await expect(secondDialog).toHaveCount(0);

  await page.getByRole("button", { name: "Luna", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Luna的档案" })).toBeVisible();
  await expect(page.getByText("猫", { exact: true })).toBeVisible();
  await expect(page.getByText("品种", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Mimi", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mimi的档案" })).toBeVisible();

  await page.getByRole("button", { name: "编辑", exact: true }).click();
  const editDialog = page.getByRole("dialog");
  await expect(
    editDialog.getByRole("heading", { name: "Mimi的档案" }),
  ).toBeVisible();
  await editDialog.getByLabel("名字").fill("Mimi Updated");
  await editDialog.getByLabel("体重（kg）").fill("7");
  await editDialog.getByRole("combobox", { name: "狗的品种" }).click();
  await page.getByRole("option", { name: "柴犬" }).click();
  await editDialog.getByRole("button", { name: "保存" }).click();
  await expect(editDialog).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Mimi Updated的档案" }),
  ).toBeVisible();
  await expect(page.getByText("7", { exact: true })).toBeVisible();
  await expect(page.getByText("柴犬", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mimi Updated", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "删除 Mimi Updated" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm.getByText("删除宠物？")).toBeVisible();
  await confirm.getByRole("button", { name: "取消" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Mimi Updated的档案" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "删除 Mimi Updated" }).click();
  const confirmAgain = page.getByRole("alertdialog");
  await expect(confirmAgain).toBeVisible();
  await confirmAgain.getByRole("button", { name: "删除" }).click();
  await expect(confirmAgain).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Luna", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Luna的档案" })).toBeVisible();

  await page.getByRole("button", { name: "删除 Luna" }).click();
  const confirmLuna = page.getByRole("alertdialog");
  await confirmLuna.getByRole("button", { name: "删除" }).click();
  await expect(confirmLuna).toHaveCount(0);
  await expect(page.getByText("还没有宠物")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mimi Updated", exact: true }),
  ).toHaveCount(0);
});

test("explains pet deletion reasons and cascades only ended trips", async ({
  page,
}) => {
  await signIn(page);
  await resetTrips(page);
  await deleteAllPetsViaApi(page);

  const headers = await csrfHeaders(page);
  const created = await page.request.post("/api/pets", {
    headers,
    data: {
      name: "Biscuit",
      petType: "CAT",
      weightKg: 4,
      shoulderHeightCm: 24,
      hasLeash: true,
      hasVaccinationProof: true,
      photo: null,
      dogBreedId: null,
    },
  });
  expect(created.status()).toBe(201);
  const petId = ((await created.json()) as { id: number }).id;

  const ongoing = await createTripViaApi(page, {
    name: "进行中行程",
    cityAdcode: "330100",
    petId,
    totalDays: 2,
  });

  await openPaws(page);
  await page.getByRole("button", { name: "删除 Biscuit" }).click();
  const blocked = page.getByRole("alertdialog");
  await expect(
    blocked.getByText(
      "该宠物正在被行程「进行中行程」使用，暂时无法删除。请先删除这些行程，或等待行程结束后再试。",
    ),
  ).toBeVisible();
  await expect(blocked.getByRole("button", { name: "删除" })).toBeDisabled();
  await blocked.getByRole("button", { name: "取消" }).click();
  await expect(blocked).toHaveCount(0);

  await page.request.delete(`/api/trips/${ongoing.id}`, { headers });
  const ended = await createTripViaApi(page, {
    name: "已结束行程",
    cityAdcode: "330100",
    petId,
    totalDays: 2,
    startDate: "2020-01-01",
  });

  await page.getByRole("button", { name: "删除 Biscuit" }).click();
  const cascade = page.getByRole("alertdialog");
  await expect(
    cascade.getByText(
      "删除后，引用该宠物的已结束行程「已结束行程」也会一并删除。",
    ),
  ).toBeVisible();
  await cascade.getByRole("button", { name: "删除" }).click();
  await expect(cascade).toHaveCount(0);
  await expect(page.getByText("还没有宠物")).toBeVisible();

  const remaining = (await (
    await page.request.get("/api/trips")
  ).json()) as { id: number }[];
  expect(remaining.some((trip) => trip.id === ended.id)).toBe(false);
});

test("manages optional preferences and personality across create, view and edit", async ({
  page,
}) => {
  await signIn(page);
  await openPaws(page);

  await page.getByRole("button", { name: "添加第一只宠物" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("名字").fill("Coco");
  await dialog.getByRole("combobox", { name: "宠物类型" }).click();
  await page.getByRole("option", { name: "猫" }).click();
  await dialog.getByLabel("体重（kg）").fill("4");
  await dialog.getByLabel("肩高（cm）").fill("25");

  // 不填喜好/性格时无必填错误，直接创建成功（REQ-014 可选字段）
  await dialog.getByRole("button", { name: "创建宠物" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Coco的档案" })).toBeVisible();
  await expect(page.getByText("未设置", { exact: true })).toHaveCount(2);

  // 编辑：勾选喜好 + 选择性格，保存后档案展示中文标签
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByRole("checkbox", { name: "游泳" }).click();
  await editDialog.getByRole("checkbox", { name: "草地奔跑" }).click();
  await editDialog.getByRole("combobox", { name: "宠物性格" }).click();
  await page.getByRole("option", { name: "活泼好动" }).click();
  await editDialog.getByRole("button", { name: "保存" }).click();
  await expect(editDialog).toHaveCount(0);
  await expect(page.getByText("游泳、草地奔跑")).toBeVisible();
  await expect(page.getByText("活泼好动")).toBeVisible();

  // 再次编辑：回显勾选与选中值
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  const againDialog = page.getByRole("dialog");
  await expect(
    againDialog.getByRole("checkbox", { name: "游泳" }),
  ).toBeChecked();
  await expect(
    againDialog.getByRole("checkbox", { name: "草地奔跑" }),
  ).toBeChecked();
  await expect(
    againDialog.getByRole("checkbox", { name: "爬山" }),
  ).not.toBeChecked();
  await expect(
    againDialog.getByRole("combobox", { name: "宠物性格" }),
  ).toContainText("活泼好动");

  // 清空喜好并将性格设为「未设置」，保存后档案显示未设置
  await againDialog.getByRole("checkbox", { name: "游泳" }).click();
  await againDialog.getByRole("checkbox", { name: "草地奔跑" }).click();
  await againDialog.getByRole("combobox", { name: "宠物性格" }).click();
  await page.getByRole("option", { name: "未设置" }).click();
  await againDialog.getByRole("button", { name: "保存" }).click();
  await expect(againDialog).toHaveCount(0);
  await expect(page.getByText("未设置", { exact: true })).toHaveCount(2);

  await deleteAllPetsViaApi(page);
});

test("shows unset for legacy pets created without preferences fields", async ({
  page,
}) => {
  await signIn(page);

  // API 造旧档案：请求体不含 preferences/personality，后端按 NULL 存储
  const headers = await csrfHeaders(page);
  const created = await page.request.post("/api/pets", {
    headers,
    data: {
      name: "Legacy",
      petType: "CAT",
      weightKg: 3.5,
      shoulderHeightCm: 22,
      hasLeash: false,
      hasVaccinationProof: false,
      photo: null,
      dogBreedId: null,
    },
  });
  expect(created.status()).toBe(201);

  await openPaws(page);
  await expect(
    page.getByRole("heading", { name: "Legacy的档案" }),
  ).toBeVisible();
  await expect(page.getByText("未设置", { exact: true })).toHaveCount(2);

  await deleteAllPetsViaApi(page);
});
