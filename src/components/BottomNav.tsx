import { NavLink } from "react-router-dom";
import { Home, MessageSquare, Calendar, Bell, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const navItems = [
    { path: "/home", icon: Home, label: "Home" },
    { path: "/chat", icon: MessageSquare, label: "Chat" },
    { path: "/routine", icon: Calendar, label: "Routine" },
    { path: "/notifications", icon: Bell, label: "Alerts" },
    { path: "/sensors", icon: Activity, label: "Sensors" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-20 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors rounded-lg",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
