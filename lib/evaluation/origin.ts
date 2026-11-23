// Para onde "Cancelar" (ou "Voltar") leva: só um caminho deste app. "//host" e "/\host" o navegador
// lê como outro site, e um parâmetro repetido chega como lista. Fora disso, o destino padrão.
export function safeOrigin(de: unknown, fallback = "/"): string {
  return typeof de === "string" && /^\/(?![/\\])/.test(de) ? de : fallback;
}
