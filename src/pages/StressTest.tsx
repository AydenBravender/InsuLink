import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Question = {
  expression: string;
  answer: number;
};

export default function StressTest() {
  const navigate = useNavigate();

  // ----------- Generate harder BEDMAS questions -----------
  function generateQuestions(): Question[] {
    const q: Question[] = [];

    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    // Q1: (a + b) × c
    {
      const a = rand(5, 30);
      const b = rand(5, 20);
      const c = rand(2, 9);
      q.push({
        expression: `(${a} + ${b}) × ${c}`,
        answer: (a + b) * c,
      });
    }

    // Q2: a × b - c
    {
      const a = rand(10, 30);
      const b = rand(2, 12);
      const c = rand(1, 20);
      q.push({
        expression: `${a} × ${b} - ${c}`,
        answer: a * b - c,
      });
    }

    // Q3: (a × b) + (c × d)
    {
      const a = rand(3, 10);
      const b = rand(3, 10);
      const c = rand(2, 12);
      const d = rand(2, 12);
      q.push({
        expression: `(${a} × ${b}) + (${c} × ${d})`,
        answer: a * b + c * d,
      });
    }

    // Q4: (a + b + c) × d
    {
      const a = rand(3, 15);
      const b = rand(3, 15);
      const c = rand(3, 15);
      const d = rand(2, 8);
      q.push({
        expression: `(${a} + ${b} + ${c}) × ${d}`,
        answer: (a + b + c) * d,
      });
    }

    return q;
  }

  const [questions] = useState<Question[]>(generateQuestions);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"correct" | "wrong" | "idle">("idle");

  // timers
  const [start, setStart] = useState(Date.now());
  const [times, setTimes] = useState<number[]>([]);

  // breathing + final states
  const [phase, setPhase] = useState<"questions" | "breathing" | "result">(
    "questions"
  );
  const [breathText, setBreathText] = useState("Inhale...");

  const q = questions[idx];

  useEffect(() => {
    setStart(Date.now());
  }, [idx]);

  const submit = () => {
    if (+answer === q.answer) {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setTimes((prev) => [...prev, elapsed]);
      setStatus("correct");

      setTimeout(() => {
        setStatus("idle");
        setAnswer("");

        if (idx < 3) {
          setIdx(idx + 1);
        } else {
          // done → breathing
          setPhase("breathing");
          startBreathingAnimation();
        }
      }, 900);
    } else {
      setStatus("wrong");
      setTimeout(() => setStatus("idle"), 900);
    }
  };

  // ----------- Breathing animation + inhale/exhale prompts -----------
  const startBreathingAnimation = () => {
    // alternating inhale/exhale
    const sequence = [
      { t: 0, text: "Inhale..." },
      { t: 3500, text: "Exhale..." },
      { t: 7000, text: "Inhale..." },
      { t: 10500, text: "Exhale..." },
    ];

    sequence.forEach((s) => {
      setTimeout(() => setBreathText(s.text), s.t);
    });

    // finish at 14 seconds
    setTimeout(() => setPhase("result"), 14000);
  };

  // ----------- BREATHING PHASE UI -----------
  if (phase === "breathing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-2xl font-bold mb-3">Take a little moment to relax</h1>

        <p className="mb-6 text-lg opacity-80">{breathText}</p>

        <div className="breathing-wrapper">
          <div className="breathing-circle animate-breath"></div>
        </div>

        <style>{`
          .breathing-wrapper {
            margin-top: 40px; /* shifts orb DOWN so it won't overlap text */
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
          }

          .breathing-circle {
            width: 140px;
            height: 140px;
            background: rgba(255, 64, 129, 0.25);
            border-radius: 9999px;
          }

          @keyframes breath {
            0% { transform: scale(1); }
            25% { transform: scale(1.4); }
            50% { transform: scale(1); }
            75% { transform: scale(1.4); }
            100% { transform: scale(1); }
          }

          .animate-breath {
            animation: breath 14s ease-in-out forwards;
          }
        `}</style>
      </div>
    );
  }

  // ----------- RESULT UI -----------
  if (phase === "result") {
    const default_offset = 4;
    const totalSec = times.reduce((a, b) => a + b, 0);
    const scaled = (totalSec / 100) + default_offset;
    const minutes = Math.floor(scaled);
    const seconds = Math.round((scaled - minutes) * 60);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="card bg-base-200 shadow-xl p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Stress Test Result</h1>

          <p className="text-lg mb-6">
            Based on our analysis, we suggest taking your next insulin dose{" "}
            <span className="font-bold text-primary">
              {minutes} minute{minutes !== 1 ? "s" : ""} {seconds} seconds
            </span>{" "}
            early today.
          </p>

          <button className="btn btn-primary" onClick={() => navigate("/app")}>
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // ----------- QUESTION UI -----------
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="card bg-base-200 shadow-xl p-8 max-w-md w-full text-center">

        <h1 className="text-xl font-bold mb-4">
          Question {idx + 1} of 4
        </h1>

        <p className="text-lg mb-4 font-mono">
          {q.expression}
        </p>

        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer"
          className="input input-bordered w-full mb-4 text-center"
        />

        {status === "correct" && (
          <p className="text-green-400 font-bold animate-pulse">Correct!</p>
        )}
        {status === "wrong" && (
          <p className="text-red-400 font-bold animate-pulse">
            Incorrect — try again!
          </p>
        )}

        <button className="btn btn-primary w-full mt-4" onClick={submit}>
          Submit
        </button>
      </div>
    </div>
  );
}
