// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import Signup from "./pages/Signup"; // Import Signup page
import AppShell from "./pages/AppShell.tsx";
import Results from "./pages/Results.tsx";
import SensorFeed from "./pages/SensorFeed.tsx";
import Assistant from "./pages/Assistant.tsx";
import IncidentDashboard from "./pages/IncidentDashboard.tsx";
import StressTest from "./pages/StressTest";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/app" element={<AppShell />} />
        <Route path="/results" element={<Results />} />
        <Route path="/sensorfeed" element={<SensorFeed />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/incidentdashboard" element={<IncidentDashboard />} />
        <Route path="/stress-test" element={<StressTest />} />
      </Routes>
    </Router>
  );
}

export default App;
