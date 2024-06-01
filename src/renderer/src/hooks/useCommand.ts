import CommandContext from '@renderer/context/CommandContext';
import { useCallback, useContext } from 'react';

interface IUseCommand {
  createCommand: (type: Command['type']) => Command;
}

const useCommand = (): IUseCommand => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider');
  }

  const createCommand = useCallback(
    (type: Command['type']) =>
      type === 'analyze'
        ? {
            type,
            config: context.analyzeCommandConfig || {}
          }
        : {
            type,
            config: context.compareCommandConfig || {}
          },

    [context]
  );

  return {
    createCommand
  };
};

export default useCommand;
