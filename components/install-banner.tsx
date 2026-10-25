"use client";

import { Icon } from "@/components/icon";
import { dismissInstall, installApp, useInstallPrompt } from "@/lib/hooks/use-install-prompt";

export function InstallBanner() {
  const { canPrompt, visible } = useInstallPrompt();
  if (!visible) return null;

  return (
    <section
      aria-label="Instalar app"
      className="mx-4 mt-4 flex items-center gap-3 rounded-card bg-white py-2 pl-3.5 pr-1 shadow-[0_0_0_1px_rgba(0,0,0,.06)]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon name="mobile_arrow_down" size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">Instale o app</p>
        <p className="text-[13px] leading-[1.35] text-muted">
          {canPrompt
            ? "Abra direto da tela inicial."
            : "Toque em Compartilhar e depois em “Adicionar à Tela de Início”."}
        </p>
      </div>
      {canPrompt && (
        <button
          type="button"
          onClick={installApp}
          className="flex h-11 shrink-0 items-center rounded-[12px] bg-primary px-3.5 text-[15px] font-semibold text-white"
        >
          Instalar
        </button>
      )}
      <button
        type="button"
        aria-label="Fechar"
        onClick={dismissInstall}
        className="flex size-11 shrink-0 items-center justify-center text-muted"
      >
        <Icon name="close" size={22} />
      </button>
    </section>
  );
}
