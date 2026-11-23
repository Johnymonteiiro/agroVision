"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/modules/core/ui/icon";
import { useOnline } from "@/modules/core/hooks/use-online";

export type GridPhoto = { id: string; when: string };

type Props = { photos: GridPhoto[]; positionLabel: string };

// Fotos de uma posição no perfil. Tocar abre a foto, que pode ser excluída com confirmação (dataset-ajustes, S2).
export function PhotoGrid({ photos, positionLabel }: Props) {
  const router = useRouter();
  const online = useOnline();
  const [open, setOpen] = useState<GridPhoto | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  function close() {
    setOpen(null);
    setConfirming(false);
    setError(false);
  }

  async function remove() {
    if (!open) return;
    setDeleting(true);
    setError(false);
    try {
      const res = await fetch(`/api/images/${open.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`exclusão ${res.status}`);
      close();
      router.refresh();
    } catch (e) {
      console.error("exclusão da foto falhou", e);
      setError(true);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <ul className="grid grid-cols-4 gap-2">
        {photos.map((photo) => (
          <li key={photo.id}>
            <button
              type="button"
              aria-label={`Abrir foto ${positionLabel}, ${photo.when}`}
              onClick={() => setOpen(photo)}
              className="block w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/images/${photo.id}?variant=thumb`}
                alt=""
                data-image-id={photo.id}
                className="aspect-square w-full rounded-[10px] object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div className="fixed inset-0 z-50 bg-camera" data-testid="photo-viewer">
          <div className="relative mx-auto flex h-dvh w-full max-w-[480px] flex-col text-white">
            <div className="flex items-center justify-between px-3 pt-3">
              <button
                type="button"
                aria-label="Fechar"
                onClick={close}
                className="flex size-11 items-center justify-center rounded-full bg-white/15"
              >
                <Icon name="close" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/images/${open.id}?variant=full`}
              alt={`Foto ${positionLabel}`}
              data-testid="viewer-photo"
              className="mt-3 min-h-0 w-full flex-1 object-contain"
            />
            <div className="flex items-center justify-between gap-3 px-5 pb-[34px] pt-4">
              <p className="text-[15px]" data-testid="viewer-info">
                <span className="font-semibold">{positionLabel}</span> · {open.when}
              </p>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex h-11 items-center gap-1.5 rounded-[12px] bg-white/15 px-3.5 text-[15px] font-semibold"
              >
                <Icon name="delete" size={20} />
                Excluir foto
              </button>
            </div>

            {confirming && (
              <div className="absolute inset-0 flex items-end bg-black/50">
                <section
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="delete-title"
                  className="w-full rounded-t-[24px] bg-white px-5 pb-[34px] pt-6 text-ink"
                >
                  <h2 id="delete-title" className="text-[22px] font-bold leading-[1.25] tracking-[-0.01em]">
                    Excluir esta foto?
                  </h2>
                  <p className="mt-1.5 text-[15px] text-muted">
                    A foto {positionLabel} de {open.when} será apagada do dataset.
                  </p>
                  {!online && (
                    <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">
                      <Icon name="cloud_off" size={18} />
                      Sem internet — conecte-se para excluir.
                    </p>
                  )}
                  {error && (
                    <p role="alert" className="mt-3 flex items-center gap-2 text-[13px] font-medium text-error">
                      <Icon name="error" size={18} />
                      Não foi possível excluir a foto. Tente de novo.
                    </p>
                  )}
                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirming(false);
                        setError(false);
                      }}
                      className="flex h-14 items-center justify-center rounded-btn bg-primary-soft text-[17px] font-semibold text-primary-dark"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!online || deleting}
                      onClick={remove}
                      className={`flex h-14 items-center justify-center rounded-btn text-[17px] font-semibold ${
                        !online || deleting ? "bg-disabled text-faint" : "bg-error text-white"
                      }`}
                    >
                      {deleting ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
