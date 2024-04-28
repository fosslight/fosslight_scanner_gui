import CommandManager from '@renderer/services/CommandManager';
import { useCallback, useEffect, useState } from 'react';

const useCommandManager = (): {
  analyze: (config: AnalyzeCommandConfig) => Promise<CommandResponse>;
  compare: (config: CompareCommandConfig) => Promise<CommandResponse>;
  result: string | null;
  log: string | null;
} => {
  const commandManager = CommandManager.getInstance();
  const [result, setResult] = useState<string | null>(null);
  const [log, setLog] = useState<string | null>(null);

  const analyze = useCallback(async (config: AnalyzeCommandConfig): Promise<CommandResponse> => {
    return commandManager.executeCommand({ type: 'analyze', config });
  }, []);

  const compare = useCallback(async (config: CompareCommandConfig): Promise<CommandResponse> => {
    return commandManager.executeCommand({ type: 'compare', config });
  }, []);

  // Memory leakage possible
  useEffect(() => {
    window.api.onCommandResult((result) => {
      setResult(result);
    });
    window.api.onLog((log) => {
      setLog(log);
    });
  }, []);

  return {
    analyze,
    compare,
    result,
    log
  };
};

export default useCommandManager;
