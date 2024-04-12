let instantiated: boolean = false;

class CommandManager implements ICommandManager {
  private commandQueue: string[] = [];

  constructor() {
    // singleton pattern
    if (instantiated) {
      throw new Error('You can only create one instance.');
    }
    instantiated = true;
  }

  public async executeCommand(command: Command): Promise<CommandResponse> {
    return new Promise((resolve, reject) => {
      try {
        const exec = require('child_process').exec;
        exec(command, (error: any, stdout: any, stderr: any) => {
          if (error) {
            reject(error);
          }
          if (stderr) {
            reject(stderr);
          }
          resolve(stdout);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

const commandManager = Object.freeze(new CommandManager());
export default commandManager;
