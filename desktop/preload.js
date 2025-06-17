const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getClipboardContent: () => ipcRenderer.invoke('get-clipboard-content'),
  setMonitoring: (enabled) => ipcRenderer.invoke('set-monitoring', enabled),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // Listen for navigation events from main process
  onNavigate: (callback) => ipcRenderer.on('navigate-to', callback),
  
  // Platform info
  platform: process.platform,
  
  // App info
  isDesktopApp: true
});