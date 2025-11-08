import { Button } from "@/components/ui/button";
import { Edit2, LucideIcon } from "lucide-react";

interface MetricCardProps {
  metric: {
    title: string;
    value: string;
    icon: LucideIcon;
    color: string;
  };
  onEdit: () => void;
}

export const MetricCard = ({ metric, onEdit }: MetricCardProps) => {
  const Icon = metric.icon;
  
  return (
    <div className="bg-card rounded-2xl p-6 shadow-md border border-border hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`${metric.color} bg-muted rounded-xl p-3`}>
          <Icon className="w-6 h-6" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{metric.title}</h3>
      <p className="text-2xl font-bold text-foreground">{metric.value}</p>
    </div>
  );
};
