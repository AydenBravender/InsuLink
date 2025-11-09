// src/pages/Results.tsx
import { useLocation } from "react-router-dom";

export default function Results() {
  const location = useLocation();
  const { med, food, sleep, avg } = location.state ?? {};

  const getColor = (score: number) => {
    if (score <= 3) return "error";
    if (score <= 6) return "warning";
    return "success";
  };

  const categories = [
    { label: "Medication", score: med },
    { label: "Food", score: food },
    { label: "Sleep", score: sleep },
  ];

  return (
    <div className="min-h-screen bg-base-100 p-8 text-base-content">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Your Results</h1>

        {categories.map((c, i) => (
          <div key={i} className="card bg-base-200 shadow">
            <div className="card-body">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">{c.label}</span>
                <div className={`badge badge-${getColor(c.score)}`}>
                  {c.score}/10
                </div>
              </div>

              <progress
                className={`progress progress-${getColor(c.score)}`}
                value={c.score}
                max={10}
              />

              {/* Suggestions */}
              <p className="text-sm opacity-75 mt-2">
                {(() => {
                  if (c.score <= 3)
                    return "This area needs urgent improvement. Try to build better consistency.";
                  if (c.score <= 6)
                    return "You're doing okay, but you can improve with a few changes.";
                  return "Great job! Keep maintaining your healthy habits.";
                })()}
              </p>
            </div>
          </div>
        ))}

        <div className="card bg-base-200 shadow">
          <div className="card-body">
            <h2 className="font-bold">Overall Score</h2>
            <p className="text-xl">{avg.toFixed(1)}/10</p>
          </div>
        </div>
      </div>
    </div>
  );
}
