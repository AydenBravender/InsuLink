// src/pages/Results.tsx
import { useLocation, useNavigate } from "react-router-dom";

export default function Results() {
  const navigate = useNavigate();
  const { state } = useLocation() as any;

  if (!state) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <p className="mb-4">No results found.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>Go Home</button>
        </div>
      </div>
    );
  }

  const { scores, average, levels, suggestions } = state;

  const colorMap: Record<string, string> = {
    red: "bg-red-500 text-white",
    yellow: "bg-yellow-400 text-black",
    green: "bg-green-500 text-white",
  };

  function Section({ title, score, level, suggestion }: any) {
    return (
      <div className="card bg-base-200 shadow-xl p-5 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className={`px-3 py-1 rounded text-sm ${colorMap[level]}`}>
            {level.toUpperCase()}
          </div>
        </div>

        <div className="mb-3">
          <p className="font-semibold mb-1">Score: {score}/10</p>
          <progress
            className="progress progress-primary w-full"
            value={score * 10}
            max={100}
          ></progress>
        </div>

        <div>
          <p className="font-semibold mb-1">Suggestion:</p>
          <p className="opacity-80">{suggestion}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Daily Summary</h1>

        {/* Overall Score */}
        <div className="card bg-base-300 shadow-xl p-5 mb-6">
          <h2 className="text-xl font-bold text-center mb-2">Overall Score</h2>
          <p className="text-4xl font-bold text-center mb-3">{average}/10</p>
          <progress
            className="progress progress-secondary w-full"
            value={average * 10}
            max={100}
          ></progress>
        </div>

        {/* Category Sections */}
        <Section
          title="Medication Adherence"
          score={scores.med}
          level={levels.med}
          suggestion={suggestions.med}
        />
        <Section
          title="Food / Nutrition"
          score={scores.food}
          level={levels.food}
          suggestion={suggestions.food}
        />
        <Section
          title="Sleep Quality"
          score={scores.sleep}
          level={levels.sleep}
          suggestion={suggestions.sleep}
        />

        <div className="mt-6 flex justify-center">
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
