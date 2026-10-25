import { TabBar } from "@/components/tab-bar";

// Telas de topo, com a barra inferior. Cadastro, perfil e câmera ficam fora deste grupo e não a mostram.
// O espaço embaixo (altura da barra: 8 + 50 + área segura) impede que ela cubra o fim da página.
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-1 flex-col pb-[calc(58px+max(8px,env(safe-area-inset-bottom)))]">{children}</div>
      <TabBar />
    </>
  );
}
