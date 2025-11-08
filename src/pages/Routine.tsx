import { Button } from "@/components/ui/button";
import { Syringe, Moon, Activity } from "lucide-react";

interface RoutineItem {
  id: string;
  title: string;
  suggestedTime: string;
  icon: typeof Syringe;
  color: string;
}

const Routine = () => {
  const routines: RoutineItem[] = [
    {
      id: "insulin",
      title: "Insulin Timing",
      suggestedTime: "8:00 AM & 6:00 PM",
      icon: Syringe,
      color: "text-primary",
    },
    {
      id: "sleep",
      title: "Sleep",
      suggestedTime: "10:30 PM - 6:30 AM",
      icon: Moon,
      color: "text-accent",
    },
    {
      id: "fitness",
      title: "Fitness",
      suggestedTime: "7:00 AM (30 min)",
      icon: Activity,
      color: "text-secondary",
    },
  ];

  return (
    <div className="pb-20">
      <div className="bg-card border-b border-border">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-foreground">My Routine</h1>
          <p className="text-muted-foreground mt-1">Daily health schedule</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {routines.map((routine) => {
          const Icon = routine.icon;
          return (
            <div
              key={routine.id}
              className="bg-card rounded-2xl p-6 shadow-md border border-border"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`${routine.color} bg-muted rounded-xl p-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {routine.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Suggested: {routine.suggestedTime}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Routine;
