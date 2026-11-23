import { Icon } from "@/modules/core/ui/icon";
import { QUALITY_LABEL, type QualityIssue } from "./issues";

// Lista de problemas da foto na revisão e no bloco "Foto do animal" (qualidade-imagem, AC 9 e AC 14).
export function QualityIssues({ issues }: { issues: QualityIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul data-testid="quality-issues" className="flex flex-col gap-1.5 rounded-[12px] bg-warn-soft px-3.5 py-2.5">
      {issues.map((issue) => (
        <li key={issue} data-testid="quality-issue" className="flex items-center gap-2 text-[14px] font-medium text-warn-ink">
          <Icon name="warning" size={18} className="text-warn-dark" />
          {QUALITY_LABEL[issue]}
        </li>
      ))}
    </ul>
  );
}

export function QualityChecking() {
  return (
    <p data-testid="quality-checking" className="flex items-center gap-2 text-[13px] text-muted">
      <Icon name="hourglass_top" size={18} />
      Verificando a foto...
    </p>
  );
}
