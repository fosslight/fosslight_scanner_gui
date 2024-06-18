import CommandContext from '@renderer/context/CommandContext';
import { useCallback, useContext, useEffect, useState } from 'react';

interface IUseCommandConfig {
  analyzeCommandConfig: AnalyzeCommandConfig;
  compareCommandConfig: CompareCommandConfig;
  readyToAnalyze: boolean;
  readyToCompare: boolean;
  updateAnalyzeCommandConfig: (config: Partial<AnalyzeCommandConfig>) => void;
  updateCompareCommandConfig: (config: Partial<CompareCommandConfig>) => void;
}

const useCommandConfig = (): IUseCommandConfig => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider.');
  }

  const [readyToAnalyze, setReadyToAnalyze] = useState<boolean>(false);
  const [readyToCompare, setReadyToCompare] = useState<boolean>(false);

  const requiredFieldsForAnalyze = [
    'mode',
    'subjects',
    'outputFormat',
    'outputPath',
    'outputFileName'
  ];
  const requiredFieldsForCompare = ['reports', 'outputFormat', 'outputPath', 'outputFileName'];

  useEffect(() => {
    const ready = requiredFieldsForAnalyze.every((field) => {
      const value = context.analyzeCommandConfig[field];
      return (
        (value instanceof Array && value.length > 0) ||
        (typeof value === 'string' && value.length > 0)
      );
    });
    setReadyToAnalyze(ready);
  }, [context.analyzeCommandConfig]);

  useEffect(() => {
    const ready = requiredFieldsForCompare.every((field) => {
      const value = context.compareCommandConfig[field];
      if (field === 'reports') {
        return value instanceof Array && value[0] && value[1];
      }
      return (
        (value instanceof Array && value.length > 0) ||
        (typeof value === 'string' && value.length > 0)
      );
    });
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
    analyzeCommandConfig: context.analyzeCommandConfig,
    compareCommandConfig: context.compareCommandConfig,
    readyToAnalyze,
    readyToCompare,
    updateAnalyzeCommandConfig,
    updateCompareCommandConfig
  };
};

export default useCommandConfig;
