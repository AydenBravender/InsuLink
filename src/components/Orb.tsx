import { motion } from "framer-motion";

type OrbProps = {
  recording: boolean;
  volume: number; // normalized 0 to 1
};

export default function Orb({ recording, volume }: OrbProps) {
  // subtle scale change
  const scale = 1 + (recording ? volume * 0.5 : 0); // max ~1.1

  // glow responds to volume
  const glowIntensity = 0.3 + volume * 0.7; // 0.3 to 1.0
  const glowSpread = 20 + volume * 40; // px
  const glow = recording
    ? `0 0 ${glowSpread}px ${glowSpread / 2}px rgba(255,0,0,${glowIntensity})`
    : "0 0 30px 10px rgba(0,0,255,0.3)";

  return (
    <motion.div
      animate={{
        scale,
        boxShadow: glow,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-80 h-80 rounded-full flex items-center justify-center bg-linear-to-br from-blue-500 to-red-500 shadow-lg mb-20"
    >
    </motion.div>
  );
}
