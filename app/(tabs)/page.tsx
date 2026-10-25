import Image from "next/image";
import Link from "next/link";
import { ConnectionChip } from "@/components/connection-chip";
import { Icon } from "@/components/icon";
import { GalleryButton } from "./gallery-button";
import { ModelStatus } from "./model-status";

// Home (design 1a/1b): ponto de partida da avaliação.
export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[480px] pb-10">
      <header className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={36}
            height={36}
            data-testid="home-logo"
            className="size-9 rounded-[10px]"
          />
          <h1 className="text-[18px] font-bold leading-[1.1] tracking-[-0.01em]">AgroVision</h1>
        </div>
        <ConnectionChip />
      </header>

      <p className="mx-5 mb-4 mt-7 text-pretty text-[16px] leading-[1.45] text-muted">
        Analise um animal usando a câmera ou uma foto.
      </p>

      <section className="mx-4 flex flex-col items-center rounded-card-lg bg-white px-5 pb-5 pt-7 text-center shadow-[0_1px_2px_rgba(23,33,28,.04),0_8px_24px_rgba(23,33,28,.05)]">
        <div className="flex size-[76px] items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon name="photo_camera" size={38} fill />
        </div>
        <h2 className="mt-[18px] text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">Analisar animal</h2>
        <p className="mt-1.5 text-[16px] leading-[1.4] text-muted">Tire uma foto ou selecione uma imagem</p>
        <div className="mt-6 flex w-full flex-col gap-2.5">
          <Link
            href="/analisar?de=/"
            data-primary-action
            className="flex h-[60px] items-center justify-center gap-2.5 rounded-btn bg-primary text-[18px] font-semibold text-white"
          >
            <Icon name="photo_camera" />
            Tirar foto
          </Link>
          <GalleryButton />
        </div>
      </section>

      <ModelStatus />
    </main>
  );
}
