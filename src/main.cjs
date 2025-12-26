const { app, BrowserWindow, ipcMain, protocol, shell, dialog, clipboard, nativeImage } = require('electron');const path = require('path');
const fs = require('fs');
const https = require('https');

global.File = class File {};

let mainWindow;
let magicWindow = null; // [NEW] Biến quản lý cửa sổ Magic Tool

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

// --- [BỔ SUNG QUAN TRỌNG] QUẢN LÝ CỬA SỔ MAGIC TOOL ---

// 1. Mở cửa sổ Magic Tool
// 1. Mở cửa sổ Magic Tool (Cập nhật Logic Toggle)
// 1. Mở cửa sổ Magic Tool (Đã sửa lỗi Toggle)
ipcMain.on('open-magic-tool', (event, initialData) => {
    // Nếu cửa sổ đang tồn tại
    if (magicWindow && !magicWindow.isDestroyed()) {
        
        // TRƯỜNG HỢP A: Có dữ liệu mới (do Kéo thả Link) -> Luôn hiện và cập nhật
        if (initialData) {
            if (magicWindow.isMinimized()) magicWindow.restore();
            magicWindow.show(); // Đảm bảo cửa sổ hiện lên
            magicWindow.focus();
            magicWindow.webContents.send('magic-data-update', initialData);
            return;
        }

        // TRƯỜNG HỢP B: Bấm nút (initialData là null) -> Xử lý Bật/Tắt
        // [FIX] Dùng isVisible() thay vì isFocused() để tránh lỗi mất focus khi click vào Main Window
        if (magicWindow.isVisible()) {
            magicWindow.close(); // Nếu đang hiện -> Đóng
        } else {
            if (magicWindow.isMinimized()) magicWindow.restore();
            magicWindow.show();  // Nếu đang ẩn -> Hiện
            magicWindow.focus();
        }
        return;
    }

    // Nếu chưa có cửa sổ -> Tạo mới như bình thường
    magicWindow = new BrowserWindow({
        width: 800, height: 600,
        minWidth: 600, minHeight: 400,
        title: 'Magic Downloader',
        icon: fs.existsSync(APP_ICON_PATH) ? APP_ICON_PATH : null,
        frame: false, 
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false, 
            webviewTag: true, 
            webSecurity: false
        }
    });

    const isDev = !app.isPackaged;
    const url = isDev 
        ? 'http://localhost:5173/#magic-tool' 
        : `file://${path.join(__dirname, '../dist/index.html')}#magic-tool`;
    
    magicWindow.loadURL(url);

    magicWindow.webContents.on('did-finish-load', () => {
        if (initialData) magicWindow.webContents.send('magic-data-update', initialData);
    });

    magicWindow.on('closed', () => { magicWindow = null; });
});

// 2. Điều khiển cửa sổ (Thu nhỏ, Phóng to, Đóng)
ipcMain.on('magic-window-control', (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    switch (action) {
        case 'minimize': win.minimize(); break;
        case 'maximize': win.isMaximized() ? win.unmaximize() : win.maximize(); break;
        case 'close': win.close(); break;
    }
});

app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('lang', 'vi');



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
// --- [NEW] LOGIC XỬ LÝ DROP ZONE & SCRAPING (NATIVE NODEJS VERSION) ---
// Dùng thư viện gốc của Node.js để tránh lỗi Crash của Axios khi pipe stream

const axios = require('axios'); // Chỉ dùng để lấy HTML text (an toàn)
const cheerio = require('cheerio');
const os = require('os');

// Thư mục tạm
const TEMP_DIR = path.join(app.getPath('temp'), 'Favo_DropZone');

const clearTempDir = () => {
    try {
        if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    } catch (e) { console.error('Clear Temp Error:', e); }
};

// [HÀM MỚI] Lấy kích thước file bằng HTTPS thuần (Không dùng Axios)
function getFileSizeNative(url) {
    return new Promise((resolve) => {
        // Tự động xử lý redirect nếu có
        const req = https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve(getFileSizeNative(res.headers.location)); // Đệ quy theo redirect
                return;
            }
            resolve(parseInt(res.headers['content-length'] || '0', 10));
        });
        req.on('error', () => resolve(0));
        req.end();
    });
}

// [HÀM MỚI] Tải file bằng HTTPS thuần (Đảm bảo có Stream, không bao giờ lỗi pipe)
function downloadFileNative(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            // Xử lý Redirect (Quan trọng với link Facebook/Google)
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                downloadFileNative(response.headers.location, destPath).then(resolve).catch(reject);
                return;
            }
            // Pipe dữ liệu (Đây là chỗ Axios cũ bị lỗi, còn Native thì an toàn tuyệt đối)
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(true));
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => {}); // Xóa file lỗi
            reject(err);
        });
    });
}

// Hàm xử lý chính (Đã cập nhật dùng Native Functions)
async function processMediaItem(url, index) {
    try {
        const LIMIT_100MB = 100 * 1024 * 1024;
        
        // 1. Kiểm tra dung lượng (Dùng Native)
        const size = await getFileSizeNative(url);

        const extension = path.extname(url).split('?')[0] || '.jpg';
        const fileName = `media_${index}${extension}`;
        const filePath = path.join(TEMP_DIR, fileName);

        // CASE A: File quá nặng -> Báo cáo
        if (size > LIMIT_100MB) {
            return { type: 'large_file', url, size, isDownloaded: false, name: fileName };
        }

        // CASE B: Tải về (Dùng Native)
        await downloadFileNative(url, filePath);

        return {
            type: 'downloaded',
            localPath: filePath.replace(/\\/g, '/'),
            url,
            size,
            isDownloaded: true,
            name: fileName
        };
    } catch (e) { 
        return null; // Link lỗi thì bỏ qua
    }
}
// --- [THÊM MỚI] 1. XỬ LÝ COPY ẢNH VÀO CLIPBOARD ---
ipcMain.handle('copy-image-to-clipboard', async (event, filePath) => {
    try {
        const image = nativeImage.createFromPath(filePath);
        if (!image.isEmpty()) {
            clipboard.writeImage(image);
            return { success: true };
        }
        return { success: false, error: 'Image empty' };
    } catch (e) { return { success: false, error: e.message }; }
});

// --- [THÊM MỚI] 2. XỬ LÝ TẢI FILE RIÊNG LẺ (SAVE AS) ---
ipcMain.handle('save-file-from-temp', async (event, { sourcePath, defaultName }) => {
    try {
        const win = BrowserWindow.getFocusedWindow();
        const { filePath } = await dialog.showSaveDialog(win, {
            defaultPath: defaultName,
            filters: [
                { name: 'Images/Media', extensions: ['jpg', 'png', 'mp4', 'webp', 'jpeg'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (filePath) {
            fs.copyFileSync(sourcePath, filePath);
            return { success: true };
        }
        return { canceled: true };
    } catch (e) { return { success: false, error: e.message }; }
});
// [UPDATE] Hàm xử lý Drop Link: Mạnh mẽ hơn, nhận diện Link tương đối & Meta Tags
ipcMain.handle('process-drop-link', async (event, targetUrl) => {
    try {
        clearTempDir(); // Dọn rác

        // --- GIAI ĐOẠN 1: KIỂM TRA LINK TRỰC TIẾP (DIRECT FILE) ---
        let isDirectFile = false;
        
        // A. Check nhanh bằng đuôi file (Bổ sung thêm nhiều định dạng)
        try {
            const u = new URL(targetUrl);
            const ext = path.extname(u.pathname).toLowerCase();
            const mediaExts = [
                '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', // Ảnh
                '.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', // Video
                '.mp3', '.wav', '.ogg', '.m4a', '.flac' // Âm thanh
            ];
            if (mediaExts.includes(ext)) isDirectFile = true;
        } catch (e) {}

        // B. Nếu đuôi file không rõ, Check Header bằng HTTPS thuần (Không dùng Axios để tránh lỗi)
        if (!isDirectFile) {
             try {
                const contentType = await new Promise((resolve) => {
                    const req = https.request(targetUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
                        resolve(res.headers['content-type']);
                    });
                    req.on('error', () => resolve(null));
                    req.setTimeout(3000, () => { req.destroy(); resolve(null); }); // Timeout 3s
                    req.end();
                });
                
                if (contentType && (contentType.startsWith('image/') || contentType.startsWith('video/') || contentType.startsWith('audio/'))) {
                    isDirectFile = true;
                }
             } catch (e) {}
        }

        // -> NẾU LÀ FILE TRỰC TIẾP: TẢI LUÔN
        if (isDirectFile) {
            const item = await processMediaItem(targetUrl, 1);
            return { success: true, items: item ? [item] : [] };
        }

        // --- GIAI ĐOẠN 2: QUÉT WEBSITE (SCRAPING THÔNG MINH) ---
        // Tải HTML
        const { data: html } = await axios.get(targetUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            timeout: 10000 
        });
        
        const $ = cheerio.load(html);
        const mediaList = new Set(); // Dùng Set để tự động loại bỏ link trùng

        // Hàm helper: Chuẩn hóa URL (Biến link tương đối thành tuyệt đối)
        const addUrl = (url) => {
            if (!url) return;
            try {
                // Tự động ghép domain nếu link là dạng "/images/pic.jpg"
                const fullUrl = new URL(url, targetUrl).href; 
                mediaList.add(fullUrl);
            } catch (e) {}
        };

        // 1. Quét ẢNH (src, data-src, srcset)
        $('img').each((i, el) => {
            addUrl($(el).attr('src'));
            addUrl($(el).attr('data-src')); // Ảnh Lazyload
        });

        // 2. Quét VIDEO (src, data-src, source tag)
        $('video').each((i, el) => {
            addUrl($(el).attr('src'));
            addUrl($(el).attr('data-src'));
        });
        $('video source').each((i, el) => {
            addUrl($(el).attr('src'));
        });

        // 3. Quét AUDIO
        $('audio').each((i, el) => {
            addUrl($(el).attr('src'));
        });
        $('audio source').each((i, el) => {
            addUrl($(el).attr('src'));
        });

        // 4. [QUAN TRỌNG] Quét META TAGS (Open Graph)
        // Nhiều web giấu video kỹ, nhưng lại để link preview trong thẻ meta này
        $('meta[property="og:image"]').each((i, el) => addUrl($(el).attr('content')));
        $('meta[property="og:video"]').each((i, el) => addUrl($(el).attr('content')));
        $('meta[property="og:video:url"]').each((i, el) => addUrl($(el).attr('content')));
        $('meta[property="og:audio"]').each((i, el) => addUrl($(el).attr('content')));
        $('meta[name="twitter:image"]').each((i, el) => addUrl($(el).attr('content')));

        // Chuyển Set thành Array và giới hạn 30 file để không quá tải
        const uniqueLinks = [...mediaList].slice(0, 30);
        
        // Tải song song
        const results = await Promise.all(uniqueLinks.map((url, index) => processMediaItem(url, index)));

        return { success: true, items: results.filter(i => i !== null) };

    } catch (error) {
        return { success: false, error: error.message };
    }
});
