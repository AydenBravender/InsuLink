// src/hooks/useRecorder.ts
import { useEffect, useRef, useState } from "react";

export function useRecorder(opts?: { autoStopSilenceMs?: number; threshold?: number }) {
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastAboveRef = useRef<number>(0);

  const autoStopMs = opts?.autoStopSilenceMs ?? 1400;
  const threshold = opts?.threshold ?? 0.01;

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const analyser = analyserRef.current;
      const mr = mediaRecorderRef.current;
      if (recording && analyser && mr) {
        const arr = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(arr);
        const rms = Math.sqrt(arr.reduce((s, v) => s + v * v, 0) / arr.length);
        const now = performance.now();
        if (rms > threshold) {
          lastAboveRef.current = now;
        } else if (now - lastAboveRef.current > autoStopMs) {
          stopRecording(); // auto stop after silence
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [recording]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const mr = new MediaRecorder(stream, { mimeType: mime });

    chunksRef.current = [];
    mr.ondataavailable = function (this: MediaRecorder, e: BlobEvent) {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = function (this: MediaRecorder) {
      stream.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
    };

    // analyser for silence detection
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    lastAboveRef.current = performance.now();

    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
  };

  const stopRecording = async (): Promise<Blob> => {
    const mr = mediaRecorderRef.current;
    if (!mr) return new Blob([], { type: "audio/webm" });

    const stopped = new Promise<void>((resolve) => {
      const handler = () => resolve();
      mr.addEventListener("stop", handler as EventListener, { once: true });
    });

    mr.stop();
    await stopped;
    setRecording(false);

    const out = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    return out;
  };

  return { recording, startRecording, stopRecording };
}
