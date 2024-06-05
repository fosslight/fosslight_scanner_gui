import { FC, ReactNode, createContext, useState } from 'react';

export interface ICommandContext {
  analyzeCommandConfig: AnalyzeCommandConfig;
  compareCommandConfig: CompareCommandConfig;
  setAnalyzeCommandConfig: (config: AnalyzeCommandConfig) => void;
  setCompareCommandConfig: (config: CompareCommandConfig) => void;
}

const CommandContext = createContext<ICommandContext | undefined>(undefined);

interface ICommandProviderProps {
  children: ReactNode;
}

export const CommandProvider: FC<ICommandProviderProps> = ({ children }) => {
  const [analyzeCommandConfig, setAnalyzeCommandConfig] = useState<AnalyzeCommandConfig>({});
  const [compareCommandConfig, setCompareCommandConfig] = useState<CompareCommandConfig>({});

  return (
    <CommandContext.Provider
      value={{
        analyzeCommandConfig,
        compareCommandConfig,
        setAnalyzeCommandConfig,
        setCompareCommandConfig
      }}
    >
      {children}
    </CommandContext.Provider>
  );
};

export default CommandContext;
