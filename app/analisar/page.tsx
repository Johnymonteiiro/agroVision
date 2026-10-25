import { EvaluationFlow } from "./evaluation-flow";

// Fluxo de avaliação (design 1c-1h), fora do grupo (tabs): sem a barra inferior.
export default async function AnalisarPage({ searchParams }: PageProps<"/analisar">) {
  const { de } = await searchParams;
  // "Cancelar" só volta para um caminho deste app: "//host" ou "/\host" levariam a outro site.
  const origin = typeof de === "string" && /^\/(?![/\\])/.test(de) ? de : "/";
  return <EvaluationFlow origin={origin} />;
}
