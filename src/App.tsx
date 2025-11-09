// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import Dashboard from "./pages/Dashboard";
import Signup from "./pages/Signup"; // Import Signup page
import AppShell from "./pages/AppShell.tsx";
import Questionnaire from "./pages/Questionnaire.tsx";
import Results from "./pages/Results.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/app" element={<AppShell />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Router>
  );
}

export default App;
