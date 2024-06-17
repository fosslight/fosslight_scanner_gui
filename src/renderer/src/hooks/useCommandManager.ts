import CommandContext from '@renderer/context/CommandContext';
import CommandManager from '@renderer/services/CommandManager';
import { useCallback, useContext, useEffect, useState } from 'react';
import AnsiToHtml from 'ansi-to-html';

const useCommandManager = (): {
  analyze: () => void;
  compare: () => void;
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

  const analyze = useCallback((): void => {
    commandManager.executeCommand({ type: 'analyze', config: context.analyzeCommandConfig });
  }, [context]);

  const compare = useCallback((): void => {
    commandManager.executeCommand({ type: 'compare', config: context.compareCommandConfig });
  }, [context]);

  const handleCommandResult = useCallback((result: CommandResponse) => {
    setResult(result.message ?? null);
    console.log(result);
  }, []);

  const handleLog = useCallback((log: string) => {
    const converter = new AnsiToHtml();
    const htmlLog = converter.toHtml(log);
    setLog((prev) => (prev ? `${prev}\n${log}` : log));
  }, []);

  useEffect(() => {
    commandManager.subscribe('command-result', handleCommandResult);
    commandManager.subscribe('log', handleLog);

    return () => {
      commandManager.unsubscribe('command-result', handleCommandResult);
      commandManager.unsubscribe('log', handleLog);
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
