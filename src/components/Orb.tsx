import { motion } from "framer-motion";

type OrbProps = {
  recording: boolean;
  volume: number; // normalized 0 to 1
};

export default function Orb({ recording, volume }: OrbProps) {
  const scale = 1 + (recording ? volume * 0.8 : 0); // base 1, grows with volume
  const glow = recording
    ? `0 0 ${20 + volume * 60}px ${10 + volume * 20}px rgba(255,0,0,${0.3 + volume * 0.4})`
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
      <span className="text-white font-bold text-2xl">Assistant</span>
    </motion.div>
  );
}
