import { createContext, useContext, useState, type ReactNode } from "react";


export interface HealthContextType {
  healthValue: number;
  setHealthValue: (v: number) => void;

  alert: {
    title: string;
    message: string;
    severity: "caution" | "critical";
  } | null;
  setAlert: (a: HealthContextType["alert"]) => void;

  dismissNotification: () => void;

  history: {
    title: string;
    message: string;
    severity: string;
    timestamp: string;
  }[];
  addHistory: (item: {
    title: string;
    message: string;
    severity: string;
  }) => void;
}

const HealthContext = createContext<HealthContextType | null>(null);

export const HealthProvider = ({ children }: { children: ReactNode }) => {
  const [healthValue, setHealthValue] = useState(0);

  const [alert, setAlert] = useState<HealthContextType["alert"]>(null);

  const [history, setHistory] = useState<
    { title: string; message: string; severity: string; timestamp: string }[]
  >([]);

  const dismissNotification = () => {
    setAlert(null);
  };

  const addHistory = (item: {
    title: string;
    message: string;
    severity: string;
  }) => {
    setHistory((prev) => [
      {
        ...item,
        timestamp: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  };

  return (
    <HealthContext.Provider
      value={{
        healthValue,
        setHealthValue,
        alert,
        setAlert,
        dismissNotification,
        history,
        addHistory,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const ctx = useContext(HealthContext);
  if (!ctx) {
    throw new Error("useHealth must be used inside HealthProvider");
  }
  return ctx;
};
