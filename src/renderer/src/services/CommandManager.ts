class CommandManager implements ICommandManager {
  private static instance: CommandManager;
  private readonly commandQueue: Command[] = [];
  private readonly capacity: number = 1;

  private constructor() {}

  public static getInstance(): CommandManager {
    // Singleton pattern
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager();
    }
    return CommandManager.instance;
  }

  public async executeCommand(command: Command): Promise<CommandResponse> {
    if (!command) {
      return { success: false, message: 'Command is required' };
    }

    if (this.commandQueue.length >= this.capacity) {
      return { success: false, message: 'Command queue is full' };
    }

    this.commandQueue.push(command);
    await window.api.sendCommand(command);
    const message: string = 'hey';
    // window.api.onCommandResult((result) => {
    //   message = result;
    // });
    console.log('command: ', command);
    this.commandQueue.shift();
    return { success: true, message };
  }
}

export default CommandManager;
