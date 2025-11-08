import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditMetricModalProps {
  metric: {
    title: string;
    value: string;
  } | null;
  onClose: () => void;
  onSave: (value: string) => void;
}

export const EditMetricModal = ({ metric, onClose, onSave }: EditMetricModalProps) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (metric) {
      setValue(metric.value);
    }
  }, [metric]);

  const handleSave = () => {
    onSave(value);
  };

  return (
    <Dialog open={!!metric} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {metric?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              New Value
            </label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter new value"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
