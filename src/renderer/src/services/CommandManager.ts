type ChannelType = 'log' | 'command-result';

class CommandManager {
  private static instance: CommandManager;
  private readonly commandQueue: Command[] = [];
  private readonly capacity: number = 1;
  private logHandlers: ((log: string) => void)[] = [];
  private commandResultHandlers: ((result: CommandResponse) => void)[] = [];

  private constructor() {
    window.api.onLog((_: unknown, log: string) => this.handleLog(log));
    window.api.onCommandResult((_: unknown, result: CommandResponse) => {
      this.handleCommandResult(result);
      this.commandQueue.shift();
    });
  }

  private handleLog(log: string): void {
    this.logHandlers.forEach((handler) => handler(log));
  }

  private handleCommandResult(result: CommandResponse): void {
    this.commandResultHandlers.forEach((handler) => handler(result));
  }

  public static getInstance(): CommandManager {
    // Singleton pattern
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager();
    }
    return CommandManager.instance;
  }

  public executeCommand(command: Command): void {
    if (!command) {
      this.handleCommandResult({ success: false, message: 'Command is required' });
      return;
    }

    if (this.commandQueue.length >= this.capacity) {
      this.handleCommandResult({ success: false, message: 'Command queue is full' });
      return;
    }

    this.commandQueue.push(command);
    window.api.sendCommand(command);
  }

  public subscribe(channel: ChannelType, handler: (data: any) => void): void {
    if (channel === 'log') {
      this.logHandlers.push(handler);
    } else if (channel === 'command-result') {
      this.commandResultHandlers.push(handler);
    }
  }

  public unsubscribe(channel: ChannelType, handler: (data: any) => void): void {
    if (channel === 'log') {
      this.logHandlers = this.logHandlers.filter((h) => h !== handler);
    } else if (channel === 'command-result') {
      this.commandResultHandlers = this.commandResultHandlers.filter((h) => h !== handler);
    }
  }
}

export default CommandManager;
