'use strict';

const { app, BrowserWindow, Menu, shell, ipcMain, Notification, nativeTheme } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

let mainWindow = null;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--url' && argv[i + 1]) {
      args.url = argv[i + 1];
      i += 1;
    } else if (argv[i] === '--data-dir' && argv[i + 1]) {
      args.dataDir = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function resolveDataDir() {
  if (process.env.AI_TEAM_DAEMON_HOME) return process.env.AI_TEAM_DAEMON_HOME;
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'ai-team-daemon');
  }
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'ai-team-daemon');
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'ai-team-daemon');
}

function findDaemonUrl(dataDir) {
  try {
    const statusFile = path.join(dataDir, 'status.json');
    if (fs.existsSync(statusFile)) {
      const snap = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      if (snap && snap.ui_url) return snap.ui_url;
    }
  } catch {
    // fallback
  }
  return null;
}

function createMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [{
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
        }]
      : []),
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'AI Team Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/demo-ai-team/ai-team-daemon');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const cliArgs = parseArgs(process.argv);
  const dataDir = cliArgs.dataDir || resolveDataDir();
  const targetUrl = cliArgs.url || findDaemonUrl(dataDir);

  mainWindow = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 840,
    minHeight: 600,
    title: 'AI Local Daemon',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0b0f19' : '#f8fafc',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (targetUrl) {
    mainWindow.loadURL(targetUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.on('daemon-notify', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title: title || 'AI Local Daemon', body: body || '' }).show();
  }
});

ipcMain.on('daemon-open-external', (_event, url) => {
  if (url && (url.startsWith('http:') || url.startsWith('https:'))) {
    shell.openExternal(url);
  }
});

app.whenReady().then(() => {
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

