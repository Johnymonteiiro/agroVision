"use client";

import { useSyncExternalStore } from "react";

// `beforeinstallprompt` só existe nos navegadores Chromium; o Safari do iOS instala pelo menu Compartilhar.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
let dismissed = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((onChange) => onChange());
}

// O evento pode chegar antes de o banner montar, então é capturado quando o módulo carrega.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

const STANDALONE = "(display-mode: standalone)";

function subscribeStandalone(onChange: () => void) {
  const query = window.matchMedia(STANDALONE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function isStandalone() {
  return window.matchMedia(STANDALONE).matches || (navigator as { standalone?: boolean }).standalone === true;
}

function isIOS() {
  const ua = navigator.userAgent;
  // O iPadOS se apresenta como Mac; a tela de toque o denuncia.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function noSubscribe() {
  return () => {};
}

export async function installApp() {
  const event = deferred;
  if (!event) return;
  await event.prompt();
  await event.userChoice;
  // O mesmo evento não pode chamar prompt() duas vezes.
  deferred = null;
  emit();
}

export function dismissInstall() {
  dismissed = true;
  emit();
}

export function useInstallPrompt() {
  const canPrompt = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  const hidden = useSyncExternalStore(subscribe, () => dismissed, () => true);
  // No servidor o app é tratado como instalado, para o banner não piscar antes da hidratação.
  const standalone = useSyncExternalStore(subscribeStandalone, isStandalone, () => true);
  const ios = useSyncExternalStore(noSubscribe, isIOS, () => false);
  return { canPrompt, ios, visible: !hidden && !standalone && (canPrompt || ios) };
}
