// src/components/InsulinTracker.tsx
import { useEffect, useState } from "react";

type Dose = {
  type: string;
  amount: number;
  time: string;
};

export default function InsulinTracker() {
  const [type, setType] = useState("Rapid-Acting");
  const [amount, setAmount] = useState<number>(0);
  const [history, setHistory] = useState<Dose[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("insulin_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (newHist: Dose[]) => {
    setHistory(newHist);
    localStorage.setItem("insulin_history", JSON.stringify(newHist));
  };

  const logDose = () => {
    if (!amount || amount <= 0) return;

    const newDose: Dose = {
      type,
      amount,
      time: new Date().toISOString(),
    };

    saveHistory([newDose, ...history]);
    setAmount(0);
  };

  const last = history[0];

  return (
  <div className="w-full flex justify-center mt-32">
    <div className="w-full max-w-3xl bg-[#0f0f0f] rounded-3xl border border-gray-800 p-10 shadow-xl">

      {/* Header */}
      <h2 className="text-2xl font-bold text-center text-white mb-2">
        Insulin Tracker
      </h2>
      <p className="text-center text-gray-400 mb-10">
        Log your daily insulin doses and stay on track.
      </p>

      {/* ✅ Centered Last Dose Card */}
      <div className="flex justify-center mb-10">
        <div className="bg-[#1a1a1a] border border-gray-700 p-6 rounded-xl w-[70%] text-center">
          <div className="text-gray-400 text-sm">Last Dose</div>

          {last ? (
            <>
              <div className="text-white text-xl font-semibold mt-1">
                {last.amount} units — {last.type}
              </div>
              <div className="text-gray-500 text-xs mt-1">
                {new Date(last.time).toLocaleString()}
              </div>
            </>
          ) : (
            <p className="text-gray-600 text-sm mt-2">
              No doses recorded yet.
            </p>
          )}
        </div>
      </div>

      {/* ✅ Inputs centered */}
      <div className="flex flex-col gap-4 w-[70%] mx-auto">
        <select
          className="select select-bordered w-full bg-[#1a1a1a] border-gray-700 text-gray-200"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>Rapid-Acting</option>
          <option>Short-Acting</option>
          <option>Intermediate-Acting</option>
          <option>Long-Acting</option>
          <option>Mixed</option>
        </select>

        <input
          type="number"
          className="input input-bordered w-full bg-[#1a1a1a] border-gray-700 text-gray-200"
          placeholder="Units"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
        />

        <button
          onClick={logDose}
          className="btn btn-primary w-full text-white font-semibold"
        >
          Log Dose
        </button>
      </div>
    </div>
  </div>
);
}
