"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";
import { ageConversion, formatAge, type AgeUnit } from "@/lib/animals/age";
import { CATEGORY_LABEL, SEX_LABEL } from "@/lib/animals/format";
import { validateField, type AnimalField } from "@/lib/animals/validation";
import { useOnline } from "@/lib/hooks/use-online";

type Category = keyof typeof CATEGORY_LABEL;
type Sex = keyof typeof SEX_LABEL;

type Values = {
  externalId: string;
  category: Category | null;
  age: string;
  ageUnit: AgeUnit;
  weightKg: string;
  sex: Sex | null;
};

const INITIAL: Values = { externalId: "", category: null, age: "", ageUnit: "MONTHS", weightKg: "", sex: null };

function toNumber(raw: string) {
  return raw.trim() === "" ? NaN : Number(raw.replace(",", "."));
}

function fieldValue(field: AnimalField, v: Values): unknown {
  if (field === "age") return toNumber(v.age);
  if (field === "weightKg") return toNumber(v.weightKg);
  return v[field];
}

export function AnimalForm() {
  const router = useRouter();
  const online = useOnline();
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<AnimalField, string>>>({});
  const [saving, setSaving] = useState(false);

  const filled = [
    values.externalId.trim() !== "",
    values.category !== null,
    values.age.trim() !== "",
    values.weightKg.trim() !== "",
    values.sex !== null,
  ].filter(Boolean).length;
  const complete = filled === 5;

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    // Escolhas por toque validam na hora; campos de texto só ao sair (blur).
    if (key === "category" || key === "sex" || key === "ageUnit") {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function check(field: AnimalField) {
    setErrors((e) => ({ ...e, [field]: validateField(field, fieldValue(field, values)) ?? undefined }));
  }

  async function save() {
    const fields: AnimalField[] = ["externalId", "category", "age", "ageUnit", "weightKg", "sex"];
    const found: Partial<Record<AnimalField, string>> = {};
    for (const f of fields) {
      const msg = validateField(f, fieldValue(f, values));
      if (msg) found[f] = msg;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const id = crypto.randomUUID();
      const res = await fetch("/api/animals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          externalId: values.externalId.trim(),
          category: values.category,
          sex: values.sex,
          age: toNumber(values.age),
          ageUnit: values.ageUnit,
          weightKg: toNumber(values.weightKg),
        }),
      });
      if (res.ok) {
        router.push(`/animais/${id}`);
        return;
      }
      const body = await res.json().catch(() => ({}));
      setErrors(body.fields ?? { externalId: "Não foi possível salvar. Tente de novo." });
    } finally {
      setSaving(false);
    }
  }

  const ageNumber = toNumber(values.age);
  const ageMonths = Number.isFinite(ageNumber) ? (values.ageUnit === "YEARS" ? ageNumber * 12 : ageNumber) : null;
  const unitWord = values.ageUnit === "YEARS" ? (ageNumber === 1 ? "ano" : "anos") : ageNumber === 1 ? "mês" : "meses";

  const preview = {
    title: values.externalId.trim() ? `Animal #${values.externalId.trim()}` : "Animal #—",
    line1: `${values.category ? CATEGORY_LABEL[values.category] : "Categoria"} • ${values.sex ? SEX_LABEL[values.sex] : "Sexo"}`,
    line2: `${ageMonths !== null ? formatAge(ageMonths) : "Idade"} • ${values.weightKg.trim() ? `${values.weightKg.trim()} kg` : "Peso"}`,
  };

  const canSave = complete && online && !saving;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <header className="flex items-center gap-2 px-3 pt-3">
        <Link href="/animais" aria-label="Fechar" className="flex size-11 items-center justify-center">
          <Icon name="close" />
        </Link>
        <h1 className="text-[20px] font-bold">Novo animal</h1>
        <span className="ml-auto pr-2 text-[13px] font-medium text-muted">Todos obrigatórios</span>
      </header>

      <div className="flex flex-col gap-5 px-4 pb-6 pt-3" data-testid="form-fields">
        <Field label="Identificação" error={errors.externalId} testId="field-externalId">
          <div
            className={`flex h-14 items-center gap-2.5 rounded-btn border bg-white px-3.5 focus-within:border-[1.5px] focus-within:border-primary focus-within:shadow-[0_0_0_4px_#EAF5EF] ${
              errors.externalId ? "border-[1.5px] border-[#C74A3A]" : "border-line"
            }`}
          >
            <Icon name="sell" className="text-muted" />
            <input
              aria-label="Identificação"
              value={values.externalId}
              maxLength={40}
              onChange={(e) => set("externalId", e.target.value)}
              onBlur={() => check("externalId")}
              placeholder="Brinco, ID ou código interno"
              className="h-full min-w-0 flex-1 bg-transparent text-[17px] font-semibold outline-none placeholder:font-normal placeholder:text-faint"
            />
          </div>
        </Field>

        <Field label="Categoria" error={errors.category} testId="field-category">
          <div className="grid grid-cols-2 gap-2.5">
            {(["TAURINE", "ZEBU"] as const).map((c) => {
              const on = values.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("category", c)}
                  className={`relative overflow-hidden rounded-card bg-white text-left ${
                    on ? "border-2 border-primary shadow-[0_0_0_4px_#EAF5EF]" : "border-[1.5px] border-line"
                  }`}
                >
                  <div className="placeholder-stripes flex h-[70px] items-center justify-center">
                    <span className="rounded-[4px] bg-white/75 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted">
                      foto referência
                    </span>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className={`text-[16px] font-semibold ${on ? "text-primary-dark" : ""}`}>{CATEGORY_LABEL[c]}</div>
                    <div className="text-[12px] text-muted">{c === "TAURINE" ? "Sem cupim" : "Com cupim"}</div>
                  </div>
                  {on && (
                    <span className="absolute right-2 top-2 flex size-[26px] items-center justify-center rounded-full bg-primary text-white" data-testid="category-check">
                      <Icon name="check" size={18} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Idade" error={errors.age} testId="field-age">
          <div className="grid grid-cols-[1fr_170px] gap-2.5">
            <div className={`flex h-14 items-center gap-2 rounded-btn border bg-white px-3.5 ${errors.age ? "border-[1.5px] border-[#C74A3A]" : "border-line"}`}>
              <input
                aria-label="Idade"
                inputMode="numeric"
                value={values.age}
                onChange={(e) => set("age", e.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => check("age")}
                className="h-full min-w-0 flex-1 bg-transparent text-[20px] font-semibold outline-none"
              />
              {values.age && <span className="text-[15px] font-semibold text-primary-dark">{unitWord}</span>}
            </div>
            <div className="grid h-14 grid-cols-2 gap-1 rounded-btn bg-[#EEF1EF] p-1" role="group" aria-label="Unidade da idade">
              {(["MONTHS", "YEARS"] as const).map((u) => {
                const on = values.ageUnit === u;
                return (
                  <button
                    key={u}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("ageUnit", u)}
                    className={`rounded-[10px] text-[15px] ${on ? "bg-white font-semibold text-primary-dark shadow-[0_1px_3px_rgba(23,33,28,.12)]" : "font-medium text-muted"}`}
                  >
                    {u === "MONTHS" ? "Meses" : "Anos"}
                  </button>
                );
              })}
            </div>
          </div>
          {Number.isFinite(ageNumber) && (
            <p className="mt-1.5 text-[12px] text-muted" data-testid="age-conversion">
              {ageConversion(ageNumber, values.ageUnit)}
            </p>
          )}
        </Field>

        <Field label="Peso" error={errors.weightKg} testId="field-weight">
          <div className={`flex h-14 items-center rounded-btn border bg-white pl-3.5 pr-1.5 ${errors.weightKg ? "border-[1.5px] border-[#C74A3A]" : "border-line"}`}>
            <input
              aria-label="Peso"
              inputMode="numeric"
              value={values.weightKg}
              onChange={(e) => set("weightKg", e.target.value.replace(/[^\d.,]/g, ""))}
              onBlur={() => check("weightKg")}
              className="h-full min-w-0 flex-1 bg-transparent text-[20px] font-semibold outline-none"
            />
            <span className="flex h-11 items-center rounded-[10px] bg-primary-soft px-3.5 text-[15px] font-bold text-primary-dark">kg</span>
          </div>
        </Field>

        <Field label="Sexo" error={errors.sex} testId="field-sex">
          <div className="grid grid-cols-2 gap-2.5">
            {(["MALE", "FEMALE"] as const).map((s) => {
              const on = values.sex === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("sex", s)}
                  className={`flex h-14 items-center justify-center gap-2 rounded-btn text-[17px] font-semibold ${
                    on ? "border-2 border-primary bg-primary-soft text-primary-dark" : "border-[1.5px] border-line bg-white text-ink-2"
                  }`}
                >
                  <Icon name={s === "MALE" ? "male" : "female"} size={22} />
                  {SEX_LABEL[s]}
                </button>
              );
            })}
          </div>
        </Field>

        <section
          data-testid="card-preview"
          className="flex items-center gap-3 rounded-card bg-white p-3 shadow-[0_1px_2px_rgba(23,33,28,.04),0_4px_16px_rgba(23,33,28,.04)]"
        >
          <div className="placeholder-stripes size-14 flex-none rounded-[12px]" />
          <div>
            <div className="mb-0.5 font-mono text-[11px] font-medium text-muted">PRÉVIA DO CARD</div>
            <div className="text-[16px] font-bold">{preview.title}</div>
            <div className="text-[14px] font-medium text-ink-2">{preview.line1}</div>
            <div className="text-[14px] text-muted">{preview.line2}</div>
          </div>
        </section>
      </div>

      <footer className="sticky bottom-0 mt-auto border-t border-line bg-white px-4 pb-[34px] pt-3">
        {complete ? (
          <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-medium text-ready" data-testid="filled-counter">
            <Icon name="check_circle" size={16} />5 de 5 preenchidos
          </p>
        ) : (
          <p className="mb-2.5 text-[13px] font-medium text-muted" data-testid="filled-counter">
            {filled} de 5 preenchidos
          </p>
        )}
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
          {complete && <Icon name="check" />}
          Salvar animal
        </button>
      </footer>
    </main>
  );
}

function Field({ label, error, testId, children }: { label: string; error?: string; testId: string; children: ReactNode }) {
  return (
    <div data-testid={testId}>
      <div className="mb-2 text-[15px] font-semibold">{label}</div>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-error">
          <Icon name="error" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}
