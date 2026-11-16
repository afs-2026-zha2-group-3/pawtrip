import { expect, test, type Page } from "@playwright/test";
import { signIn as signInWithApi } from "./trip-helpers";

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