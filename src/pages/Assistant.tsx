// src/pages/Questionnaire.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getQuestions,
  ttsSpeak,
  transcribeAudio,
  analyzeAnswers
} from "../lib/api";
import { useRecorder } from "../hooks/useRecorder";
import { useNavigate } from "react-router-dom";
import Dial from "../components/Dial";
import Orb from "../components/Orb";
import Navbar from "../components/Navbar";

type Bank = { med: string[]; food: string[]; sleep: string[] };
type Item = { cat: "med" | "food" | "sleep"; text: string };

export default function Questionnaire() {
  const navigate = useNavigate();
  const { recording, volume, startRecording, stopRecording } = useRecorder({
    autoStopSilenceMs: 1400,
    threshold: 0.01
  });

  const [bank, setBank] = useState<Bank | null>(null);
  const [queue, setQueue] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [display, setDisplay] = useState("");
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState<{
    med: string[];
    food: string[];
    sleep: string[];
  }>({
    med: [],
    food: [],
    sleep: []
  });
  const [loading, setLoading] = useState(false);

  // Load questions
  useEffect(() => {
    (async () => {
      const { questions } = await getQuestions();
      setBank(questions);
    })();
  }, []);

  // Build & shuffle question queue
  const shuffled: Item[] = useMemo(() => {
    if (!bank) return [];
    const items: Item[] = [
      ...bank.med.map((t) => ({ cat: "med" as const, text: t })),
      ...bank.food.map((t) => ({ cat: "food" as const, text: t })),
      ...bank.sleep.map((t) => ({ cat: "sleep" as const, text: t }))
    ];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [bank]);

  useEffect(() => {
    if (shuffled.length) setQueue(shuffled);
  }, [shuffled]);

  // Typewriter + TTS when question changes
  useEffect(() => {
    if (!queue.length) return;
    const q = queue[idx]?.text ?? "";
    setDisplay("");
    setTranscript("");

    let i = 0;
    const timer = setInterval(() => {
      setDisplay(q.slice(0, i));
      i++;
      if (i > q.length) {
        clearInterval(timer);
        ttsSpeak(q).then((url) => new Audio(url).play());
      }
    }, 18);

    return () => clearInterval(timer);
  }, [queue, idx]);

  // Handlers
  const onStart = async () => await startRecording();

  const onStop = async () => {
    const blob = await stopRecording();
    const { text } = await transcribeAudio(blob);
    setTranscript(text);
  };

  const onNext = async () => {
    const cat = queue[idx].cat;
    const nextAnswers = {
      ...answers,
      [cat]: [...answers[cat], transcript || ""]
    };
    setAnswers(nextAnswers);
    setTranscript("");

    if (idx < queue.length - 1) {
      setIdx((x) => x + 1);
    } else {
      setLoading(true);
      try {
        const result = await analyzeAnswers(nextAnswers);
        navigate("/results", { state: result });
      } catch (e) {
        console.error("[ui] analyze error", e);
        alert("Sorry, analyzing failed. Check the server logs.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!queue.length) {
    return (
      <div className="min-h-screen grid place-items-center text-lg">
        Loading questions…
      </div>
    );
  }

  const progress = Math.round(((idx + 1) / queue.length) * 100);

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col items-center p-6 gap-6">
      <Navbar />
      <span className="text-white font-bold text-4xl mb-5">InsuLink Assistant</span>
      {/* Question card */}
      <div className="w-full max-w-2xl card bg-base-200 shadow-xl p-6 flex flex-col gap-4">
        {/* Header & progress */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">
            Question {idx + 1} of {queue.length}
          </h1>
          <progress
            className="progress progress-primary w-40"
            value={progress}
            max={100}
          />
        </div>

        {/* Question display */}
        <p className="text-lg mb-4">{display}</p>
        {/* Orb centered above the card */}
        <div className="flex justify-center w-full">
          <Orb recording={recording} volume={volume} />
        </div>
        {/* Buttons */}
        <div className="justify-center flex gap-3">
          <button
            className="btn btn-accent"
            disabled={recording}
            onClick={onStart}
          >
            Start Recording
          </button>
          <button
            className="btn btn-primary"
            disabled={!recording}
            onClick={onStop}
          >
            Done Speaking
          </button>
          <button className="btn" disabled={!transcript} onClick={onNext}>
            Next
          </button>
        </div>

        {/* Transcript display */}
        {transcript && (
          <div className="mt-4 p-3 bg-base-300 rounded-2xl">
            <div className="text-xs opacity-70 mb-1">Your answer</div>
            <div>{transcript}</div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-6 text-lg animate-pulse">
          Analyzing your answers…
        </div>
      )}

      <Dial />
    </div>
  );
}
