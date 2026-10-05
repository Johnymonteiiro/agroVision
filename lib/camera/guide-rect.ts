const MARGIN = 0.05;

/**
 * Retângulo, em px da tela, do quadro capturado recuado 5% em cada borda.
 * O vídeo é exibido com `object-fit: cover`, então o quadro pode passar das bordas da tela.
 */
export function guideRect(input: { frameWidth: number; frameHeight: number; viewWidth: number; viewHeight: number }) {
  const { frameWidth, frameHeight, viewWidth, viewHeight } = input;
  const scale = Math.max(viewWidth / frameWidth, viewHeight / frameHeight);
  const offsetX = (viewWidth - frameWidth * scale) / 2;
  const offsetY = (viewHeight - frameHeight * scale) / 2;
  return {
    left: offsetX + frameWidth * MARGIN * scale,
    top: offsetY + frameHeight * MARGIN * scale,
    right: offsetX + frameWidth * (1 - MARGIN) * scale,
    bottom: offsetY + frameHeight * (1 - MARGIN) * scale,
  };
}
