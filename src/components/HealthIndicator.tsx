import { useState } from "react";

export default function HealthIndicator() {
  // Placeholder state for health indicator
  const [healthStatus] = useState<HealthStatus>("good"); // Change manually for now

  // For placeholder status types
  type HealthStatus = "good" | "caution" | "critical";
	
  return (
    <>
      {/* Health Indicator */}
      <div className="flex justify-center mt-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 text-4xl font-bold tracking-wide shadow-2xl">
            Health Indicator
          </div>

          <div
            className={`relative w-64 h-64 rounded-full bg-white flex items-center justify-center overflow-visible mt-5`}
            style={
              {
                "--health-color":
                  healthStatus === "good"
                    ? "#22c55e" // green
                    : healthStatus === "caution"
                    ? "#f97316" // orange
                    : "#ef4444", // red
                boxShadow: `
            0 0 25px var(--health-color),
            0 0 50px var(--health-color)
          `,
                animation:
                  healthStatus !== "good"
                    ? "pulseGlow 2.5s infinite ease-in-out"
                    : "none"
              } as React.CSSProperties
            }
          >
            {/* Rotating glow ring (only for "good" status) */}
            {healthStatus === "good" && (
              <div
                className="absolute -inset-2.5 rounded-full border-[6px] opacity-60 blur-md"
                style={{
                  borderColor: "#22c55e transparent transparent transparent",
                  animation: "spinGlow 3s linear infinite",
                  filter: "drop-shadow(0 0 10px #22c55e)"
                }}
              ></div>
            )}

            <span
              className="font-extrabold text-4xl capitalize relative"
              style={{
                color:
                  healthStatus === "good"
                    ? "#22c55e"
                    : healthStatus === "caution"
                    ? "#f97316"
                    : "#ef4444",
                WebkitTextStroke: `1px ${
                  healthStatus === "good"
                    ? "#16a34a"
                    : healthStatus === "caution"
                    ? "#ea580c"
                    : "#dc2626"
                }`,
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

            {/* Subtle outer aura */}
            <div
              className="absolute inset-0 rounded-full opacity-30 blur-2xl"
              style={{
                backgroundColor:
                  healthStatus === "good"
                    ? "#22c55e"
                    : healthStatus === "caution"
                    ? "#f97316"
                    : "#ef4444"
              }}
            ></div>
          </div>
        </div>

        {/* Keyframes for pulse and rotating glow */}
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
    </>
  );
}
