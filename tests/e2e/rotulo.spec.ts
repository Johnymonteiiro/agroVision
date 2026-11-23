import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { assertTouchTargets, createAnimal, dbQuery, resetDb, uploadPhoto } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
});

const pronto = (page: Page) => page.getByRole("group", { name: "Rótulo" }).getByRole("button", { name: /^Pronto/ });
const naoPronto = (page: Page) => page.getByRole("group", { name: "Rótulo" }).getByRole("button", { name: /^Não pronto/ });
const saveButton = (page: Page) => page.getByRole("button", { name: "Salvar rótulo" });

async function animalWithPhotos(request: Parameters<typeof createAnimal>[0], photos: number) {
  const animal = await createAnimal(request, { externalId: "023", readiness: "NOT_READY" });
  for (let i = 0; i < photos; i++) await uploadPhoto(request, animal.id, "SIDE");
  return animal;
}

const animalReadiness = async (id: string) =>
  (await dbQuery<{ readiness: string }>("select readiness from animals where id = $1", [id]))[0].readiness;
const photoReadiness = async (id: string) =>
  (await dbQuery<{ r: string }>("select readiness_at_capture as r from animal_images where animal_id = $1", [id])).map((p) => p.r);

test("qual posicao mostra o rotulo", async ({ page, request }) => {
  const animal = await animalWithPhotos(request, 0);
  await page.goto(`/animais/${animal.id}/fotos`);
  const line = page.getByTestId("capture-readiness");
  await expect(line).toContainText("As fotos serão salvas como");
  await expect(line.getByTestId("readiness-badge")).toHaveText("NÃO PRONTO");
  const change = line.getByRole("link", { name: "Alterar" });
  await expect(change).toHaveAttribute("href", `/animais/${animal.id}/rotulo?de=/animais/${animal.id}/fotos`);
  expect((await change.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test("tela alterar rotulo", async ({ page, request }) => {
  const animal = await animalWithPhotos(request, 1);
  await page.goto(`/animais/${animal.id}/rotulo?de=/animais/${animal.id}`);
  const back = page.getByRole("link", { name: "Voltar" });
  await expect(back.locator('[data-icon="arrow_back"]')).toBeVisible();
  const bb = (await back.boundingBox())!;
  expect([Math.round(bb.width), Math.round(bb.height)]).toEqual([44, 44]);
  await expect(page.getByText("Animal #023")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Alterar rótulo" })).toBeVisible();
  await expect(naoPronto(page)).toHaveAttribute("aria-pressed", "true");
  await expect(pronto(page)).toHaveAttribute("aria-pressed", "false");
  expect(Math.round((await saveButton(page).boundingBox())!.height)).toBe(58);
});

test("motivo com fotos", async ({ page, request }) => {
  const two = await animalWithPhotos(request, 2);
  await page.goto(`/animais/${two.id}/rotulo`);
  const reason = page.getByTestId("reason");
  await expect(reason.getByRole("heading", { name: "Por que mudar?" })).toBeVisible();
  await expect(reason.getByRole("button", { name: /O animal mudou/ })).toContainText("Só as fotos novas recebem o rótulo novo.");
  await expect(reason.getByRole("button", { name: /Corrigir erro de cadastro/ })).toContainText(
    "As 2 fotos já tiradas também mudam.",
  );

  await resetDb();
  const one = await animalWithPhotos(request, 1);
  await page.goto(`/animais/${one.id}/rotulo`);
  await expect(page.getByTestId("reason").getByRole("button", { name: /Corrigir erro de cadastro/ })).toContainText(
    "A foto já tirada também muda.",
  );
});

test("sem fotos nao pergunta o motivo", async ({ page, request }) => {
  const animal = await animalWithPhotos(request, 0);
  await page.goto(`/animais/${animal.id}/rotulo`);
  await expect(page.getByText("Por que mudar?")).toHaveCount(0);
  await expect(saveButton(page)).toBeDisabled();
  await pronto(page).click();
  await expect(saveButton(page)).toBeEnabled();
  const put = page.waitForRequest((r) => r.url().endsWith(`/api/animals/${animal.id}/readiness`) && r.method() === "PUT");
  await saveButton(page).click();
  expect((await put).postDataJSON()).toEqual({ readiness: "READY", scope: "FROM_NOW" });
  await expect(page).toHaveURL(new RegExp(`/animais/${animal.id}$`));
  expect(await animalReadiness(animal.id)).toBe("READY");
});

test("salvar desabilitado ate escolher", async ({ page, request }) => {
  const animal = await animalWithPhotos(request, 1);
  await page.goto(`/animais/${animal.id}/rotulo`);
  await expect(saveButton(page)).toBeDisabled();
  await pronto(page).click();
  await expect(saveButton(page)).toBeDisabled();
  await page.getByRole("button", { name: /O animal mudou/ }).click();
  await expect(saveButton(page)).toBeEnabled();
});

test("o animal mudou mantem as fotos", async ({ page, request }) => {
  const animal = await animalWithPhotos(request, 2);
  await page.goto(`/animais/${animal.id}`);
  await page.getByTestId("readiness-row").getByRole("link", { name: "Alterar" }).click();
  await pronto(page).click();
  await page.getByRole("button", { name: /O animal mudou/ }).click();
  await saveButton(page).click();
  await expect(page).toHaveURL(new RegExp(`/animais/${animal.id}$`));
  expect(await animalReadiness(animal.id)).toBe("READY");
  expect(await photoReadiness(animal.id)).toEqual(["NOT_READY", "NOT_READY"]);
});

test("corrigir erro muda as fotos", async ({ page, request }) => {
  const animal = await animalWithPhotos(request, 2);
  await page.goto(`/animais/${animal.id}/fotos`);
  await page.getByTestId("capture-readiness").getByRole("link", { name: "Alterar" }).click();
  await pronto(page).click();
  await page.getByRole("button", { name: /Corrigir erro de cadastro/ }).click();
  const res = page.waitForResponse((r) => r.url().endsWith(`/api/animals/${animal.id}/readiness`));
  await saveButton(page).click();
  expect(await (await res).json()).toMatchObject({ photosUpdated: 2 });
  await expect(page).toHaveURL(new RegExp(`/animais/${animal.id}/fotos$`));
  expect(await animalReadiness(animal.id)).toBe("READY");
  expect(await photoReadiness(animal.id)).toEqual(["READY", "READY"]);
});

test("voltar nao muda nada", async ({ page, request }) => {
  const animal = await animalWithPhotos(request, 1);
  await page.goto(`/animais/${animal.id}/rotulo?de=/animais/${animal.id}`);
  await pronto(page).click();
  await page.getByRole("link", { name: "Voltar" }).click();
  await expect(page).toHaveURL(new RegExp(`/animais/${animal.id}$`));
  expect(await animalReadiness(animal.id)).toBe("NOT_READY");
});

test("de externo volta para o perfil", async ({ page, request }) => {
  const animal = await animalWithPhotos(request, 0);
  await page.goto(`/animais/${animal.id}/rotulo?de=//evil.com`);
  await expect(page.getByRole("link", { name: "Voltar" })).toHaveAttribute("href", `/animais/${animal.id}`);
  await pronto(page).click();
  await saveButton(page).click();
  await expect(page).toHaveURL(new RegExp(`^http://[^/]+/animais/${animal.id}$`));
});

// C50 revisto em 2026-11-22: a página é um soft 404 (streaming, status 200); a API responde 404 de verdade.
test("rotulo de animal inexistente cai no nao encontrado", async ({ page }) => {
  await page.goto(`/animais/${randomUUID()}/rotulo`);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
  await expect(page.getByRole("heading", { name: "Alterar rótulo" })).toHaveCount(0);
});

test("offline desabilita salvar rotulo", async ({ page, context, request }) => {
  const animal = await animalWithPhotos(request, 0);
  await page.goto(`/animais/${animal.id}/rotulo`);
  await pronto(page).click();
  await context.setOffline(true);
  await expect(saveButton(page)).toBeDisabled();
  await expect(page.getByText("Sem internet — conecte-se para salvar.")).toBeVisible();
  await context.setOffline(false);
});

test("alvos de toque do rotulo", async ({ page, request }) => {
  const animal = await animalWithPhotos(request, 2);
  await page.goto(`/animais/${animal.id}/rotulo`);
  await assertTouchTargets(page);
});
