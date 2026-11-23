import { safeOrigin } from "@/lib/evaluation/origin";
import { EvaluationFlow } from "./evaluation-flow";

// Fluxo de avaliação (design 1c-1h), fora do grupo (tabs): sem a barra inferior.
export default async function AnalisarPage({ searchParams }: PageProps<"/analisar">) {
  const { de } = await searchParams;
  return <EvaluationFlow origin={safeOrigin(de)} />;
}
