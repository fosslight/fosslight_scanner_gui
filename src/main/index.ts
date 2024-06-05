import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { dirname, join, resolve } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png';
import { fileURLToPath } from 'url';
import BinaryExecuter from './src/BinaryExecuter';
import commandParser from './src/CommandParser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const binaryExecuter = BinaryExecuter.getInstance();

let mainWindow: BrowserWindow;
let hiddenWindow: BrowserWindow;

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/visible.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  // if (is.dev) {
  //   mainWindow.loadURL('http://localhost:3000');
  // } else {
  mainWindow.loadFile(join(__dirname, '../src/renderer/index.html'));
  // }
}

function createHiddenWindow(): void {
  hiddenWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/hidden.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  hiddenWindow.loadFile(join(__dirname, '../src/background/index.html'));
  // const devUrl = 'http://localhost:3001';
  // if (is.dev) {
  //   hiddenWindow.loadURL(devUrl);
  // } else {
  //   hiddenWindow.loadFile(join(__dirname, '../background/index.html'));
  // }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();
  createHiddenWindow();

  const arg = !binaryExecuter.checkVenv() ? 'false' : undefined; // assign any string is fine
  console.log('Waiting for setting venv and Fosslight Scanner');
  const progressInterval = setInterval(() => {
    process.stdout.write('.');
  }, 500); // 설치하는 동안 500ms 간격으로 점 출력

  // Will take a long time (about 3 min) when the first install the venv and fs.
  const setVenv: boolean = await binaryExecuter.executeSetVenv(arg);

  if (!setVenv) {
    console.error(
      '[Error]: Failed to set venv and install Fosslight Scanner.\n\t Please check the resources folder and files are in initial condition.\n\t Or try to reinstall this app.'
    );
  } else {
    console.log('Fosslight Scanner is ready to use.');
  }
  clearInterval(progressInterval); // 점 출력 정지

  // IPC communication between main and hidden windows
  ipcMain.on('send-command', async (event, { command }) => {
    const args: string[] = commandParser.parseCommand(command);

    // check venv and fs before executing.
    if (!binaryExecuter.checkVenv()) {
      console.error(
        '[Error]: Failed to run Fosslight Scanner.\n\t Please check the resources folder and files are in initial condition.\n\t Or try to reinstall this app.'
      );
    } else {
      const result: string = await binaryExecuter.executeScanner(args);

      const message =
        command.type === 'analyze'
          ? 'Analyze command executed successfully'
          : 'Compare command executed successfully';

      event.reply('recv-command-result', result); // 화면에 보임
      hiddenWindow.webContents.send('recv-command', { result }); // 콘솔에 찍힘
    }
  });

  ipcMain.on('send-log', (_, { log }) => {
    console.log('log result: ', log);
    mainWindow.webContents.send('recv-log', { log });
  });

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
