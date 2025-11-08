import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "action" | "success";
  title: string;
  message: string;
  time: string;
}

const Notifications = () => {
  const notifications: Notification[] = [
    {
      id: "1",
      type: "action",
      title: "Action Needed",
      message: "Time for your evening insulin dose",
      time: "10 min ago",
    },
    {
      id: "2",
      type: "success",
      title: "All Good",
      message: "Your glucose levels are within target range",
      time: "2 hours ago",
    },
    {
      id: "3",
      type: "action",
      title: "Action Needed",
      message: "Log your lunch carbohydrates",
      time: "3 hours ago",
    },
    {
      id: "4",
      type: "success",
      title: "All Good",
      message: "Great job! You completed today's fitness goal",
      time: "5 hours ago",
    },
    {
      id: "5",
      type: "action",
      title: "Action Needed",
      message: "Schedule your next appointment",
      time: "1 day ago",
    },
  ];

  return (
    <div className="pb-20">
      <div className="bg-card border-b border-border">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay on top of your health</p>
        </div>
      </div>

      <div className="p-6 space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "bg-card rounded-xl p-4 border transition-all hover:shadow-md",
              notification.type === "action"
                ? "border-warning bg-warning/5"
                : "border-border"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "rounded-full p-2 mt-1",
                  notification.type === "action"
                    ? "bg-warning/10"
                    : "bg-success/10"
                )}
              >
                {notification.type === "action" ? (
                  <AlertCircle className="w-5 h-5 text-warning" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {notification.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {notification.message}
                </p>
                <span className="text-xs text-muted-foreground">
                  {notification.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
