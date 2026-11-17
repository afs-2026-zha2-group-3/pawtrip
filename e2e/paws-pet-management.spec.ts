import { expect, test, type Page } from "@playwright/test";
import { csrfHeaders, signIn as signInWithApi } from "./trip-helpers";

const username = "demo";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function signIn(page: Page) {
  await signInWithApi(page, username);
}

async function openPaws(page: Page) {
  await page.getByRole("tab", { name: "Paws" }).click();
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

test("validates required pet fields before submitting", async ({ page }) => {
  await signIn(page);
  await openPaws(page);

  await page.getByRole("button", { name: "添加宠物", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "创建宠物" }).click();
  await expect(dialog.getByText("请输入宠物名字。")).toBeVisible();
  await expect(dialog.getByText("请选择宠物类型。")).toBeVisible();
  await expect(dialog.getByText("体重必须为大于 0 的数字。")).toBeVisible();
  await expect(dialog.getByText("肩高必须为大于 0 的数字。")).toBeVisible();

  await dialog.getByLabel("名字").fill("Rex");
  await dialog.getByRole("combobox", { name: "宠物类型" }).click();
  await page.getByRole("option", { name: "狗" }).click();
  await dialog.getByLabel("体重（kg）").fill("10");
  await dialog.getByLabel("肩高（cm）").fill("40");
  await dialog.getByRole("button", { name: "创建宠物" }).click();
  await expect(dialog.getByText("请选择狗的品种。")).toBeVisible();

  await dialog.getByRole("combobox", { name: "狗的品种" }).click();
  await page.getByRole("option", { name: "柯基犬" }).click();
  await dialog.getByRole("combobox", { name: "宠物类型" }).click();
  await page.getByRole("option", { name: "猫" }).click();
  await expect(
    dialog.getByRole("combobox", { name: "狗的品种" }),
  ).toHaveCount(0);

  await dialog.getByRole("button", { name: "取消" }).click();
  await expect(dialog).toHaveCount(0);
});

test("creates, views, edits and deletes a pet", async ({ page }) => {
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
  await createDialog.getByLabel("照片").setInputFiles({
    name: "pet.png",
    mimeType: "image/png",
    buffer: onePixelPng,
  });
  await expect(
    createDialog.getByRole("img", { name: "宠物照片预览" }),
  ).toBeVisible();
  await createDialog.getByRole("button", { name: "创建宠物" }).click();
  await expect(createDialog).toHaveCount(0);

  const card = page.getByRole("button", { name: "Mimi（柯基犬）" });
  await expect(card).toBeVisible();
  await expect(card.getByText("柯基犬")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Mimi（柯基犬）" }),
  ).toBeVisible();

  await card.click();
  const detail = page.getByRole("dialog");
  await expect(detail.getByRole("heading", { name: "Mimi" })).toBeVisible();
  await expect(detail.getByText("6.5 kg")).toBeVisible();
  await expect(detail.getByText("35 cm")).toBeVisible();
  await expect(detail.getByText("柯基犬")).toBeVisible();
  await expect(detail.getByText("有", { exact: true })).toHaveCount(2);

  await detail.getByRole("button", { name: "编辑" }).click();
  await expect(
    detail.getByRole("heading", { name: "编辑 Mimi" }),
  ).toBeVisible();
  await detail.getByLabel("名字").fill("Mimi Updated");
  await detail.getByLabel("体重（kg）").fill("7");
  await detail.getByRole("combobox", { name: "狗的品种" }).click();
  await page.getByRole("option", { name: "柴犬" }).click();
  await detail.getByRole("button", { name: "保存" }).click();
  await expect(
    detail.getByRole("heading", { name: "Mimi Updated" }),
  ).toBeVisible();
  await expect(detail.getByText("7 kg")).toBeVisible();
  await expect(detail.getByText("柴犬")).toBeVisible();
  await detail.getByRole("button", { name: "关闭", exact: true }).click();
  await expect(detail).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Mimi Updated（柴犬）" }),
  ).toBeVisible();

  const updatedCard = page.getByRole("button", {
    name: "Mimi Updated（柴犬）",
  });
  await updatedCard.click();
  await page.getByRole("dialog").getByRole("button", { name: "删除" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm.getByText("删除宠物？")).toBeVisible();
  await confirm.getByRole("button", { name: "取消" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(updatedCard).toBeVisible();

  await updatedCard.click();
  await page.getByRole("dialog").getByRole("button", { name: "删除" }).click();
  const confirmAgain = page.getByRole("alertdialog");
  await expect(confirmAgain).toBeVisible();
  await confirmAgain.getByRole("button", { name: "删除" }).click();
  await expect(confirmAgain).toHaveCount(0);
  await expect(page.getByText("还没有宠物")).toBeVisible();
  await expect(updatedCard).toHaveCount(0);
});

test("manages optional preferences and personality across create, view and edit", async ({
  page,
}) => {
  await signIn(page);
  await openPaws(page);

  await page.getByRole("button", { name: "添加宠物", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("名字").fill("Coco");
  await dialog.getByRole("combobox", { name: "宠物类型" }).click();
  await page.getByRole("option", { name: "猫" }).click();
  await dialog.getByLabel("体重（kg）").fill("4");
  await dialog.getByLabel("肩高（cm）").fill("25");

  // 不填喜好/性格时无必填错误，直接创建成功（REQ-014 可选字段）
  await dialog.getByRole("button", { name: "创建宠物" }).click();
  await expect(dialog).toHaveCount(0);
  const cocoCard = page.getByRole("button", { name: "Coco（猫）" });
  await expect(cocoCard).toBeVisible();

  await cocoCard.click();
  const detail = page.getByRole("dialog");
  await expect(detail.getByText("未设置", { exact: true })).toHaveCount(2);

  // 编辑：勾选喜好 + 选择性格，保存后详情展示中文标签
  await detail.getByRole("button", { name: "编辑" }).click();
  await detail.getByRole("checkbox", { name: "游泳" }).click();
  await detail.getByRole("checkbox", { name: "草地奔跑" }).click();
  await detail.getByRole("combobox", { name: "宠物性格" }).click();
  await page.getByRole("option", { name: "活泼好动" }).click();
  await detail.getByRole("button", { name: "保存" }).click();
  await expect(detail.getByText("游泳、草地奔跑")).toBeVisible();
  await expect(detail.getByText("活泼好动")).toBeVisible();

  // 再次编辑：回显勾选与选中值
  await detail.getByRole("button", { name: "编辑" }).click();
  await expect(detail.getByRole("checkbox", { name: "游泳" })).toBeChecked();
  await expect(
    detail.getByRole("checkbox", { name: "草地奔跑" }),
  ).toBeChecked();
  await expect(
    detail.getByRole("checkbox", { name: "爬山" }),
  ).not.toBeChecked();
  await expect(
    detail.getByRole("combobox", { name: "宠物性格" }),
  ).toContainText("活泼好动");

  // 清空喜好并将性格设为「未设置」，保存后详情显示未设置
  await detail.getByRole("checkbox", { name: "游泳" }).click();
  await detail.getByRole("checkbox", { name: "草地奔跑" }).click();
  await detail.getByRole("combobox", { name: "宠物性格" }).click();
  await page.getByRole("option", { name: "未设置" }).click();
  await detail.getByRole("button", { name: "保存" }).click();
  await expect(detail.getByText("未设置", { exact: true })).toHaveCount(2);

  await detail.getByRole("button", { name: "关闭", exact: true }).click();
  await expect(detail).toHaveCount(0);
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
  await page.getByRole("button", { name: "Legacy（猫）" }).click();
  const detail = page.getByRole("dialog");
  await expect(detail.getByRole("heading", { name: "Legacy" })).toBeVisible();
  await expect(detail.getByText("未设置", { exact: true })).toHaveCount(2);

  await detail.getByRole("button", { name: "关闭", exact: true }).click();
  await expect(detail).toHaveCount(0);
  await deleteAllPetsViaApi(page);
});