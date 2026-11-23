import { safeOrigin } from "@/modules/core/navigation/origin";
import { EvaluationFlow } from "@/modules/evaluation/components/evaluation-flow";

// Fluxo de avaliação (design 1c-1h), fora do grupo (tabs): sem a barra inferior.
export default async function AnalisarPage({ searchParams }: PageProps<"/analisar">) {
  const { de } = await searchParams;
  return <EvaluationFlow origin={safeOrigin(de)} />;
}
