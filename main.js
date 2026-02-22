const { app, BrowserWindow, Menu, protocol, session } = require('electron');
const path = require('path');

// Allow AudioContext to start without user gesture to prevent audio glitches
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// Disable renderer background throttling so audio timers stay accurate
app.commandLine.appendSwitch('disable-renderer-backgrounding');

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const DEV_SERVER_URL = 'http://localhost:5173';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Needed for dev server and WASM
      allowRunningInsecureContent: false,
      experimentalFeatures: true,
      enableBlinkFeatures: 'SharedArrayBuffer',
      backgroundThrottling: false,
    },
    backgroundColor: '#000000',
    title: 'Uncharted Waters 2',
    icon: path.join(__dirname, 'unchartedwaters2/dist/favicon.ico'),
  });

  // Load from dev server in development, built files in production
  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    const appPath = path.join(__dirname, 'unchartedwaters2/dist/index.html');
    mainWindow.loadFile(appPath);
  }

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Alt+F4',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Fullscreen',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          },
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          },
        },
      ],
    },
  ];

  // Add Edit menu for macOS
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-prevent-unload', (event) => {
    event.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Register protocol to handle static file requests with proper MIME types
  protocol.registerFileProtocol('static', (request, callback) => {
    const url = request.url.replace('static://', '');
    const filePath = path.join(__dirname, 'unchartedwaters2/dist', url);
    callback({ path: filePath });
  });

  // Intercept file:// protocol requests to add proper headers
  session.defaultSession.webRequest.onHeadersReceived({ urls: ['file://*'] }, (details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Cross-Origin-Opener-Policy': ['same-origin'],
        'Cross-Origin-Embedder-Policy': ['require-corp'],
        'Cross-Origin-Resource-Policy': ['cross-origin'],
        'Access-Control-Allow-Origin': ['*'],
      },
    });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle certificate errors for local resources
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('file://')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
