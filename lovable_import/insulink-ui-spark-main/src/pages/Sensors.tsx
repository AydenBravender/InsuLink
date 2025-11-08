import { Activity, Heart, Brain } from "lucide-react";

const Sensors = () => {
  const sensors = [
    {
      id: "ecg",
      title: "ECG",
      description: "Electrocardiogram monitoring",
      icon: Heart,
      color: "text-destructive",
    },
    {
      id: "emg",
      title: "EMG",
      description: "Electromyography tracking",
      icon: Activity,
      color: "text-secondary",
    },
    {
      id: "eeg",
      title: "EEG",
      description: "Electroencephalography analysis",
      icon: Brain,
      color: "text-accent",
    },
  ];

  return (
    <div className="pb-20">
      <div className="bg-card border-b border-border">
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-foreground">Sensors</h1>
          <p className="text-muted-foreground mt-1">Coming soon</p>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-muted rounded-2xl p-8 text-center mb-6">
          <div className="flex justify-center gap-6 mb-6">
            {sensors.map((sensor) => {
              const Icon = sensor.icon;
              return (
                <div
                  key={sensor.id}
                  className={`${sensor.color} bg-background rounded-xl p-4`}
                >
                  <Icon className="w-8 h-8" />
                </div>
              );
            })}
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            ECG / EMG / EEG Integration
          </h2>
          <p className="text-muted-foreground">
            Advanced biosensor integration is coming soon to provide you with comprehensive health insights.
          </p>
        </div>

        <div className="space-y-3">
          {sensors.map((sensor) => {
            const Icon = sensor.icon;
            return (
              <div
                key={sensor.id}
                className="bg-card rounded-xl p-4 border border-border opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className={`${sensor.color} bg-muted rounded-lg p-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{sensor.title}</h3>
                    <p className="text-sm text-muted-foreground">{sensor.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sensors;
