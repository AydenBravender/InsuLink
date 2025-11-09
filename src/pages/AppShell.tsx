import Navbar from "../components/Navbar";
import Dial from "../components/Dial";
import HealthIndicator from "../components/HealthIndicator";

export default function AppShell() {

  return (
    <div className="bg-base-100 text-base-content">
      {/* Top bar */}
      <Navbar />
      <HealthIndicator />
      <Dial />
    </div>
  );
}
