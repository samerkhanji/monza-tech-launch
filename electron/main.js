import { app, BrowserWindow, dialog, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' && !app.isPackaged;

// License verification system
function verifyLicense() {
  // In production, look for license.key in the same directory as the executable
  const licenseFile = isDev 
    ? path.join(__dirname, '../license.key')
    : path.join(process.resourcesPath, '../license.key');
  
  if (!fs.existsSync(licenseFile)) {
    dialog.showErrorBox('License Error', 'No valid license found. Please contact Monza TECH for a license key.');
    return false;
  }
  
  try {
    const licenseData = fs.readFileSync(licenseFile, 'utf8');
    const [encryptedData, signature] = licenseData.split('.');
    
    // Simple license validation (in production, use proper cryptographic verification)
    const expectedSignature = crypto.createHash('sha256').update(encryptedData + 'MONZA_SECRET_KEY').digest('hex');
    
    if (signature === expectedSignature) {
      const licenseInfo = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
      const expiryDate = new Date(licenseInfo.expiry);
      
      if (new Date() > expiryDate) {
        dialog.showErrorBox('License Expired', 'Your license has expired. Please contact Monza TECH to renew.');
        return false;
      }
      
      return true;
    }
  } catch (error) {
    dialog.showErrorBox('License Error', 'Invalid license file. Please contact Monza TECH.');
    return false;
  }
  
  return false;
}

function createWindow() {
  // Temporarily disable license verification for testing
  // TODO: Re-enable license verification after fixing path issues
  // if (!isDev && !verifyLicense()) {
  //   app.quit();
  //   return;
  // }

  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    show: false
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Load the built application
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading from:', indexPath);
    
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
      console.log('Successfully loaded app from:', indexPath);
    } else {
      console.error('Could not find index.html at:', indexPath);
      console.log('__dirname:', __dirname);
      dialog.showErrorBox('Loading Error', 'Could not find application files. Please reinstall the application.');
    }
  }

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== mainWindow.webContents.getURL().split('/').slice(0, 3).join('/')) {
      event.preventDefault();
    }
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'Monza TECH',
      submenu: [
        {
          label: 'About Monza TECH',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About Monza TECH',
              message: 'Monza TECH - Vehicle Management System',
              detail: 'Licensed software for authorized use only.\nContact: samer@monzasal.com'
            });
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
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
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createMenu();
  createWindow();
});

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

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
}); 