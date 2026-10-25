import { Icon } from "@/components/icon";

type ComingSoonProps = {
  title: string;
  icon: string;
  text: string;
};

// Aba da barra inferior cuja feature ainda não existe; a página é trocada quando ela chegar.
export function ComingSoon({ title, icon, text }: ComingSoonProps) {
  return (
    <main className="mx-auto w-full max-w-[480px] pb-10">
      <header className="px-5 pt-6">
        <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.02em]">{title}</h1>
      </header>
      <section className="mx-4 mt-6 flex flex-col items-center rounded-card-lg bg-white px-5 py-6 text-center shadow-[0_0_0_1px_rgba(0,0,0,.06)]">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon name={icon} size={30} />
        </div>
        <p className="mt-3.5 text-[17px] font-semibold">Em breve</p>
        <p className="mt-1 text-[14px] leading-[1.4] text-muted">{text}</p>
      </section>
    </main>
  );
}
