'use strict';

const { app, BrowserWindow, Menu, shell, ipcMain, Notification, nativeTheme } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

let mainWindow = null;
let currentDataDir = null;

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

function findDaemonToken(dataDir) {
  try {
    const tokenFile = path.join(dataDir, 'ui.token');
    if (fs.existsSync(tokenFile)) {
      return fs.readFileSync(tokenFile, 'utf8').trim();
    }
  } catch {
    // fallback
  }
  return null;
}

function sendMenuAction(action) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('menu-action', action);
  }
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
      label: 'Tệp',
      submenu: [
        {
          label: 'Giao việc mới…',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendMenuAction('dispatch-task'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Thoát' },
      ],
    },
    {
      label: 'Thao tác',
      submenu: [
        {
          label: 'Tạm dừng / Tiếp tục',
          accelerator: 'CmdOrCtrl+P',
          click: () => sendMenuAction('toggle-pause'),
        },
        {
          label: 'Dò lại công cụ AI',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => sendMenuAction('redetect'),
        },
        {
          label: 'Xoay vòng token thiết bị',
          click: () => sendMenuAction('rotate-token'),
        },
        { type: 'separator' },
        {
          label: 'Chuyển đổi giao diện (Sáng/Tối)',
          accelerator: 'CmdOrCtrl+T',
          click: () => sendMenuAction('toggle-theme'),
        },
      ],
    },
    {
      label: 'Điều hướng',
      submenu: [
        {
          label: 'Trạng thái & Tổng quan',
          accelerator: 'CmdOrCtrl+1',
          click: () => sendMenuAction('tab-status'),
        },
        {
          label: 'Giao việc trực tiếp',
          accelerator: 'CmdOrCtrl+2',
          click: () => sendMenuAction('tab-dispatch'),
        },
        {
          label: 'Lịch sử & Nhật ký',
          accelerator: 'CmdOrCtrl+3',
          click: () => sendMenuAction('tab-runs'),
        },
        {
          label: 'Cài đặt & Setup',
          accelerator: 'CmdOrCtrl+,',
          click: () => sendMenuAction('tab-settings'),
        },
      ],
    },
    {
      label: 'Chỉnh sửa',
      submenu: [
        { role: 'undo', label: 'Hoàn tác' },
        { role: 'redo', label: 'Làm lại' },
        { type: 'separator' },
        { role: 'cut', label: 'Cắt' },
        { role: 'copy', label: 'Sao chép' },
        { role: 'paste', label: 'Dán' },
        { role: 'selectAll', label: 'Chọn tất cả' },
      ],
    },
    {
      label: 'Xem',
      submenu: [
        { role: 'reload', label: 'Tải lại' },
        { role: 'forceReload', label: 'Tải lại toàn bộ' },
        { role: 'toggleDevTools', label: 'Công cụ nhà phát triển' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Kích thước chuẩn' },
        { role: 'zoomIn', label: 'Phóng to' },
        { role: 'zoomOut', label: 'Thu nhỏ' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toàn màn hình' },
      ],
    },
    {
      label: 'Cửa sổ',
      submenu: [
        { role: 'minimize', label: 'Thu nhỏ' },
        { role: 'zoom', label: 'Phóng to' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close', label: 'Đóng' }]),
      ],
    },
    {
      role: 'help',
      label: 'Trợ giúp',
      submenu: [
        {
          label: 'Tài liệu AI Local Daemon',
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
  currentDataDir = cliArgs.dataDir || resolveDataDir();

  mainWindow = new BrowserWindow({
    width: 1260,
    height: 880,
    minWidth: 880,
    minHeight: 640,
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

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

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

ipcMain.handle('daemon-info', () => {
  const dataDir = currentDataDir || resolveDataDir();
  return {
    dataDir,
    daemonUrl: findDaemonUrl(dataDir) || 'http://127.0.0.1:7471/',
    hasToken: Boolean(findDaemonToken(dataDir)),
    platform: process.platform,
    version: app.getVersion(),
  };
});

ipcMain.handle('daemon-api', async (_event, { method = 'GET', pathname = '/api/state', body = undefined, customUrl = null } = {}) => {
  const dataDir = currentDataDir || resolveDataDir();
  const baseUrl = (customUrl || findDaemonUrl(dataDir) || 'http://127.0.0.1:7471/').replace(/\/+$/, '');
  const token = findDaemonToken(dataDir);
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const targetUrl = new URL(normalizedPath, baseUrl);

  const headers = { accept: 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';

  try {
    const res = await fetch(targetUrl, {
      method: method.toUpperCase(),
      headers,
      body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: (data && data.error) || `HTTP ${res.status}`,
        body: data,
      };
    }
    return { ok: true, status: res.status, body: data };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
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
