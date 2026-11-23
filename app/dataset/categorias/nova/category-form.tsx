"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { validateCategoryField, type CategoryField } from "@/lib/categories/validation";
import { useOnline } from "@/lib/hooks/use-online";

const INPUT =
  "h-14 w-full rounded-btn border bg-white px-3.5 text-[17px] font-semibold outline-none placeholder:font-normal placeholder:text-faint focus:border-[1.5px] focus:border-primary focus:shadow-[0_0_0_4px_#EAF5EF]";

export function CategoryForm() {
  const router = useRouter();
  const online = useOnline();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Partial<Record<CategoryField, string>>>({});
  const [saving, setSaving] = useState(false);
  // Fixo por formulário: reenviar depois de uma falha de rede não cria uma segunda categoria.
  const categoryId = useRef<string | null>(null);

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
