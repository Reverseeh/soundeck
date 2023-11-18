const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ipc = ipcMain;

if(require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 588,
    height: 384,
    icon: path.join(__dirname, 'assets/icons/icon.ico'),
    autoHideMenuBar: true,
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  //CLOSE APP
  ipc.on('closeApp', () => { mainWindow.close(); });
  
  //MINIMIZE APP
  ipc.on('minimizeApp', () => { mainWindow.minimize(); });

  ipc.handle('getPath', async () => {
    return await app.getPath('userData');
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if(BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

//require('electron').Menu.setApplicationMenu(null);