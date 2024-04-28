import { spawn } from 'child_process';

class CommandManager implements ICommandManager {
  private static instance: CommandManager;
  private commandQueue: Command[] = [];

  private constructor() {}

  public static getInstance(): CommandManager {
    // Singleton pattern
    if (!CommandManager.instance) {
      CommandManager.instance = new CommandManager();
    }
    return CommandManager.instance;
  }

  public async executeCommand(command: Command): Promise<CommandResponse> {
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
