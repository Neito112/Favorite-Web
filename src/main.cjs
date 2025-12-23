const { app, BrowserWindow, ipcMain, protocol, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { autoUpdater } = require('electron-updater');

// --- CẤU HÌNH LOG UPDATE ---
try {
    autoUpdater.logger = require("electron-log");
    autoUpdater.logger.transports.file.level = "info";
} catch (e) { console.log('Log module not found'); }
autoUpdater.autoDownload = false;

// --- [QUAN TRỌNG] CẤU HÌNH ĐƯỜNG DẪN AN TOÀN ---
const APP_INSTALL_DIR = app.isPackaged 
    ? path.join(process.resourcesPath, 'data') 
    : path.join(__dirname, '../data');

// Lưu vào AppData để không mất khi update
const USER_DATA_DIR = path.join(app.getPath('userData'), 'UserData');

const BOOKMARKS_DIR = path.join(USER_DATA_DIR, 'bookmarks');
const ICONS_DIR = path.join(USER_DATA_DIR, 'icons');
const FONTS_DIR = path.join(USER_DATA_DIR, 'fonts');
const SETTINGS_FILE = path.join(USER_DATA_DIR, 'settings.json');
const BG_FILE = path.join(USER_DATA_DIR, 'background.png');

const APP_ICON_PATH = path.join(__dirname, '../icon.ico');

// --- HÀM KHỞI TẠO DỮ LIỆU ---
function initializeUserData() {
    if (!fs.existsSync(USER_DATA_DIR)) fs.mkdirSync(USER_DATA_DIR, { recursive: true });
    if (!fs.existsSync(BOOKMARKS_DIR)) fs.mkdirSync(BOOKMARKS_DIR, { recursive: true });
    if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });
    if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true });

    // Copy dữ liệu mẫu nếu chưa có
    copyFolderRecursiveSync(path.join(APP_INSTALL_DIR, 'fonts'), FONTS_DIR);
    
    const defaultBg = path.join(APP_INSTALL_DIR, 'background.png');
    if (fs.existsSync(defaultBg) && !fs.existsSync(BG_FILE)) {
        fs.copyFileSync(defaultBg, BG_FILE);
    }
}

function copyFolderRecursiveSync(source, target) {
    if (!fs.existsSync(source)) return;
    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
    const files = fs.readdirSync(source);
    files.forEach((file) => {
        const curSource = path.join(source, file);
        const curTarget = path.join(target, file);
        if (fs.lstatSync(curSource).isDirectory()) {
            copyFolderRecursiveSync(curSource, curTarget);
        } else {
            if (!fs.existsSync(curTarget)) fs.copyFileSync(curSource, curTarget);
        }
    });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' } };
    const request = https.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        if (response.headers.location) return downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) return reject(new Error(`Status: ${response.statusCode}`));
      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      file.on('finish', () => file.close(() => resolve(filepath)));
      file.on('error', (err) => { fs.unlink(filepath, () => {}); reject(err); });
    });
    request.on('error', (err) => { fs.unlink(filepath, () => {}); reject(err); });
  });
}

app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('lang', 'vi');

let mainWindow;

function createWindow() {
  initializeUserData(); // [QUAN TRỌNG] Tạo folder AppData trước khi vẽ UI

  mainWindow = new BrowserWindow({
    width: 1280, height: 800, 
    frame: false,
    autoHideMenuBar: true,
    icon: fs.existsSync(APP_ICON_PATH) ? APP_ICON_PATH : null, 
    webPreferences: {
      nodeIntegration: true, contextIsolation: false, webviewTag: true, devTools: true, webSecurity: false
    },
  });
  mainWindow.removeMenu();

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && input.key.toLowerCase() === 'r') event.preventDefault();
    if (input.key === 'F5') event.preventDefault();
  });

  const isDev = !app.isPackaged;
  if (isDev) {
      mainWindow.loadURL('http://localhost:5173');
  } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('local-resource', (request, callback) => {
    const url = request.url.replace('local-resource://', '');
    const decodedUrl = decodeURI(url); 
    try { return callback(decodedUrl); } catch (error) { console.error(error); }
  });

  createWindow();

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

// --- AUTO UPDATE EVENTS ---
autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
        type: 'info', title: 'Cập nhật Favo', message: 'Đã tìm thấy phiên bản mới. Bạn có muốn tải về ngay không?', buttons: ['Cập nhật', 'Để sau']
    }).then((result) => {
        if (result.response === 0) autoUpdater.downloadUpdate();
    });
});
autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
        type: 'info', title: 'Cập nhật hoàn tất', message: 'Bản cập nhật đã sẵn sàng. Khởi động lại ngay?', buttons: ['Khởi động lại', 'Để sau']
    }).then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall();
    });
});

// --- IPC HANDLERS (Dùng đường dẫn USER_DATA_DIR) ---
ipcMain.handle('load-bookmarks', async () => {
  try {
    if (!fs.existsSync(BOOKMARKS_DIR)) return [];
    const files = fs.readdirSync(BOOKMARKS_DIR);
    const bookmarks = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(BOOKMARKS_DIR, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          if (data && typeof data === 'object') {
              if (typeof data.localIconPath === 'string' && data.localIconPath.trim() !== '') {
                 try {
                     const fileName = path.basename(data.localIconPath);
                     data.localIconPath = path.join(ICONS_DIR, fileName).replace(/\\/g, '/');
                 } catch (pathErr) { data.localIconPath = null; }
              } else { data.localIconPath = null; }
              bookmarks.push(data);
          }
        } catch (e) { console.error(`Lỗi tải file ${file}:`, e); }
      }
    }
    return bookmarks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) { return []; }
});

ipcMain.handle('add-bookmark', async (event, bookmarkData) => {
  try {
    const id = bookmarkData.id || Date.now().toString();
    const iconFilename = `${id}.png`;
    const jsonFilename = `${id}.json`;
    const iconSavePath = path.join(ICONS_DIR, iconFilename);
    const jsonSavePath = path.join(BOOKMARKS_DIR, jsonFilename);
    let localIconPath = null;
    let savedIconFilename = null; 
    const iconUrl = bookmarkData.iconUrl;
    if (iconUrl) {
      try {
        if (iconUrl.startsWith('data:image')) {
            const base64Data = iconUrl.replace(/^data:image\/\w+;base64,/, "");
            fs.writeFileSync(iconSavePath, base64Data, 'base64');
        } else if (iconUrl.startsWith('http')) {
             await downloadImage(iconUrl, iconSavePath);
        }
        if (fs.existsSync(iconSavePath)) {
            localIconPath = iconSavePath.replace(/\\/g, '/');
            savedIconFilename = iconFilename;
        }
      } catch (err) { console.error("Lỗi xử lý icon:", err); }
    }
    const dataToDisk = { ...bookmarkData, id, localIconPath: savedIconFilename || null, createdAt: new Date().toISOString() };
    fs.writeFileSync(jsonSavePath, JSON.stringify(dataToDisk, null, 2));
    return { success: true, data: { ...dataToDisk, localIconPath: localIconPath } };
  } catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('delete-bookmark', async (event, id) => {
  try {
    const jsonPath = path.join(BOOKMARKS_DIR, `${id}.json`);
    const iconPath = path.join(ICONS_DIR, `${id}.png`);
    if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
    if (fs.existsSync(iconPath)) fs.unlinkSync(iconPath);
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('update-bookmark', async (event, bookmarkData) => {
    try {
        const jsonPath = path.join(BOOKMARKS_DIR, `${bookmarkData.id}.json`);
        if (fs.existsSync(jsonPath)) {
            const oldData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            let pathForSave = bookmarkData.localIconPath;
            if (typeof pathForSave === 'string' && pathForSave.trim() !== '') {
                pathForSave = path.basename(pathForSave);
            } else { pathForSave = null; }
            const newData = { ...oldData, ...bookmarkData, localIconPath: pathForSave };
            fs.writeFileSync(jsonPath, JSON.stringify(newData, null, 2));
            return { success: true };
        }
        return { success: false };
    } catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    if (settings.bgImage && settings.bgImage.startsWith('data:image')) {
      const base64Data = settings.bgImage.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(BG_FILE, base64Data, 'base64');
      settings.bgImage = 'LOCAL_BG';
    } else if (settings.bgImage === null && fs.existsSync(BG_FILE)) {
      fs.unlinkSync(BG_FILE);
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('load-settings', async () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      if (fs.existsSync(BG_FILE)) {
          settings.bgImage = 'local-resource://' + BG_FILE.replace(/\\/g, '/');
      } else { settings.bgImage = null; }
      return settings;
    }
  } catch (e) {}
  return null;
});

ipcMain.handle('get-local-fonts', async () => {
  try {
      if (!fs.existsSync(FONTS_DIR)) return [];
      const files = fs.readdirSync(FONTS_DIR);
      return files.filter(file => /\.(ttf|otf|woff|woff2)$/i.test(file))
          .map(file => ({ name: path.parse(file).name, path: path.join(FONTS_DIR, file).replace(/\\/g, '/') }));
  } catch (error) { return []; }
});

ipcMain.on('open-fonts-folder', () => {
    if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true });
    shell.openPath(FONTS_DIR);
});

ipcMain.on('app-minimize', () => { const w = BrowserWindow.getFocusedWindow(); if(w) w.minimize(); });
ipcMain.on('app-maximize', () => { const w = BrowserWindow.getFocusedWindow(); if(w) w.isMaximized() ? w.unmaximize() : w.maximize(); });
ipcMain.on('app-quit', () => app.quit());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });