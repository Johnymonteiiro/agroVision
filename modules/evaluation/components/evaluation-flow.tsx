"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { GuidedCamera, PhotoReview } from "@/modules/vision/camera/guided-camera";
import { Icon } from "@/modules/core/ui/icon";
import {
  ModelUnavailableError,
  loadClassifier,
  type Classifier,
  type ModelInfo,
  type Probabilities,
} from "@/modules/model/classifier";
import { clearPendingPhoto, peekPendingPhoto } from "@/modules/evaluation/pending-photo";
import { useOnline } from "@/modules/core/hooks/use-online";
import { ResultView } from "@/modules/evaluation/components/result-view";

// A foto existe só em memória; a URL temporária é revogada quando outra foto toma o lugar dela.
type Photo = { blob: Blob; url: string };

type Step =
  | { name: "camera" }
  | { name: "review"; photo: Photo }
  | { name: "analyzing"; photo: Photo; model: ModelInfo | null }
  | { name: "loading-model"; photo: Photo }
  | { name: "unavailable" }
  | { name: "load-error"; photo: Photo }
  | { name: "decode-error" }
  | { name: "result"; photo: Photo; model: ModelInfo; probs: Probabilities; at: Date };

function toPhoto(blob: Blob): Photo {
  return { blob, url: URL.createObjectURL(blob) };
}

function release(photo: Photo) {
  URL.revokeObjectURL(photo.url);
}

// Decodifica a foto, pede o modelo e classifica; cada etapa vira uma tela.
async function runAnalysis(photo: Photo, show: (step: Step) => void) {
  show({ name: "analyzing", photo, model: null });
  let image: ImageBitmap;
  try {
    image = await createImageBitmap(photo.blob);
  } catch {
    release(photo);
    show({ name: "decode-error" });
    return;
  }

  show({ name: "loading-model", photo });
  let classifier: Classifier;
  try {
    classifier = await loadClassifier();
  } catch (error) {
    image.close();
    if (error instanceof ModelUnavailableError) {
      release(photo);
      show({ name: "unavailable" });
    } else {
      console.error("modelo não carregou", error);
      show({ name: "load-error", photo });
    }
    return;
  }

  show({ name: "analyzing", photo, model: classifier.model });
  try {
    const probs = await classifier.classify(image);
    show({ name: "result", photo, model: classifier.model, probs, at: new Date() });
  } catch (error) {
    console.error("classificação falhou", error);
    show({ name: "load-error", photo });
  } finally {
    image.close();
  }
}

const QUESTION = "Esta foto está boa para análise?";

export function EvaluationFlow({ origin }: { origin: string }) {
  const [step, setStep] = useState<Step>(() => {
    const pending = peekPendingPhoto();
    return pending ? { name: "review", photo: toPhoto(pending) } : { name: "camera" };
  });

  // A foto da galeria da Home vale para uma abertura do fluxo só.
  useEffect(() => {
    clearPendingPhoto();
  }, []);

  function backToCamera(photo?: Photo) {
    if (photo) release(photo);
    setStep({ name: "camera" });
  }

  switch (step.name) {
    case "camera":
      return (
        <GuidedCamera
          position="SIDE"
          weightKg={null}
          cancel={{ href: origin }}
          needsNetwork={false}
          chips={false}
          onGallery={(file) => setStep({ name: "review", photo: toPhoto(file) })}
          review={{ question: QUESTION, actionLabel: "Analisar imagem", actionIcon: "center_focus_strong", notes: <ReviewNotes /> }}
          onUse={async (shot) => {
            void runAnalysis(toPhoto(shot.blob), setStep);
          }}
        />
      );
    case "review":
      return (
        <main className="relative mx-auto h-dvh w-full max-w-[480px] overflow-hidden bg-camera">
          <PhotoReview
            url={step.photo.url}
            question={QUESTION}
            action={{
              label: "Analisar imagem",
              icon: "center_focus_strong",
              onClick: () => void runAnalysis(step.photo, setStep),
            }}
            onRetake={() => backToCamera(step.photo)}
          >
            <ReviewNotes />
          </PhotoReview>
        </main>
      );
    case "analyzing":
      return <Analyzing url={step.photo.url} model={step.model} />;
    case "loading-model":
      return (
        <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-8 text-center">
          <div data-testid="model-spinner" className="size-12 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />
          <p className="mt-4 text-[17px] font-semibold">Carregando modelo...</p>
          <p className="mt-1 text-[14px] leading-[1.4] text-muted">Só na primeira abertura.</p>
        </main>
      );
    case "unavailable":
      return (
        <StateScreen
          testId="model-unavailable"
          icon="memory"
          tone="bg-disabled text-ink-2"
          title="Modelo de IA ainda não disponível"
          text="A avaliação Pronto / Não pronto chega quando o modelo for treinado com as fotos do dataset."
        >
          <Link href="/" className="flex h-12 items-center rounded-[12px] bg-primary px-[18px] text-[15px] font-semibold text-white">
            Voltar ao início
          </Link>
        </StateScreen>
      );
    case "load-error":
      return (
        <StateScreen
          testId="model-error"
          icon="report"
          tone="bg-error-soft text-error"
          title="Erro ao carregar o modelo"
          text="Reinicie o app. Se persistir, reinstale o modelo com internet."
        >
          <button
            type="button"
            onClick={() => void runAnalysis(step.photo, setStep)}
            className="flex h-12 items-center rounded-[12px] bg-primary-soft px-[18px] text-[15px] font-semibold text-primary-dark"
          >
            Tentar novamente
          </button>
        </StateScreen>
      );
    case "decode-error":
      return (
        <StateScreen
          testId="image-error"
          icon="image_not_supported"
          tone="bg-warn-badge text-warn-dark"
          title="Não foi possível processar esta imagem"
          text="Tente outra foto."
        >
          <button
            type="button"
            onClick={() => backToCamera()}
            className="flex h-12 items-center rounded-[12px] bg-primary px-[18px] text-[15px] font-semibold text-white"
          >
            Tirar outra foto
          </button>
        </StateScreen>
      );
    case "result":
      return (
        <ResultView
          url={step.photo.url}
          model={step.model}
          probs={step.probs}
          at={step.at}
          onAgain={() => backToCamera(step.photo)}
        />
      );
  }
}

function ReviewNotes() {
  const online = useOnline();
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      <p className="flex items-center gap-2 text-[13px] text-muted">
        <Icon name="smartphone" size={18} className="text-primary" />
        A análise é realizada no seu dispositivo.
      </p>
      {!online && (
        <p className="flex items-center gap-2 text-[13px] text-muted">
          <Icon name="cloud_off" size={18} />
          Sem internet — a análise continuará normalmente.
        </p>
      )}
    </div>
  );
}

// Design 1e: varredura e barra indeterminada, sem porcentagem falsa.
function Analyzing({ url, model }: { url: string; model: ModelInfo | null }) {
  return (
    <main
      data-testid="analyzing"
      className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-8 pb-[60px] text-center"
    >
      <div className="relative h-[196px] w-[280px] overflow-hidden rounded-[18px] bg-line-soft shadow-[0_8px_24px_rgba(23,33,28,.08)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Foto em análise" data-testid="analyzing-photo" className="size-full object-cover" />
        <div className="absolute inset-2.5 rounded-[12px] shadow-[inset_0_0_0_1.5px_rgba(31,107,69,.45)]" />
        <div
          data-testid="scan-line"
          className="absolute inset-x-0 h-[3px] animate-scan bg-guide shadow-[0_0_14px_3px_rgba(127,209,163,.75)] motion-reduce:animate-none"
        />
      </div>
      <h1 className="mt-9 text-[24px] font-bold leading-[1.2] tracking-[-0.01em]">Analisando animal...</h1>
      <p className="mt-2 max-w-[300px] text-pretty text-[16px] leading-[1.45] text-muted">
        A inteligência artificial está processando a imagem no seu dispositivo.
      </p>
      <div data-testid="indeterminate-bar" className="relative mt-7 h-1 w-[140px] overflow-hidden rounded-sm bg-line">
        <div className="absolute inset-y-0 w-[35%] animate-indeterminate rounded-sm bg-primary motion-reduce:animate-none" />
      </div>
      {model && (
        <p className="absolute inset-x-0 bottom-10 flex items-center justify-center gap-1.5 font-mono text-[12px] font-medium text-muted">
          <Icon name="memory" size={16} className="text-primary" />
          {model.name} v{model.version} · no dispositivo
        </p>
      )}
    </main>
  );
}

// Estados do design 1q: modelo indisponível, erro de carregamento e foto inválida.
function StateScreen({
  testId,
  icon,
  tone,
  title,
  text,
  children,
}: {
  testId: string;
  icon: string;
  tone: string;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <main
      data-testid={testId}
      className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-8 text-center"
    >
      <Link href="/" aria-label="Fechar" className="absolute left-4 top-3 flex size-11 items-center justify-center rounded-full bg-white">
        <Icon name="close" />
      </Link>
      <div data-testid="state-icon" className={`flex size-16 items-center justify-center rounded-full ${tone}`}>
        <Icon name={icon} size={30} />
      </div>
      <h1 className="mt-3.5 text-[17px] font-semibold">{title}</h1>
      <p className="mt-1 max-w-[300px] text-pretty text-[14px] leading-[1.4] text-muted">{text}</p>
      <div className="mt-4">{children}</div>
    </main>
  );
}
