import { useHealth } from "../context/HealthContext";
import Dial from "../components/Dial";

export default function IncidentDashboard() {
  const { history } = useHealth();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Incident Dashboard</h1>

      <p className="opacity-70 mb-4">
        Below is your log of past incidents detected from the ECG monitoring.
      </p>

      <div className="space-y-4">
        {history.length === 0 && (
          <p className="text-gray-400">No incidents recorded yet.</p>
        )}

        {history.map((item, idx) => (
          <div key={idx} className="card bg-base-200 shadow-md p-4">
            <h2 className="font-bold text-xl">{item.title}</h2>

            <p className="mt-1">{item.message}</p>

            <div className="mt-2 text-sm opacity-70">
              {new Date(item.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Dial />
      </div>
    </div>
  );
}
