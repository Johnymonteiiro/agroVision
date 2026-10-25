"use client";

export type ModelInfo = { name: string; version: string; threshold: { READY: number; NOT_READY: number } };
export type Probabilities = { ready: number; notReady: number };

// Porta do modelo (plan.md, porta 1): o adaptador do Edge Impulse (F5) implementa esta interface,
// e o pré-processamento da imagem fica dentro dele, porque depende do modelo.
export interface Classifier {
  readonly model: ModelInfo;
  classify(image: ImageBitmap): Promise<Probabilities>;
}

export class ModelUnavailableError extends Error {
  constructor() {
    super("Nenhum modelo de IA instalado");
    this.name = "ModelUnavailableError";
  }
}

declare global {
  interface Window {
    /** Gancho de teste E2E: instala um classificador no lugar do modelo real (tests/e2e). */
    __agroClassifier?: () => Promise<Classifier>;
  }
}

let loading: Promise<Classifier> | null = null;

// A Home chama primeiro e a análise reaproveita o mesmo carregamento; uma falha libera a próxima tentativa.
export function loadClassifier(): Promise<Classifier> {
  if (!loading) {
    const hook = typeof window === "undefined" ? undefined : window.__agroClassifier;
    // Ainda não existe modelo empacotado: sem o gancho, o app sempre responde que não há modelo.
    loading = hook ? hook() : Promise.reject(new ModelUnavailableError());
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}
