import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Dial from "../components/Dial";

type ECGPoint = { time: number; value: number };
type EEGPoint = { time: number; F7: number; F8: number; T5: number; T4: number };

export default function SensorFeed() {
  const [ecgData, setEcgData] = useState<ECGPoint[]>([]);
  const [eegData, setEegData] = useState<EEGPoint[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const ecgDataRef = useRef<ECGPoint[]>([]);
  const eegDataRef = useRef<EEGPoint[]>([]);
  const MAX_POINTS = 80;
  const MAX_LOGS = 30;

  useEffect(() => {
    let ecgIndex = 0;
    const ecgValues: number[] = [];

    let eegIndex = 0;
    const eegRows: EEGPoint[] = [];

    // --- FETCH ECG CSV ---
    fetch("/AI/ECG/data_ecg/ecg_live.csv")
      .then((res) => res.text())
      .then((text) => {
        const lines = text.trim().split("\n").filter((r) => r.length > 0);
        for (const row of lines) {
          const values = row.split(",").map((v) => parseFloat(v)).filter((v) => !isNaN(v));
          while (values.length > 0 && values[values.length - 1] === 0) values.pop();
          if (values.length > 0) values.pop();
          ecgValues.push(...values);
        }
        setTerminalLogs((prev) => [
          ...prev,
          `[INFO] ECG CSV loaded: ${lines.length} rows, ${ecgValues.length} points`,
        ]);
      })
      .catch((err) =>
        setTerminalLogs((prev) => [...prev, `[ERROR] Failed to load ECG CSV: ${String(err)}`])
      );

    // --- FETCH EEG CSV ---
    fetch("/AI/EEG/diagnostic/data_eeg_diagnostic/eeg_live_diagnostic.csv")
      .then((res) => res.text())
      .then((text) => {
        const lines = text.trim().split("\n").filter((r) => r.length > 0);
        let t = 0;
        for (const row of lines) {
          const [F7, F8, T5, T4] = row.split(",").map((v) => parseFloat(v));
          eegRows.push({ time: t++, F7, F8, T5, T4 });
        }
        setTerminalLogs((prev) => [...prev, `[INFO] EEG CSV loaded: ${lines.length} rows`]);
      })
      .catch((err) =>
        setTerminalLogs((prev) => [...prev, `[ERROR] Failed to load EEG CSV: ${String(err)}`])
      );

    // --- ECG STREAM ---
    const ECG_INTERVAL_MS = 80;
    const ECG_POINTS_PER_UPDATE = 1;
    let ecgTimeCounter = 0;

    const ecgInterval = setInterval(() => {
      if (!ecgValues.length) return;
      const remaining = ecgValues.length - ecgIndex;
      if (remaining <= 0) return;

      const count = Math.min(ECG_POINTS_PER_UPDATE, remaining);
      const newVals = ecgValues.slice(ecgIndex, ecgIndex + count);
      ecgIndex += count;

      newVals.forEach((v) =>
        ecgDataRef.current.push({ time: ecgTimeCounter++, value: v })
      );

      if (ecgDataRef.current.length > MAX_POINTS) {
        ecgDataRef.current = ecgDataRef.current.slice(-MAX_POINTS);
        ecgDataRef.current = ecgDataRef.current.map((p, i) => ({ ...p, time: i }));
        ecgTimeCounter = MAX_POINTS;
      }

      setEcgData([...ecgDataRef.current]);
    }, ECG_INTERVAL_MS);

    // --- EEG STREAM ---
    const EEG_INTERVAL_MS = 500;
    const EEG_POINTS_PER_UPDATE = 3;

    const eegInterval = setInterval(() => {
      if (!eegRows.length) return;
      const remaining = eegRows.length - eegIndex;
      if (remaining <= 0) return;

      const count = Math.min(EEG_POINTS_PER_UPDATE, remaining);
      const newPoints = eegRows.slice(eegIndex, eegIndex + count);
      eegIndex += count;

      eegDataRef.current.push(...newPoints);

      if (eegDataRef.current.length > MAX_POINTS) {
        eegDataRef.current = eegDataRef.current.slice(-MAX_POINTS);
        eegDataRef.current = eegDataRef.current.map((p, i) => ({ ...p, time: i }));
      }

      setEegData([...eegDataRef.current]);
    }, EEG_INTERVAL_MS);

    return () => {
      clearInterval(ecgInterval);
      clearInterval(eegInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-8 relative">
      <Navbar />
      <h1 className="mb-6 text-4xl font-bold">ECG + EEG Live Feed</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ECG Chart */}
        <div className="card bg-base-200 p-4 shadow-lg flex-1">
          <h2 className="text-center font-bold mb-2">ECG</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ecgData}>
              {/* Only show axis lines, no grid */}
              <XAxis dataKey="time" hide={false} axisLine={true} tick={false} />
              <YAxis domain={[0, 1]} axisLine={true} tick={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* EEG Chart */}
        <div className="card bg-base-200 p-4 shadow-lg flex-1">
          <h2 className="text-center font-bold mb-2">EEG (F7, F8, T5, T4)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={eegData}>
              <XAxis dataKey="time" hide={false} axisLine={true} tick={false} />
              <YAxis domain={[0, 1]} axisLine={true} tick={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="F7" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="F8" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="T5" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="T4" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Dial />
    </div>
  );
}
