const {app, BrowserWindow, protocol} = require('electron')
const electron = require("electron");
const remote = electron.remote;
// Module to create native browser window.

const path = require('path')
const url = require('url')

console.log(process.argv)
var server = "";
if (process.argv[0].includes("electron")) {
  server = process.argv[2] ? process.argv[2] : process.argv[1]
} else {
  server = process.argv[1] ? process.argv[1] : "";
}
if (server.startsWith("riddlet://") && server) {
  const url = server.substr(11);
    server = url;
}
console.log(server);
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    titleBarStyle: 'hidden',
    width: 1280,
    height: 720,
    minHeight: 720,
    minWidth: 1280
  });
  mainWindow.setTitle("Riddlet");
  mainWindow.webContents.openDevTools()
  mainWindow.setMenu(null);
  if (server) {
    mainWindow.loadURL(`https://riddletchat.firebaseapp.com/chat/${server}/confirm`);
  } else {
    // and load the index.html of the app.
    mainWindow.loadURL(`https://riddletchat.firebaseapp.com`);
  }
  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  protocol.registerStringProtocol('riddlet', (request, callback) => {
    const url = request.url.substr(11);
    server = url;
    createWindow()
  })
  createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
