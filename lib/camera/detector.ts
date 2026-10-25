"use client";

import type { FrameDetection } from "./framing";

export type Detector = {
  detect(video: HTMLVideoElement, timestampMs: number): FrameDetection[];
};

declare global {
  interface Window {
    /** Gancho de teste E2E: substitui o detector real (tests/e2e). */
    __gadoDetector?: () => Promise<Detector>;
  }
}

const WASM_PATH = "/mediapipe/wasm";
const MODEL_PATH = "/mediapipe/efficientdet_lite0_uint8.tflite";

async function loadMediapipe(): Promise<Detector> {
  const { FilesetResolver, ObjectDetector } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
  const detector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_PATH },
    runningMode: "VIDEO",
    scoreThreshold: 0.5,
    categoryAllowlist: ["cow"],
  });
  return {
    detect(video, timestampMs) {
      const result = detector.detectForVideo(video, timestampMs);
      return result.detections.flatMap((d) => {
        const best = d.categories[0];
        if (!best || !d.boundingBox) return [];
        const { originX, originY, width, height } = d.boundingBox;
        return [{ categoryName: best.categoryName, score: best.score, box: { x: originX, y: originY, width, height } }];
      });
    },
  };
}

export function loadDetector(): Promise<Detector> {
  return window.__gadoDetector ? window.__gadoDetector() : loadMediapipe();
}
