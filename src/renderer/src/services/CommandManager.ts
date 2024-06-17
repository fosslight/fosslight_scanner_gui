type ChannelType = 'log' | 'command-result' | 'ready';

class CommandManager {
  private static instance: CommandManager;
  private readonly commandQueue: Command[] = [];
  private readonly capacity: number = 1;
  private logHandlers: ((log: string) => void)[] = [];
  private commandResultHandlers: ((result: CommandResponse) => void)[] = [];
  private readyHandlers: ((isReady: boolean) => void)[] = [];

  private constructor() {
    window.api.onLog((_: unknown, log: string) => this.handleLog(log));
    window.api.onCommandResult((_: unknown, result: CommandResponse) => {
      this.handleCommandResult(result);
      if (this.commandQueue.length > 0) {
        this.commandQueue.shift();
        this.handleReady(this.commandQueue.length < this.capacity);
      }
    });
  }

  private handleLog = (log: string): void => {
    this.logHandlers.forEach((handler) => handler(log));
  };

  private handleCommandResult = (result: CommandResponse): void => {
    this.commandResultHandlers.forEach((handler) => handler(result));
  };

  private handleReady = (isReady: boolean): void => {
    this.readyHandlers.forEach((handler) => handler(isReady));
  };

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
    this.handleReady(this.commandQueue.length < this.capacity);
    window.api.sendCommand(command);
  }

  public subscribe(channel: ChannelType, handler: (data: any) => void): void {
    if (channel === 'log') {
      this.logHandlers.push(handler);
    } else if (channel === 'command-result') {
      this.commandResultHandlers.push(handler);
    } else if (channel === 'ready') {
      this.readyHandlers.push(handler);
    }
  }

  public unsubscribe(channel: ChannelType, handler: (data: any) => void): void {
    if (channel === 'log') {
      this.logHandlers = this.logHandlers.filter((h) => h !== handler);
    } else if (channel === 'command-result') {
      this.commandResultHandlers = this.commandResultHandlers.filter((h) => h !== handler);
    } else if (channel === 'ready') {
      this.readyHandlers = this.readyHandlers.filter((h) => h !== handler);
    }
  }
}

export default CommandManager;
