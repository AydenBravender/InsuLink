// src/pages/Results.tsx
import { useLocation, useNavigate } from "react-router-dom";

export default function Results() {
  const navigate = useNavigate();
  const { state } = useLocation() as any;

  if (!state) {
    return (
      <div className="min-h-screen grid place-items-center text-xl">
        No results available.
      </div>
    );
  }

  const { scores, average, levels, overview } = state;

  function Block({
    title,
    score,
    level,
    text,
  }: {
    title: string;
    score: number;
    level: "red" | "yellow" | "green";
    text: string;
  }) {
    const barColor =
      {
        red: "progress-error",
        yellow: "progress-warning",
        green: "progress-success",
      }[level] || "progress-primary";

    return (
      <div className="card bg-base-200 shadow-xl p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>

        <p className="font-semibold">
          Score: <span className="text-primary">{score}/10</span>
        </p>

        <progress
          className={`progress w-full mt-2 mb-4 ${barColor}`}
          value={score * 10}
          max={100}
        />

        <div className="bg-base-300 p-4 rounded-xl">
          <h3 className="font-bold mb-1 opacity-80">AI Overview</h3>
          <p className="whitespace-pre-line opacity-90">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-8 flex justify-center">
      <div className="w-full max-w-3xl">

        <h1 className="text-4xl font-bold mb-6">Your Health Summary</h1>

        <div className="text-xl mb-8">
          Overall Score:{" "}
          <span className="text-primary font-bold">{average}/10</span>
        </div>

        <Block
          title="Medication"
          score={scores.med}
          level={levels.med}
          text={overview.med}
        />

        <Block
          title="Nutrition"
          score={scores.food}
          level={levels.food}
          text={overview.food}
        />

        <Block
          title="Sleep Quality"
          score={scores.sleep}
          level={levels.sleep}
          text={overview.sleep}
        />

        <button
          className="btn btn-primary w-full mt-6"
          onClick={() => navigate("/app")}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
