// Para onde "Cancelar" volta: só um caminho deste app. "//host" e "/\host" o navegador lê como outro site,
// e um parâmetro repetido chega como lista.
export function safeOrigin(de: unknown): string {
  return typeof de === "string" && /^\/(?![/\\])/.test(de) ? de : "/";
}
