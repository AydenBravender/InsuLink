// src/pages/Questionnaire.tsx

import { useEffect, useState } from "react";
import { getQuestions, ttsSpeak, transcribeAudio } from "../lib/api";
import { analyzeAnswers } from "../lib/api";
import { useRecorder } from "../hooks/useRecorder";
import { useNavigate } from "react-router-dom";

type Questions = {
  med: string;
  food: string;
  sleep: string;
};

export default function Questionnaire() {
  const navigate = useNavigate();
  const { recording, startRecording, stopRecording } = useRecorder();

  const [questions, setQuestions] = useState<Questions | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const questionList = questions
    ? [questions.med, questions.food, questions.sleep]
    : [];

  // Fetch questions at start
  useEffect(() => {
    (async () => {
      const q = await getQuestions();
      setQuestions(q);
    })();
  }, []);

  // Typing animation + TTS
  useEffect(() => {
    if (!questions) return;

    const text = questionList[currentIndex];
    setDisplayText("");

    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
        playTTS(text);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [questions, currentIndex]);

  const playTTS = async (text: string) => {
    const mp3 = await ttsSpeak(text);
    const audio = new Audio(mp3);
    await audio.play();
  };

  const handleStart = () => {
    startRecording();
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    const result = await transcribeAudio(blob);
    const transcript = result.text;

    const newAnswers = [...answers, transcript];
    setAnswers(newAnswers);

    if (currentIndex < 2) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 400);
    } else {
      submitAll(newAnswers);
    }
  };

  const submitAll = async (finalAnswers: string[]) => {
    setLoading(true);
    const result = await analyzeAnswers(finalAnswers);
    navigate("/results", { state: result });
  };

  if (!questions) {
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
          Question {currentIndex + 1} of 3
        </h1>
        <p className="text-lg min-h-[80px]">{displayText}</p>

        {/* Microphone animation */}
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

        <div className="flex gap-4 mt-4">
          <button
            className="btn btn-secondary"
            onClick={handleStart}
            disabled={recording}
          >
            Start Recording
          </button>

          <button
            className="btn btn-primary"
            onClick={handleStop}
            disabled={!recording}
          >
            Done Speaking
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-8 text-xl animate-pulse">Analyzing your answers…</div>
      )}
    </div>
  );
}
