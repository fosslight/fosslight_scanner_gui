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
    const res = window.api.sendCommand(command);
    return new Promise((resolve, reject) => {
      try {
        // spawn(command, (error: any, stdout: any, stderr: any) => {
        //   if (error) {
        //     reject(error);
        //   }
        //   if (stderr) {
        //     reject(stderr);
        //   }
        //   resolve(stdout);
        // });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default CommandManager;
