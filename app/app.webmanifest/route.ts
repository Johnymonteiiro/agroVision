import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Servido por rota, e não por app/manifest.ts, para o <link> do layout poder pedir o manifest com cookies
// (crossOrigin="use-credentials"): sem cookie, o túnel gratuito do ngrok devolve a página de aviso no lugar do JSON.
// `id` e `scope` identificam a instalação: mudar depois deixa os apps já instalados órfãos.
const manifest: MetadataRoute.Manifest = {
  id: "/",
  name: "AgroVision",
  short_name: "AgroVision",
  description: "Cadastro de bovinos e fotos para o dataset",
  lang: "pt-BR",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#F6F8F7",
  theme_color: "#1F6B45",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

export function GET() {
  return Response.json(manifest, { headers: { "Content-Type": "application/manifest+json" } });
}
