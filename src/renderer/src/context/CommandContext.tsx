import { ReactNode, createContext } from 'react';

export interface ICommandContext {
  command: Command;
}

const CommandContext = createContext<ICommandContext | undefined>(undefined);

interface ICommandProviderProps {
  children: ReactNode;
}

export const CommandProvider = ({ children }: ICommandProviderProps) => {
  return (
    <CommandContext.Provider
      value={{
        command: {
          config: {},
          type: 'analyze'
        }
      }}
    >
      {children}
    </CommandContext.Provider>
  );
};

export default CommandContext;
