import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Dial from "../components/Dial";
import HealthIndicator from "../components/HealthIndicator";
import InsulinTracker from "../components/InsulinTracker";
import HealthToast from "../components/HealthToast";
import { useHealth } from "../context/HealthContext";

export default function AppShell() {
  const { setHealthValue, setAlert, addHistory } = useHealth();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const r = await fetch("http://127.0.0.1:8000/ecg/status");
        const json = await r.json();

        // Update the health indicator
        setHealthValue(json.value);

        // If backend found a *new* alert
        if (json.new_alert) {
          setAlert(json.new_alert);
          // Also log to incident history
          addHistory({
            title: json.new_alert.title,
            message: json.new_alert.message,
            severity: json.new_alert.severity,
          });
        }
      } catch (err) {
        console.error("ECG poll failed:", err);
      }
    }, 1000);

    // 'q' key triggers a demo force of value=1
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "q" || e.key === "Q") {
        fetch("http://127.0.0.1:8000/ecg/demo/force?value=1", {
          method: "POST",
        }).catch((err) => console.error("Demo force failed:", err));
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="bg-base-100 text-base-content">
      <Navbar />
      <HealthToast />
      <HealthIndicator />
      <InsulinTracker />
      <Dial />
    </div>
  );
}
