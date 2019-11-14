import {app, BrowserWindow} from 'electron';
import log from 'electron-log';
import {autoUpdater} from 'electron-updater';
import * as path from 'path';
import {newStateMachine} from './modules/state-machine';
import visualize from 'javascript-state-machine/lib/visualize';

console.log(visualize(newStateMachine()));

let win: Electron.BrowserWindow; // Global ref og window object
// const HIDListen = require('hid-listen');

/**
 * Initialize our app window
 * @module main
 */
function createWindow(): void {
  win = new BrowserWindow({
    height: 800,
    webPreferences: {
      allowRunningInsecureContent: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    width: 1200,
  });
  // process.win = win;
  let url = 'https://config.qmk.fm';
  //url = 'http://localhost:8080';
  win.loadURL(url);
  // win.loadFile('./dist/index.html')
  // Emitted when the window is closed.
  if (process.defaultApp) {
    win.webContents.once('dom-ready', () => {
      win.webContents.openDevTools();
    });
  }
  win.on('closed', () => {
    win = null;
  });
  log.info('opening app');
}

/**
 * Logging function
 * @param {string} text Used for logging to a text file
 */
function sendStatusToWindow(text: string): void {
  log.info(text);
  win.webContents.send('message', text);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', () => {
  sendStatusToWindow('Update available.');
});
autoUpdater.on('update-not-available', () => {
  sendStatusToWindow('Update not available.');
});
autoUpdater.on('error', (err: string) => {
  sendStatusToWindow(`Error in auto-updater. ${err}`);
});
autoUpdater.on('download-progress', (progressObj) => {
  const logMessage = [`Download speed: ${progressObj.bytesPerSecond}`];
  logMessage.push(` - Downloaded ${progressObj.percent}%`);
  logMessage.push(` (${progressObj.transferred}/${progressObj.total})`);
  sendStatusToWindow(logMessage.join(''));
});
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow(`Update downloaded ${info}`);
});

// app.on('browser-window-created', (event, win) => {});

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
