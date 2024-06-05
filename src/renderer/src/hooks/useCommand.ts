import CommandContext from '@renderer/context/CommandContext';
import { useCallback, useContext } from 'react';

interface IUseCommand {
  updateAnalyzeCommandConfig: (config: AnalyzeCommandConfig) => void;
  updateCompareCommandConfig: (config: CompareCommandConfig) => void;
}

const useCommand = (): IUseCommand => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider.');
  }

  const updateAnalyzeCommandConfig = useCallback(
    (config: AnalyzeCommandConfig) => {
      context.setAnalyzeCommandConfig({ ...context.analyzeCommandConfig, ...config });
    },
    [context]
  );

  const updateCompareCommandConfig = useCallback(
    (config: CompareCommandConfig) => {
      context.setCompareCommandConfig({ ...context.compareCommandConfig, ...config });
    },
    [context]
  );

  return { updateAnalyzeCommandConfig, updateCompareCommandConfig };
};

export default useCommand;
