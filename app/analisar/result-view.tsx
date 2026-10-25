import Link from "next/link";
import { Icon } from "@/components/icon";
import type { ModelInfo, Probabilities } from "@/lib/evaluation/classifier";
import { confidencePercent, decide, type Decision } from "@/lib/evaluation/decision";
import { formatResultDate } from "@/lib/evaluation/result-date";

// Leitura em três camadas (design 1f-1h): cor do bloco, palavra, número. Nunca só pela cor.
const LOOK: Record<Decision, { label: string; icon: string; block: string; fill: string }> = {
  READY: { label: "PRONTO PARA ABATE", icon: "check_circle", block: "bg-ready text-white text-[20px]", fill: "bg-ready" },
  NOT_READY: { label: "NÃO PRONTO PARA ABATE", icon: "cancel", block: "bg-not-ready text-white text-[19px]", fill: "bg-not-ready" },
  INCONCLUSIVE: { label: "RESULTADO INCONCLUSIVO", icon: "help", block: "bg-warn text-warn-ink text-[19px]", fill: "bg-warn" },
};

const INCONCLUSIVE_TIPS = [
  { icon: "open_in_full", text: "Tire outra foto com o animal inteiro visível." },
  { icon: "wb_shade", text: "Evite sombras fortes." },
  { icon: "swap_horiz", text: "Fotografe o animal lateralmente." },
];

type Props = { url: string; model: ModelInfo; probs: Probabilities; at: Date; onAgain: () => void };

export function ResultView({ url, model, probs, at, onAgain }: Props) {
  const decision = decide(probs, model.threshold);
  const confidence = confidencePercent(probs);
  const look = LOOK[decision];
  const inconclusive = decision === "INCONCLUSIVE";
  const minimum = Math.round(model.threshold.READY * 100);

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pb-[34px]">
      <div className={`relative ${inconclusive ? "h-[230px]" : "h-[270px]"} bg-line-soft`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Foto analisada" data-testid="result-photo" className="size-full object-cover" />
        <Link
          href="/"
          aria-label="Fechar"
          className="absolute left-4 top-3 flex size-11 items-center justify-center rounded-full bg-white/90"
        >
          <Icon name="close" />
        </Link>
      </div>

      <section className="relative mx-3 -mt-[38px] flex flex-1 flex-col rounded-card-lg bg-white p-4 shadow-[0_1px_2px_rgba(23,33,28,.04),0_8px_24px_rgba(23,33,28,.06)]">
        <div
          data-testid="decision-block"
          className={`flex h-16 items-center justify-center gap-2.5 rounded-btn font-bold tracking-[0.02em] ${look.block}`}
        >
          <Icon name={look.icon} size={30} fill />
          {look.label}
        </div>

        <div className="px-1 pt-[18px]">
          <p data-testid="confidence" className="flex items-baseline gap-2">
            <span className={`${inconclusive ? "text-[34px]" : "text-[40px]"} font-bold leading-none tracking-[-0.03em]`}>
              {confidence}%
            </span>
            <span className="text-[15px] font-medium text-muted">de confiança</span>
          </p>
          <div className="relative mt-3 h-2.5 rounded-[5px] bg-track">
            <div
              data-testid="confidence-fill"
              className={`absolute inset-y-0 left-0 rounded-[5px] ${look.fill}`}
              style={{ width: `${confidence}%` }}
            />
            {inconclusive && (
              <div
                data-testid="threshold-mark"
                className="absolute -inset-y-1 w-0.5 rounded-[1px] bg-ink"
                style={{ left: `${minimum}%` }}
              />
            )}
          </div>
          {inconclusive && (
            <p className="mt-1.5 pr-[8%] text-right font-mono text-[11px] font-medium text-muted">mínimo {minimum}%</p>
          )}
        </div>

        {inconclusive && (
          <>
            <p className="mt-2 text-pretty text-[15px] font-medium leading-[1.45]">
              A IA não conseguiu determinar o resultado com confiança suficiente. Uma nova foto costuma resolver.
            </p>
            <ul data-testid="inconclusive-tips" className="mt-3 flex flex-col gap-2.5 rounded-btn bg-warn-soft px-3.5 py-3">
              {INCONCLUSIVE_TIPS.map((tip) => (
                <li key={tip.text} className="flex items-center gap-2.5 text-[14px] font-medium leading-[1.3]">
                  <Icon name={tip.icon} size={20} className="text-warn-dark" />
                  <span data-testid="inconclusive-tip">{tip.text}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <dl className="mt-4 border-t border-line-soft">
          <div data-testid="result-model" className="flex h-[42px] items-center justify-between border-b border-line-soft text-[15px]">
            <dt className="text-muted">Modelo</dt>
            <dd className="font-medium">
              {model.name} v{model.version}
            </dd>
          </div>
          <div data-testid="result-date" className="flex h-[42px] items-center justify-between text-[15px]">
            <dt className="text-muted">Data</dt>
            <dd className="font-medium">{formatResultDate(at)}</dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-col gap-2.5 pt-4">
          <button
            type="button"
            data-primary-action
            onClick={onAgain}
            className="flex h-[58px] items-center justify-center gap-2.5 rounded-btn bg-primary text-[18px] font-semibold text-white"
          >
            <Icon name="photo_camera" />
            {inconclusive ? "Tirar outra foto" : "Nova avaliação"}
          </button>
          <p className="mt-0.5 text-center text-[12px] leading-[1.4] text-muted">
            Este resultado é uma estimativa gerada pelo modelo de IA.
          </p>
        </div>
      </section>
    </main>
  );
}
