import CommandManager from '@renderer/services/CommandManager';

const useCommandManager = (): {
  analyze: (config: AnalyzeCommandConfig) => Promise<CommandResponse>;
  compare: (config: CompareCommandConfig) => Promise<CommandResponse>;
} => {
  const commandManager = CommandManager.getInstance();

  const analyze = async (config: AnalyzeCommandConfig): Promise<CommandResponse> => {
    return commandManager.executeCommand({ type: 'analyze', config });
  };

  const compare = async (config: CompareCommandConfig): Promise<CommandResponse> => {
    return commandManager.executeCommand({ type: 'compare', config });
  };

  return {
    analyze,
    compare
  };
};

export default useCommandManager;
