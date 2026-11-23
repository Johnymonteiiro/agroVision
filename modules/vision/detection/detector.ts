"use client";

import type { FrameDetection } from "./framing";

export type Detector = {
  detect(video: HTMLVideoElement, timestampMs: number): FrameDetection[];
};

/** Detector de foto parada (galeria), em modo imagem (qualidade-imagem, door 3). */
export type ImageDetector = {
  detectImage(image: ImageBitmap): FrameDetection[];
};

declare global {
  interface Window {
    /** Gancho de teste E2E: substitui o detector real (tests/e2e). `detectImage` é opcional. */
    __gadoDetector?: () => Promise<Detector & Partial<ImageDetector>>;
  }
}

const WASM_PATH = "/mediapipe/wasm";
const MODEL_PATH = "/mediapipe/efficientdet_lite0_uint8.tflite";

type MediapipeDetection = {
  categories: { categoryName: string; score: number }[];
  boundingBox?: { originX: number; originY: number; width: number; height: number };
};

function toFrameDetections(detections: MediapipeDetection[]): FrameDetection[] {
  return detections.flatMap((d) => {
    const best = d.categories[0];
    if (!best || !d.boundingBox) return [];
    const { originX, originY, width, height } = d.boundingBox;
    return [{ categoryName: best.categoryName, score: best.score, box: { x: originX, y: originY, width, height } }];
  });
}

async function createMediapipe(runningMode: "VIDEO" | "IMAGE") {
  const { FilesetResolver, ObjectDetector } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
  return ObjectDetector.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_PATH },
    runningMode,
    scoreThreshold: 0.5,
    categoryAllowlist: ["cow"],
  });
}

async function loadMediapipe(): Promise<Detector> {
  const detector = await createMediapipe("VIDEO");
  return {
    detect(video, timestampMs) {
      return toFrameDetections(detector.detectForVideo(video, timestampMs).detections);
    },
  };
}

export function loadDetector(): Promise<Detector> {
  return window.__gadoDetector ? window.__gadoDetector() : loadMediapipe();
}

// Uma instância em modo imagem para o app inteiro: a galeria pode ser usada várias vezes.
let imageDetector: Promise<ImageDetector> | null = null;

export function loadImageDetector(): Promise<ImageDetector> {
  const hook = window.__gadoDetector;
  if (hook) {
    return hook().then((d) => {
      if (!d.detectImage) throw new Error("gancho de teste sem detectImage");
      return { detectImage: (image: ImageBitmap) => d.detectImage!(image) };
    });
  }
  imageDetector ??= createMediapipe("IMAGE")
    .then((detector) => ({ detectImage: (image: ImageBitmap) => toFrameDetections(detector.detect(image).detections) }))
    .catch((error) => {
      imageDetector = null;
      throw error;
    });
  return imageDetector;
}
