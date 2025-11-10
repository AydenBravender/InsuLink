// src/pages/Questionnaire.tsx
import { useEffect, useMemo, useState } from "react";
import { getQuestions, transcribeAudio, analyzeAnswers } from "../lib/api";
import { useRecorder } from "../hooks/useRecorder";
import { useNavigate } from "react-router-dom";

import Dial from "../components/Dial";
import Orb from "../components/Orb";
import Navbar from "../components/Navbar";

// ---------------------------
// Types
// ---------------------------
type Bank = { med: string[]; food: string[]; sleep: string[] };
type Item = { cat: "med" | "food" | "sleep"; text: string };

// ---------------------------
// Browser TTS
// ---------------------------
function speak(text: string) {
  if (!window.speechSynthesis) {
    console.error("Speech synthesis not supported.");
    return;
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.pitch = 1;
  utter.rate = 1;
  utter.volume = 1;

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return false;

    const microsoft = voices.find((v) => v.name.includes("Microsoft"));
    const fallback = voices.find((v) => v.default) || voices[0];

    utter.voice = microsoft || fallback;
    window.speechSynthesis.speak(utter);
    return true;
  };

  if (!loadVoices()) {
    window.speechSynthesis.onvoiceschanged = () => loadVoices();
  }
}

// ---------------------------
// Component
// ---------------------------
export default function Questionnaire() {
  const navigate = useNavigate();

  const { recording, volume, startRecording, stopRecording } = useRecorder({
    autoStopSilenceMs: 1400,
    threshold: 0.01,
  });

  // ---------------------------
  // State
  // ---------------------------
  const [bank, setBank] = useState<Bank | null>(null);
  const [queue, setQueue] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [display, setDisplay] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);

  const [answers, setAnswers] = useState<{
    med: string[];
    food: string[];
    sleep: string[];
  }>({
    med: [],
    food: [],
    sleep: [],
  });

  // ---------------------------
  // Load Questions
  // ---------------------------
  useEffect(() => {
    (async () => {
      const { questions } = await getQuestions();
      setBank(questions);
    })();
  }, []);

  // ---------------------------
  // Build Shuffled Queue
  // ---------------------------
  const shuffled: Item[] = useMemo(() => {
  if (!bank) return [];

  const items: Item[] = [
    ...bank.med.map((t) => ({ cat: "med" as const, text: t })),
    ...bank.food.map((t) => ({ cat: "food" as const, text: t })),
    ...bank.sleep.map((t) => ({ cat: "sleep" as const, text: t })),
  ];

  // Fisher–Yates shuffle
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}, [bank]);

  useEffect(() => {
    if (shuffled.length) setQueue(shuffled);
  }, [shuffled]);

  // ---------------------------
  // Typewriter + Speak When Question Changes
  // ---------------------------
  useEffect(() => {
    if (!queue.length) return;

    const q = queue[idx]?.text || "";
    setDisplay("");
    setTranscript("");

    let i = 0;
    const timer = setInterval(() => {
      setDisplay(q.slice(0, i));
      i++;

      if (i > q.length) {
        clearInterval(timer);
        speak(q);
      }
    }, 18);

    return () => clearInterval(timer);
  }, [idx, queue]);

  // ---------------------------
  // Handlers
  // ---------------------------
  const onStart = () => startRecording();

  const onStop = async () => {
    const blob = await stopRecording();
    const { text } = await transcribeAudio(blob);
    setTranscript(text);
  };

  const onNext = async () => {
    const category = queue[idx].cat;

    const updated = {
      ...answers,
      [category]: [...answers[category], transcript || ""],
    };

    setAnswers(updated);
    setTranscript("");

    const isLast = idx === queue.length - 1;

    if (!isLast) {
      setIdx((n) => n + 1);
      return;
    }

    // Final: analyze
    setLoading(true);
    try {
      const result = await analyzeAnswers(updated);
      navigate("/results", { state: result });
    } catch (err) {
      console.error("Analyze error:", err);
      alert("Failed to analyze results. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Loading State
  // ---------------------------
  if (!queue.length) {
    return (
      <div className="min-h-screen grid place-items-center text-lg">
        Loading questions…
      </div>
    );
  }

  // ---------------------------
  // Render
  // ---------------------------
  const progress = Math.round(((idx + 1) / queue.length) * 100);

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col items-center p-6 gap-6">
      <Navbar />
      <span className="text-white font-bold text-4xl mb-5">
        InsuLink Assistant
      </span>

      <div className="w-full max-w-2xl card bg-base-200 shadow-xl p-6 flex flex-col gap-4">
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

        <p className="text-lg mb-4">{display}</p>

        <div className="flex justify-center w-full">
          <Orb recording={recording} volume={volume} />
        </div>

        <div className="flex justify-center gap-3">
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

        {transcript && (
          <div className="mt-4 p-3 bg-base-300 rounded-2xl">
            <div className="text-xs opacity-70 mb-1">Your answer</div>
            <div>{transcript}</div>
          </div>
        )}
      </div>

      {loading && (
        <div className="mt-6 text-lg animate-pulse">Analyzing your answers…</div>
      )}

      <Dial />
    </div>
  );
}
