import { useHealth } from "../context/HealthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HealthToast() {
  const { alert, dismissNotification } = useHealth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);

  // Auto-dismiss after 15s
  useEffect(() => {
    if (!alert) return;

    setProgress(100);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) {
          dismissNotification();
          clearInterval(interval);
          return 0;
        }
        return p - 0.5;
      });
    }, 75);

    return () => clearInterval(interval);
  }, [alert]);

  if (!alert) return null;

  return (
    <div className="toast toast-top toast-center z-50">
      <div
        className={`alert shadow-lg ${
          alert.severity === "critical" ? "alert-error" : "alert-warning"
        }`}
      >
        <div>
          <h3 className="font-bold text-lg">{alert.title}</h3>
          <p>{alert.message}</p>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={dismissNotification}>
            Dismiss
          </button>

          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              dismissNotification();
              navigate("/incidentdashboard");
            }}
          >
            Go to
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <progress
        className="progress progress-primary w-56 mt-1"
        value={progress}
        max="100"
      ></progress>
    </div>
  );
}
