// src/hooks/useRecorder.ts
import { useRef, useState } from "react";

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const srRef = useRef<any>(null);

  const startSR = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      const rec = new SR();
      rec.lang = "en-US";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e: any) => {
        let interimLocal = "";
        let finalLocal = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalLocal += r[0].transcript;
          else interimLocal += r[0].transcript;
        }
        setInterim(interimLocal);
        if (finalLocal) setFinalText((prev) => (prev + " " + finalLocal).trim());
      };
      rec.onerror = () => {};
      rec.onend = () => {};
      rec.start();
      srRef.current = rec;
    } catch {
      // no-op
    }
  };

  const stopSR = () => {
    try {
      srRef.current?.stop();
    } catch {}
    srRef.current = null;
  };

  const startRecording = async () => {
    setInterim("");
    setFinalText("");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";

    const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);

    chunksRef.current = [];

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = function () {
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorderRef.current = mr;
    startSR();
    mr.start();
    setRecording(true);
  };

  const stopRecording = async (): Promise<Blob> => {
    stopSR();
    const mr = mediaRecorderRef.current;
    if (!mr) return new Blob([], { type: "audio/webm" });

    const stopped = new Promise<void>((resolve) => {
      const prev = mr.onstop;
      mr.onstop = function (this: MediaRecorder, ev: Event) {
        if (prev) prev.call(this, ev);
        resolve();
      };
    });

    mr.stop();
    await stopped;

    setRecording(false);

    const blob = new Blob(chunksRef.current, {
      type: mr.mimeType || "audio/webm",
    });

    chunksRef.current = [];
    mediaRecorderRef.current = null;

    return blob;
  };

  return {
    recording,
    interim,
    finalText,
    startRecording,
    stopRecording,
  };
}

