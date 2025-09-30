const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#0a0a0a',
    show: true,
    frame: true,
    titleBarStyle: 'default'
  });

  // Load the React application with retry logic
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  async function loadApp() {
    if (isDev) {
      // In development, wait for Vite dev server and load it
      const maxRetries = 10;
      let retries = 0;

      while (retries < maxRetries) {
        try {
          console.log(`Attempting to load dev server (attempt ${retries + 1}/${maxRetries})`);
          await mainWindow.loadURL('http://localhost:5176');
          console.log('Successfully loaded dev server on port 5176');
          return;
        } catch (err) {
          console.log(`Failed to load localhost:5176, trying localhost:5175...`);
          try {
            await mainWindow.loadURL('http://localhost:5175');
            console.log('Successfully loaded dev server on port 5175');
            return;
          } catch (err2) {
            console.log(`Failed to load localhost:5175, trying localhost:5174...`);
            try {
              await mainWindow.loadURL('http://localhost:5174');
              console.log('Successfully loaded dev server on port 5174');
              return;
            } catch (err3) {
              console.log(`Failed to load localhost:5174, trying localhost:5173...`);
              try {
                await mainWindow.loadURL('http://localhost:5173');
                console.log('Successfully loaded dev server on port 5173');
                return;
              } catch (err4) {
                console.log(`Retry ${retries + 1} failed, waiting 1 second...`);
                retries++;
                if (retries < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            }
          }
        }
      }
      console.error('Failed to load dev server after all retries');
    } else {
      // In production, load built files
      try {
        await mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
        console.log('Successfully loaded built files');
      } catch (err) {
        console.error('Failed to load built files:', err);
      }
    }
  }

  // Load the app
  loadApp();

  // Add success handler
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading successfully');
  });

  // Add error handling for failed loads
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load page:', errorCode, errorDescription, 'URL:', validatedURL);
  });

  // Open DevTools only in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Basic IPC handlers for now
ipcMain.handle('auth:login', async (event, credentials) => {
  // TODO: Implement authentication
  return { success: true, user: { id: '1', username: credentials.username } };
});

ipcMain.handle('auth:register', async (event, userData) => {
  // TODO: Implement registration
  return { success: true, user: { id: '1', username: userData.username } };
});

ipcMain.handle('auth:logout', async (event) => {
  // TODO: Implement logout
  return { success: true };
});

ipcMain.handle('server:start', async (event, config) => {
  // TODO: Implement server start
  return { success: true, message: 'Server started' };
});

ipcMain.handle('server:stop', async (event) => {
  // TODO: Implement server stop
  return { success: true, message: 'Server stopped' };
});

ipcMain.handle('server:status', async (event) => {
  // TODO: Implement server status
  return { running: false, uptime: 0 };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
