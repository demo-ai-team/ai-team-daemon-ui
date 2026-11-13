'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('daemonDesktop', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
  notify: (title, body) => ipcRenderer.send('daemon-notify', { title, body }),
  openExternal: (url) => ipcRenderer.send('daemon-open-external', url),
  callApi: (options) => ipcRenderer.invoke('daemon-api', options),
  getDaemonInfo: () => ipcRenderer.invoke('daemon-info', {}),
  onMenuAction: (callback) => {
    const handler = (_event, action) => callback(action);
    ipcRenderer.on('menu-action', handler);
    return () => ipcRenderer.removeListener('menu-action', handler);
  },
});
