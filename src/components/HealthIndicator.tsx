import { useMemo } from "react";
import { useHealth } from "../context/HealthContext";

export default function HealthIndicator() {
  const { healthValue } = useHealth();

  type HealthStatus = "good" | "caution" | "critical";

  // Map numeric backend value to status
  const healthStatus: HealthStatus = useMemo(() => {
    switch (healthValue) {
      case 2:
        return "critical";
      case 1:
      case 3:
      case 4:
        return "caution";
      case 0:
      default:
        return "good";
    }
  }, [healthValue]);

  // Color mapping for easy reference
  const healthColors = {
    good: "#22c55e",
    caution: "#f97316",
    critical: "#ef4444"
  };

  const strokeColors = {
    good: "#16a34a",
    caution: "#ea580c",
    critical: "#dc2626"
  };

  return (
    <div className="flex justify-center mt-12">
      <div className="flex flex-col items-center text-center">
        {/* Title */}
        <text className="mb-6 text-4xl font-bold ">Health Indicator</text>

        {/* Main Health Circle */}
        <div
          className="relative w-64 h-64 rounded-full flex items-center justify-center overflow-visible mt-5"
          style={
            {
              backgroundColor: "#0f172a", // dark background
              "--health-color": healthColors[healthStatus],
              boxShadow: `
              0 0 25px ${healthColors[healthStatus]},
              0 0 50px ${healthColors[healthStatus]}
            `,
              animation:
                healthStatus !== "good"
                  ? "pulseGlow 2.5s infinite ease-in-out"
                  : "none"
            } as React.CSSProperties
          }
        >
          {/* Rotating Glow Ring (for "good" status) */}
          {healthStatus === "good" && (
            <div
              className="absolute -inset-2.5 rounded-full border-[6px] opacity-60 blur-md"
              style={{
                borderColor: `${healthColors.good} transparent transparent transparent`,
                animation: "spinGlow 3s linear infinite",
                filter: `drop-shadow(0 0 10px ${healthColors.good})`
              }}
            />
          )}

          {/* Status Text */}
          <span
            className="font-extrabold text-4xl capitalize relative"
            style={{
              color: healthColors[healthStatus],
              WebkitTextStroke: `1px ${strokeColors[healthStatus]}`,
              textShadow: `
                0 0 4px var(--health-color),
                0 0 8px var(--health-color),
                0 0 16px rgba(255,255,255,0.2)
              `,
              letterSpacing: "1px"
            }}
          >
            {healthStatus}
          </span>

          {/* Subtle Outer Aura */}
          <div
            className="absolute inset-0 rounded-full opacity-30 blur-2xl"
            style={{
              backgroundColor: healthColors[healthStatus]
            }}
          />
        </div>

        {/* Keyframes for Animations */}
        <style>
          {`
            @keyframes pulseGlow {
              0%, 100% {
                box-shadow:
                  0 0 25px var(--health-color),
                  0 0 50px var(--health-color);
                transform: scale(1);
              }
              50% {
                box-shadow:
                  0 0 35px var(--health-color),
                  0 0 70px var(--health-color);
                transform: scale(1.03);
              }
            }

            @keyframes spinGlow {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}
