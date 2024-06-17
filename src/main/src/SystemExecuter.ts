import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { exec, spawn } from 'child_process';

class SystemExecuter {
  private static instance: SystemExecuter;
  private readonly venvPath = path.join(app.getAppPath(), 'resources', 'venv');
  private readonly pythonPath =
    process.platform == 'win32'
      ? path.join(this.venvPath, 'Scripts', 'python.exe')
      : path.join(this.venvPath, 'bin', 'python');
  private readonly activatePath =
    process.platform == 'win32'
      ? path.join(this.venvPath, 'Scripts', 'activate.bat')
      : path.join(this.venvPath, 'bin', 'activate');
  private logHandlers: ((data: any) => void)[] = [];

  private constructor() {}

  public static getInstance(): SystemExecuter {
    // Singleton pattern
    if (!SystemExecuter.instance) {
      SystemExecuter.instance = new SystemExecuter();
    }
    return SystemExecuter.instance;
  }

  public checkVenv(): boolean {
    if (!fs.existsSync(this.venvPath)) return false;
    if (!fs.existsSync(this.pythonPath)) return false;
    if (!fs.existsSync(this.activatePath)) return false;

    return true;
  }

  public async executeSetVenv(arg: string | undefined): Promise<boolean> {
    const execPromise = util.promisify(exec);
    try {
      if (arg) {
        const { stderr: venvError } = await execPromise('python -m venv ' + this.venvPath);
        if (venvError) {
          console.error('Create venv failed: ' + venvError);
          return false;
        }
      }

      const { stderr: pipError } = await execPromise(
        this.pythonPath + ' -m pip install --upgrade pip'
      );
      if (pipError) {
        console.error('pip upgrade failed: ' + pipError);
        return false;
      }

      const { stderr: pythonError } = await execPromise(
        this.pythonPath + ' -m pip install fosslight_scanner'
      );
      if (pythonError) {
        console.error('Install and Update fosslight sccanner failed: ' + pythonError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('An Error occured while setting venv and fosslight_scanner: ' + error);
      return false;
    }
  }

  public async executeScanner(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const command = path.join(app.getAppPath(), 'resources', 'run_scanner');
      const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });

      child.stdout.on('data', this.handleLog.bind(this));
      child.stderr.on('data', this.handleLog.bind(this));

      child.on('close', (code) => {
        if (code === 0) {
          resolve('Fosslight Scanner finished successfully');
        } else {
          reject(`Fosslight Scanner stopped with exit code: ${code}`);
        }
      });

      child.on('error', (error) => {
        reject(`Failed to run Fosslight Scanner: ${error.message}`);
      });
    });
  }

  private handleLog(data: any): void {
    this.logHandlers.forEach((handler) => handler(data.toString()));
  }

  public onLog(handler: (data: any) => void): void {
    this.logHandlers.push(handler);
  }

  public offLog(handler: (data: any) => void): void {
    this.logHandlers = this.logHandlers.filter((h) => h !== handler);
  }
}

export default SystemExecuter;
