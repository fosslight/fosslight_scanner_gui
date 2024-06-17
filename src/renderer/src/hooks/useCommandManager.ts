import CommandContext from '@renderer/context/CommandContext';
import CommandManager from '@renderer/services/CommandManager';
import { ScannerType, parseLog } from '@renderer/utils/parseLog';
import { useCallback, useContext, useEffect, useState } from 'react';

interface IUseCommandManager {
  analyze: () => void;
  compare: () => void;
  result: string | null;
  log: string | null;
  idle: boolean;
  status: ScannerType | null;
}

const useCommandManager = (): IUseCommandManager => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommandManager must be used within a CommandProvider.');
  }

  const commandManager = CommandManager.getInstance();
  const [result, setResult] = useState<string | null>(null);
  const [log, setLog] = useState<string | null>(null);
  const [idle, setIdle] = useState<boolean>(true);
  const [status, setStatus] = useState<ScannerType | null>(null);

  const analyze = useCallback((): void => {
    if (!idle) return;
    commandManager.executeCommand({ type: 'analyze', config: context.analyzeCommandConfig });
  }, [context, idle]);

  const compare = useCallback((): void => {
    if (!idle) return;
    commandManager.executeCommand({ type: 'compare', config: context.compareCommandConfig });
  }, [context, idle]);

  const handleCommandResult = useCallback((result: CommandResponse) => {
    setStatus(null);
    setResult(result.message ?? null);
    console.log(result);
  }, []);

  const handleLog = useCallback((log: string) => {
    const status = parseLog(log);
    if (status) setStatus(status);
    setLog((prev) => (prev ? `${prev}\n${log}` : log));
  }, []);

  const handleReady = useCallback((idle: boolean) => {
    setIdle(idle);
  }, []);

  useEffect(() => {
    commandManager.subscribe('command-result', handleCommandResult);
    commandManager.subscribe('log', handleLog);
    commandManager.subscribe('idle', handleReady);

    return () => {
      commandManager.unsubscribe('command-result', handleCommandResult);
      commandManager.unsubscribe('log', handleLog);
      commandManager.unsubscribe('idle', handleReady);
    };
  }, []);

  return {
    analyze,
    compare,
    result,
    log,
    idle,
    status
  };
};

export default useCommandManager;
