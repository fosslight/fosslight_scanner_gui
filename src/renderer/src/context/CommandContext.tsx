import { createContext } from 'react';

export interface ICommandContext {
  command: Command;
}

const CommandContext = createContext<ICommandContext | undefined>(undefined);

export default CommandContext;
