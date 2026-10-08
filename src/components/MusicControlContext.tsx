import { createContext, useContext, ReactNode } from "react";
import type { MusicMode } from "../audio/musicSettings";

interface MusicControlValue {
  musicOn: boolean;
  musicMode: MusicMode;
  musicVolume: number;
  customFileName: string | null;
  persistWarning: string | null;
  formatError: string | null;
  settingsOpen: boolean;
  openMusicSettings: () => void;
  closeMusicSettings: () => void;
  onToggleMusic: () => void;
  setMusicMode: (mode: MusicMode) => void;
  setMusicVolume: (volume: number) => void;
  pickCustomMusic: (file: File) => Promise<void> | void;
}

const MusicControlContext = createContext<MusicControlValue | null>(null);

export function MusicControlProvider({
  value,
  children
}: {
  value: MusicControlValue;
  children: ReactNode;
}) {
  return <MusicControlContext.Provider value={value}>{children}</MusicControlContext.Provider>;
}

export function useMusicControl(): MusicControlValue {
  const value = useContext(MusicControlContext);
  if (!value) {
    throw new Error("useMusicControl must be used within MusicControlProvider");
  }
  return value;
}
