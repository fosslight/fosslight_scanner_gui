import CommandContext from '@renderer/context/CommandContext';
import CommandManager from '@renderer/services/CommandManager';
import { useCallback, useContext, useEffect, useState } from 'react';

const useCommandManager = (): {
  analyze: () => Promise<CommandResponse>;
  compare: () => Promise<CommandResponse>;
  result: string | null;
  log: string | null;
} => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommandManager must be used within a CommandProvider.');
  }

  const commandManager = CommandManager.getInstance();
  const [result, setResult] = useState<string | null>(null);
  const [log, setLog] = useState<string | null>(null);

  const analyze = useCallback(async (): Promise<CommandResponse> => {
    return commandManager.executeCommand({ type: 'analyze', config: context.analyzeCommandConfig });
  }, [context]);

  const compare = useCallback(async (): Promise<CommandResponse> => {
    return commandManager.executeCommand({ type: 'compare', config: context.compareCommandConfig });
  }, [context]);

  const handleCommandResult = useCallback((result: CommandResponse) => {
    setResult(result.message ?? null);
  }, []);

  const handleLog = useCallback((log: string) => {
    setLog(log);
  }, []);

  useEffect(() => {
    window.api.onCommandResult(handleCommandResult);
    window.api.onLog(handleLog);

    return () => {
      window.api.removeCommandResultListener(handleCommandResult);
      window.api.removeLogListener(handleLog);
    };
  }, []);

  return {
    analyze,
    compare,
    result,
    log
  };
};

export default useCommandManager;
