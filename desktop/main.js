const { app, BrowserWindow, Tray, Menu, clipboard, nativeImage, Notification, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

// Keep a global reference of the window object
let mainWindow;
let tray = null;
let lastClipboardContent = '';
let isMonitoring = true;

// API configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const POLL_INTERVAL = 1000; // Check clipboard every second

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // Start hidden
  });

  // Load the web app
  mainWindow.loadURL(`${API_BASE_URL}`);

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Hide to system tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    }
  });
}

function createTray() {
  // Create a simple tray icon (we'll create actual icon files next)
  const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVDiNpZM9SwNBEIafgwQSCxsLwcJCG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1sLG1s=');
  tray = new Tray(icon);

  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open ClipAI',
      click: () => {
        mainWindow.show();
        if (process.platform === 'darwin') {
          app.dock.show();
        }
      }
    },
    {
      label: isMonitoring ? 'Pause Monitoring' : 'Resume Monitoring',
      click: () => {
        isMonitoring = !isMonitoring;
        updateTrayMenu();
        
        if (isMonitoring) {
          showNotification('ClipAI', 'Clipboard monitoring resumed');
        } else {
          showNotification('ClipAI', 'Clipboard monitoring paused');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'View Recent Items',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate-to', '/dashboard');
      }
    },
    {
      label: 'Settings',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate-to', '/settings');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit ClipAI',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('ClipAI - Smart Clipboard Manager');

  // Double click to show window
  tray.on('double-click', () => {
    mainWindow.show();
  });
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open ClipAI',
      click: () => {
        mainWindow.show();
        if (process.platform === 'darwin') {
          app.dock.show();
        }
      }
    },
    {
      label: isMonitoring ? 'Pause Monitoring' : 'Resume Monitoring',
      click: () => {
        isMonitoring = !isMonitoring;
        updateTrayMenu();
        
        if (isMonitoring) {
          showNotification('ClipAI', 'Clipboard monitoring resumed');
        } else {
          showNotification('ClipAI', 'Clipboard monitoring paused');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'View Recent Items',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate-to', '/dashboard');
      }
    },
    {
      label: 'Settings',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate-to', '/settings');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit ClipAI',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function showNotification(title, body, clickAction = null) {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      silent: false
    });

    if (clickAction) {
      notification.on('click', clickAction);
    }

    notification.show();
  }
}

async function analyzeClipboardContent(content) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/clipboard/analyze`, {
      content,
      autoSave: true // Automatically save good content
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const analysis = response.data;
    
    // Show notification based on AI decision
    let notificationBody = '';
    let shouldShow = false;

    switch (analysis.aiDecision) {
      case 'keep':
        notificationBody = `Saved to ${analysis.category}: ${analysis.title || content.substring(0, 50)}...`;
        shouldShow = true;
        break;
      case 'maybe':
        notificationBody = `Review needed: ${analysis.title || content.substring(0, 50)}...`;
        shouldShow = true;
        break;
      case 'discard':
        // Don't show notification for discarded items
        break;
    }

    if (shouldShow) {
      showNotification('ClipAI Analysis', notificationBody, () => {
        mainWindow.show();
        mainWindow.webContents.send('navigate-to', '/dashboard');
      });
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing clipboard content:', error);
    
    if (error.code === 'ECONNREFUSED') {
      showNotification('ClipAI Error', 'Cannot connect to ClipAI server. Please ensure the web app is running.');
    } else if (error.response?.status === 401) {
      showNotification('ClipAI Error', 'Authentication required. Please log in to the web app.');
    }
    
    return null;
  }
}

function startClipboardMonitoring() {
  // Get initial clipboard content
  lastClipboardContent = clipboard.readText();

  setInterval(() => {
    if (!isMonitoring) return;

    const currentContent = clipboard.readText();
    
    // Check if clipboard content has changed
    if (currentContent && currentContent !== lastClipboardContent) {
      lastClipboardContent = currentContent;
      
      // Only analyze non-empty content that's longer than 3 characters
      if (currentContent.trim().length > 3) {
        console.log('New clipboard content detected:', currentContent.substring(0, 100));
        analyzeClipboardContent(currentContent);
      }
    }
  }, POLL_INTERVAL);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createTray();
  startClipboardMonitoring();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep app running in system tray
});

app.on('before-quit', () => {
  app.isQuiting = true;
});

// IPC handlers
ipcMain.handle('get-clipboard-content', () => {
  return clipboard.readText();
});

ipcMain.handle('set-monitoring', (event, enabled) => {
  isMonitoring = enabled;
  updateTrayMenu();
  return isMonitoring;
});

ipcMain.handle('show-notification', (event, title, body) => {
  showNotification(title, body);
});