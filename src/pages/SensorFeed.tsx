import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Dial from "../components/Dial";

type ECGPoint = { time: number; value: number };
type EEGPoint = {
  time: number;
  F7: number;
  F8: number;
  T5: number;
  T4: number;
};

export default function SensorFeed() {
  const [ecgData, setEcgData] = useState<ECGPoint[]>([]);
  const [eegData, setEegData] = useState<EEGPoint[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const MAX_POINTS = 3;
  const MAX_LOGS = 30;

  useEffect(() => {
    let ecgTime = 0;
    const ecgValues: number[] = [];
    let ecgIndex = 0;

    // --- ECG FETCH ---
    fetch("/AI/ECG/ecg_live.csv")
      .then((res) => res.text())
      .then((text) => {
        const lines = text
          .trim()
          .split("\n")
          .filter((row) => row.length > 0);

        for (const row of lines) {
          const values = row
            .split(",")
            .map((v) => parseFloat(v))
            .filter((v) => !isNaN(v));

          while (values.length > 0 && values[values.length - 1] === 0) values.pop();
          if (values.length > 0) values.pop();
          ecgValues.push(...values);
        }

        setTerminalLogs((prev) => [
          ...prev,
          `[INFO] ECG CSV loaded with ${lines.length} rows, ${ecgValues.length} total points`,
        ]);
      })
      .catch((err) => {
        console.error(err);
        setTerminalLogs((prev) => [
          ...prev,
          `[ERROR] Failed to load ECG CSV: ${String(err)}`,
        ]);
      });

    // --- EEG FETCH ---
    let eegTime = 0;
    const eegRows: EEGPoint[] = [];
    let eegIndex = 0;

    fetch("/AI/EEG/eeg_live_diagnostic.csv")
      .then((res) => res.text())
      .then((text) => {
        const lines = text
          .trim()
          .split("\n")
          .filter((row) => row.length > 0);

        for (const row of lines) {
          const [F7, F8, T5, T4] = row.split(",").map((v) => parseFloat(v));
          eegRows.push({
            time: eegTime++,
            F7,
            F8,
            T5,
            T4,
          });
        }

        setTerminalLogs((prev) => [
          ...prev,
          `[INFO] EEG CSV loaded with ${lines.length} rows.`,
        ]);
      })
      .catch((err) => {
        console.error(err);
        setTerminalLogs((prev) => [
          ...prev,
          `[ERROR] Failed to load EEG CSV: ${String(err)}`,
        ]);
      });

    // --- ECG INTERVAL STREAM ---
    const ECG_INTERVAL_MS = 1000;
    const ECG_POINTS_PER_UPDATE = 3;

    const ecgInterval = setInterval(() => {
      if (ecgValues.length === 0) return;
      const remaining = ecgValues.length - ecgIndex;
      if (remaining <= 0) {
        setTerminalLogs((prev) => [...prev, `[INFO] ECG data complete.`]);
        clearInterval(ecgInterval);
        return;
      }
      const count = Math.min(ECG_POINTS_PER_UPDATE, remaining);
      const newVals = ecgValues.slice(ecgIndex, ecgIndex + count);
      ecgIndex += count;

      const newPoints = newVals.map((v) => ({ time: ecgTime++, value: v }));

      setEcgData((prev) => {
        const currentData = prev.slice(-(MAX_POINTS - newPoints.length));
        return [...currentData, ...newPoints];
      });

      setTerminalLogs((prev) => {
        const updated = [
          ...prev,
          `[t=${ecgTime - count}] Added ${count} ECG points.`,
        ];
        while (updated.length > MAX_LOGS) updated.shift();
        return updated;
      });
    }, ECG_INTERVAL_MS);

    // --- EEG INTERVAL STREAM ---
    const EEG_INTERVAL_MS = 1000;
    const EEG_POINTS_PER_UPDATE = 3;

    const eegInterval = setInterval(() => {
      if (eegRows.length === 0) return;
      const remaining = eegRows.length - eegIndex;
      if (remaining <= 0) {
        setTerminalLogs((prev) => [...prev, `[INFO] EEG data complete.`]);
        clearInterval(eegInterval);
        return;
      }

      const count = Math.min(EEG_POINTS_PER_UPDATE, remaining);
      const newPoints = eegRows.slice(eegIndex, eegIndex + count);
      eegIndex += count;

      setEegData((prev) => {
        const current = prev.slice(-(MAX_POINTS - newPoints.length));
        return [...current, ...newPoints];
      });

      setTerminalLogs((prev) => {
        const updated = [
          ...prev,
          `[t=${eegIndex}] Added ${count} EEG points.`,
        ];
        while (updated.length > MAX_LOGS) updated.shift();
        return updated;
      });
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

      {/* Layout with ECG and EEG side-by-side */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ECG Chart */}
        <div className="card bg-base-200 p-4 shadow-lg flex-1">
          <h2 className="text-center font-bold mb-2">ECG</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ecgData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* EEG Chart */}
        <div className="card bg-base-200 p-4 shadow-lg flex-1">
          <h2 className="text-center font-bold mb-2">EEG (F7, F8, T5, T4)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={eegData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="F7" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="F8" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="T5" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="T4" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Terminal log */}
      <div className="card bg-black text-green-400 font-mono mt-10 p-4 h-64 overflow-y-auto shadow-inner">
        <h2 className="text-green-300 mb-2">Live Sensor Console</h2>
        <div className="text-xs space-y-1">
          {terminalLogs.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
      <Dial />
    </div>
  );
}
