import InsuLinkLogo from "../assets/InsuLinkLogo.png";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  
  const handleNavigation = () => {
    navigate("/signup"); // Replace '/target-page' with your desired route
  };
  return (
    <div className="min-h-screen flex flex-col md:flex-row text-gray-200">
      {/* Left Section */}
      <div className="md:w-1/2 flex flex-col justify-center px-10 py-20 space-y-8">
        <div className="flex flex-col items-center text-center">
          <img
            src={InsuLinkLogo}
            alt="InsuLink logo"
            className="w-56 mb-4 drop-shadow-xl mx-auto"
          />

          <h1 className="text-5xl font-medium text-white leading-tight mb-7">
            Smarter Diabetes Care.
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-md empty-10">
            InsuLink helps you stay ahead of your health with intelligent
            tracking, personalized insights, and a seamless daily routine — all
            powered by intuitive design and smart technology.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 max-w-md pt-4">
          <div className="p-5 bg-[#111111] rounded-2xl shadow border border-gray-800 hover:border-blue-500/30 transition">
            <h3 className="font-semibold text-white">Health Metrics</h3>
            <p className="text-sm text-gray-400">
              Sleep, fitness, heart & more
            </p>
          </div>
          <div className="p-5 bg-[#111111] rounded-2xl shadow border border-gray-800 hover:border-blue-500/30 transition">
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-sm text-gray-400">Chat for support anytime</p>
          </div>
          <div className="p-5 bg-[#111111] rounded-2xl shadow border border-gray-800 hover:border-blue-500/30 transition">
            <h3 className="font-semibold text-white">Routines</h3>
            <p className="text-sm text-gray-400">Personal care scheduling</p>
          </div>
          <div className="p-5 bg-[#111111] rounded-2xl shadow border border-gray-800 hover:border-blue-500/30 transition">
            <h3 className="font-semibold text-white">Notifications</h3>
            <p className="text-sm text-gray-400">Stay on top of your health</p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="md:w-1/2 flex justify-center items-center px-10 py-20">
        <div className="w-full max-w-sm p-10 bg-[#111111] border border-gray-800 rounded-3xl shadow-xl">
          <h2 className="text-3xl font-bold text-white mb-8">Get Started</h2>

          <div className="flex flex-col space-y-5">
            <button onClick={handleNavigation} className="btn w-full btn-primary text-white font-semibold rounded-xl py-3 border-none">
              Sign Up
            </button>
            <button
              className="btn w-full btn-accent text-white font-semibold rounded-xl py-3 border-none"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
