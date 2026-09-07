import { createContext, useContext, ReactNode } from "react";

interface MusicControlValue {
  musicOn: boolean;
  onToggleMusic: () => void;
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
