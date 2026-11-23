import { expect, test, type Page } from "@playwright/test";
import { COW_PHOTO, createAnimal, createCategory, dbQuery, fakeDetector, galleryImage, resetDb, rgb, uploadPhoto } from "./helpers";

// dataset-ajustes: revisão da galeria no cadastro, excluir foto, "Novo cadastro" e imagem da categoria.

test.beforeEach(async () => {
  await resetDb();
});

type GalleryFile = string | Awaited<ReturnType<typeof galleryImage>>;

async function openFormGallery(page: Page, file: GalleryFile) {
  await page.goto("/dataset/novo");
  await page.getByRole("button", { name: "Galeria", exact: true }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("dialog").getByRole("button", { name: "Lateral" }).click();
  await (await chooser).setFiles(file);
  await expect(page.getByTestId("review")).toBeVisible();
}

// S1 - revisão da galeria no cadastro

test("galeria do cadastro abre a revisao", async ({ page }) => {
  await fakeDetector(page, { animals: 1 });
  await openFormGallery(page, await galleryImage("black"));
  const review = page.getByTestId("review");
  await expect(review.getByText("Esta foto está boa para o dataset?")).toBeVisible();
  await expect(review.getByTestId("review-info")).toContainText("Lateral");
  await expect(review.getByTestId("quality-issue")).toHaveText(["Foto desfocada", "Foto muito escura"]);
  await expect(review.getByRole("button", { name: "Usar mesmo assim" })).toBeVisible();
  await expect(review.getByRole("button", { name: "Escolher outra foto" })).toBeVisible();
});

test("foto da galeria entra no bloco", async ({ page }) => {
  await fakeDetector(page, { animals: 1 });
  await openFormGallery(page, await galleryImage("black"));
  await expect(page.getByTestId("quality-checking")).toHaveCount(0);
  await page.getByRole("button", { name: "Usar mesmo assim" }).click();
  await expect(page.getByTestId("review")).toHaveCount(0);
  const block = page.getByTestId("field-photo");
  await expect(block.getByTestId("photo-preview")).toBeVisible();
  await expect(block.getByTestId("quality-issue")).toHaveText(["Foto desfocada", "Foto muito escura"]);
});

test("escolher outra foto reabre o seletor", async ({ page }) => {
  await fakeDetector(page, { animals: 1 });
  await openFormGallery(page, await galleryImage("black"));
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Escolher outra foto" }).click();
  await chooser;
  await expect(page.getByTestId("review")).toHaveCount(0);
  await expect(page.getByTestId("photo-preview")).toHaveCount(0);
});

test("voltar descarta a foto da galeria", async ({ page }) => {
  await fakeDetector(page, { animals: 1 });
  await openFormGallery(page, COW_PHOTO);
  await page.getByTestId("review").getByRole("button", { name: "Voltar" }).click();
  await expect(page.getByTestId("review")).toHaveCount(0);
  await expect(page.getByTestId("photo-preview")).toHaveCount(0);
});

// S2 - excluir foto do perfil

async function profileWithPhotos(page: Page, request: Parameters<typeof createAnimal>[0], count: number) {
  const animal = await createAnimal(request, { externalId: "023" });
  const ids: string[] = [];
  for (let i = 0; i < count; i++) ids.push(await uploadPhoto(request, animal.id, "SIDE"));
  await page.goto(`/animais/${animal.id}`);
  return { animal, ids };
}

async function openViewer(page: Page) {
  await page.getByTestId("position-SIDE").getByRole("button", { name: /^Abrir foto Lateral/ }).first().click();
  await expect(page.getByTestId("photo-viewer")).toBeVisible();
}

test("miniatura abre a foto", async ({ page, request }) => {
  const { ids } = await profileWithPhotos(page, request, 1);
  await openViewer(page);
  const viewer = page.getByTestId("photo-viewer");
  await expect(viewer.getByTestId("viewer-photo")).toHaveAttribute("src", `/api/images/${ids[0]}?variant=full`);
  await expect(viewer.getByTestId("viewer-info")).toHaveText(/^Lateral · Hoje, \d{2}:\d{2}$/);
  await expect(viewer.getByRole("button", { name: "Fechar" }).locator('[data-icon="close"]')).toBeVisible();
  await expect(viewer.getByRole("button", { name: "Excluir foto" })).toBeVisible();
});

test("confirmacao de exclusao", async ({ page, request }) => {
  await profileWithPhotos(page, request, 1);
  await openViewer(page);
  await page.getByRole("button", { name: "Excluir foto" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByRole("heading", { name: "Excluir esta foto?" })).toBeVisible();
  await expect(dialog).toContainText(/A foto Lateral de Hoje, \d{2}:\d{2} será apagada do dataset\./);
  await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Excluir", exact: true })).toHaveCSS("background-color", rgb("#B23E2F"));
});

test("excluir apaga e atualiza o perfil", async ({ page, request }) => {
  await profileWithPhotos(page, request, 2);
  await expect(page.getByTestId("position-SIDE").getByTestId("position-count")).toHaveText("2 fotos");
  await openViewer(page);
  await page.getByRole("button", { name: "Excluir foto" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(page.getByTestId("photo-viewer")).toHaveCount(0);
  await expect(page.getByTestId("position-SIDE").getByTestId("position-count")).toHaveText("1 foto");
  expect(await dbQuery("select count(*)::int as n from animal_images")).toEqual([{ n: 1 }]);
});

test("cancelar mantem a foto", async ({ page, request }) => {
  await profileWithPhotos(page, request, 2);
  await openViewer(page);
  await page.getByRole("button", { name: "Excluir foto" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.getByTestId("photo-viewer")).toBeVisible();
  await page.getByTestId("photo-viewer").getByRole("button", { name: "Fechar" }).click();
  await expect(page.getByTestId("position-SIDE").getByTestId("position-count")).toHaveText("2 fotos");
});

test("erro ao excluir mantem a foto", async ({ page, request }) => {
  await profileWithPhotos(page, request, 1);
  await page.route("**/api/images/*", (route) =>
    route.request().method() === "DELETE" ? route.fulfill({ status: 500, body: "{}" }) : route.continue(),
  );
  await openViewer(page);
  await page.getByRole("button", { name: "Excluir foto" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Não foi possível excluir a foto. Tente de novo.");
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancelar" }).click();
  await page.getByTestId("photo-viewer").getByRole("button", { name: "Fechar" }).click();
  await expect(page.getByTestId("position-SIDE").getByTestId("position-count")).toHaveText("1 foto");
});

test("offline desabilita excluir", async ({ page, request, context }) => {
  await profileWithPhotos(page, request, 1);
  await openViewer(page);
  await page.getByRole("button", { name: "Excluir foto" }).click();
  await context.setOffline(true);
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Sem internet — conecte-se para excluir.");
  await expect(dialog.getByRole("button", { name: "Excluir", exact: true })).toBeDisabled();
  await context.setOffline(false);
});

// S3 - "Novo cadastro"

test("novo cadastro na linha do titulo", async ({ page }) => {
  await page.goto("/dataset");
  const button = page.getByRole("button", { name: "Novo cadastro" });
  await expect(button.locator('[data-icon="add"]')).toBeVisible();
  await expect(button).toHaveCSS("background-color", rgb("#1F6B45"));
  const b = (await button.boundingBox())!;
  const t = (await page.getByRole("heading", { name: "Dataset", level: 1 }).boundingBox())!;
  expect(Math.round(b.height)).toBe(44);
  expect(b.x).toBeGreaterThan(t.x + t.width);
  expect(b.y).toBeLessThan(t.y + t.height);
  expect(b.y + b.height).toBeGreaterThan(t.y);
});

test("menu com animal e categoria", async ({ page }) => {
  await page.goto("/dataset");
  await page.getByRole("button", { name: "Novo cadastro" }).click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveText(["Animal", "Categoria"]);
});

test("menu leva aos cadastros", async ({ page }) => {
  await page.goto("/dataset");
  await page.getByRole("button", { name: "Novo cadastro" }).click();
  await page.getByRole("menuitem", { name: "Animal" }).click();
  await expect(page).toHaveURL(/\/dataset\/novo$/);
  await expect(page.getByRole("heading", { name: "Novo animal" })).toBeVisible();

  await page.goto("/dataset");
  await page.getByRole("button", { name: "Novo cadastro" }).click();
  await page.getByRole("menuitem", { name: "Categoria" }).click();
  await expect(page).toHaveURL(/\/dataset\/categorias\/nova$/);
  await expect(page.getByRole("heading", { name: "Nova categoria" })).toBeVisible();
});

test("menu fecha fora e com escape", async ({ page }) => {
  await page.goto("/dataset");
  const button = page.getByRole("button", { name: "Novo cadastro" });
  await button.click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("heading", { name: "Dataset", level: 1 }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await button.click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
});

test("dataset sem categorias", async ({ page }) => {
  await page.goto("/dataset");
  const y = async (name: string, level: number) => (await page.getByRole("heading", { name, level }).boundingBox())!.y;
  const order = [await y("Dataset", 1), await y("Resumo", 2), await y("Animais", 2)];
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  await expect(page.getByRole("heading", { name: "Categorias" })).toHaveCount(0);
  await expect(page.getByTestId("category-item")).toHaveCount(0);
});

// S4 - imagem da categoria

async function pickCategoryImage(page: Page, file: GalleryFile) {
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Adicionar foto" }).click();
  await (await chooser).setFiles(file);
}

test("campo de foto da categoria", async ({ page }) => {
  await page.goto("/dataset/categorias/nova");
  await expect(page.getByTestId("field-image")).toContainText("Foto (opcional)");
  await expect(page.getByTestId("category-image-input")).toHaveAttribute("accept", "image/*");
  await pickCategoryImage(page, COW_PHOTO);
  await expect(page.getByTestId("category-image-preview")).toBeVisible();
  await page.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByTestId("category-image-preview")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Adicionar foto" })).toBeVisible();
});

test("categoria com imagem", async ({ page }) => {
  await page.goto("/dataset/categorias/nova");
  await page.getByLabel("Nome", { exact: true }).fill("Nelore");
  await pickCategoryImage(page, COW_PHOTO);
  const sent = page.waitForResponse((r) => /\/api\/categories\/[^/]+\/image$/.test(r.url()) && r.request().method() === "PUT");
  await page.getByRole("button", { name: "Salvar categoria" }).click();
  const res = await sent;
  expect(res.status()).toBe(200);
  const { category } = await res.json();
  expect(category.imageKey).toBe(`categories/${category.id}.webp`);
  await expect(page).toHaveURL(/\/dataset$/);
});

test("imagem no cartao do formulario", async ({ page, request }) => {
  const nelore = await createCategory(request, "Nelore");
  const res = await request.put(`/api/categories/${nelore}/image`, {
    multipart: { file: { name: "foto.jpg", mimeType: "image/jpeg", buffer: (await galleryImage("blurred")).buffer } },
  });
  expect(res.status()).toBe(200);
  await page.goto("/dataset/novo");
  const cards = page.getByTestId("field-category");
  const neloreCard = cards.getByRole("button", { name: /Nelore/ });
  await expect(neloreCard.getByTestId("category-image")).toHaveAttribute("src", `/api/categories/${nelore}/image`);
  await expect(cards.getByRole("button", { name: /Taurino/ })).toContainText("foto referência");
});

test("falha da imagem da categoria e reenviada", async ({ page }) => {
  let failed = false;
  await page.route(/\/api\/categories\/[^/]+\/image$/, async (route) => {
    if (failed) return route.continue();
    failed = true;
    await route.fulfill({ status: 503, body: "{}" });
  });
  await page.goto("/dataset/categorias/nova");
  await page.getByLabel("Nome", { exact: true }).fill("Nelore");
  await pickCategoryImage(page, COW_PHOTO);
  await page.getByRole("button", { name: "Salvar categoria" }).click();
  await expect(page.getByTestId("field-image")).toContainText(
    "A categoria foi salva, mas a imagem não foi enviada. Toque em Salvar categoria para tentar de novo.",
  );
  const retry = page.waitForResponse((r) => /\/api\/categories\/[^/]+\/image$/.test(r.url()) && r.request().method() === "PUT");
  await page.getByRole("button", { name: "Salvar categoria" }).click();
  expect((await retry).status()).toBe(200);
  await expect(page).toHaveURL(/\/dataset$/);
  expect(await dbQuery("select count(*)::int as n from categories where name = 'Nelore'")).toEqual([{ n: 1 }]);
});
