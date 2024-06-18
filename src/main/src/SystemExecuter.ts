import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { exec, spawn } from 'child_process';
import { ChildProcessByStdio } from 'child_process';
import { Readable } from 'stream';

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
  private child: ChildProcessByStdio<null, Readable, Readable> | null = null;

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

      const { stderr: installError } = await execPromise(
        this.pythonPath + ' -m pip install fosslight_scanner'
      );
      if (installError) {
        console.error('Install fosslight sccanner failed: ' + installError);
        return false;
      }

      /* TODO: This 'always update' takes long time. Need to check the version first.
      const { stderr: updateError } = await execPromise(
        this.pythonPath + ' -m pip install fosslight_scanner --upgrade --force-reinstall'
      );
      if (updateError) {
        console.error('Update fosslight sccanner failed: ' + updateError);
        return false;
      }
      */

      return true;
    } catch (error) {
      console.error('An Error occured while setting venv and fosslight_scanner: ' + error);
      return false;
    }
  }

  public async executeScanner(args: string[][]): Promise<string> {
    const mode: string = args[0].join(' ');
    const jobs: number = mode === 'compare' ? 1 : args[1].length + args[2].length;
    const finalArgs: string[] = [];

    for (let i = 0; i < jobs; i++) {
      finalArgs.length = 0;

      if (mode === 'compare') {
        const comparePath = '-p ' + args[1].join(' ');
        finalArgs.push(mode, comparePath, ...args[3]);
      } else {
        if (args[1][0] === 'undefined') {
          finalArgs.push(mode, '-p .', ...args[3]);
        } else if (i < args[1].length) {
          finalArgs.push(mode, '-p ' + args[1][i], ...args[3]);
        } else {
          finalArgs.push(mode, '-w ' + args[2][i - args[1].length], ...args[3]);
        }
      }

      try {
        await this.scanProcess(finalArgs);
      } catch (error) {
        return `${error}`;
      }
    }

    return 'Fosslight Scanner finished successfully';
  }

  public async saveSetting(setting: Setting): Promise<string> {
    return new Promise((resolve, reject) => {
      const settingPath = path.join(app.getAppPath(), 'resources', 'setting.json');
      fs.writeFile(settingPath, JSON.stringify(setting), (error) => {
        if (error) {
          reject(`Failed to save setting: ${error.message}`);
        } else {
          resolve('Setting file saved successfully');
        }
      });
    });
  }

  private scanProcess(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const shellCommand =
        process.platform === 'win32'
          ? `cmd.exe /c "${this.activatePath} && fosslight ${args.join(' ')}"`
          : `bash -c "source ${this.activatePath} && fosslight ${args.join(' ')}"`;

      this.child = spawn(shellCommand, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

      this.child.stdout.on('data', this.handleLog);
      this.child.stderr.on('data', this.handleLog);

      this.child.on('close', (code) => {
        this.child = null;
        code === 0
          ? resolve('Fosslight Scanner finished successfully')
          : reject(`Fosslight Scanner stopped with exit code: ${code}`);
      });

      this.child.on('error', (error) => {
        this.child = null;
        reject(`Failed to run Fosslight Scanner: ${error.message}`);
      });
    });
  }

  public forceQuit() {
    if (this.child) {
      try {
        process.platform == 'win32'
          ? exec(`taskkill /pid ${this.child.pid} /T /F`)
          : exec(`kill -9 ${this.child.pid}`);
      } catch (error) {
        console.error('Failed to force stop the fosslight scanner: ' + error);
      }
    }
  }

  private handleLog = (data: any): void => {
    this.logHandlers.forEach((handler) => handler(data.toString()));
  };

  public onLog(handler: (data: any) => void): void {
    this.logHandlers.push(handler);
  }

  public offLog(handler: (data: any) => void): void {
    this.logHandlers = this.logHandlers.filter((h) => h !== handler);
  }
}

export default SystemExecuter;
