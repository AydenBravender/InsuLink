import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Moon, Activity, Heart, Lightbulb } from "lucide-react";

type Metric = {
  title: string;
  value: string;
  icon: typeof Moon;
  color: string;
};

const Index = () => {
  const navigate = useNavigate();

  const metrics: Metric[] = useMemo(
    () => [
      { title: "Sleep", value: "7.5 hours", icon: Moon, color: "text-accent" },
      { title: "Fitness", value: "8,432 steps", icon: Activity, color: "text-secondary" },
      { title: "Heart", value: "72 bpm", icon: Heart, color: "text-destructive" },
      { title: "Insights", value: "3 new tips", icon: Lightbulb, color: "text-warning" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Dashboard preview */}
          <section className="md:col-span-2 space-y-4">
            <header className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground">Insulink</h1>
              <p className="text-muted-foreground">Your personal health companion — preview</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metrics.map((m, idx) => (
                <MetricCard
                  key={`${m.title}-${idx}`}
                  metric={m}
                  onEdit={() => navigate("/login")}
                />)
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Sign in to edit your metrics, chat with the AI assistant, manage routines, and view notifications.
            </p>
          </section>

          {/* Right: Auth CTA */}
          <aside className="md:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md sticky top-6">
              <h2 className="text-xl font-semibold text-foreground">Get Started</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create an account or log in to continue.
              </p>

              <div className="mt-6 space-y-3">
                <Button className="w-full" size="lg" onClick={() => navigate("/login")}>Sign Up</Button>
                <Button className="w-full" size="lg" variant="outline" onClick={() => navigate("/login")}>
                  Log In
                </Button>
              </div>

              <div className="mt-6 text-xs text-muted-foreground">
                Demo only — no real accounts required. Proceeding takes you to the existing login screen.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Index;
