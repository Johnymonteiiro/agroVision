"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { POSITION_LABEL, photoCountLabel } from "@/lib/animals/format";
import { loadDetector, type Detector } from "@/lib/camera/detector";
import { FRAMING_UI, classifyFraming, type Framing } from "@/lib/camera/framing";
import { guideRect } from "@/lib/camera/guide-rect";
import { DEFAULT_HFOV_DEG, formatDistance, minDistance, roundUpDistance, type Position } from "@/lib/camera/min-distance";
import { useOnline } from "@/lib/hooks/use-online";

type Props = { animalId: string; weightKg: number; position: Position; initialCount: number };
type StreamState = "starting" | "live" | "denied" | "error";
type DetectorState = "loading" | "ready" | "failed";
type Captured = { blob: Blob; url: string; framing: Framing; capturedAt: string; minDistanceM: number };

const FIRST_TIP: Record<Position, string> = {
  REAR: "Fotografe por trás",
  TOP: "Fotografe de cima",
  SIDE: "Fotografe de lado",
};
const DETECT_INTERVAL_MS = 200;

export function CameraCapture({ animalId, weightKg, position, initialCount }: Props) {
  const online = useOnline();
  const videoRef = useRef<HTMLVideoElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const framingRef = useRef<Framing>("NOT_DETECTED");

  const [stream, setStream] = useState<StreamState>("starting");
  const [detector, setDetector] = useState<DetectorState>("loading");
  const [framing, setFraming] = useState<Framing>("NOT_DETECTED");
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null);
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [count, setCount] = useState(initialCount);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [showTips, setShowTips] = useState(true);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({
        // 4:3 é o formato nativo do sensor do celular; 16:9 recortaria o campo de visão vertical.
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      })
      .then(async (media) => {
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = media;
        const video = videoRef.current;
        if (video) {
          video.srcObject = media;
          await video.play().catch(() => {});
        }
        setStream("live");
      })
      .catch((error) => {
        if (!cancelled) setStream((error as DOMException)?.name === "NotAllowedError" ? "denied" : "error");
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [attempt]);

  function retryCamera() {
    setStream("starting");
    setAttempt((n) => n + 1);
  }

  useEffect(() => {
    let cancelled = false;
    loadDetector()
      .then((d) => {
        if (cancelled) return;
        detectorRef.current = d;
        setDetector("ready");
      })
      .catch((error) => {
        console.error("detector de enquadramento indisponível", error);
        if (!cancelled) setDetector("failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setArea({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (detector !== "ready" || stream !== "live" || captured) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const video = videoRef.current;
      const d = detectorRef.current;
      if (video && d && video.readyState >= 2 && now - last >= DETECT_INTERVAL_MS) {
        last = now;
        try {
          const next = classifyFraming(d.detect(video, now), video.videoWidth, video.videoHeight);
          framingRef.current = next;
          setFraming(next);
        } catch (error) {
          console.error("falha na detecção", error);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [detector, stream, captured]);

  const shownFraming: Framing | null =
    detector === "failed" ? "UNAVAILABLE" : detector === "loading" ? null : framing;
  const ui = shownFraming ? FRAMING_UI[shownFraming] : null;
  const cornerColor = ui?.color ?? "#FFFFFF";
  const distance = frame ? minDistance({ position, weightKg, frameWidth: frame.w, frameHeight: frame.h, hfovDeg: DEFAULT_HFOV_DEG }) : null;
  const rect = frame && area ? guideRect({ frameWidth: frame.w, frameHeight: frame.h, viewWidth: area.w, viewHeight: area.h }) : null;

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || distance === null) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const framingAtCapture: Framing =
      detector === "ready" ? framingRef.current : "UNAVAILABLE";
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setUploadError(false);
        setCaptured({
          blob,
          url: URL.createObjectURL(blob),
          framing: framingAtCapture,
          capturedAt: new Date().toISOString(),
          minDistanceM: roundUpDistance(distance),
        });
      },
      "image/jpeg",
      0.92,
    );
  }

  function discard() {
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
  }

  async function sendPhoto() {
    if (!captured) return;
    setUploading(true);
    setUploadError(false);
    try {
      const form = new FormData();
      form.set("file", captured.blob, "foto.jpg");
      form.set("imageId", crypto.randomUUID());
      form.set("position", position);
      form.set("framing", captured.framing);
      form.set("minDistanceM", String(captured.minDistanceM));
      form.set("capturedAt", captured.capturedAt);
      const res = await fetch(`/api/animals/${animalId}/images`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`upload ${res.status}`);
      setCount((n) => n + 1);
      discard();
    } catch (error) {
      console.error("envio da foto falhou", error);
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  }

  const tips = [FIRST_TIP[position], "Boa iluminação", "Só um animal", "Corpo inteiro"];
  const tipIcons = ["swap_horiz", "wb_sunny", "filter_1", "open_in_full"];

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-camera text-white" data-testid="camera-screen">
      <div className="relative z-10 flex items-center justify-between px-4 pt-3" data-testid="camera-top">
        <Link
          href={`/animais/${animalId}`}
          className="flex h-11 items-center gap-1.5 rounded-full bg-white/15 pl-3 pr-4 text-[15px] font-semibold"
        >
          <Icon name="close" size={22} />
          Cancelar
        </Link>
        {online ? (
          <span className="flex h-8 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-[12px] font-medium" data-testid="connection-chip">
            <span className="size-2 rounded-full bg-guide" />
            Online
          </span>
        ) : (
          <span className="flex h-8 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-[12px] font-medium" data-testid="connection-chip">
            <Icon name="cloud_off" size={16} />
            Offline
          </span>
        )}
      </div>

      <p className="relative z-10 mx-6 mt-5 text-balance text-center text-[18px] font-semibold leading-[1.3]">
        Posicione o animal inteiro dentro da área
      </p>
      <div className="relative z-10 mt-2 flex items-center justify-center gap-2 text-[13px] font-medium">
        <span className="rounded-full bg-white/15 px-2.5 py-1" data-testid="camera-position">
          {POSITION_LABEL[position]}
        </span>
        <span className="rounded-full bg-white/15 px-2.5 py-1" data-testid="min-distance">
          {distance === null ? "Distância mínima: —" : `Distância mínima: ${formatDistance(distance)}`}
        </span>
      </div>

      <div ref={areaRef} className="relative mt-3 flex-1" data-testid="camera-area">
        <video
          ref={videoRef}
          muted
          playsInline
          onLoadedMetadata={(e) => setFrame({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight })}
          className="absolute inset-0 size-full object-contain"
        />
        {rect && stream === "live" && (
          <div
            data-testid="guide-frame"
            data-color={cornerColor}
            className="pointer-events-none absolute"
            style={{ left: rect.left, top: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top }}
          >
            {(["tl", "tr", "bl", "br"] as const).map((c) => (
              <span
                key={c}
                data-testid="guide-corner"
                className="absolute size-9"
                style={{
                  borderColor: cornerColor,
                  borderStyle: "solid",
                  borderWidth: 0,
                  [c[0] === "t" ? "top" : "bottom"]: -2,
                  [c[1] === "l" ? "left" : "right"]: -2,
                  [c[0] === "t" ? "borderTopWidth" : "borderBottomWidth"]: 4,
                  [c[1] === "l" ? "borderLeftWidth" : "borderRightWidth"]: 4,
                  [`border${c[0] === "t" ? "Top" : "Bottom"}${c[1] === "l" ? "Left" : "Right"}Radius`]: 18,
                }}
              />
            ))}
          </div>
        )}
        {stream === "live" && (
          <div className="absolute inset-x-0 top-2 flex justify-center">
            <span
              data-testid="framing-status"
              data-framing={shownFraming ?? "LOADING"}
              className="rounded-full bg-black/45 px-3 py-1.5 text-[14px] font-semibold"
              style={{ color: shownFraming === "FRAMED" ? "#7FD1A3" : shownFraming === "OUT_OF_FRAME" || shownFraming === "TOO_FAR" ? "#E8A93A" : "#FFFFFF" }}
            >
              {ui ? ui.label : "Carregando guia de enquadramento..."}
            </span>
          </div>
        )}
        {(stream === "denied" || stream === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <Icon name="no_photography" size={40} />
            <p className="text-[16px] font-medium">
              {stream === "denied"
                ? "Permita o acesso à câmera nas configurações do navegador"
                : "Não foi possível abrir a câmera"}
            </p>
            <button
              type="button"
              onClick={retryCamera}
              className="flex h-12 items-center rounded-[12px] bg-white/15 px-5 text-[15px] font-semibold"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      {showTips && (
        <ul className="relative z-10 mx-4 mt-3 grid grid-cols-2 gap-2" data-testid="tips">
          {tips.map((tip, i) => (
            <li key={tip} className="flex items-center gap-2 rounded-[12px] bg-white/10 px-2.5 py-[9px] text-[13px] font-medium leading-[1.25]">
              <Icon name={tipIcons[i]} size={18} className="text-guide" />
              <span data-testid="tip-text">{tip}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center px-7 pb-12 pt-5" data-testid="camera-controls">
        <div className="flex flex-col items-start gap-1.5">
          <div className="flex size-14 items-center justify-center rounded-[14px] bg-white/15 text-[20px] font-bold" data-testid="photo-counter">
            {count}
          </div>
          <span className="text-[12px] font-medium text-white/80" data-testid="photo-counter-label">
            {photoCountLabel(count)}
          </span>
        </div>
        <button
          type="button"
          aria-label="Tirar foto"
          data-testid="shutter"
          disabled={stream !== "live" || !frame}
          onClick={capture}
          className="flex size-[88px] items-center justify-center rounded-full border-4 border-white disabled:opacity-50"
        >
          <span className="size-[70px] rounded-full bg-white" />
        </button>
        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            aria-label="Dicas"
            aria-pressed={showTips}
            onClick={() => setShowTips((v) => !v)}
            className="flex size-14 items-center justify-center rounded-full bg-white/15"
          >
            <Icon name="help" />
          </button>
          <span className="text-[12px] font-medium text-white/80">Dicas</span>
        </div>
      </div>

      {captured && (
        <section className="absolute inset-0 z-20 bg-camera" data-testid="review">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={captured.url} alt="Foto capturada" data-testid="review-photo" className="h-[66%] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 rounded-t-[24px] bg-white px-5 pb-[34px] pt-6 text-ink">
            <h2 className="mb-1 text-[22px] font-bold leading-[1.25] tracking-[-0.01em]">Esta foto está boa para o dataset?</h2>
            <p className="flex items-center gap-2 text-[14px] text-muted" data-testid="review-info">
              <span className="font-semibold text-ink-2">{POSITION_LABEL[position]}</span>·
              <span>{FRAMING_UI[captured.framing].label}</span>
            </p>
            <button
              type="button"
              data-primary-action
              disabled={!online || uploading}
              onClick={sendPhoto}
              className={`flex h-[60px] items-center justify-center gap-2.5 rounded-btn text-[18px] font-semibold ${
                online && !uploading ? "bg-primary text-white" : "bg-disabled text-faint"
              }`}
            >
              <Icon name="check" />
              {uploading ? "Enviando..." : "Usar foto"}
            </button>
            <button
              type="button"
              data-primary-action
              onClick={discard}
              className="flex h-14 items-center justify-center gap-2.5 rounded-btn bg-primary-soft text-[17px] font-semibold text-primary-dark"
            >
              <Icon name="replay" size={22} />
              Tirar outra foto
            </button>
            {!online && (
              <p className="flex items-center gap-2 text-[13px] text-muted">
                <Icon name="cloud_off" size={18} />
                Sem internet — conecte-se para enviar.
              </p>
            )}
            {uploadError && (
              <p role="alert" className="flex items-center gap-2 text-[13px] font-medium text-error">
                <Icon name="error" size={18} />
                Não foi possível enviar a foto. Tente de novo.
              </p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
