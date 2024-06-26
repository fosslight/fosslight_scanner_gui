import { app, shell, BrowserWindow, ipcMain, screen, dialog } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import SystemExecuter from './src/SystemExecuter';
import commandParser from './src/CommandParser';

const systemExecuter = SystemExecuter.getInstance();

let mainWindow: BrowserWindow;

function createWindow(): void {
  const display = screen.getPrimaryDisplay();

  mainWindow = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? {} : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
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

  // HMR for renderer based on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
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

  const arg = !systemExecuter.checkVenv() ? 'false' : undefined; // assign any string is fine
  await new Promise((resolve) => setTimeout(resolve, 500)); // await little time for window to send the following message
  mainWindow.webContents.send(
    'recv-log',
    'Please wait for setting venv and Fosslight Scanner (will take a few minutes)\nYou may not interact with this app during this time.'
  );
  // await new Promise((resolve) => setTimeout(resolve, 500));

  const progressInterval = setInterval(() => {
    mainWindow.webContents.send('recv-log', '.');
  }, 1000); // print '.' every 1ms while setting

  // Will take a long time (about 3 min) when the first install the venv and fs.
  const setVenv: string = await systemExecuter.executeSetVenv(arg);
  if (setVenv === 'success') {
    mainWindow.webContents.send('recv-log', 'Fosslight Scanner is ready to use.');
  } else {
    mainWindow.webContents.send('recv-log', setVenv);
  }
  clearInterval(progressInterval); // stop printing '.'

  // IPC communication between main and renderers
  ipcMain.on('send-command', async (_, { command }) => {
    const args: string[][] = commandParser.parseCmd2Args(command);
    // check venv and fs before executing.
    if (!systemExecuter.checkVenv()) {
      mainWindow.webContents.send(
        'recv-log',
        '[Error]: Failed to run Fosslight Scanner.\nPlease check the resources folder and files are in initial condition.\nOr try to reinstall this app.'
      );
    } else {
      const scannerResult: CommandResponse = await systemExecuter.executeScanner(args);
      mainWindow.webContents.send('recv-command-result', scannerResult);
      const setting: Setting = commandParser.parseArgs2Setting(args, command.type);
      await systemExecuter.saveSetting(setting);
    }
  });

  ipcMain.on('force-quit', () => {
    systemExecuter.forceQuit();
  });

  ipcMain.on('minimizeApp', () => {
    console.log('minimizeApp');
    mainWindow.minimize();
  });

  ipcMain.on('maximizeApp', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('closeApp', () => {
    mainWindow.close();
  });

  ipcMain.on('open-file-explorer', (_, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle('open-file-selector', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile']
    });
    return result.filePaths[0];
  });

  ipcMain.handle('open-dir-selector', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.filePaths[0];
  });

  // IPC communication between main and FOSSLight Scanner
  systemExecuter.onLog((data: any) => {
    console.log(data.toString());
    mainWindow.webContents.send('recv-log', data.toString());
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
