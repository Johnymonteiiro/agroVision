"use client";

import { useRef, useState } from "react";
import { GuidedCamera, PhotoReview, type CapturedPhoto } from "@/modules/vision/camera/guided-camera";
import { Icon } from "@/modules/core/ui/icon";
import { POSITION_LABEL, POSITION_OPTIONS, type Position } from "@/modules/vision/positions";
import { qualityIssues } from "@/modules/vision/quality/issues";
import { measureFile } from "@/modules/vision/quality/measure";
import type { QualityMetrics } from "@/modules/vision/quality/metrics";
import { QualityChecking, QualityIssues } from "@/modules/vision/quality/quality-issues";
import type { PhotoToSend } from "@/modules/photos/send-photo";

export type FormPhoto = PhotoToSend & { url: string };

type Source = "camera" | "gallery";

// Foto da galeria em revisão, com a medição de qualidade em andamento.
type GalleryShot = {
  file: File;
  url: string;
  position: Position;
  width: number;
  height: number;
  capturedAt: string;
  measuring: Promise<QualityMetrics | null>;
};

type Props = {
  photo: FormPhoto | null;
  onChange: (photo: FormPhoto | null) => void;
  // Peso válido do formulário, para a câmera mostrar a distância mínima; null se ainda não há.
  weightKg: number | null;
  invalid: boolean;
};

// Bloco "Foto do animal" do cadastro (design 2a/2b). A posição é escolhida antes da câmera ou da galeria,
// e a foto só é enviada quando o animal é salvo.
export function PhotoField({ photo, onChange, weightKg, invalid }: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const galleryPosition = useRef<Position | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [cameraPosition, setCameraPosition] = useState<Position | null>(null);
  const [unreadable, setUnreadable] = useState(false);
  const [gallery, setGallery] = useState<GalleryShot | null>(null);
  const [galleryQuality, setGalleryQuality] = useState<{ file: File; metrics: QualityMetrics | null } | null>(null);
  // Foto atual: a medição da galeria só vale se esta ainda for a foto do formulário quando voltar.
  const latest = useRef<string | null>(null);

  // `quality` undefined = medição em andamento (foto da galeria); a da câmera já vem medida.
  function keep(shot: Omit<CapturedPhoto, "quality"> & Pick<PhotoToSend, "quality">, position: Position) {
    setUnreadable(false);
    const kept: FormPhoto = { ...shot, position, imageId: crypto.randomUUID(), url: URL.createObjectURL(shot.blob) };
    latest.current = kept.imageId;
    onChange(kept);
    return kept;
  }

  function choose(position: Position) {
    if (source === "camera") {
      setCameraPosition(position);
    } else {
      // Ainda dentro do toque do usuário, que o navegador exige para abrir o seletor de arquivos.
      galleryPosition.current = position;
      galleryRef.current?.click();
    }
    setSource(null);
  }

  // A foto da galeria passa pela revisão com a análise antes de entrar no formulário (dataset-ajustes, S1).
  async function fromGallery(file: File | undefined) {
    const position = galleryPosition.current;
    if (!file || !position) return;
    try {
      // createImageBitmap aplica a orientação do EXIF, então largura e altura saem como a foto aparece.
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      const measuring = measureFile(file);
      setGallery({
        file,
        url: URL.createObjectURL(file),
        position,
        width,
        height,
        // lastModified é a data do arquivo; o navegador usa o momento da escolha quando ela não existe.
        capturedAt: new Date(file.lastModified).toISOString(),
        measuring,
      });
      void measuring.then((metrics) => setGalleryQuality({ file, metrics }));
    } catch {
      setUnreadable(true);
    }
  }

  function closeGallery() {
    if (gallery) URL.revokeObjectURL(gallery.url);
    setGallery(null);
  }

  function acceptGallery() {
    if (!gallery) return;
    const measured = galleryQuality?.file === gallery.file ? galleryQuality.metrics : undefined;
    // Sem o guia ao vivo, o enquadramento fica UNAVAILABLE para a curadoria poder separar essas fotos.
    const kept = keep(
      {
        blob: gallery.file,
        framing: "UNAVAILABLE",
        capturedAt: gallery.capturedAt,
        width: gallery.width,
        height: gallery.height,
        quality: measured,
      },
      gallery.position,
    );
    // Usada antes de a medição voltar: o bloco mostra "Verificando a foto..." até ela chegar.
    if (measured === undefined) {
      void gallery.measuring.then((quality) => {
        if (latest.current === kept.imageId) onChange({ ...kept, quality });
      });
    }
    closeGallery();
  }

  function chooseAnother() {
    closeGallery();
    // Ainda dentro do toque do usuário: reabre o seletor para a mesma posição.
    galleryRef.current?.click();
  }

  function replace() {
    if (photo) URL.revokeObjectURL(photo.url);
    latest.current = null;
    onChange(null);
  }

  return (
    <>
      {photo ? (
        <>
        <div className="relative h-[220px] overflow-hidden rounded-card bg-line-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={`Foto do animal, ${POSITION_LABEL[photo.position]}`}
            data-testid="photo-preview"
            className="size-full object-cover"
          />
          <span className="absolute left-2.5 top-2.5 flex h-[30px] items-center rounded-full bg-white/92 px-2.5 text-[12px] font-semibold text-ink-2">
            {POSITION_LABEL[photo.position]}
          </span>
          <span className="absolute bottom-2.5 left-2.5 flex h-[30px] items-center gap-1.5 rounded-full bg-white/92 px-2.5 text-[12px] font-semibold text-ready">
            <Icon name="check_circle" size={16} />
            Foto adicionada
          </span>
          <button
            type="button"
            onClick={replace}
            className="absolute bottom-2.5 right-2.5 flex h-11 items-center gap-1.5 rounded-[12px] bg-white/92 px-3.5 text-[14px] font-semibold text-primary-dark"
          >
            <Icon name="replay" size={18} />
            Trocar foto
          </button>
        </div>
        {/* Avisos da checagem de qualidade, abaixo da prévia; não bloqueiam o salvar (qualidade-imagem, AC 14). */}
        <div className="mt-2 empty:hidden">
          {photo.quality === undefined ? (
            <QualityChecking />
          ) : photo.quality ? (
            <QualityIssues issues={qualityIssues(photo.quality)} />
          ) : null}
        </div>
        </>
      ) : (
        <div
          className={`flex h-[168px] flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed bg-white ${
            invalid || unreadable ? "border-[#C74A3A]" : "border-line"
          }`}
        >
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setSource("camera")}
              className="flex h-[52px] items-center gap-2 rounded-btn bg-primary px-[18px] text-[16px] font-semibold text-white"
            >
              <Icon name="photo_camera" />
              Tirar foto
            </button>
            <button
              type="button"
              onClick={() => setSource("gallery")}
              className="flex h-[52px] items-center gap-2 rounded-btn bg-primary-soft px-[18px] text-[16px] font-semibold text-primary-dark"
            >
              <Icon name="photo_library" size={22} />
              Galeria
            </button>
          </div>
          <p className="text-[13px] text-muted">
            {unreadable ? "Não foi possível abrir esta imagem. Escolha outra." : "Você escolhe a posição antes da foto"}
          </p>
        </div>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="gallery-input"
        onChange={(e) => {
          void fromGallery(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {source && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40">
          <button type="button" aria-label="Fechar escolha de posição" className="absolute inset-0" onClick={() => setSource(null)} />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="position-title"
            className="relative mx-auto w-full max-w-[480px] rounded-t-[24px] bg-white px-4 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]"
          >
            <h2 id="position-title" className="text-[22px] font-bold leading-[1.25] tracking-[-0.01em]">
              Qual posição?
            </h2>
            <p className="mt-1 text-[15px] text-muted">
              {source === "camera" ? "Escolha antes de abrir a câmera." : "Escolha antes de selecionar a foto."}
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {POSITION_OPTIONS.map((o) => (
                <li key={o.position}>
                  <button
                    type="button"
                    data-primary-action
                    onClick={() => choose(o.position)}
                    className="flex h-[60px] w-full items-center gap-3 rounded-btn border-[1.5px] border-line bg-white px-4 text-left"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Icon name={o.icon} size={22} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[17px] font-semibold">{POSITION_LABEL[o.position]}</span>
                      <span className="block text-[13px] text-muted">{o.hint}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setSource(null)}
              className="mt-2 flex h-12 w-full items-center justify-center text-[16px] font-semibold text-primary-dark"
            >
              Cancelar
            </button>
          </section>
        </div>
      )}

      {cameraPosition && (
        <div className="fixed inset-0 z-50 bg-camera">
          <GuidedCamera
            position={cameraPosition}
            weightKg={weightKg}
            cancel={{ onClick: () => setCameraPosition(null) }}
            needsNetwork={false}
            onUse={async (shot) => {
              keep(shot, cameraPosition);
              setCameraPosition(null);
            }}
          />
        </div>
      )}

      {gallery && <GalleryReview shot={gallery} quality={galleryQuality} onUse={acceptGallery} onBack={closeGallery} onAnother={chooseAnother} />}
    </>
  );
}

type GalleryReviewProps = {
  shot: GalleryShot;
  quality: { file: File; metrics: QualityMetrics | null } | null;
  onUse: () => void;
  onBack: () => void;
  onAnother: () => void;
};

// Revisão da foto da galeria, igual à da câmera, com "Escolher outra foto" (dataset-ajustes, AC 1-4).
function GalleryReview({ shot, quality, onUse, onBack, onAnother }: GalleryReviewProps) {
  const checking = quality?.file !== shot.file;
  const metrics = checking ? null : quality.metrics;
  const issues = metrics ? qualityIssues(metrics) : [];
  return (
    <div className="fixed inset-0 z-50 bg-camera">
      <div className="relative mx-auto h-dvh w-full max-w-[480px] overflow-hidden">
        <PhotoReview
          url={shot.url}
          question="Esta foto está boa para o dataset?"
          info={
            <p className="flex items-center gap-2 text-[14px] text-muted" data-testid="review-info">
              <span className="font-semibold text-ink-2">{POSITION_LABEL[shot.position]}</span>·<span>Foto da galeria</span>
            </p>
          }
          checking={checking}
          issues={issues}
          action={{ label: issues.length > 0 ? "Usar mesmo assim" : "Usar foto", icon: "check", onClick: onUse }}
          onRetake={onBack}
          retake={{ label: "Escolher outra foto", icon: "photo_library", onClick: onAnother }}
        />
      </div>
    </div>
  );
}
