import CommandContext from '@renderer/context/CommandContext';
import { useCallback, useContext } from 'react';

interface IUseCommandConfig {
  updateAnalyzeCommandConfig: (config: Partial<AnalyzeCommandConfig>) => void;
  updateCompareCommandConfig: (config: Partial<CompareCommandConfig>) => void;
}

const useCommandConfig = (): IUseCommandConfig => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider.');
  }

  const updateAnalyzeCommandConfig = useCallback(
    (config: Partial<AnalyzeCommandConfig>) => {
      context.setAnalyzeCommandConfig({ ...context.analyzeCommandConfig, ...config });
    },
    [context]
  );

  const updateCompareCommandConfig = useCallback(
    (config: Partial<CompareCommandConfig>) => {
      context.setCompareCommandConfig({ ...context.compareCommandConfig, ...config });
    },
    [context]
  );

  return { updateAnalyzeCommandConfig, updateCompareCommandConfig };
};

export default useCommandConfig;
