import { useNavigate } from "react-router-dom";
import { Activity, Cpu, AlertTriangle, FileText, Zap } from "lucide-react";

export default function Dial() {
  const navigate = useNavigate();

  return (
    <div className="fab">
      {/* Main FAB button */}
      <div
        tabIndex={0}
        role="button"
        className="btn btn-lg btn-circle btn-primary"
      >
        <Zap className="w-6 h-6" />
      </div>

      {/* Main Action button when FAB is open */}
      <div className="fab-main-action">
        Homepage{" "}
        <button
          className="btn btn-circle btn-secondary btn-lg"
          onClick={() => navigate("/app")}
        >
          <Activity className="w-6 h-6" />
        </button>
      </div>

      {/* FAB options */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2">
          Live Sensor Feed
          <button
            className="btn btn-lg btn-circle"
            onClick={() => navigate("/sensorfeed")}
          >
            <Activity className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          AI Assistant
          <button
            className="btn btn-lg btn-circle"
            onClick={() => navigate("/assistant")}
          >
            <Cpu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          Incident Dashboard
          <button
            className="btn btn-lg btn-circle"
            onClick={() => navigate("/incidentdashboard")}
          >
            <AlertTriangle className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          Questionnaire
          <button
            className="btn btn-lg btn-circle"
            onClick={() => navigate("/questionnaire")}
          >
            <FileText className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
