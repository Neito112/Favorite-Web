const { app, BrowserWindow, ipcMain, protocol, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

// --- CẤU HÌNH UPDATE (AN TOÀN) ---
let autoUpdater;
try {
    const updaterModule = require('electron-updater');
    autoUpdater = updaterModule.autoUpdater;
    try {
        const log = require("electron-log");
        autoUpdater.logger = log;
        autoUpdater.logger.transports.file.level = "info";
    } catch(e) {}
    autoUpdater.autoDownload = false;
} catch (e) { autoUpdater = null; }

// --- CẤU HÌNH ĐƯỜNG DẪN ---
const APP_INSTALL_DIR = app.isPackaged 
    ? path.join(process.resourcesPath, 'data') 
    : path.join(__dirname, '../data');

// Nơi lưu dữ liệu mới (AppData - Không bị mất khi update)
const USER_DATA_DIR = path.join(app.getPath('userData'), 'UserData');
const BOOKMARKS_DIR = path.join(USER_DATA_DIR, 'bookmarks');
const ICONS_DIR = path.join(USER_DATA_DIR, 'icons');
const FONTS_DIR = path.join(USER_DATA_DIR, 'fonts');
const SETTINGS_FILE = path.join(USER_DATA_DIR, 'settings.json');
const BG_FILE = path.join(USER_DATA_DIR, 'background.png');
const APP_ICON_PATH = path.join(__dirname, '../icon.ico');

// --- HÀM KHÔI PHỤC DỮ LIỆU CŨ ---
function initializeUserData() {
    try {
        if (!fs.existsSync(USER_DATA_DIR)) fs.mkdirSync(USER_DATA_DIR, { recursive: true });
        if (!fs.existsSync(BOOKMARKS_DIR)) fs.mkdirSync(BOOKMARKS_DIR, { recursive: true });
        if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });
        if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true });

        console.log('[MIGRATION] Dang dong bo Bookmarks...');
        copyFolderRecursiveSync(path.join(APP_INSTALL_DIR, 'bookmarks'), BOOKMARKS_DIR);

        console.log('[MIGRATION] Dang dong bo Icons...');
        copyFolderRecursiveSync(path.join(APP_INSTALL_DIR, 'icons'), ICONS_DIR);

        copyFolderRecursiveSync(path.join(APP_INSTALL_DIR, 'fonts'), FONTS_DIR);
        
        const defaultBg = path.join(APP_INSTALL_DIR, 'background.png');
        if (fs.existsSync(defaultBg) && !fs.existsSync(BG_FILE)) {
            fs.copyFileSync(defaultBg, BG_FILE);
        }
        const defaultSettings = path.join(APP_INSTALL_DIR, 'settings.json');
        if (fs.existsSync(defaultSettings) && !fs.existsSync(SETTINGS_FILE)) {
            fs.copyFileSync(defaultSettings, SETTINGS_FILE);
        }

    } catch (err) { console.error('[ERROR] Loi khoi tao data:', err); }
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
            if (!fs.existsSync(curTarget)) {
                fs.copyFileSync(curSource, curTarget);
            }
        }
    });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'Mozilla/5.0' } };
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
  initializeUserData();
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 435,  // [UPDATE] Giới hạn chiều rộng tối thiểu (cỡ điện thoại)
    minHeight: 295, // [UPDATE] Giới hạn chiều cao tối thiểu
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
    try { return callback(decodeURI(url)); } catch (error) { console.error(error); }
  });

  createWindow();

  if (app.isPackaged && autoUpdater) {
    try { autoUpdater.checkForUpdatesAndNotify(); } catch(e) {}
  }
});

// --- UPDATE EVENTS ---
if (autoUpdater) {
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
}

// --- IPC HANDLERS ---
ipcMain.handle('load-bookmarks', async () => {
  try {
    if (!fs.existsSync(BOOKMARKS_DIR)) return [];
    
    const files = fs.readdirSync(BOOKMARKS_DIR);
    const bookmarks = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(path.join(BOOKMARKS_DIR, file), 'utf-8');
          const data = JSON.parse(content);
          if (data && typeof data === 'object') {
              if (data.localIconPath) {
                 const fileName = path.basename(data.localIconPath);
                 data.localIconPath = path.join(ICONS_DIR, fileName).replace(/\\/g, '/');
              }
              bookmarks.push(data);
          }
        } catch (e) {}
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
      } catch (err) {}
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
            let pathForSave = bookmarkData.localIconPath ? path.basename(bookmarkData.localIconPath) : null;
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

ipcMain.handle('get-system-fonts', async () => ["Arial", "Segoe UI", "Tahoma", "Verdana"]);

ipcMain.on('open-fonts-folder', () => {
    if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true });
    shell.openPath(FONTS_DIR);
});

// --- WINDOW CONTROLS ---
ipcMain.on('app-minimize', () => BrowserWindow.getFocusedWindow()?.minimize());
ipcMain.on('app-maximize', () => { const w = BrowserWindow.getFocusedWindow(); w?.isMaximized() ? w.unmaximize() : w.maximize(); });
ipcMain.on('app-quit', () => app.quit());

// --- MINI-MODE HANDLER ---
ipcMain.handle('set-always-on-top', (event, flag) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.setAlwaysOnTop(flag, 'screen-saver'); 
    }
    return true;
});

// [THÊM ĐOẠN NÀY] - Xử lý thay đổi kích thước cửa sổ
ipcMain.handle('resize-window', (event, { width, height }) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.setSize(width, height, true); // true để có hiệu ứng mượt (nếu OS hỗ trợ)
    }
    return true;
});