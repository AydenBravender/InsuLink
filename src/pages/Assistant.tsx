import { useEffect, useState } from "react";
import { useRecorder } from "../hooks/useRecorder";
import Orb from "../components/Orb";
import Dial from "../components/Dial";
import Navbar from "../components/Navbar";
export default function Assistant() {
  const { recording, interim, finalText, startRecording, stopRecording } =
    useRecorder();

  const [audioDetected, setAudioDetected] = useState(false);

  useEffect(() => {
    if (!recording) {
      setAudioDetected(false);
      return;
    }

    let audioCtx: AudioContext;
    let analyser: AnalyserNode;
    let source: MediaStreamAudioSourceNode;
    let animationId: number;

    const detectAudio = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new AudioContext();
      analyser = audioCtx.createAnalyser();
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioDetected(avg > 5); // simple threshold
        animationId = requestAnimationFrame(checkAudio);
      };
      checkAudio();
    };

    detectAudio();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      audioCtx?.close();
      setAudioDetected(false);
    };
  }, [recording]);

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-6">
			<Navbar/>
      <Orb recording={recording} volume={audioDetected ? 0.7 : 0} />


      <div className="flex gap-4">
        <button
          onClick={startRecording}
          className="btn btn-accent"
        >
          Start
        </button>
        <button
          onClick={stopRecording}
          className="btn btn-primary"
        >
          Stop
        </button>
      </div>

      <div className="w-full max-w-lg  p-4 rounded shadow flex flex-col gap-2">
        <p className="text-gray-500 italic">{interim || "Listening..."}</p>
        <p>{finalText}</p>
        <p className="text-sm text-gray-700">
          Audio detected: {audioDetected ? "Yes" : "No"}
        </p>
      </div>
			<Dial />
    </div>
  );
}
