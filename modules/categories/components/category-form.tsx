"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icon } from "@/modules/core/ui/icon";
import { validateCategoryField, type CategoryField } from "@/modules/categories/validation";
import { useOnline } from "@/modules/core/hooks/use-online";

const INPUT =
  "h-14 w-full rounded-btn border bg-white px-3.5 text-[17px] font-semibold outline-none placeholder:font-normal placeholder:text-faint focus:border-[1.5px] focus:border-primary focus:shadow-[0_0_0_4px_#EAF5EF]";

export function CategoryForm() {
  const router = useRouter();
  const online = useOnline();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Partial<Record<CategoryField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const [imageError, setImageError] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  // Fixo por formulário: reenviar depois de uma falha de rede não cria uma segunda categoria.
  const categoryId = useRef<string | null>(null);

  function pickImage(file: File | undefined) {
    if (!file) return;
    if (image) URL.revokeObjectURL(image.url);
    setImage({ file, url: URL.createObjectURL(file) });
    setImageError(false);
  }

  function removeImage() {
    if (image) URL.revokeObjectURL(image.url);
    setImage(null);
    setImageError(false);
  }

  async function save() {
    const found: Partial<Record<CategoryField, string>> = {};
    const nameError = validateCategoryField("name", name);
    const descriptionError = validateCategoryField("description", description);
    if (nameError) found.name = nameError;
    if (descriptionError) found.description = descriptionError;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const id = (categoryId.current ??= crypto.randomUUID());
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, name: name.trim(), description: description.trim() || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.fields ?? { name: "Não foi possível salvar. Tente de novo." });
        return;
      }
      // A imagem vai depois, para a mesma categoria; se falhar, salvar de novo só reenvia (dataset-ajustes, door 3).
      if (image) {
        setImageError(false);
        const form = new FormData();
        form.set("file", image.file, image.file.name || "categoria.jpg");
        const sent = await fetch(`/api/categories/${id}/image`, { method: "PUT", body: form }).catch(() => null);
        if (!sent?.ok) {
          setImageError(true);
          return;
        }
      }
      router.push("/dataset");
    } finally {
      setSaving(false);
    }
  }

  const canSave = online && !saving;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <header className="flex items-center gap-2 px-3 pt-3">
        <Link href="/dataset" aria-label="Fechar" className="flex size-11 items-center justify-center">
          <Icon name="close" />
        </Link>
        <h1 className="text-[20px] font-bold">Nova categoria</h1>
      </header>

      <div className="flex flex-col gap-5 px-4 pb-6 pt-3">
        <div data-testid="field-name">
          <label htmlFor="category-name" className="mb-2 block text-[15px] font-semibold">
            Nome
          </label>
          <input
            id="category-name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setErrors((e) => ({ ...e, name: validateCategoryField("name", name) ?? undefined }))}
            placeholder="Ex.: Nelore"
            className={`${INPUT} ${errors.name ? "border-[1.5px] border-[#C74A3A]" : "border-line"}`}
          />
          {errors.name && <FieldError text={errors.name} />}
        </div>

        <div data-testid="field-description">
          <label htmlFor="category-description" className="mb-2 block text-[15px] font-semibold">
            Descrição (opcional)
          </label>
          <input
            id="category-description"
            value={description}
            maxLength={60}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() =>
              setErrors((e) => ({ ...e, description: validateCategoryField("description", description) ?? undefined }))
            }
            placeholder="Ex.: Com cupim"
            className={`${INPUT} ${errors.description ? "border-[1.5px] border-[#C74A3A]" : "border-line"}`}
          />
          {errors.description && <FieldError text={errors.description} />}
        </div>

        <div data-testid="field-image">
          <div className="mb-2 text-[15px] font-semibold">Foto (opcional)</div>
          {image ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="Prévia da foto da categoria" data-testid="category-image-preview" className="size-[88px] rounded-card object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="flex h-11 items-center gap-1.5 rounded-[12px] bg-primary-soft px-3.5 text-[15px] font-semibold text-primary-dark"
              >
                <Icon name="delete" size={20} />
                Remover
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageInput.current?.click()}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-btn border-[1.5px] border-dashed border-line bg-white text-[16px] font-semibold text-primary-dark"
            >
              <Icon name="add_photo_alternate" />
              Adicionar foto
            </button>
          )}
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            className="hidden"
            data-testid="category-image-input"
            onChange={(e) => {
              pickImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {imageError && (
            <FieldError text="A categoria foi salva, mas a imagem não foi enviada. Toque em Salvar categoria para tentar de novo." />
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 mt-auto border-t border-line bg-white px-4 pb-[34px] pt-3">
        {!online && (
          <p className="mb-2.5 flex items-center gap-1.5 text-[13px] text-muted">
            <Icon name="cloud_off" size={16} />
            Sem internet — conecte-se para salvar.
          </p>
        )}
        <button
          type="button"
          data-primary-action
          disabled={!canSave}
          onClick={save}
          className={`flex h-[58px] w-full items-center justify-center gap-2 rounded-btn text-[18px] font-semibold ${
            canSave ? "bg-primary text-white" : "bg-disabled text-faint"
          }`}
        >
          Salvar categoria
        </button>
      </footer>
    </main>
  );
}

function FieldError({ text }: { text: string }) {
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-error">
      <Icon name="error" size={16} />
      {text}
    </p>
  );
}
