"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  applyTimeTheme,
  getTimePeriod,
  TIME_THEMES,
  type TimePeriod,
  type TimeTheme,
} from "@/lib/timeTheme";

const TimeThemeContext = createContext<TimeTheme | null>(null);

export function useTimeTheme(): TimeTheme {
  const theme = useContext(TimeThemeContext);
  if (!theme) {
    return TIME_THEMES[getTimePeriod()];
  }
  return theme;
}

export default function TimeThemeProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<TimePeriod>("day");

  useEffect(() => {
    function syncTheme() {
      const next = getTimePeriod();
      setPeriod(next);
      applyTimeTheme(next);
    }

    syncTheme();
    const interval = window.setInterval(syncTheme, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <TimeThemeContext.Provider value={TIME_THEMES[period]}>
      {children}
    </TimeThemeContext.Provider>
  );
}
