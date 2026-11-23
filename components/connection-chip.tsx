"use client";

import { Icon } from "@/components/icon";
import { useOnline } from "@/lib/hooks/use-online";

// Chip de conexão das telas claras (design 1a/1b); offline é estado normal no campo, então é cinza, não vermelho.
export function ConnectionChip() {
  const online = useOnline();
  return online ? (
    <span
      data-testid="connection-chip"
      className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-3 text-[13px] font-semibold text-primary-dark"
    >
      <span data-testid="online-dot" className="size-2 rounded-full bg-ready" />
      Online
    </span>
  ) : (
    <span
      data-testid="connection-chip"
      className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-disabled px-3 text-[13px] font-semibold text-ink-2"
    >
      <Icon name="cloud_off" size={17} />
      Offline
    </span>
  );
}
