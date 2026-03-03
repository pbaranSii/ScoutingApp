import { createContext, useContext, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import type { MatchPlayerSlot } from "@/features/observations/types";
import type { MatchHeaderFormValues } from "@/features/observations/components/MatchObservationHeaderForm";

type MatchObservationNewContextValue = {
  players: MatchPlayerSlot[];
  setPlayers: React.Dispatch<React.SetStateAction<MatchPlayerSlot[]>>;
  headerTeamNames: [string, string];
  setHeaderTeamNames: (home: string, away: string) => void;
  headerFormValues: MatchHeaderFormValues | null;
  setHeaderFormValues: (v: MatchHeaderFormValues | null) => void;
};

const MatchObservationNewContext = createContext<MatchObservationNewContextValue | null>(null);

export function useMatchObservationNew() {
  const ctx = useContext(MatchObservationNewContext);
  if (!ctx) throw new Error("useMatchObservationNew must be used within MatchObservationNewLayout");
  return ctx;
}

export function MatchObservationNewLayout() {
  const [players, setPlayers] = useState<MatchPlayerSlot[]>([]);
  const [headerTeamNames, setHeaderTeamNamesState] = useState<[string, string]>(["", ""]);
  const [headerFormValues, setHeaderFormValues] = useState<MatchHeaderFormValues | null>(null);
  const setHeaderTeamNames = useCallback((home: string, away: string) => {
    setHeaderTeamNamesState([home, away]);
  }, []);

  const value: MatchObservationNewContextValue = {
    players,
    setPlayers,
    headerTeamNames,
    setHeaderTeamNames,
    headerFormValues,
    setHeaderFormValues,
  };

  return (
    <MatchObservationNewContext.Provider value={value}>
      <Outlet />
    </MatchObservationNewContext.Provider>
  );
}
