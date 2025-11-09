import { useEffect, useState } from "react";
import {
  analyzeAnswers,
  getQuestions,
  ttsSpeak,
  transcribeAudio,
  type Question,
  type QAAnswer,
  type Category,
} from "../lib/api";
import { useRecorder } from "../hooks/useRecorder";
import { useNavigate } from "react-router-dom";

export default function Questionnaire() {
  const navigate = useNavigate();
  const { recording, interim, finalText, startRecording, stopRecording } = useRecorder();

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [queue, setQueue] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<QAAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [typed, setTyped] = useState("");

  // Load questions
  useEffect(() => {
    (async () => {
      const res = await getQuestions();
      setQuestions(res.questions);
    })();
  }, []);

  // Shuffle questions
  useEffect(() => {
    if (!questions) return;
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setIdx(0);
    setAnswers([]);
    setCanProceed(false);
  }, [questions]);

  const current = queue[idx];

  // Typewriter effect for current question
  useEffect(() => {
    if (!current) return;
    setCanProceed(false);
    setTyped("");

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(current.text.slice(0, i));
      if (i >= current.text.length) clearInterval(interval);
    }, 25);

    return () => clearInterval(interval);
  }, [current]);

  const handleStart = async () => {
    try {
      const url = await ttsSpeak(current.text);
      const audio = new Audio(url);
      await audio.play();
      await new Promise<void>((resolve) =>
        audio.addEventListener("ended", () => resolve(), { once: true })
      );
    } catch {}
    await startRecording();
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    const { text } = await transcribeAudio(blob);
    const transcript = (text || "").trim();
    const ans: QAAnswer = { category: current.category as Category, text: transcript };
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = ans;
      return next;
    });
    setCanProceed(true);
  };

  const handleNext = async () => {
    if (!canProceed) return;
    if (idx < queue.length - 1) {
      setIdx((n) => n + 1);
      setCanProceed(false);
    } else {
      setLoading(true);
      const filled: QAAnswer[] = queue.map((q, i) =>
        answers[i] ?? { category: q.category as Category, text: "" }
      );
      const result = await analyzeAnswers(filled);
      navigate("/results", { state: result });
    }
  };

  if (!current) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading questions...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col items-center p-8">
      <div className="w-full max-w-2xl card bg-base-200 shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-2">
          Question {idx + 1} of {queue.length}
        </h1>

        <p className="text-lg mb-4">{typed}</p>

        {/* live transcription */}
        <div className="min-h-[60px] text-sm opacity-80">
          {recording ? (
            <span className="italic">Listening… {interim}</span>
          ) : (
            <span>{finalText}</span>
          )}
        </div>

        {/* mic animation */}
        <div className="flex justify-center my-6">
          <div className="flex space-x-1">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full bg-primary transition-all duration-300 ${
                  recording ? "h-12" : "h-4"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="btn btn-accent"
            disabled={recording}
            onClick={handleStart}
          >
            Start
          </button>

          <button className="btn-accent" disabled={!recording} onClick={handleStop}>
            Stop
          </button>

          <button className="btn btn-primary" disabled={!canProceed} onClick={handleNext}>
            Next
          </button>
        </div>
      </div>

      {loading && <div className="mt-8 text-xl animate-pulse">Analyzing…</div>}
    </div>
  );
}
