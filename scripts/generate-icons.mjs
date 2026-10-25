// Gera os ícones da PWA a partir do logo em assets/logo.png: os PNGs do manifest (app/manifest.ts),
// o apple-icon e o favicon. Rodar com `node scripts/generate-icons.mjs` depois de trocar o logo.
import { join } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const WHITE = "#ffffff";

// O logo veio com o xadrez de "transparência" pintado nos pixels (branco ~254 e cinza ~237):
// todo pixel claro e sem cor vira branco, e a borda branca é cortada.
async function cleanLogo() {
  const { data, info } = await sharp(join(root, "assets/logo.png"))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    if (min >= 215 && max - min <= 20) data[i] = data[i + 1] = data[i + 2] = 255;
  }
  return sharp(data, { raw: info }).trim({ background: WHITE, threshold: 10 }).png().toBuffer();
}

// `scale` é a fração do lado ocupada pelo logo, centralizado num quadrado branco.
async function render(logo, size, scale, file) {
  const inner = Math.round(size * scale);
  const resized = await sharp(logo).resize(inner, inner, { fit: "contain", background: WHITE }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: WHITE } })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toFile(join(root, file));
  console.log(`${size}px -> ${file}`);
}

const logo = await cleanLogo();
await render(logo, 192, 0.84, "public/icons/icon-192.png");
await render(logo, 512, 0.84, "public/icons/icon-512.png");
// Maskable: os cantos da moldura ficam dentro da zona segura (círculo de 80% do lado).
await render(logo, 512, 0.56, "public/icons/maskable-512.png");
// O iOS arredonda os cantos sozinho.
await render(logo, 180, 0.78, "app/apple-icon.png");
await render(logo, 256, 0.92, "app/icon.png");
