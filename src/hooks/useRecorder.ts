// src/hooks/useRecorder.ts
import { useState, useRef } from "react";

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const chunksRef = useRef<BlobPart[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.start();
    setRecording(true);
  };

  const stopRecording = async () => {
    return new Promise<Blob>((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) return;

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        setRecording(false);
        resolve(blob);
      };

      recorder.stop();
    });
  };

  return {
    recording,
    startRecording,
    stopRecording,
  };
}
