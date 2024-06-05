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

  const createCommand = useCallback(
    (type: Command['type']): Command =>
      type === 'analyze'
        ? { type, config: context.analyzeCommandConfig }
        : { type, config: context.compareCommandConfig },
    [context]
  );

  const analyze = useCallback(async (): Promise<CommandResponse> => {
    return commandManager.executeCommand(createCommand('analyze'));
  }, []);

  const compare = useCallback(async (): Promise<CommandResponse> => {
    return commandManager.executeCommand(createCommand('compare'));
  }, []);

  // Memory leakage possible
  useEffect(() => {
    window.api.onCommandResult((result) => {
      setResult(result);
    });
    window.api.onLog((log) => {
      setLog(log);
    });

    // return () => {
    //   window.api.offCommandResult();
    //   window.api.offLog();
    // };
  }, []);

  return {
    analyze,
    compare,
    result,
    log
  };
};

export default useCommandManager;
