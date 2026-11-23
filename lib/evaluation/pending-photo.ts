"use client";

// Foto escolhida na galeria da Home, entregue a /analisar pela navegação do cliente.
// O seletor de arquivos precisa do toque do usuário, então a escolha acontece na Home e não em /analisar.
let pending: File | null = null;

export function setPendingPhoto(file: File) {
  pending = file;
}

export function peekPendingPhoto() {
  return pending;
}

export function clearPendingPhoto() {
  pending = null;
}
