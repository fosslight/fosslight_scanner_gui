import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { execFile, spawn } from 'child_process';

class BinaryExecuter {
  private static instance: BinaryExecuter;
  private readonly venvPath = path.join(app.getAppPath(), 'resources', 'venv');
  private readonly pythonPath =
    process.platform == 'win32'
      ? path.join(this.venvPath, 'Scripts', 'python.exe')
      : path.join(this.venvPath, 'bin', 'python');
  private readonly activatePath =
    process.platform == 'win32'
      ? path.join(this.venvPath, 'Scripts', 'activate.bat')
      : path.join(this.venvPath, 'bin', 'activate');

  private constructor() {}

  public static getInstance(): BinaryExecuter {
    // Singleton pattern
    if (!BinaryExecuter.instance) {
      BinaryExecuter.instance = new BinaryExecuter();
    }
    return BinaryExecuter.instance;
  }

  public checkVenv(): boolean {
    if (!fs.existsSync(this.venvPath)) return false;
    if (!fs.existsSync(this.pythonPath)) return false;
    if (!fs.existsSync(this.activatePath)) return false;

    return true;
  }

  public async executeSetVenv(arg: string | undefined): Promise<boolean> {
    return new Promise((resolve, _) => {
      const binaryPath = path.join(app.getAppPath(), 'resources', 'set_venv');
      const args = arg ? [arg] : [];
      execFile(binaryPath, args, (error, _, stderr) => {
        if (error) {
          console.error(error);
          resolve(false);
        } else if (stderr) {
          console.error(stderr);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  public async executeScanner(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const binaryPath = path.join(app.getAppPath(), 'resources', 'run_scanner');
      const child = spawn(binaryPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

      child.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
      child.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

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
}

export default BinaryExecuter;
