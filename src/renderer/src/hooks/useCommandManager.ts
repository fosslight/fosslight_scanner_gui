import CommandContext from '@renderer/context/CommandContext';
import CommandManager from '@renderer/services/CommandManager';
import { parseLogToScanner, parseLogToSubject } from '@renderer/utils/parseLog';
import { useCallback, useContext, useEffect, useState } from 'react';

interface ScanningStatus {
  scanner: ScannerType | null;
  subject: string | null;
}
interface IUseCommandManager {
  command: Command | null;
  result: CommandResponse | null;
  log: string | null;
  idle: boolean;
  scanner: ScannerType | null;
  subject: string | null;
  analyze: () => void;
  compare: () => void;
  clearLog: () => void;
}

const useCommandManager = (): IUseCommandManager => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommandManager must be used within a CommandProvider.');
  }

  const commandManager = CommandManager.getInstance();
  const [result, setResult] = useState<CommandResponse | null>(null);
  const [log, setLog] = useState<string | null>(commandManager.logHistory === null ? null : '');
  const [idle, setIdle] = useState<boolean>(true);
  const [scanner, setScanner] = useState<ScannerType | null>(null);
  const [subject, setSubject] = useState<string | null>(null);

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

  const clearLog = useCallback(() => {
    commandManager.clearLog();
  }, []);

  const handleCommandResult = useCallback((result: CommandResponse) => {
    setScanner(null);
    setSubject(null);
    setResult(result);
  }, []);

  const handleLog = useCallback((log: string | null) => {
    if (log === null) {
      setLog(null);
    } else {
      const scanner = parseLogToScanner(log);
      if (scanner) setScanner(scanner);
      const subject = parseLogToSubject(log);
      if (subject) setSubject(subject);
      setLog((prev) => (prev ? `${prev}\n${log}` : log));
    }
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
    scanner,
    subject,
    analyze,
    compare,
    clearLog
  };
};

export default useCommandManager;
