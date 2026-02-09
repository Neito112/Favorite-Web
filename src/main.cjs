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

// --- [SAFE MODE] HÀM KHỞI TẠO DỮ LIỆU AN TOÀN ---
function initializeUserData() {
    // 1. Tạo các thư mục lưu trữ nếu chưa có
    try {
        [USER_DATA_DIR, BOOKMARKS_DIR, ICONS_DIR, FONTS_DIR].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });
    } catch (e) { console.error('[INIT] Lỗi tạo thư mục:', e); }

    // 2. Bắt đầu đồng bộ dữ liệu từ bản cài đặt (nếu có)
    if (fs.existsSync(APP_INSTALL_DIR)) {
        console.log('[MIGRATION] Kiem tra du lieu mac dinh...');

        // --- A. ĐỒNG BỘ BOOKMARKS ---
        const sourceBookmarks = path.join(APP_INSTALL_DIR, 'bookmarks');
        if (fs.existsSync(sourceBookmarks)) {
            try {
                const files = fs.readdirSync(sourceBookmarks);
                files.forEach(file => {
                    const src = path.join(sourceBookmarks, file);
                    const dest = path.join(BOOKMARKS_DIR, file);
                    // Chỉ copy nếu user chưa có file này (tránh ghi đè dữ liệu cũ của họ)
                    if (!fs.existsSync(dest)) {
                        try { fs.copyFileSync(src, dest); } catch (err) {} 
                    }
                });
            } catch (e) { console.error('[MIGRATION] Loi doc bookmarks:', e); }
        }

        // --- B. ĐỒNG BỘ ICONS (PHẦN QUAN TRỌNG NHẤT) ---
        // Đây là nơi hay gây treo app nhất do file ảnh dễ bị lỗi hoặc bị khóa
        const sourceIcons = path.join(APP_INSTALL_DIR, 'icons');
        if (fs.existsSync(sourceIcons)) {
            try {
                const files = fs.readdirSync(sourceIcons);
                files.forEach(file => {
                    const src = path.join(sourceIcons, file);
                    const dest = path.join(ICONS_DIR, file);
                    
                    // Nếu icon chưa có bên AppData thì mới copy
                    if (!fs.existsSync(dest)) {
                        // [FIX AN TOÀN] Dùng try-catch riêng cho từng file
                        // Nếu 1 file lỗi -> Bỏ qua ngay -> Chạy tiếp file sau -> KHÔNG TREO APP
                        try { 
                            fs.copyFileSync(src, dest); 
                        } catch (err) { 
                            console.error(`[SKIP] Bỏ qua icon lỗi: ${file}`); 
                        }
                    }
                });
            } catch (e) { console.error('[MIGRATION] Loi doc icons:', e); }
        }
    }
}

// --- [BỔ SUNG QUAN TRỌNG] QUẢN LÝ CỬA SỔ MAGIC TOOL ---

// 1. Mở cửa sổ Magic Tool (Hỗ trợ Animation theo tọa độ)
ipcMain.on('open-magic-tool', (event, payload) => {
    // Chuẩn hóa dữ liệu đầu vào
    let items = null;
    let animCoords = null;

    if (Array.isArray(payload)) {
        items = payload; // Trường hợp kéo thả file (payload là mảng)
    } else if (payload && payload.type === 'toggle') {
        animCoords = { x: payload.x, y: payload.y }; // Trường hợp click nút
    }

    // Nếu cửa sổ đang tồn tại
    if (magicWindow && !magicWindow.isDestroyed()) {
        
        // CASE A: Có items mới (Kéo thả) -> Mở và update
        if (items) {
            if (magicWindow.isMinimized()) magicWindow.restore();
            magicWindow.show();
            magicWindow.focus();
            magicWindow.webContents.send('magic-data-update', items);
            return;
        }

        // CASE B: Toggle (Click nút)
        if (magicWindow.isVisible()) {
            magicWindow.close(); // Đang hiện -> Đóng
        } else {
            if (magicWindow.isMinimized()) magicWindow.restore();
            
            // [QUAN TRỌNG] Gửi tọa độ animation trước khi hiện cửa sổ
            if (animCoords) magicWindow.webContents.send('set-anim-origin', animCoords);
            
            magicWindow.show();
            magicWindow.focus();
        }
        return;
    }

    // Nếu chưa có cửa sổ -> Tạo mới
    magicWindow = new BrowserWindow({
        width: 800, height: 600,
        minWidth: 600, minHeight: 400,
        title: 'Magic Downloader',
        icon: fs.existsSync(APP_ICON_PATH) ? APP_ICON_PATH : null,
        frame: false, 
        transparent: true,            
        backgroundColor: '#00000000', 
        hasShadow: true,              
        webPreferences: {
            nodeIntegration: true, contextIsolation: false, webviewTag: true, webSecurity: false
        }
    });

    const isDev = !app.isPackaged;
    const url = isDev ? 'http://localhost:5173/#magic-tool' : `file://${path.join(__dirname, '../dist/index.html')}#magic-tool`;
    
    magicWindow.loadURL(url);

    // Khi load xong
    magicWindow.webContents.on('did-finish-load', () => {
        // Gửi dữ liệu nếu có
        if (items) magicWindow.webContents.send('magic-data-update', items);
        // Gửi tọa độ để tính toán animation ngay lần mở đầu tiên
        if (animCoords) magicWindow.webContents.send('set-anim-origin', animCoords);
    });

    magicWindow.on('closed', () => { magicWindow = null; });
});

// --- [FIX LAG] Tắt Hardware Acceleration để tránh lỗi GPU Cache trên Windows ---
app.disableHardwareAcceleration(); 
// [FIX] Dọn dẹp Cache nhẹ nhàng (Bỏ qua nếu đang bị khóa)
try {
    const userDataPath = app.getPath('userData');
    const gpuCachePath = path.join(userDataPath, 'GPUCache');

} catch (e) {}
// Các cấu hình cũ giữ nguyên
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('lang', 'vi');

// Thêm cấu hình tối ưu bộ nhớ GPU (phòng hờ)
app.commandLine.appendSwitch('force-gpu-mem-available-mb', '1024'); 
app.commandLine.appendSwitch('disable-gpu-compositing');

function createWindow() {
  initializeUserData();
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 435, 
    minHeight: 295,
    frame: false,
    autoHideMenuBar: true,
    show: false, // [FIX 1] Ẩn cửa sổ lúc mới tạo để tránh "Flash trắng"
    backgroundColor: '#1e1e1e', // [FIX 2] Đặt màu nền khớp với App để mượt hơn
    icon: fs.existsSync(APP_ICON_PATH) ? APP_ICON_PATH : null, 
    webPreferences: {
      nodeIntegration: true, 
      contextIsolation: false, 
      webviewTag: true, 
      devTools: true, // Giữ true để debug nếu lỗi
      webSecurity: false
    },
  });
  mainWindow.removeMenu();

  // [FIX 3] Chỉ hiện cửa sổ khi nội dung đã sẵn sàng
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && input.key.toLowerCase() === 'r') event.preventDefault();
    if (input.key === 'F5') event.preventDefault();
  });

  const isDev = !app.isPackaged;
  if (isDev) {
      mainWindow.loadURL('http://localhost:5173');
  } else {
      // [QUAN TRỌNG] Load file từ dist
      mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
      
// [QUAN TRỌNG] Bật dòng này lên để debug lỗi trắng màn hình
      mainWindow.webContents.openDevTools();
  }
}
app.whenReady().then(() => {
  // [FIX] Xử lý đường dẫn ảnh: Cắt bỏ tham số ?t=... để Windows tìm đúng file
protocol.registerFileProtocol('local-resource', (request, callback) => {
    let url = request.url.replace('local-resource://', '');
    // Quan trọng: Loại bỏ query string (ví dụ ?t=12345) trước khi đọc file
    url = url.split('?')[0]; 
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

// --- [SAFE LOAD] HÀM ĐỌC BOOKMARK THÔNG MINH (CHỐNG LỖI FILE LẠ) ---
ipcMain.handle('load-bookmarks', async () => {
    try {
        // 1. Đảm bảo thư mục tồn tại
        if (!fs.existsSync(BOOKMARKS_DIR)) {
            fs.mkdirSync(BOOKMARKS_DIR, { recursive: true });
            return [];
        }

        const files = fs.readdirSync(BOOKMARKS_DIR);
        
        // 2. Dùng map để xử lý từng file an toàn
        const bookmarks = files.map(file => {
            const filePath = path.join(BOOKMARKS_DIR, file);

            // A. LỌC ĐUÔI FILE: Chỉ chấp nhận .json, bỏ qua tất cả file rác (.txt, .png, .tmp...)
            if (!file.toLowerCase().endsWith('.json')) return null;

            try {
                // B. ĐỌC VÀ PARSE FILE
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                // Nếu file rỗng -> Bỏ qua
                if (!fileContent.trim()) return null;

                const data = JSON.parse(fileContent);

                // C. KIỂM TRA DỮ LIỆU BẮT BUỘC
                // Nếu thiếu ID hoặc URL -> Coi như file hỏng -> Bỏ qua
                if (!data.id || !data.url) {
                    console.warn(`[SKIP] Bỏ qua bookmark hỏng (thiếu ID/URL): ${file}`);
                    return null;
                }

                // D. XỬ LÝ ĐƯỜNG DẪN ICON (Quan trọng khi copy từ máy khác)
                if (data.localIconPath) {
                    // Chuẩn hóa dấu gạch chéo để tránh lỗi Windows/Linux
                    data.localIconPath = path.join(ICONS_DIR, path.basename(data.localIconPath)).replace(/\\/g, '/');
                }

                return data;
            } catch (err) {
                // E. NẾU GẶP BẤT KỲ LỖI GÌ (Sai cú pháp, file lỗi...) -> BỎ QUA LUÔN
                console.error(`[ERROR] File lỗi, tự động bỏ qua: ${file}`);
                return null;
            }
        })
        .filter(item => item !== null) // Loại bỏ sạch sẽ các file lỗi (null)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Sắp xếp cái mới lên đầu

        console.log(`[LOAD] Đã load thành công ${bookmarks.length} bookmarks hợp lệ.`);
        return bookmarks;

    } catch (error) {
        console.error("Lỗi nghiêm trọng khi đọc thư mục bookmarks:", error);
        return []; // Trả về rỗng để App vẫn mở lên được (không trắng màn hình)
    }
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

// [FIX FINAL] Hàm Update Bookmark: Xử lý thông minh việc giữ ảnh cũ hoặc lưu ảnh mới
ipcMain.handle('update-bookmark', async (event, bookmarkData) => {
    try {
        const id = bookmarkData.id;
        const jsonPath = path.join(BOOKMARKS_DIR, `${id}.json`);
        
        if (fs.existsSync(jsonPath)) {
            // 1. Đọc dữ liệu CŨ từ file
            const oldData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            
            // Mặc định giữ nguyên tên file ảnh cũ
            let savedIconFilename = oldData.localIconPath ? path.basename(oldData.localIconPath) : null;
            
            // 2. Kiểm tra xem người dùng có gửi ảnh MỚI không?
            // Nếu iconUrl khác với localIconPath cũ -> Có nghĩa là người dùng đã chọn ảnh mới
            if (bookmarkData.iconUrl && !bookmarkData.iconUrl.startsWith('local-resource://') && !bookmarkData.iconUrl.includes(savedIconFilename)) {
                
                const iconFilename = `${id}_${Date.now()}.png`; // Thêm timestamp để tránh cache
                const iconSavePath = path.join(ICONS_DIR, iconFilename);
                
                try {
                    if (bookmarkData.iconUrl.startsWith('data:image')) {
                        // Lưu ảnh từ Base64 (Upload từ máy)
                        const base64Data = bookmarkData.iconUrl.replace(/^data:image\/\w+;base64,/, "");
                        fs.writeFileSync(iconSavePath, base64Data, 'base64');
                        // Xóa ảnh cũ nếu có để tiết kiệm dung lượng
                        if (savedIconFilename) {
                            try { fs.unlinkSync(path.join(ICONS_DIR, savedIconFilename)); } catch(e){}
                        }
                        savedIconFilename = iconFilename;
                    } 
                    else if (bookmarkData.iconUrl.startsWith('http')) {
                        // Lưu ảnh từ Link Online
                        await downloadImage(bookmarkData.iconUrl, iconSavePath);
                        if (fs.existsSync(iconSavePath)) {
                            // Xóa ảnh cũ
                            if (savedIconFilename) {
                                try { fs.unlinkSync(path.join(ICONS_DIR, savedIconFilename)); } catch(e){}
                            }
                            savedIconFilename = iconFilename;
                        }
                    }
                } catch (e) {
                    console.error("Lỗi lưu icon mới:", e);
                }
            }

            // 3. Tạo data mới (Ghi đè thông tin mới vào cũ)
            const newData = { 
                ...oldData, 
                title: bookmarkData.title || oldData.title, // Nếu title rỗng thì giữ cũ
                url: bookmarkData.url || oldData.url,       // Nếu url rỗng thì giữ cũ
                localIconPath: savedIconFilename 
            };

            // 4. Ghi đè file JSON (Quan trọng: Dùng try-catch riêng cho việc ghi file)
            try {
                fs.writeFileSync(jsonPath, JSON.stringify(newData, null, 2));
            } catch (writeErr) {
                console.error("Lỗi ghi file JSON (Access Denied?):", writeErr);
                return { success: false, error: "Không thể ghi file (Lỗi quyền truy cập)" };
            }
            
            // 5. Chuẩn bị dữ liệu trả về cho giao diện
            const returnData = { ...newData };
            if (returnData.localIconPath) {
                 returnData.localIconPath = path.join(ICONS_DIR, returnData.localIconPath).replace(/\\/g, '/');
            }
            
            return { success: true, data: returnData };
        }
        return { success: false, error: "Không tìm thấy Bookmark gốc" };
    } catch (error) { 
        return { success: false, error: error.message }; 
    }
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
