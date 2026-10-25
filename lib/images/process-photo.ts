import sharp from "sharp";

export class NotAnImageError extends Error {}

const FULL_MAX = 2048;
const THUMB_MAX = 320;

/**
 * JPEG de até 2048 px no maior lado, orientação EXIF aplicada e sem metadados, mais uma
 * miniatura WebP de até 320 px. O original é descartado (plan.md, porta 4).
 */
export async function processPhoto(input: Buffer) {
  try {
    await sharp(input).metadata();
  } catch {
    throw new NotAnImageError();
  }

  const full = await sharp(input)
    .autoOrient()
    .resize(FULL_MAX, FULL_MAX, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const thumb = await sharp(input)
    .autoOrient()
    .resize(THUMB_MAX, THUMB_MAX, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();

  return { full: full.data, width: full.info.width, height: full.info.height, thumb };
}
