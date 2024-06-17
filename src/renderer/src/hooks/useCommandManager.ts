import CommandContext from '@renderer/context/CommandContext';
import CommandManager from '@renderer/services/CommandManager';
import { parseLog } from '@renderer/utils/parseLog';
import { useCallback, useContext, useEffect, useState } from 'react';

const useCommandManager = (): {
  analyze: () => void;
  compare: () => void;
  result: string | null;
  log: string | null;
  ready: boolean;
} => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommandManager must be used within a CommandProvider.');
  }

  const commandManager = CommandManager.getInstance();
  const [result, setResult] = useState<string | null>(null);
  const [log, setLog] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(true);

  const analyze = useCallback((): void => {
    if (!ready) return;
    commandManager.executeCommand({ type: 'analyze', config: context.analyzeCommandConfig });
  }, [context, ready]);

  const compare = useCallback((): void => {
    if (!ready) return;
    commandManager.executeCommand({ type: 'compare', config: context.compareCommandConfig });
  }, [context, ready]);

  const handleCommandResult = useCallback((result: CommandResponse) => {
    setResult(result.message ?? null);
    console.log(result);
  }, []);

  const handleLog = useCallback((log: string) => {
    const scanner = parseLog(log);
    console.log(scanner);
    setLog((prev) => (prev ? `${prev}\n${log}` : log));
  }, []);

  const handleReady = useCallback((ready: boolean) => {
    setReady(ready);
  }, []);

  useEffect(() => {
    commandManager.subscribe('command-result', handleCommandResult);
    commandManager.subscribe('log', handleLog);
    commandManager.subscribe('ready', handleReady);

    return () => {
      commandManager.unsubscribe('command-result', handleCommandResult);
      commandManager.unsubscribe('log', handleLog);
      commandManager.unsubscribe('ready', handleReady);
    };
  }, []);

  return {
    analyze,
    compare,
    result,
    log,
    ready
  };
};

export default useCommandManager;
