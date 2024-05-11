import { createContext, useState, ReactNode, FC } from 'react';

export type ModeType = Command['type'];

export interface IModeContext {
  mode: ModeType;
  setMode: (mode: ModeType) => void;
}

const ModeContext = createContext<IModeContext | undefined>(undefined);

interface IModeProviderProps {
  children: ReactNode;
}

export const ModeProvider: FC<IModeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ModeType>('analyze');

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
};

export default ModeContext;
