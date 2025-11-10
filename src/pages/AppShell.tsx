import Navbar from "../components/Navbar";
import Dial from "../components/Dial";
import HealthIndicator from "../components/HealthIndicator";
import InsulinTracker from "../components/InsulinTracker";

export default function AppShell() {

  return (
    <div className="bg-base-100 text-base-content">
      {/* Top bar */}
      <Navbar />
      <HealthIndicator />
      <InsulinTracker />
      <Dial />
    </div>
  );
}
