import Image from "next/image";
import loader from "./loader.svg";

// Fallback de todas as páginas: o Next as envolve num <Suspense> enquanto o servidor busca os dados.
export default function Loading() {
  return (
    <div role="status" className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-bg px-6 text-center">
      {/* eager e não preload: o preload entraria no <head> de toda página, mesmo quando o fallback não aparece. */}
      <Image src={loader} alt="Carregando" width={168} height={164} loading="eager" unoptimized />
      <p className="mt-6 text-[34px] font-bold leading-none tracking-[-0.02em]">
        <span className="text-brand">Agro</span>
        <span className="text-scan">Vision</span>
      </p>
      <p className="mt-2.5 text-[15px] leading-[1.4] text-muted">Seu rebanho avaliado por inteligência artificial</p>
    </div>
  );
}
