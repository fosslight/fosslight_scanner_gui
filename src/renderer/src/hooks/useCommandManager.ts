import CommandContext from '@renderer/context/CommandContext';
import CommandManager from '@renderer/services/CommandManager';
import { parseLog } from '@renderer/utils/parseLog';
import { useCallback, useContext, useEffect, useState } from 'react';

interface IUseCommandManager {
  command: Command | null;
  result: CommandResponse | null;
  log: string | null;
  idle: boolean;
  status: ScannerType | null;
  analyze: () => void;
  compare: () => void;
}

const useCommandManager = (): IUseCommandManager => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommandManager must be used within a CommandProvider.');
  }

  const commandManager = CommandManager.getInstance();
  const [result, setResult] = useState<CommandResponse | null>(null);
  const [log, setLog] = useState<string | null>(null);
  const [idle, setIdle] = useState<boolean>(true);
  const [status, setStatus] = useState<ScannerType | null>(null);

  const analyze = useCallback((): void => {
    if (!idle) return;
    const command: Command = { type: 'analyze', config: context.analyzeCommandConfig };
    commandManager.executeCommand(command);
  }, [context, idle]);

  const compare = useCallback((): void => {
    if (!idle) return;
    const command: Command = { type: 'compare', config: context.compareCommandConfig };
    commandManager.executeCommand(command);
  }, [context, idle]);

  const handleCommandResult = useCallback((result: CommandResponse) => {
    setStatus(null);
    setResult(result);
  }, []);

  const handleLog = useCallback((log: string) => {
    const status = parseLog(log);
    if (status) setStatus(status);
    setLog((prev) => (prev ? `${prev}\n${log}` : log));
  }, []);

  const handleIdle = useCallback((idle: boolean) => {
    setIdle(idle);
  }, []);

  useEffect(() => {
    commandManager.subscribe('command-result', handleCommandResult);
    commandManager.subscribe('log', handleLog);
    commandManager.subscribe('idle', handleIdle);

    return () => {
      commandManager.unsubscribe('command-result', handleCommandResult);
      commandManager.unsubscribe('log', handleLog);
      commandManager.unsubscribe('idle', handleIdle);
    };
  }, []);

  return {
    command: commandManager.command,
    result,
    log,
    idle,
    status,
    analyze,
    compare
  };
};

export default useCommandManager;
