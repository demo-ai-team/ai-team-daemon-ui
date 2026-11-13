'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('daemonDesktop', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
  notify: (title, body) => ipcRenderer.send('daemon-notify', { title, body }),
  openExternal: (url) => ipcRenderer.send('daemon-open-external', url),
});
