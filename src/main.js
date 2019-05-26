const { app, BrowserWindow } = require("electron");
const path = require("path");
let win; // Global ref og window object
const HIDListen = require("hid-listen");

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  win.loadURL("http://localhost:8080");
  //win.loadFile('./dist/index.html')
  win.webContents.openDevTools();
  // Emitted when the window is closed.
  win.on("closed", () => {
    win = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// const inst = new HIDListen();
// inst.on("connect", () => {
//   console.log("Listening:");
// });
// inst.on("disconnect", () => {
//   console.log("Device disconnected.");
//   console.log("Waiting for new device:");
// });
// inst.on("data", data => {
//   console.log(data);
// });
