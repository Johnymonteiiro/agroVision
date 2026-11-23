"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { loadClassifier, type ModelInfo } from "@/lib/evaluation/classifier";
import { useOnline } from "@/lib/hooks/use-online";

// Linha abaixo do cartão da Home. Pedir o modelo aqui também adianta o carregamento da primeira análise.
export function ModelStatus() {
  // undefined: ainda consultando; null: nenhum modelo (ou falha ao carregar, detalhada só na análise).
  const [model, setModel] = useState<ModelInfo | null | undefined>(undefined);
  const online = useOnline();

  useEffect(() => {
    let alive = true;
    loadClassifier().then(
      (c) => {
        if (alive) setModel(c.model);
      },
      () => {
        if (alive) setModel(null);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  if (model === undefined) return null;

  // Offline (design 1b) a linha encolhe para uma só, abaixo do banner que ocupa o espaço.
  if (model && !online) {
    return (
      <p data-testid="model-status" className="mx-5 mt-4 flex items-center gap-2 text-[14px] font-semibold text-primary-dark">
        <Icon name="offline_bolt" size={20} className="text-primary" />
        <span data-testid="model-status-label">IA disponível offline</span>
        <span data-testid="model-status-version" className="ml-auto text-[13px] font-normal text-muted">
          Modelo v{model.version}
        </span>
      </p>
    );
  }

  return (
    <div data-testid="model-status" className="mx-5 mt-5 flex flex-col gap-2.5">
      {model ? (
        <>
          <p className="flex items-center gap-2 text-[14px] font-semibold text-primary-dark">
            <Icon name="offline_bolt" size={20} className="text-primary" />
            IA disponível offline
          </p>
          <p className="text-[13px] leading-[1.4] text-muted">
            Modelo instalado: <b className="font-semibold text-ink-2">v{model.version}</b>
          </p>
        </>
      ) : (
        <p className="flex items-center gap-2 text-[14px] font-semibold text-muted">
          <Icon name="offline_bolt" size={20} className="text-muted" />
          Modelo de IA ainda não disponível
        </p>
      )}
    </div>
  );
}
