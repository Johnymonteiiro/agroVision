import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

export const COW_Y4M = path.join(process.cwd(), "test-results", "fixtures", "cow-side.y4m");

/** Converte a foto de referência num vídeo Y4M de 1 quadro (640x480, I420) para a câmera falsa do Chromium. */
async function writeCowY4m() {
  const W = 640;
  const H = 480;
  const rgb = await sharp(path.join(process.cwd(), "tests", "fixtures", "cow-side.jpg"))
    .resize(W, H, { fit: "contain", background: { r: 255, g: 255, b: 255 } })
    .removeAlpha()
    .raw()
    .toBuffer();

  const y = Buffer.alloc(W * H);
  const u = Buffer.alloc((W / 2) * (H / 2));
  const v = Buffer.alloc((W / 2) * (H / 2));
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  for (let row = 0; row < H; row++) {
    for (let col = 0; col < W; col++) {
      const i = (row * W + col) * 3;
      y[row * W + col] = clamp(0.299 * rgb[i] + 0.587 * rgb[i + 1] + 0.114 * rgb[i + 2]);
    }
  }
  for (let row = 0; row < H; row += 2) {
    for (let col = 0; col < W; col += 2) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (const [dr, dc] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
        const i = ((row + dr) * W + (col + dc)) * 3;
        r += rgb[i];
        g += rgb[i + 1];
        b += rgb[i + 2];
      }
      r /= 4;
      g /= 4;
      b /= 4;
      const k = (row / 2) * (W / 2) + col / 2;
      u[k] = clamp(128 - 0.168736 * r - 0.331264 * g + 0.5 * b);
      v[k] = clamp(128 + 0.5 * r - 0.418688 * g - 0.081312 * b);
    }
  }

  mkdirSync(path.dirname(COW_Y4M), { recursive: true });
  const header = Buffer.from(`YUV4MPEG2 W${W} H${H} F30:1 Ip A1:1 C420jpeg\nFRAME\n`, "ascii");
  writeFileSync(COW_Y4M, Buffer.concat([header, y, u, v]));
}

export default async function globalSetup() {
  await writeCowY4m();
}
