import { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { EditMetricModal } from "@/components/EditMetricModal";
import { Moon, Activity, Heart, Lightbulb } from "lucide-react";

export type MetricType = "sleep" | "fitness" | "heart" | "insights";

interface Metric {
  id: MetricType;
  title: string;
  value: string;
  icon: typeof Moon;
  color: string;
}

const Home = () => {
  const [metrics, setMetrics] = useState<Metric[]>([
    { id: "sleep", title: "Sleep", value: "7.5 hours", icon: Moon, color: "text-accent" },
    { id: "fitness", title: "Fitness", value: "8,432 steps", icon: Activity, color: "text-secondary" },
    { id: "heart", title: "Heart", value: "72 bpm", icon: Heart, color: "text-destructive" },
    { id: "insights", title: "Insights", value: "3 new tips", icon: Lightbulb, color: "text-warning" },
  ]);

  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);

  const handleSaveMetric = (value: string) => {
    if (editingMetric) {
      setMetrics(metrics.map(m => 
        m.id === editingMetric.id ? { ...m, value } : m
      ));
      setEditingMetric(null);
    }
  };

  return (
    <div className="pb-20">
      <div className="bg-card border-b border-border">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-foreground">Current State</h1>
          <p className="text-muted-foreground mt-1">Your health overview</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            onEdit={() => setEditingMetric(metric)}
          />
        ))}
      </div>

      <EditMetricModal
        metric={editingMetric}
        onClose={() => setEditingMetric(null)}
        onSave={handleSaveMetric}
      />
    </div>
  );
};

export default Home;
