"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/modules/core/ui/icon";
import { ReadinessChoice } from "@/modules/animals/components/readiness-choice";
import type { Readiness } from "@/modules/core/db/schema";
import { useOnline } from "@/modules/core/hooks/use-online";

type Scope = "FROM_NOW" | "FIX_ALL_PHOTOS";

type Props = { animalId: string; title: string; current: Readiness; photoCount: number; origin: string };

function fixHint(n: number) {
  return n === 1 ? "A foto já tirada também muda." : `As ${n} fotos já tiradas também mudam.`;
}

// "Alterar rótulo": com fotos, pergunta se o animal mudou (só fotos novas) ou se foi erro de cadastro (corrige todas).
export function ReadinessForm({ animalId, title, current, photoCount, origin }: Props) {
  const router = useRouter();
  const online = useOnline();
  const [readiness, setReadiness] = useState<Readiness>(current);
  const [scope, setScope] = useState<Scope | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askReason = photoCount > 0;
  const ready = readiness !== current && (!askReason || scope !== null);
  const canSave = ready && online && !saving;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/animals/${animalId}/readiness`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ readiness, scope: askReason ? scope : "FROM_NOW" }),
      });
      if (!res.ok) {
        setError("Não foi possível salvar. Tente de novo.");
        return;
      }
      router.push(origin);
    } finally {
      setSaving(false);
    }
  }

  const reasons: { value: Scope; label: string; hint: string }[] = [
    { value: "FROM_NOW", label: "O animal mudou", hint: "Só as fotos novas recebem o rótulo novo." },
    { value: "FIX_ALL_PHOTOS", label: "Corrigir erro de cadastro", hint: fixHint(photoCount) },
  ];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <header className="flex items-center gap-2 px-3 pt-3">
        <Link href={origin} aria-label="Voltar" className="flex size-11 items-center justify-center">
          <Icon name="arrow_back" />
        </Link>
        <span className="text-[15px] font-medium text-muted">{title}</span>
      </header>

      <div className="flex flex-col gap-5 px-4 pb-6 pt-3">
        <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.02em]">Alterar rótulo</h1>

        <ReadinessChoice value={readiness} onChange={setReadiness} />

        {askReason && (
          <section data-testid="reason">
            <h2 className="mb-2 text-[15px] font-semibold">Por que mudar?</h2>
            <div className="flex flex-col gap-2.5" role="group" aria-label="Por que mudar?">
              {reasons.map((r) => {
                const on = scope === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setScope(r.value)}
                    className={`flex min-h-16 items-center gap-3 rounded-btn px-3.5 py-2.5 text-left ${
                      on ? "border-2 border-primary bg-primary-soft" : "border-[1.5px] border-line bg-white"
                    }`}
                  >
                    <Icon
                      name={on ? "radio_button_checked" : "radio_button_unchecked"}
                      className={on ? "text-primary" : "text-muted"}
                    />
                    <span>
                      <span className="block text-[16px] font-semibold">{r.label}</span>
                      <span className="block text-[13px] text-muted">{r.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <footer className="sticky bottom-0 mt-auto border-t border-line bg-white px-4 pb-[34px] pt-3">
        {error && (
          <p role="alert" className="mb-2.5 flex items-center gap-1.5 text-[13px] font-medium text-error">
            <Icon name="error" size={16} />
            {error}
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
          Salvar rótulo
        </button>
      </footer>
    </main>
  );
}
