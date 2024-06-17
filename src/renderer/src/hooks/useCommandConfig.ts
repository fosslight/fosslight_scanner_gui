import CommandContext from '@renderer/context/CommandContext';
import { useCallback, useContext, useEffect, useState } from 'react';

interface IUseCommandConfig {
  updateAnalyzeCommandConfig: (config: Partial<AnalyzeCommandConfig>) => void;
  updateCompareCommandConfig: (config: Partial<CompareCommandConfig>) => void;
  readyToAnalyze: boolean;
  readyToCompare: boolean;
}

const useCommandConfig = (): IUseCommandConfig => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider.');
  }

  const [readyToAnalyze, setReadyToAnalyze] = useState<boolean>(false);
  const [readyToCompare, setReadyToCompare] = useState<boolean>(false);

  const requiredFieldsForAnalyze = ['mode', 'path', 'outputFormat', 'outputPath', 'outputFileName'];
  const requiredFieldsForCompare = ['reports', 'outputFormat', 'outputPath', 'outputFileName'];

  useEffect(() => {
    const ready = requiredFieldsForAnalyze.every((field) => context.analyzeCommandConfig[field]);
    setReadyToAnalyze(ready);
  }, [context.analyzeCommandConfig]);

  useEffect(() => {
    const ready = requiredFieldsForCompare.every((field) => context.compareCommandConfig[field]);
    setReadyToCompare(ready);
  }, [context.compareCommandConfig]);

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

  return {
    readyToAnalyze,
    readyToCompare,
    updateAnalyzeCommandConfig,
    updateCompareCommandConfig
  };
};

export default useCommandConfig;
