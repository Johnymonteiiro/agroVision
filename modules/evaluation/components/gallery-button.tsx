"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Icon } from "@/modules/core/ui/icon";
import { setPendingPhoto } from "@/modules/evaluation/pending-photo";

// "Escolher da galeria" da Home: escolhe aqui, dentro do toque, e abre /analisar já na revisão.
export function GalleryButton() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        data-primary-action
        onClick={() => input.current?.click()}
        className="flex h-14 items-center justify-center gap-2.5 rounded-btn bg-primary-soft text-[17px] font-semibold text-primary-dark"
      >
        <Icon name="photo_library" size={22} />
        Escolher da galeria
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setPendingPhoto(file);
          router.push("/analisar?de=/");
        }}
      />
    </>
  );
}
