import Dial from "../components/Dial";
import Navbar from "../components/Navbar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const dummyData = Array.from({ length: 50 }, (_, i) => ({
  time: i,
  value: Math.sin(i / 5) * 10 + Math.random() * 2
}));

export default function SensorFeed() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content p-8">
			<Navbar />
			<text className="mb-6 text-4xl font-bold ">
				Live Sensor Feed
			</text>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card bg-base-200 p-4 shadow-lg">
          <h2 className="text-center font-bold mb-2">EEG</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dummyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card bg-base-200 p-4 shadow-lg">
          <h2 className="text-center font-bold mb-2">ECG</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dummyData}>
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

        <div className="card bg-base-200 p-4 shadow-lg">
          <h2 className="text-center font-bold mb-2">EMG</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dummyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
			<Dial />
    </div>
  );
}
