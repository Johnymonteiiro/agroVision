import { describe, expect, it } from "vitest";
import { guideRect } from "@/lib/camera/guide-rect";

describe("moldura da camera", () => {
  it("moldura recuada 5 por cento: quadro 1000x750 em 1000x750 px", () => {
    expect(guideRect({ frameWidth: 1000, frameHeight: 750, viewWidth: 1000, viewHeight: 750 })).toEqual({
      left: 50,
      top: 37.5,
      right: 950,
      bottom: 712.5,
    });
  });
});
