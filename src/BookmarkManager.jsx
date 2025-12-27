import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Trash2, LayoutGrid, X, 
  Star, Settings, Folder, Menu, Monitor, 
  ArrowLeft, RefreshCw, Globe, Upload,
  AlertTriangle, RotateCcw, Wand2, SlidersHorizontal,
  ChevronLeft, ChevronRight, HelpCircle, Keyboard,
  MousePointer2, Mouse, Home, Image as ImageIcon, Type,
  Maximize, Minimize, ExternalLink, Type as FontIcon, FolderOpen,
  Check, ChevronDown, Minus, StopCircle, Pencil, Save, XCircle,
  LogOut, Layers, PictureInPicture, Copy,
  Package, PackageOpen, Download, PackageCheck,
  Film, Music, Image, Link, Maximize2
} from 'lucide-react';

// --- KẾT NỐI ELECTRON (Back-end) ---
let ipcRenderer = { 
    invoke: () => Promise.resolve({ success: false }), 
    send: () => {} 
};
try {
  if (window.require) {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
  }
} catch (e) { console.warn('Not in Electron'); }

// --- 1. DỮ LIỆU & CẤU HÌNH ---
const DEFAULT_FONTS = [
  { name: 'Mặc định (System UI)', value: 'Inter, system-ui, -apple-system, sans-serif', scale: 1 },
  { name: 'Segoe UI (Windows)', value: '"Segoe UI", sans-serif', scale: 1 },
  { name: 'Roboto', value: '"Roboto", sans-serif', scale: 1.02 },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif', scale: 1 },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif', scale: 1.15 },
  { name: 'Courier New (Code)', value: '"Courier New", Courier, monospace', scale: 0.9 },
];

const TRANSLATIONS = {
  vi: {
    dashboard: 'Tất cả', favorites: 'Yêu thích', trash: 'Thùng rác',
    library: 'Thư viện', system: 'Hệ thống', settings: 'Cài đặt',
    searchPlaceholder: 'Tìm kiếm bộ sưu tập...', addNew: 'Thêm mới',
    notFound: 'Không tìm thấy dữ liệu', addTitle: 'Thêm trang web',
    save: 'Lưu lại', cancel: 'Hủy bỏ', shortcuts: 'Danh sách chức năng & Phím tắt',
    quitDesc: 'Thoát ứng dụng',
    theme: 'Chế độ', light: 'Sáng', dark: 'Tối', accentColor: 'Màu chủ đạo',
    resetColor: 'Mặc định', navBack: 'Quay lại', navFwd: 'Tiến tới', navReload: 'Tải lại',
    background: 'Hình nền', uploadBg: 'Tải ảnh nền', removeBg: 'Xóa', bgOpacity: 'Độ mờ UI',
    gridCols: 'Độ lớn lưới (Số cột)', font: 'Phông chữ', language: 'Ngôn ngữ',
    deleteConfirmTitle: 'Xóa Bookmark?', deleteConfirmDesc: 'Chuyển vào thùng rác? Bạn có thể khôi phục sau.',
    deletePermanentTitle: 'Xóa Vĩnh Viễn?', deletePermanentDesc: 'Hành động này KHÔNG THỂ khôi phục.',
    delete: 'Xóa', restore: 'Khôi phục',
    urlLabel: 'Đường dẫn URL', titleLabel: 'Tiêu đề', iconLabel: 'Icon (Tùy chọn)',
    scBack: 'Quay lại', scFwd: 'Đi tới', scReload: 'Tải lại',
    scHome: 'Về trang chủ', scZoom: 'Phóng to / Thu nhỏ', scScrollX: 'Cuộn ngang',
    scContextMenu: 'Menu chức năng', mouseRight: 'Chuột phải', mouseScroll: 'Lăn chuột',
    popupTitle: 'Cửa sổ bật lên', openFontFolder: 'Mở thư mục Fonts',
    min: 'Thu nhỏ', max: 'Toàn màn hình',
    editMode: 'Chỉnh sửa', editTitle: 'Cập nhật thông tin', update: 'Cập nhật',
    emptyTrash: 'Dọn rác', emptyConfirmTitle: 'Dọn sạch thùng rác?', emptyConfirmDesc: 'Tất cả bookmark trong thùng rác sẽ bị xóa vĩnh viễn.',
    closeSession: 'Đóng trang này',
    miniMode: 'Chế độ Mini', exitMiniMode: 'Thoát Mini-mode', cloneTab: 'Thêm tab mới'
  },
  en: {
    dashboard: 'All Bookmarks', favorites: 'Favorites', trash: 'Trash',
    library: 'Library', system: 'System', settings: 'Settings',
    searchPlaceholder: 'Search collection...', addNew: 'Add New',
    notFound: 'No bookmarks found', addTitle: 'Add Website',
    save: 'Save', cancel: 'Cancel', shortcuts: 'Functions & Shortcuts',
    quitDesc: 'Quit App',
    theme: 'Theme', light: 'Light', dark: 'Dark', accentColor: 'Accent Color',
    resetColor: 'Default', navBack: 'Back', navFwd: 'Forward', navReload: 'Reload',
    background: 'Background', uploadBg: 'Upload', removeBg: 'Remove', bgOpacity: 'UI Opacity',
    gridCols: 'Grid Size', font: 'Font Family', language: 'Language',
    deleteConfirmTitle: 'Delete Bookmark?', deleteConfirmDesc: 'Move to trash? You can restore it later.',
    deletePermanentTitle: 'Delete Permanently?', deletePermanentDesc: 'This action CANNOT be undone.',
    delete: 'Delete', restore: 'Restore',
    urlLabel: 'URL Link', titleLabel: 'Title', iconLabel: 'Icon (Optional)',
    scBack: 'Go Back', scFwd: 'Go Forward', scReload: 'Reload Page',
    scHome: 'Go Home', scZoom: 'Zoom In / Out', scScrollX: 'Horizontal Scroll',
    scContextMenu: 'Function Menu', mouseRight: 'Right Click', mouseScroll: 'Scroll',
    popupTitle: 'Pop-up Window', openFontFolder: 'Open Fonts Folder',
    min: 'Minimize', max: 'Maximize',
    editMode: 'Edit Mode', editTitle: 'Edit Info', update: 'Update',
    emptyTrash: 'Empty Trash', emptyConfirmTitle: 'Empty Trash?', emptyConfirmDesc: 'All items in trash will be permanently deleted.',
    closeSession: 'Close Session',
    miniMode: 'Mini Mode', exitMiniMode: 'Exit Mini Mode', cloneTab: 'Clone Tab'
  }
};

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}).join('');

const extractDominantColor = (imageSrc) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1;
      canvas.height = 1;
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      resolve(rgbToHex(r, g, b));
    };
    img.onerror = () => resolve(null);
  });
};

const getFavicon = (url, localPath = null) => {
  if (localPath) {
     if (localPath.startsWith('local-resource://')) return localPath;
     if (localPath.startsWith('file://')) return localPath.replace('file://', 'local-resource://');
     return `local-resource://${localPath}`;
  }
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`; } catch (e) { return null; }
};

// --- [NEW COMPONENT] GIAO DIỆN CỬA SỔ MAGIC TOOL ---
function MagicToolWindow() {
    const [items, setItems] = useState([]);
    // [THÊM MỚI] State kiểm soát hiệu ứng mở cửa sổ
    const [isAnimated, setIsAnimated] = useState(false);
    const [filter, setFilter] = useState('all'); // all, image, video, audio
    const [inputLink, setInputLink] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Kích hoạt animation sau khi cửa sổ load xong
        const timer = setTimeout(() => setIsAnimated(true), 50);
        return () => clearTimeout(timer);
    }, []);
    useEffect(() => {
        // Lắng nghe dữ liệu từ Main Process gửi sang
        ipcRenderer.on('magic-data-update', (event, newItems) => {
            // Merge dữ liệu mới vào đầu danh sách, lọc trùng URL
            setItems(prev => {
                const existingUrls = new Set(prev.map(i => i.url));
                const uniqueNew = newItems.filter(i => !existingUrls.has(i.url));
                return [...uniqueNew, ...prev];
            });
        });
        return () => { ipcRenderer.removeAllListeners('magic-data-update'); };
    }, []);

    const handleProcess = async (url) => {
        if (!url) return;
        setIsProcessing(true);
        const result = await ipcRenderer.invoke('process-drop-link', url);
        setIsProcessing(false);
        if (result.success) {
            setItems(prev => {
                const existingUrls = new Set(prev.map(i => i.url));
                const uniqueNew = result.items.filter(i => !existingUrls.has(i.url));
                return [...uniqueNew, ...prev];
            });
            setInputLink('');
        } else {
            alert("Lỗi: " + result.error);
        }
    };

    // Phân loại file
    const getFileType = (item) => {
        const ext = item.name.split('.').pop().toLowerCase();
        if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
        return 'image';
    };

    const filteredItems = items.filter(item => filter === 'all' || getFileType(item) === filter);

    return (
        // [CẬP NHẬT] Thêm transition-all, duration, scale và opacity
        <div className={`
            flex flex-col h-screen bg-[#1e1e1e] text-white overflow-hidden border border-gray-700
            transition-all duration-300 ease-out transform origin-center
            ${isAnimated ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}>
            {/* 1. Custom Title Bar */}
            <div className="h-10 bg-black/40 flex items-center justify-between px-3 draggable" style={{ WebkitAppRegion: 'drag' }}>
                <div className="flex items-center gap-2 font-bold text-sm text-green-400">
                    <Wand2 size={16}/> Magic Downloader
                </div>
                <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
                    <button onClick={() => ipcRenderer.send('magic-window-control', 'minimize')} className="p-1 hover:bg-white/10 rounded"><Minus size={14}/></button>
                    <button onClick={() => ipcRenderer.send('magic-window-control', 'maximize')} className="p-1 hover:bg-white/10 rounded"><Maximize2 size={14}/></button>
                    <button onClick={() => ipcRenderer.send('magic-window-control', 'close')} className="p-1 hover:bg-red-500 rounded"><X size={14}/></button>
                </div>
            </div>

            {/* 2. Input & Drop Zone */}
            <div className="p-4 border-b border-white/10 bg-white/5">
                <div className="flex gap-2 mb-3">
                    <input 
                        value={inputLink}
                        onChange={(e) => setInputLink(e.target.value)}
                        placeholder="Dán đường dẫn ảnh/video/web vào đây..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleProcess(inputLink)}
                    />
                    <button 
                        onClick={() => handleProcess(inputLink)}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing ? <RefreshCw size={16} className="animate-spin"/> : <Download size={16}/>}
                        Quét
                    </button>
                </div>
                
                {/* Internal Drop Zone */}
                <div 
                    className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-green-500/50 hover:bg-green-500/5 transition-all cursor-default"
                    onDragOver={e => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const text = e.dataTransfer.getData('text');
                        if (text) handleProcess(text);
                    }}
                >
                    <p className="text-xs text-gray-400 pointer-events-none">Hoặc kéo thả link vào đây để thêm</p>
                </div>
            </div>

            {/* 3. Filter Tabs */}
            <div className="flex gap-1 p-2 bg-black/20 overflow-x-auto">
                {[
                    { id: 'all', icon: LayoutGrid, label: 'Tất cả' },
                    { id: 'image', icon: ImageIcon, label: 'Hình ảnh' },
                    { id: 'video', icon: Film, label: 'Video' },
                    { id: 'audio', icon: Music, label: 'Âm thanh' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === tab.id ? 'bg-green-600 text-white' : 'hover:bg-white/10 text-gray-400'}`}
                    >
                        <tab.icon size={14}/> {tab.label} <span className="opacity-60 ml-1">{tab.id === 'all' ? items.length : items.filter(i => getFileType(i) === tab.id).length}</span>
                    </button>
                ))}
            </div>

            {/* 4. Grid Results */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <PackageOpen size={48} className="mb-2"/>
                        <p>Danh sách trống</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredItems.map((item, idx) => (
                            <div key={idx} className="bg-black/20 border border-white/5 rounded-lg overflow-hidden group hover:border-green-500/50 transition-all">
                                <div className="aspect-video bg-black/50 relative flex items-center justify-center">
                                    {getFileType(item) === 'video' && <video src={`local-resource://${item.localPath}`} className="w-full h-full object-contain"/>}
                                    {getFileType(item) === 'image' && <img src={`local-resource://${item.localPath}`} className="w-full h-full object-cover"/>}
                                    {getFileType(item) === 'audio' && <Music size={32} className="text-gray-500"/>}
                                    
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                        <button onClick={() => ipcRenderer.invoke('copy-image-to-clipboard', item.localPath)} className="p-2 bg-white text-black rounded hover:bg-gray-200" title="Copy"><Copy size={16}/></button>
                                        <button onClick={() => ipcRenderer.invoke('save-file-from-temp', { sourcePath: item.localPath, defaultName: item.name })} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500" title="Lưu"><Download size={16}/></button>
                                    </div>
                                    <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 px-1 rounded text-white font-mono">{(item.size / 1024).toFixed(0)} KB</span>
                                </div>
                                <div className="p-2">
                                    <div className="text-xs font-bold truncate text-gray-300" title={item.name}>{item.name}</div>
                                    <div className="text-[10px] text-gray-500 truncate mt-0.5">{item.url}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MainApp() {
  // --- STATE ---
  const [bookmarks, setBookmarks] = useState([]); 
  const defaultSettings = { theme: 'dark', lang: 'vi', font: 'Inter', bgImage: null, bgOpacity: 85, accentColor: '#22d3ee', gridCols: 6 };
  const [settings, setSettings] = useState(defaultSettings);
  const [availableFonts, setAvailableFonts] = useState(DEFAULT_FONTS); 

  const [activeTab, setActiveTab] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isEmptyTrashOpen, setIsEmptyTrashOpen] = useState(false); 
  const [formData, setFormData] = useState({ title: '', url: '', iconUrl: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null); // Ref để click ra ngoài thì đóng
  
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(0); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [isProcessingDrop, setIsProcessingDrop] = useState(false);
  const [dropResults, setDropResults] = useState(null); // Danh sách file tải được
  const [isDropZoneHovered, setIsDropZoneHovered] = useState(false);

  // [MỚI] State kiểm soát việc ẩn/hiện bảng kết quả (tách biệt với dữ liệu)
  const [isDropResultOpen, setIsDropResultOpen] = useState(false);

  // [ĐA NHIỆM - TABS] 
  const [sessions, setSessions] = useState([]); 
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  // [MINI MODE]
  const [isMiniMode, setIsMiniMode] = useState(false);

  // [NEW] STATE THEO DÕI KÍCH THƯỚC CỬA SỔ
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const contentRef = useRef(null); // Ref để đo chiều rộng thực tế của vùng chứa Grid

  const [popupUrl, setPopupUrl] = useState(null); 
  const [contextMenu, setContextMenu] = useState({ 
      visible: false, x: 0, y: 0, 
      mediaType: 'none', hasSelection: false,
      targetWebview: 'main'
  });
  
  // Refs
  const webviewRefs = useRef({}); 
  const popupWebviewRef = useRef(null);
  const bgInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const settingsRef = useRef(null);
  const fontDropdownRef = useRef(null); 
  const lastEscTime = useRef(0);

  // --- LOGIC LOAD DỮ LIỆU ---
  const loadData = async () => {
     try {
         const bookmarkData = await ipcRenderer.invoke('load-bookmarks');
         if (Array.isArray(bookmarkData)) setBookmarks(bookmarkData);
         const settingsData = await ipcRenderer.invoke('load-settings');
         if (settingsData) setSettings(prev => ({ ...prev, ...settingsData }));

         let allFonts = [...DEFAULT_FONTS];
         try {
             const localFonts = await ipcRenderer.invoke('get-local-fonts');
             if (Array.isArray(localFonts) && localFonts.length > 0) {
                 const styleId = 'custom-local-fonts';
                 let styleTag = document.getElementById(styleId);
                 if (!styleTag) {
                     styleTag = document.createElement('style');
                     styleTag.id = styleId;
                     document.head.appendChild(styleTag);
                 }
                 const fontFaces = localFonts.map(f => `@font-face { font-family: "${f.name}"; src: url("file://${f.path}"); }`).join('\n');
                 styleTag.textContent = fontFaces;
                 allFonts = [...allFonts, ...localFonts.map(f => ({ name: `${f.name}`, value: `"${f.name}", sans-serif`, isCustom: true, scale: 1 }))];
             }
         } catch (e) { console.log('No local fonts'); }
         try {
             const sysFonts = await ipcRenderer.invoke('get-system-fonts');
             if (Array.isArray(sysFonts)) allFonts = [...allFonts, ...sysFonts.map(f => ({ name: f, value: f, scale: 1 }))];
         } catch (e) {}
         setAvailableFonts(allFonts);
     } catch (err) { console.error("Load failed", err); }
  };

  useEffect(() => { loadData(); }, []);

  
  // [NEW] XỬ LÝ KÉO THẢ LINK
  const handleDropLink = async (e) => {
      e.preventDefault();
      setIsDropZoneHovered(false);
      
      const text = e.dataTransfer.getData('text');
      if (!text || !text.startsWith('http')) return;

      setIsProcessingDrop(true);
      setDropResults(null); // Xóa dữ liệu cũ khi bắt đầu tải cái mới
      
      const result = await ipcRenderer.invoke('process-drop-link', text);
      
      setIsProcessingDrop(false);
      if (result.success) {
          setDropResults(result.items);
          setIsDropResultOpen(true); // [MỚI] Tự động mở bảng khi xong
      } else {
          alert('Lỗi phân tích: ' + result.error);
      }
  };
  // [SCALING] Lắng nghe sự kiện resize
  useEffect(() => {
      const handleResize = () => {
          setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { ipcRenderer.invoke('save-settings', settings); }, 500);
    return () => clearTimeout(timer);
  }, [settings]);

  // --- LOGIC TÍNH TOÁN UI SCALING & GRID ---
  // 1. Hệ số Scale cho UI Dashboard (Sidebar, Header): Thu nhỏ khi cửa sổ < 1100px
  const baseUiWidth = 1100;
  const uiScale = isMiniMode ? 1 : Math.max(0.65, Math.min(1, windowSize.width / baseUiWidth));

  // 2. Logic Grid thông minh (Giữ nguyên kích thước ô lưới)
  // Lấy 1280px làm chuẩn. Tại 1280px, gridCols (ví dụ 6) sẽ cho ra kích thước ô lưới lý tưởng (targetSize).
  // Khi cửa sổ nhỏ lại, ta lấy chiều rộng chia cho targetSize để ra số cột mới.
  const REFERENCE_WIDTH = 1550;
  const REFERENCE_PADDING = 48; // Padding trái phải 24px * 2
  const sidebarWidthAtRef = 170; // Width sidebar chuẩn
  
  // Kích thước ô lưới "chuẩn" mà người dùng muốn (tính tại độ phân giải 1280px)
  const targetItemWidth = (REFERENCE_WIDTH - sidebarWidthAtRef - REFERENCE_PADDING) / (settings.gridCols || 6);

  // Tính số cột thực tế dựa trên chiều rộng hiện tại
  // Chiều rộng khả dụng = Window Width - Sidebar Width (có scale) - Padding
  const currentSidebarWidth = isMiniMode ? 50 : (isSidebarOpen ? (256 * uiScale) : 0);
  const availableWidth = windowSize.width - currentSidebarWidth - 48;
  
  // Số cột tính toán được để giữ nguyên kích thước item
  const calculatedCols = Math.floor(availableWidth / targetItemWidth);
  // Đảm bảo ít nhất 2 cột
  const effectiveGridCols = Math.max(2, calculatedCols);


  // --- LOGIC BOOKMARKS ---
  const openModal = (bookmark = null) => {
    if (bookmark) {
        setEditingId(bookmark.id);
        setFormData({ title: bookmark.title, url: bookmark.url, iconUrl: bookmark.iconUrl || '' });
    } else {
        setEditingId(null);
        setFormData({ title: '', url: '', iconUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveBookmark = async (e) => {
    e.preventDefault(); if (!formData.url) return;
    let finalUrl = formData.url.replace(/^(?:https?:\/\/)?/, 'https://');
    const iconToDownload = formData.iconUrl || `https://www.google.com/s2/favicons?domain=${new URL(finalUrl).hostname}&sz=128`;
    
    if (editingId) {
        const changes = { id: editingId, title: formData.title || 'Website', url: finalUrl, iconUrl: iconToDownload };
        const result = await ipcRenderer.invoke('update-bookmark', changes);
        if (result.success) {
            setBookmarks(prev => prev.map(b => b.id === editingId ? { ...b, ...changes } : b));
            setIsModalOpen(false);
        } else { alert("Lỗi cập nhật: " + result.error); }
    } else {
        const newBookmark = { title: formData.title || 'Website', url: finalUrl, iconUrl: iconToDownload, category: 'Uncategorized', deleted: false, isFavorite: false };
        const result = await ipcRenderer.invoke('add-bookmark', newBookmark);
        if (result.success) {
            setBookmarks(prev => [result.data, ...prev]);
            setIsModalOpen(false);
        } else { alert("Lỗi lưu file: " + result.error); }
    }
  };

  const handleDeleteFromModal = async () => { if (!editingId) return; setItemToDelete(editingId); setIsModalOpen(false); };

  const executeDelete = async () => {
      if (!itemToDelete) return;
      if (activeTab === 'trash') {
          await ipcRenderer.invoke('delete-bookmark', itemToDelete);
          setBookmarks(prev => prev.filter(b => b.id !== itemToDelete));
          closeAllSessionsOfBookmark(itemToDelete);
      } else {
          const item = bookmarks.find(b => b.id === itemToDelete);
          if (item) {
              const updated = { ...item, deleted: true };
              await ipcRenderer.invoke('update-bookmark', updated);
              setBookmarks(prev => prev.map(b => b.id === itemToDelete ? updated : b));
              closeAllSessionsOfBookmark(itemToDelete);
          }
      }
      setItemToDelete(null);
  };

  const executeEmptyTrash = async () => {
      const trashItems = bookmarks.filter(b => b.deleted);
      for (const item of trashItems) {
          await ipcRenderer.invoke('delete-bookmark', item.id);
          closeAllSessionsOfBookmark(item.id);
      }
      setBookmarks(prev => prev.filter(b => !b.deleted));
      setIsEmptyTrashOpen(false);
  };

  const updateBookmarkStatus = async (id, changes) => {
      const item = bookmarks.find(b => b.id === id);
      if (item) {
          const updated = { ...item, ...changes };
          await ipcRenderer.invoke('update-bookmark', updated);
          setBookmarks(prev => prev.map(b => b.id === id ? updated : b));
      }
  };

  // --- QUẢN LÝ TABS / ĐA NHIỆM ---
  const openSession = (bookmarkId) => {
      const existingSessions = sessions.filter(s => s.bookmarkId === bookmarkId);
      if (existingSessions.length > 0) {
          setActiveSessionId(existingSessions[existingSessions.length - 1].sessionId);
      } else {
          createSession(bookmarkId);
      }
      setCurrentZoom(0);
  };

  const createSession = (bookmarkId) => {
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      if (!bookmark) return;
      const newSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const existingCount = sessions.filter(s => s.bookmarkId === bookmarkId).length;
      const newSession = {
          sessionId: newSessionId,
          bookmarkId: bookmarkId,
          title: existingCount === 0 ? 'Main' : `Tab ${existingCount + 1}`,
          url: bookmark.url,
          createdAt: Date.now()
      };
      setSessions(prev => [...prev, newSession]);
      setActiveSessionId(newSessionId);
  };

  const closeSession = (sessionId, e) => {
      if (e) e.stopPropagation();
      if (webviewRefs.current[sessionId]) delete webviewRefs.current[sessionId];
      
      const sessionToDelete = sessions.find(s => s.sessionId === sessionId);
      const remainingSessions = sessions.filter(s => s.sessionId !== sessionId);
      setSessions(remainingSessions);

      if (activeSessionId === sessionId) {
          if (remainingSessions.length > 0 && sessionToDelete) {
             const siblings = remainingSessions.filter(s => s.bookmarkId === sessionToDelete.bookmarkId);
             if (siblings.length > 0) setActiveSessionId(siblings[siblings.length - 1].sessionId);
             else setActiveSessionId(null);
          } else setActiveSessionId(null);
      }
  };

  const closeAllSessionsOfBookmark = (bookmarkId) => {
      setSessions(prev => prev.filter(s => s.bookmarkId !== bookmarkId));
      if (activeSessionId && sessions.find(s => s.sessionId === activeSessionId)?.bookmarkId === bookmarkId) setActiveSessionId(null);
  };

  const closeCurrentSession = () => {
      if (activeSessionId) closeSession(activeSessionId);
  };

  const toggleMiniMode = async () => {
      const newState = !isMiniMode;
      setIsMiniMode(newState);
      
      // 1. Set luôn nổi lên trên
      await ipcRenderer.invoke('set-always-on-top', newState);
      
      // [THÊM ĐOẠN NÀY] - 2. Gửi lệnh thay đổi kích thước
      if (newState) {
          // Kích thước khi vào Mini Mode (Ví dụ: rộng 360px, cao 600px)
          await ipcRenderer.invoke('resize-window', { width: 435, height: 295 });
      } else {
          // Kích thước khi về chế độ thường (Ví dụ: rộng 1280px, cao 800px)
          // Bạn có thể lưu lại kích thước trước đó vào state nếu muốn mượt hơn
          await ipcRenderer.invoke('resize-window', { width: 1280, height: 800 });
      }
  };

  const handleAction = useCallback((actionType, target = 'main', value = null) => {
    let wv = null;
    if (target === 'popup') wv = popupWebviewRef.current;
    else if (activeSessionId) wv = webviewRefs.current[activeSessionId]; 

    if (!wv) return;
    try {
        switch (actionType) {
            case 'goBack': if (wv.canGoBack()) wv.goBack(); break;
            case 'goForward': if (wv.canGoForward()) wv.goForward(); break;
            case 'reload': wv.reload(); break;
            case 'goHome': 
                if (target === 'popup') setPopupUrl(null); 
                else if (isMiniMode) toggleMiniMode();
                else setActiveSessionId(null); 
                break;
            case 'zoomIn': const zIn = wv.getZoomLevel() + 0.5; wv.setZoomLevel(zIn); setCurrentZoom(zIn); break;
            case 'zoomOut': const zOut = wv.getZoomLevel() - 0.5; wv.setZoomLevel(zOut); setCurrentZoom(zOut); break;
            case 'zoomReset': wv.setZoomLevel(0); setCurrentZoom(0); break;
            case 'setZoom': if (value !== null) { wv.setZoomLevel(Number(value)); setCurrentZoom(Number(value)); } break;
            default: break;
        }
    } catch (err) { console.error("Action Error:", err); }
  }, [activeSessionId, isMiniMode]);

// Tìm và thay thế hàm này trong code của bạn
  const attachWebviewEvents = (wv, type = 'main') => {
      if (!wv) return;

      // --- 1. LOGIC XỬ LÝ PHÍM TẮT (Giữ nguyên) ---
      const handleShortcutLogic = (key, isCtrl, isAlt) => {
        const k = key.toLowerCase();
        if (k === 'f5' || (isCtrl && k === 'r')) { handleAction('reload', type); return true; }
        if (isAlt && k === 'arrowleft') { handleAction('goBack', type); return true; }
        if (isAlt && k === 'arrowright') { handleAction('goForward', type); return true; }
        if (isCtrl && (key === '=' || key === '+')) { handleAction('zoomIn', type); return true; }
        if (isCtrl && key === '-') { handleAction('zoomOut', type); return true; }
        if (isCtrl && key === '0') { handleAction('zoomReset', type); return true; }
        if (k === 'escape') {
            if (contextMenu.visible) { setContextMenu(prev => ({ ...prev, visible: false })); return true; }
            if (isModalOpen || isSettingsOpen || itemToDelete || isEmptyTrashOpen) return false;
            if (isMiniMode) { toggleMiniMode(); return true; }
            const now = Date.now();
            if (now - lastEscTime.current < 500) { handleAction('goHome', type); lastEscTime.current = 0; } 
            else { lastEscTime.current = now; }
            return true;
        }
        return false;
      };

      // --- 2. CÁC EVENT LISTENERS ---
      const onInput = (e) => { const input = e.input; if (input?.type !== 'keyDown') return; handleShortcutLogic(input.key, input.control || input.meta, input.alt); };
      
      const onContextMenu = (e) => {
          const params = e.params || {}; const rect = wv.getBoundingClientRect(); setCurrentZoom(wv.getZoomLevel());
          setContextMenu({ visible: true, x: (params.x || 0) + rect.x, y: (params.y || 0) + rect.y, mediaType: params.mediaType, hasSelection: !!params.selectionText, targetWebview: type });
      };
      
      const onNewWindow = (e) => { e.preventDefault(); if (type === 'main' && e.url) setPopupUrl(e.url); };

      // --- [MỚI] 3. TIÊM CSS THANH CUỘN KHI TRANG LOAD XONG ---
      const onDomReady = () => {
          // Màu thanh cuộn trung tính (Xám trong suốt) để hợp với cả Web Sáng và Tối
          const scrollbarCSS = `
            ::-webkit-scrollbar { width: 10px; height: 10px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { 
                background: rgba(128, 128, 128, 0.5); 
                border-radius: 99px; 
                border: 2px solid transparent; 
                background-clip: content-box; 
            }
            ::-webkit-scrollbar-thumb:hover { 
                background: rgba(128, 128, 128, 0.8); 
            }
            ::-webkit-scrollbar-corner { background: transparent; }
          `;
          try {
              wv.insertCSS(scrollbarCSS);
          } catch (err) {
              console.error("Lỗi tiêm CSS thanh cuộn:", err);
          }
      };

      // Xóa listener cũ để tránh trùng lặp (cleanup)
      try {     
          wv.removeEventListener('before-input-event', onInput); 
          wv.removeEventListener('context-menu', onContextMenu); 
          wv.removeEventListener('new-window', onNewWindow); 
          wv.removeEventListener('dom-ready', onDomReady); // [MỚI]
      } catch(e){}

      // Gán listener mới
      wv.addEventListener('before-input-event', onInput); 
      wv.addEventListener('context-menu', onContextMenu); 
      wv.addEventListener('new-window', onNewWindow);
      wv.addEventListener('dom-ready', onDomReady); // [MỚI] Kích hoạt tiêm CSS
  };

  const setPopupWebviewRef = useCallback((node) => { if (node) { popupWebviewRef.current = node; attachWebviewEvents(node, 'popup'); } }, [popupUrl]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
        if (e.key === 'Escape') {
             if (popupUrl) setPopupUrl(null); 
             else if (isModalOpen || isSettingsOpen || itemToDelete || isEmptyTrashOpen) { setIsModalOpen(false); setIsSettingsOpen(false); setItemToDelete(null); setIsEmptyTrashOpen(false); }
        }
    };
    window.addEventListener('keydown', handleGlobalKeyDown); return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [popupUrl, isModalOpen, isSettingsOpen, itemToDelete, isEmptyTrashOpen]);

  useEffect(() => {
    function handleClickOutside(event) { 
        // Xử lý đóng Settings (code cũ)
        if (settingsRef.current && !settingsRef.current.contains(event.target)) { 
            setIsSettingsOpen(false); 
            setIsFontDropdownOpen(false); 
        }
        
        // [THÊM ĐOẠN NÀY] Xử lý đóng Header Menu khi click ra ngoài
        if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
            setIsHeaderMenuOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside); 
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsRef, headerMenuRef]); // Nhớ thêm headerMenuRef vào dependency
  useEffect(() => {
    function handleClickOutside(event) { if (settingsRef.current && !settingsRef.current.contains(event.target)) { setIsSettingsOpen(false); setIsFontDropdownOpen(false); } }
    document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsRef]);

  // --- UI HELPERS ---
  const t = (key) => TRANSLATIONS[settings.lang][key] || key;
  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  const handleBgUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const bgResult = reader.result;
        const color = await extractDominantColor(bgResult);
        setSettings(prev => ({ ...prev, bgImage: bgResult, accentColor: color || prev.accentColor }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleIconUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData({ ...formData, iconUrl: reader.result }); reader.readAsDataURL(file); } };
  const onMenuClick = (action, val) => { handleAction(action, contextMenu.targetWebview, val); if (action !== 'setZoom') { setContextMenu(prev => ({ ...prev, visible: false })); } };

  const getSmartMenuPosition = () => {
      const MENU_WIDTH = 256; const MENU_HEIGHT = 220; 
      let { x, y } = contextMenu;
      if (x + MENU_WIDTH > window.innerWidth) { x = x - MENU_WIDTH; if (x < 0) x = 0; }
      if (y + MENU_HEIGHT > window.innerHeight) { y = y - MENU_HEIGHT; if (y < 0) y = 0; }
      return { x, y };
  };

  const isDark = settings.theme === 'dark';
  const hasBg = !!settings.bgImage;
  const currentAccent = settings.accentColor || '#22d3ee';
  const currentFontObj = availableFonts.find(f => f.value === settings.font);
  const currentFontName = currentFontObj?.name || 'Chọn Font';
  const currentFontScale = currentFontObj?.scale || 1;
  
  const activeSession = sessions.find(s => s.sessionId === activeSessionId);
  const currentBookmark = activeSession ? bookmarks.find(b => b.id === activeSession.bookmarkId) : null;
  const currentBookmarkSessions = currentBookmark ? sessions.filter(s => s.bookmarkId === currentBookmark.id) : [];

  const theme = {
    appStyle: {
      fontFamily: settings.font,
      fontSize: `calc(15px * ${currentFontScale})`, 
      backgroundImage: hasBg ? `url(${settings.bgImage})` : isDark ? `radial-gradient(circle at 80% 20%, ${currentAccent}20 0%, transparent 40%), linear-gradient(to bottom, #0f172a, #020617)` : `linear-gradient(to bottom, #f8fafc, #f1f5f9)`,
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', color: isDark ? '#f1f5f9' : '#1e293b'
    },
    glassPanel: isDark 
      ? { backgroundColor: `rgba(15, 23, 42, ${settings.bgOpacity / 100})`, borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }
      : { backgroundColor: `rgba(255, 255, 255, ${settings.bgOpacity / 100})`, borderColor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)' },
    settingsPanel: isDark 
      ? { backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }
      : { backgroundColor: '#ffffff', borderColor: 'rgba(203, 213, 225, 0.5)' },
  };

  return (
    // [MOD] Min-width đảm bảo không vỡ khung, overflow-hidden để cắt phần dư
    <div className="flex flex-col h-screen overflow-hidden select-none transition-all duration-300 min-w-[435px] min-h-[295px]" style={theme.appStyle}>
      
       <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background-color: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'};
          border-radius: 99px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
        }
        ::-webkit-scrollbar-corner { background: transparent; }
      `}</style>    
      {/* TITLE BAR (Header phía trên) - Chỉ hiện ở Normal Mode */}
      {!isMiniMode && (
        <div className={`h-10 flex items-center justify-between pl-2 pr-1 flex-shrink-0 border-b backdrop-blur-md z-[500] relative`} style={{ ...theme.glassPanel, WebkitAppRegion: 'drag' }}>
            <div className="flex items-center gap-2 flex-1 min-w-0 h-full">
                {!activeSessionId ? (
                    <div className="flex items-center gap-2 px-2 opacity-70">
                        <LayoutGrid size={16} style={{ color: currentAccent }} />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Bookmark Manager</span>
                    </div>
                ) : (
                    <>
                        {/* Navigation Controls */}
                        <div className="flex items-center gap-1 flex-shrink-0 mr-2" style={{ WebkitAppRegion: 'no-drag' }}>
                            <button onClick={() => handleAction('goHome')} className="p-1.5 hover:bg-red-500 hover:text-white rounded transition-colors" title="Home"><Home size={16} /></button>
                            <button onClick={() => handleAction('goBack')} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded" title="Back"><ChevronLeft size={16} /></button>
                            <button onClick={() => handleAction('goForward')} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded" title="Forward"><ChevronRight size={16} /></button>
                            <button onClick={() => handleAction('reload')} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded" title="Reload"><RefreshCw size={14} /></button>
                        </div>
                        {/* TAB BAR */}
                        <div className="flex-1 flex items-center h-full overflow-x-auto gap-1 custom-scrollbar-none pl-1">
                             {currentBookmarkSessions.map(subSess => (
                                <div key={subSess.sessionId} onClick={() => setActiveSessionId(subSess.sessionId)} style={{ WebkitAppRegion: 'no-drag' }} className={`group relative flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-bold cursor-pointer transition-all min-w-[100px] max-w-[180px] border ${activeSessionId === subSess.sessionId ? 'bg-white dark:bg-white/10 border-gray-300 dark:border-white/10 shadow-sm' : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100'}`}>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                                    <span className="truncate flex-1 pb-0.5">{subSess.title}</span>
                                    <button onClick={(e) => closeSession(subSess.sessionId, e)} className="opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded-full p-0.5 transition-all"><X size={10} /></button>
                                </div>
                            ))}
                            <button onClick={() => createSession(activeSession.bookmarkId)} style={{ WebkitAppRegion: 'no-drag' }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-60 hover:opacity-100" title={t('cloneTab')}><Plus size={16} /></button>
                        </div>
                    </>
                )}
            </div>
                
{/* [GIAO DIỆN MỚI] KHU VỰC MAGIC TOOL - LUÔN HIỂN THỊ */}
            <div 
                className="flex items-center gap-2 mx-2 pl-2 border-l border-gray-500/20"
                style={{ WebkitAppRegion: 'no-drag' }}  // <--- [QUAN TRỌNG] THÊM DÒNG NÀY
                // Bắt sự kiện kéo thả cho CẢ CỤM này -> Dễ trúng hơn
                onDragOver={(e) => { e.preventDefault(); setIsDropZoneHovered(true); }}
                onDragLeave={() => setIsDropZoneHovered(false)}
                onDrop={async (e) => {
                    e.preventDefault();
                    setIsDropZoneHovered(false);
                    const text = e.dataTransfer.getData('text');
                    if (text) {
                        setIsProcessingDrop(true);
                        const result = await ipcRenderer.invoke('process-drop-link', text);
                        setIsProcessingDrop(false);
                        if (result.success) {
                            setDropResults(prev => result.items); 
                            ipcRenderer.send('open-magic-tool', result.items);
                        }
                    }
                }}
            >

                {/* 2. NÚT MỞ HỘP (VUÔNG VẮN) */}
                <button
                    onClick={() => ipcRenderer.send('open-magic-tool', null)}
                    className={`
                        w-8 h-8 flex items-center justify-center rounded-lg border transition-all active:scale-95
                        ${dropResults && dropResults.length > 0 
                            ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-500/20' // Có đồ: Xanh lá nổi bật
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-500 hover:border-blue-500'} // Trống: Màu cơ bản
                    `}
                    title="Mở Magic Downloader"
                >
                     {/* Nếu có đồ thì hiện Hộp Đóng, nếu không thì Hộp Mở */}
                    {dropResults && dropResults.length > 0 ? <PackageCheck size={16}/> : <PackageOpen size={16}/>}
                </button>
            </div>            
            {/* Window Controls */}
            <div className="flex items-center gap-1 pl-4" style={{ WebkitAppRegion: 'no-drag' }}>
                {activeSessionId && (<><button onClick={toggleMiniMode} className="p-1.5 hover:bg-blue-500 hover:text-white rounded transition-colors opacity-60 hover:opacity-100" title={t('miniMode')}><PictureInPicture size={16} /></button><div className="w-px h-3 bg-gray-500/30 mx-2"></div></>)}
                <button onClick={() => ipcRenderer.send('app-minimize')} className="p-1.5 opacity-50 hover:opacity-100 hover:bg-black/5 rounded"><Minus size={14}/></button>
                <button onClick={() => ipcRenderer.send('app-maximize')} className="p-1.5 opacity-50 hover:opacity-100 hover:bg-black/5 rounded"><Maximize size={14}/></button>
                <button onClick={() => ipcRenderer.send('app-quit')} className="p-1.5 hover:bg-red-500 hover:text-white rounded transition-colors ml-1"><X size={14}/></button>
            </div>
        </div>
      )}

      {/* --- CẤU TRÚC LAYOUT CHÍNH (THAY ĐỔI LAYOUT Ở MINI MODE) --- */}
      <div className={`flex-1 flex overflow-hidden relative w-full h-full ${isMiniMode ? 'flex-row' : 'flex-col'}`}>
        
        {/* [MINI MODE SIDEBAR] */}
        {isMiniMode && (
           <div 
             className="w-10 bg-gray-900 border-r border-white/10 flex flex-col items-center pt-3 z-50 select-none gap-3"
             style={{ WebkitAppRegion: 'drag' }} // Kéo cửa sổ bằng thanh này
           >
              {/* Nút thoát ở trên cùng */}
              <button 
                  onClick={toggleMiniMode}
                  className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                  title={t('exitMiniMode')}
                  style={{ WebkitAppRegion: 'no-drag' }}
              >
                  <LogOut size={18} className="rotate-180"/>
              </button>

              <div className="w-6 h-px bg-white/10 my-1"></div>

              {/* Icon Bookmarks */}
              <div className="relative group flex justify-center w-full" style={{ WebkitAppRegion: 'no-drag' }}>
                  <div className="p-1.5 text-yellow-500 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <Star size={18} fill="currentColor"/>
                  </div>
                  {/* Tooltip List (Delay 1s) */}
                  <div 
                    className="absolute left-full top-0 ml-1 w-64 bg-gray-900 border border-white/10 rounded-lg shadow-2xl p-2 
                                  invisible opacity-0 translate-x-[-10px]
                                  group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                                  transition-all duration-300 z-[9999]"
                    style={{ transitionDelay: '1000ms' }} // Bắt buộc delay 1s
                  >
                      <div className="text-[10px] font-bold uppercase text-gray-500 mb-2 pb-1 border-b border-white/10">{t('favorites')}</div>
                      <div className="max-h-[80vh] overflow-y-auto custom-scrollbar space-y-1">
                          {bookmarks.filter(b => b.isFavorite).map(b => (
                              <div key={b.id} onClick={() => openSession(b.id)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 cursor-pointer text-gray-300 hover:text-white">
                                  <img src={b.iconUrl} className="w-3 h-3 rounded-sm" alt=""/>
                                  <span className="text-xs truncate">{b.title}</span>
                              </div>
                          ))}
                          {bookmarks.filter(b => b.isFavorite).length === 0 && <div className="text-xs text-gray-500 italic p-1">Trống</div>}
                      </div>
                  </div>
              </div>

              {/* Icon Tabs */}
              <div className="relative group flex justify-center w-full" style={{ WebkitAppRegion: 'no-drag' }}>
                  <div className="p-1.5 text-blue-400 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <Layers size={18} />
                  </div>
                  {/* Tooltip List (Delay 1s) */}
                  <div 
                    className="absolute left-full top-0 ml-1 w-64 bg-gray-900 border border-white/10 rounded-lg shadow-2xl p-2 
                                  invisible opacity-0 translate-x-[-10px]
                                  group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                                  transition-all duration-300 z-[9999]"
                    style={{ transitionDelay: '1000ms' }} // Bắt buộc delay 1s
                  >
                      <div className="text-[10px] font-bold uppercase text-gray-500 mb-2 pb-1 border-b border-white/10">Active Tabs</div>
                      <div className="max-h-[80vh] overflow-y-auto custom-scrollbar space-y-1">
                          {/* SỬ DỤNG BIẾN SESSIONS (Array) ĐỂ RENDER LIST */}
                          {sessions.map(sess => (
                              <div key={sess.sessionId} onClick={() => setActiveSessionId(sess.sessionId)} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${activeSessionId === sess.sessionId ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-white/10'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${activeSessionId === sess.sessionId ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                  <span className="text-xs truncate">{sess.title}</span>
                              </div>
                          ))}
                          {sessions.length === 0 && <div className="text-xs text-gray-500 italic p-1">Trống</div>}
                      </div>
                  </div>
              </div>
           </div>
        )}

        {/* CONTAINER CHỨA WEBVIEW VÀ DASHBOARD (NỘI DUNG CHÍNH) */}
        <div className="flex-1 relative w-full h-full overflow-hidden">
            {/* Render các Webview từ mảng SESSIONS */}
            {sessions.map(session => {
                const isActive = activeSessionId === session.sessionId;
                return (
                    <div 
                        key={session.sessionId} 
                        className={`absolute inset-0 z-20 bg-white flex flex-col ${isActive ? 'flex' : 'hidden'}`}
                    >
                        <div className="flex-1 relative w-full h-full bg-[#18191a] overflow-hidden">
                            <webview 
                                ref={(el) => {
                                    if (el) {
                                        webviewRefs.current[session.sessionId] = el;
                                        if (!el.dataset.attached) {
                                            attachWebviewEvents(el, 'main');
                                            el.dataset.attached = "true";
                                        }
                                    }
                                }}
                                src={session.url} 
                                className="w-full h-full"
                                style={{ display: 'inline-flex' }}
                            />
                        </div>
                    </div>
                );
            })}

            {/* DASHBOARD (Hiển thị khi không có tab nào active) */}
            <div className={`absolute inset-0 z-10 flex w-full h-full ${!activeSessionId ? 'flex' : 'hidden'} ${isMiniMode ? 'hidden' : ''}`}>
                
                {/* [MOD] CÁCH LY UI SCALING: CHỈ ÁP DỤNG CHO SIDEBAR VÀ HEADER, CONTENT GIỮ NGUYÊN (ZOOM: 1) */}
                
                {/* 1. SIDEBAR: CO GIÃN */}
                <aside 
                    className={`flex-col border-r transition-all duration-300 ${isSidebarOpen ? 'w-[170px] flex' : 'w-0 hidden'} backdrop-blur-xl origin-top-left`} 
                    style={{ ...theme.glassPanel, zoom: uiScale }} // Scale Sidebar
                >
                   <nav className="p-4 space-y-1">
                     {['all', 'favorites', 'trash'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab ? 'text-white shadow-lg' : 'opacity-60 hover:opacity-100 hover:bg-black/5'}`} style={activeTab === tab ? { backgroundColor: currentAccent } : {}}>{tab === 'all' ? <Folder size={18}/> : tab === 'favorites' ? <Star size={18}/> : <Trash2 size={18}/>}{t(tab === 'all' ? 'dashboard' : tab)}</button>))}
                   </nav>
                </aside>

                <main className="flex-1 flex flex-col h-full min-w-0">
                   {/* 2. HEADER: CO GIÃN */}
                   <header 
                        className="h-16 flex items-center justify-between px-6 border-b border-gray-500/10 shrink-0 backdrop-blur-md z-[500] relative origin-top-left" 
                        style={{ ...theme.glassPanel, zoom: uiScale }} // Scale Header
                   >
                      <div className="flex items-center gap-4">
    {/* Nút Toggle Sidebar */}
    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        <Menu size={20}/>
    </button>
    
    {/* [LOGIC MỚI] MENU TIÊU ĐỀ (Dropdown) */}
    <div className="relative" ref={headerMenuRef}>
        <button 
            onClick={() => {
                // Chỉ cho phép mở khi Sidebar đang đóng (hoặc bạn thích mở lúc nào cũng được thì bỏ check !isSidebarOpen)
                if (!isSidebarOpen) setIsHeaderMenuOpen(!isHeaderMenuOpen);
            }}
            // Nếu Sidebar đóng -> Hiện trỏ chuột và hover. Nếu Sidebar mở -> Chỉ là text thường
            className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${
                !isSidebarOpen 
                ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 pr-3' 
                : 'cursor-default'
            }`}
        >
            <h2 className="text-xl font-bold tracking-tight select-none">
                {t(activeTab === 'all' ? 'dashboard' : activeTab)}
            </h2>
            
            {/* Mũi tên chỉ hiện khi Sidebar bị ẩn */}
            {!isSidebarOpen && (
                <ChevronDown 
                    size={18} 
                    className={`opacity-50 transition-transform duration-200 ${isHeaderMenuOpen ? 'rotate-180' : ''}`}
                />
            )}
        </button>

        {/* MENU XỔ XUỐNG */}
        {isHeaderMenuOpen && !isSidebarOpen && (
            <div 
                className={`absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl border p-2 animate-in fade-in zoom-in-95 duration-200 z-[100] origin-top-left flex flex-col gap-1`}
                style={theme.glassPanel} // Tận dụng style kính mờ có sẵn
            >
                {[
                    { id: 'all', icon: Folder, label: 'dashboard' },
                    { id: 'favorites', icon: Star, label: 'favorites' },
                    { id: 'trash', icon: Trash2, label: 'trash' }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveTab(item.id);
                            setIsHeaderMenuOpen(false); // Đóng menu sau khi chọn
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === item.id 
                            ? 'text-white shadow-md' 
                            : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                        style={activeTab === item.id ? { backgroundColor: currentAccent } : {}}
                    >
                        <item.icon size={18} />
                        {t(item.label)}
                        {activeTab === item.id && <Check size={14} className="ml-auto"/>}
                    </button>
                ))}
            </div>
        )}
    </div>
</div>
                      
                      <div className="flex items-center gap-3">
                          <div className="relative" ref={settingsRef}>
                            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 rounded-lg text-sm font-bold shadow-sm border transition-all ${isSettingsOpen ? 'text-blue-500 border-blue-500 bg-blue-50' : 'hover:bg-black/5 bg-white/50 border-transparent'}`} title={t('settings')}><Settings size={18} className={isSettingsOpen ? 'animate-spin-slow' : ''} /></button>
                            {isSettingsOpen && (<div className={`absolute right-0 top-full mt-3 w-80 rounded-2xl shadow-2xl border p-5 z-[1000] animate-in fade-in zoom-in-95 duration-200 origin-top-right`} style={theme.settingsPanel}><div className="space-y-6 pr-1"><div className="flex items-center justify-between pb-4 border-b border-gray-500/10"><h4 className="font-bold text-lg flex items-center gap-2"><SlidersHorizontal size={18}/> {t('settings')}</h4></div><div><label className={`text-xs font-bold uppercase tracking-wider mb-2 block opacity-70`}>{t('theme')}</label><div className={`flex rounded-xl p-1 border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`}><button onClick={() => updateSetting('theme', 'light')} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${!isDark ? 'bg-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}>{t('light')}</button><button onClick={() => updateSetting('theme', 'dark')} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${isDark ? 'bg-slate-700 shadow-sm' : 'opacity-50 hover:opacity-100'}`}>{t('dark')}</button></div></div><div><label className={`text-xs font-bold uppercase tracking-wider mb-2 block opacity-70`}>{t('accentColor')}</label><div className="flex items-center gap-3"><div className="relative w-8 h-8 rounded-full border shadow-sm flex-shrink-0 overflow-hidden group cursor-pointer" style={{ backgroundColor: currentAccent }}><input type="color" value={currentAccent.length === 7 ? currentAccent : '#22d3ee'} onChange={(e) => updateSetting('accentColor', e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"/><div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none transition-opacity"><Wand2 size={12} className="text-white"/></div></div><div className="flex-1"><button onClick={() => updateSetting('accentColor', null)} className="text-xs underline opacity-60 hover:opacity-100">{t('resetColor')}</button></div></div></div><div><label className={`text-xs font-bold uppercase tracking-wider mb-2 block opacity-70`}>{t('background')}</label>{settings.bgImage ? (<div className="relative group rounded-xl overflow-hidden h-24 border border-gray-500/20"><img src={settings.bgImage} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" /><button onClick={() => updateSetting('bgImage', null)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"><Trash2 size={16} className="mr-1"/> {t('removeBg')}</button></div>) : (<div onClick={() => bgInputRef.current?.click()} className={`h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 ${isDark ? 'border-slate-700' : 'border-slate-300'}`} style={{ ':hover': { borderColor: currentAccent } }}><Upload size={20} className="opacity-50 mb-1" /><span className="text-xs font-bold opacity-60">{t('uploadBg')}</span></div>)}<input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />{settings.bgImage && (<div className="mt-3"><div className="flex justify-between text-xs mb-1 opacity-70"><span>{t('bgOpacity')}</span><span>{settings.bgOpacity}%</span></div><input type="range" min="0" max="100" value={settings.bgOpacity} onChange={(e) => updateSetting('bgOpacity', Number(e.target.value))} className="w-full h-1 bg-gray-500/20 rounded-lg appearance-none cursor-pointer" style={{ accentColor: currentAccent }} /></div>)}</div><div><div className="flex justify-between mb-2"><label className={`text-xs font-bold uppercase tracking-wider opacity-70`}>{t('gridCols')}</label><span className="text-xs font-bold bg-black/10 px-1.5 py-0.5 rounded">{settings.gridCols || 6}</span></div><input type="range" min="4" max="18" step="1" value={settings.gridCols || 6} onChange={(e) => updateSetting('gridCols', Number(e.target.value))} className="w-full h-1 bg-gray-500/20 rounded-lg appearance-none cursor-pointer" style={{ accentColor: currentAccent }} /></div><div><label className={`text-xs font-bold uppercase tracking-wider mb-2 block opacity-70`}>{t('language')}</label><div className={`flex rounded-lg border overflow-hidden mb-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>{['vi', 'en'].map(lang => (<button key={lang} onClick={() => updateSetting('lang', lang)} className={`flex-1 py-1.5 text-xs font-bold ${settings.lang === lang ? 'bg-black/10' : 'hover:bg-black/5'}`} style={settings.lang === lang ? { color: currentAccent } : {}}>{lang.toUpperCase()}</button>))}</div><div className="flex justify-between items-center mb-2"><label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 opacity-70`}><FontIcon size={12}/> {t('font')}</label><button onClick={() => ipcRenderer.send('open-fonts-folder')} className="text-[10px] font-bold opacity-50 hover:opacity-100 flex items-center gap-1 hover:text-blue-500" title={t('openFontFolder')}><FolderOpen size={10}/> Folder</button></div><div className="relative" ref={fontDropdownRef}><button onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs border outline-none font-medium transition-all ${isDark ? 'bg-slate-900 border-slate-700 hover:border-slate-600' : 'bg-slate-100 border-slate-200 hover:border-slate-300'}`}><span className="truncate flex-1 text-left">{currentFontName}</span><ChevronDown size={14} className={`opacity-50 transition-transform ${isFontDropdownOpen ? 'rotate-180' : ''}`}/></button>{isFontDropdownOpen && (<div className={`absolute bottom-full left-0 right-0 mb-2 z-[70] max-h-48 overflow-y-auto custom-scrollbar rounded-xl border shadow-xl ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}><div className="p-1 space-y-0.5">{availableFonts.map((f, i) => (<button key={i} onClick={() => { updateSetting('font', f.value); setIsFontDropdownOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${settings.font === f.value ? (isDark ? 'bg-white/10' : 'bg-black/5') : (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')}`} style={{ fontFamily: f.value }}><span className="truncate">{f.name}</span>{settings.font === f.value && <Check size={12} className="text-blue-500"/>}</button>))}</div></div>)}</div></div></div></div>)}
                          </div>
                          {activeTab === 'trash' ? (<button onClick={() => setIsEmptyTrashOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg bg-red-500 hover:bg-red-600 active:scale-95 transition-all"><Trash2 size={18} /> <span className="hidden sm:inline">{t('emptyTrash')}</span></button>) : (<><button onClick={() => setIsEditMode(!isEditMode)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold shadow-sm border transition-all ${isEditMode ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-white/50 border-transparent hover:bg-black/5'}`} title={t('editMode')}><Pencil size={16} /> <span className="hidden sm:inline">{t('editMode')}</span></button><button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg active:scale-95 transition-transform" style={{ backgroundColor: currentAccent }}><Plus size={18} /> <span className="hidden sm:inline">{t('addNew')}</span></button></>)}
                      </div>
                   </header>

                   {/* 3. CONTENT (GRID): KHÔNG ZOOM, MÀ THAY ĐỔI CỘT */}
                   <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      {/* Nếu đang ở Mini Mode mà chưa mở tab nào thì hiện hướng dẫn */}
                      {isMiniMode && !activeSessionId ? (
                           <div className="h-full flex flex-col items-center justify-center opacity-50">
                              <PictureInPicture size={40} className="mb-2"/>
                              <p className="text-xs font-bold">Chế độ Mini</p>
                              <p className="text-[10px] opacity-70">Chọn Bookmark từ menu bên trái</p>
                           </div>
                      ) : (
                          <>
                              {/* Dùng effectiveGridCols (tự động giảm cột) thay vì settings.gridCols */}
                              <div 
                                className="grid gap-2 pb-10" 
                                style={{ 
                                    gridTemplateColumns: `repeat(${effectiveGridCols}, minmax(0, 1fr))`,
                                    // Ở đây KHÔNG có zoom, để icon giữ nguyên kích thước
                                }}
                              >
                                  {bookmarks.filter(b => { if (activeTab === 'trash') return b.deleted; if (b.deleted) return false; if (activeTab === 'favorites') return b.isFavorite; return b.title.toLowerCase().includes(searchQuery.toLowerCase()); }).map(b => (
                                    <BookmarkCard 
                                       key={b.id} 
                                       data={b} 
                                       getFavicon={getFavicon} 
                                       isDark={isDark} 
                                       isTrash={activeTab === 'trash'} 
                                       setViewingUrl={openSession} 
                                       setItemToDelete={setItemToDelete} 
                                       updateStatus={updateBookmarkStatus}
                                       hasBg={hasBg} 
                                       isEditMode={isEditMode} 
                                       onEdit={openModal}
    
                                       baseGridSize={settings.gridCols || 6} 
                                     />
                                  ))}
                              </div>
                              {bookmarks.filter(b => !b.deleted).length === 0 && activeTab !== 'trash' && (<div className="h-full flex flex-col items-center justify-center opacity-30 mt-[-50px]"><Monitor size={60} strokeWidth={1} /><p className="mt-2 text-sm font-bold">{t('notFound')}</p></div>)}
                          </>
                      )}
                   </div>
                </main>
            </div>

            {/* --- POPUP NỘI BỘ --- */}
            {popupUrl && (<div className="absolute inset-0 z-[150] bg-black animate-in fade-in zoom-in-95 duration-200 overflow-hidden"><button onClick={() => setPopupUrl(null)} className="absolute top-4 right-4 z-[200] p-2.5 rounded-full bg-black/50 text-white/80 hover:bg-red-600 hover:text-white hover:scale-110 transition-all backdrop-blur-md shadow-xl border border-white/20 group cursor-pointer" title="Đóng"><X size={24} className="group-hover:rotate-90 transition-transform duration-300"/></button><webview ref={setPopupWebviewRef} src={popupUrl} className="w-full h-full bg-white" style={{ display: 'inline-flex' }}/></div>)}
            
            {/* --- CONTEXT MENU (THÔNG MINH) --- */}
            {contextMenu.visible && (<div className="fixed inset-0 z-[190] cursor-default" onClick={() => setContextMenu({ ...contextMenu, visible: false })} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ ...contextMenu, visible: false }); }}></div>)}
            {contextMenu.visible && (
              <div className={`fixed z-[200] w-64 rounded-xl shadow-2xl border p-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-2`} style={{ left: getSmartMenuPosition().x, top: getSmartMenuPosition().y, ...theme.glassPanel }} onClick={e => e.stopPropagation()}>
                <div className="flex gap-1"><button onClick={() => onMenuClick('goBack')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-black/5 ${isDark ? 'hover:bg-white/10' : ''}`} title="Back"><ArrowLeft size={16}/></button><button onClick={() => onMenuClick('reload')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-black/5 ${isDark ? 'hover:bg-white/10' : ''}`} title="Reload"><RefreshCw size={15}/></button><button onClick={() => onMenuClick('goForward')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-black/5 ${isDark ? 'hover:bg-white/10' : ''}`} title="Forward"><ArrowLeft size={16} className="rotate-180"/></button><button onClick={() => onMenuClick('goHome')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-blue-500 hover:text-white`} title="Home"><Home size={16}/></button></div>
                <div className={`rounded-lg p-2 ${isDark ? 'bg-black/20' : 'bg-black/5'}`}><div className="flex justify-between items-center text-[10px] font-bold opacity-60 mb-1 px-1"><span>Zoom</span><span>{Math.round(100 * Math.pow(1.2, currentZoom))}%</span></div><div className="relative h-6 flex items-center"><div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-current opacity-30 -translate-x-1/2 pointer-events-none h-full z-0"></div><input type="range" min="-3" max="3" step="0.1" value={currentZoom} onChange={(e) => onMenuClick('setZoom', e.target.value)} className="w-full h-1 bg-gray-500/30 rounded-lg appearance-none cursor-pointer z-10 relative" style={{ accentColor: currentAccent }}/></div><div className="flex justify-between text-[9px] opacity-40 px-1 mt-1 font-mono"><span>-</span><span className="cursor-pointer hover:opacity-100" onClick={() => onMenuClick('zoomReset')}>RESET (100%)</span><span>+</span></div></div>
                <button onClick={() => { if(activeSession) { createSession(activeSession.bookmarkId); setContextMenu(prev => ({ ...prev, visible: false })); } }} className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 hover:bg-blue-500 hover:text-white`}><Copy size={12} /> {t('cloneTab')}</button>
              </div>
            )}
        </div>
      </div>

      {/* --- MODALS (Z-INDEX 9000) --- */}
      {isEmptyTrashOpen && (<div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsEmptyTrashOpen(false)}><div className={`w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}><Trash2 size={40} className="mx-auto text-red-500 mb-4 bg-red-500/10 p-2 rounded-full"/><h3 className="font-bold text-lg mb-2">{t('emptyConfirmTitle')}</h3><p className="text-sm opacity-60 mb-6">{t('emptyConfirmDesc')}</p><div className="flex gap-3"><button onClick={() => setIsEmptyTrashOpen(false)} className="flex-1 py-2 rounded-lg font-bold border opacity-60 hover:opacity-100">{t('cancel')}</button><button onClick={executeEmptyTrash} className="flex-1 py-2 rounded-lg font-bold bg-red-500 text-white shadow-lg">{t('delete')}</button></div></div></div>)}
      {itemToDelete && (<div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setItemToDelete(null)}><div className={`w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}><AlertTriangle size={40} className="mx-auto text-red-500 mb-4 bg-red-500/10 p-2 rounded-full"/><h3 className="font-bold text-lg mb-6">{activeTab === 'trash' ? t('deletePermanentTitle') : t('deleteConfirmTitle')}</h3><div className="flex gap-3"><button onClick={() => setItemToDelete(null)} className="flex-1 py-2 rounded-lg font-bold border opacity-60 hover:opacity-100">{t('cancel')}</button><button onClick={executeDelete} className="flex-1 py-2 rounded-lg font-bold bg-red-500 text-white shadow-lg">{t('delete')}</button></div></div></div>)}
      {isModalOpen && (<div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}><div className={`w-full max-w-lg rounded-2xl p-0 shadow-2xl overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-white'}`} onClick={e => e.stopPropagation()}><div className="p-4 border-b border-gray-500/10 flex justify-between items-center bg-black/5"><h3 className="font-bold">{editingId ? t('editTitle') : t('addTitle')}</h3><button onClick={() => setIsModalOpen(false)}><X size={18}/></button></div><form onSubmit={handleSaveBookmark} className="p-6 space-y-4"><div><label className="text-xs font-bold uppercase opacity-60 mb-1 block">{t('urlLabel')} <span className="text-red-500">*</span></label><div className="relative"><Globe size={16} className="absolute left-3 top-3 opacity-50"/><input autoFocus placeholder="example.com" className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} /></div></div><div><label className="text-xs font-bold uppercase opacity-60 mb-1 block">{t('titleLabel')}</label><input placeholder="My Website" className="w-full px-3 py-2.5 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div><div><label className="text-xs font-bold uppercase opacity-60 mb-1 block">{t('iconLabel')}</label><div className="flex gap-2"><input type="text" placeholder="Image URL..." className="flex-1 px-3 py-2.5 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500" value={formData.iconUrl} onChange={e => setFormData({...formData, iconUrl: e.target.value})} /><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleIconUpload} /><button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 border rounded-xl hover:bg-black/5"><Upload size={18}/></button></div></div><div className="pt-4 flex justify-between gap-3">{editingId ? (<button type="button" onClick={handleDeleteFromModal} className="px-4 py-2 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors">{t('delete')}</button>) : (<div></div>)}<div className="flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-xl font-bold opacity-60 hover:opacity-100 hover:bg-black/5">{t('cancel')}</button><button type="submit" className="px-6 py-2 rounded-xl font-bold text-white shadow-lg transform active:scale-95 transition-all" style={{ backgroundColor: currentAccent }}>{editingId ? t('update') : t('save')}</button></div></div></form></div></div>)}
{/* [NEW] MODAL KẾT QUẢ - SỬA LẠI LOGIC HIỂN THỊ */}
      {isDropResultOpen && dropResults && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setIsDropResultOpen(false)}>
            <div className="w-[80vw] h-[80vh] bg-[#1e1e1e] rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <PackageOpen className="text-green-500"/> Kho dữ liệu tạm ({dropResults.length})
                    </h3>
                    <button onClick={() => setIsDropResultOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} className="text-white"/></button>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
                        {dropResults.map((item, idx) => (
                            <div key={idx} className="relative group bg-black/40 rounded-xl overflow-hidden border border-white/5 hover:border-blue-500 transition-all">
                                {item.isDownloaded ? (
                                    <>
                                        {/* Preview */}
                                        <div className="aspect-square flex items-center justify-center bg-checkerboard">
                                            {item.name.endsWith('.mp4') ? (
                                                <video src={`local-resource://${item.localPath}`} className="w-full h-full object-cover"/>
                                            ) : (
                                                <img src={`local-resource://${item.localPath}`} className="w-full h-full object-cover"/>
                                            )}
                                        </div>
                                        
                                        {/* [MỚI] Action Buttons Overlay */}
                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-2">
                                            {/* Nút Copy */}
                                            <button 
                                                onClick={() => ipcRenderer.invoke('copy-image-to-clipboard', item.localPath)}
                                                className="w-full py-1.5 bg-white text-black text-[10px] font-bold rounded hover:bg-gray-200 flex items-center justify-center gap-1"
                                            >
                                                <Copy size={12}/> Copy
                                            </button>
                                            
                                            {/* Nút Download */}
                                            <button 
                                                onClick={() => ipcRenderer.invoke('save-file-from-temp', { sourcePath: item.localPath, defaultName: item.name })}
                                                className="w-full py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-500 flex items-center justify-center gap-1"
                                            >
                                                <Download size={12}/> Lưu
                                            </button>
                                        </div>

                                        <div className="absolute bottom-1 right-1 bg-black/50 px-1 rounded text-[10px] text-white pointer-events-none">
                                            {(item.size / 1024).toFixed(0)} KB
                                        </div>
                                    </>
                                ) : (
                                    // File lớn
                                    <div className="aspect-square flex flex-col items-center justify-center p-2 text-center bg-red-900/20">
                                        <AlertTriangle size={24} className="text-red-500 mb-2"/>
                                        <span className="text-xs font-bold text-red-400">FILE LỚN</span>
                                        <button onClick={() => window.open(item.url, '_blank')} className="mt-2 px-2 py-1 border border-red-500 text-red-500 text-[10px] rounded hover:bg-red-600 hover:text-white">Mở Link</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Footer - Chỉ đóng chứ không xóa dữ liệu */}
                <div className="p-3 border-t border-white/10 bg-black/20 text-right">
                    <span className="text-xs text-gray-500 italic mr-4">Dữ liệu vẫn được giữ trong hộp cho đến khi bạn tắt App</span>
                    <button onClick={() => setIsDropResultOpen(false)} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-xl">Ẩn đi</button>
                </div>
            </div>
        </div>
      )}
</div>
  );
}
// --- [BƯỚC 3] ROUTER ĐIỀU HƯỚNG ---
// Đây sẽ là component chính được chạy đầu tiên
export default function AppEntry() {
    const [route, setRoute] = useState(window.location.hash);

    useEffect(() => {
        // Lắng nghe sự thay đổi của hash trên URL (ví dụ: #magic-tool)
        const handleHashChange = () => setRoute(window.location.hash);
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Nếu URL có đuôi #magic-tool -> Hiển thị Cửa sổ Magic Downloader
    if (route === '#magic-tool') {
        return <MagicToolWindow />;
    }

    // Mặc định -> Hiển thị App quản lý Bookmark chính
    return <MainApp />;
}
// Thay thế hoàn toàn function BookmarkCard ở cuối file
function BookmarkCard({ 
  data, getFavicon, isDark, isTrash, 
  setViewingUrl, setItemToDelete, updateStatus, 
  hasBg, isEditMode, onEdit, baseGridSize 
}) {
  // 1. Tính Font Size
  const calculatedFontSize = Math.max(11, Math.min(15, 12 + (6 - baseGridSize) * 0.9));

  // 2. LOGIC QUAN TRỌNG: Kiểm tra xem tên có dấu cách không
  const hasSpace = data.title.trim().includes(' ');

  const displayIcon = getFavicon(data.url, data.localIconPath) || data.iconUrl;
  
  const titleClass = hasBg 
    ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" 
    : "text-gray-700 dark:text-gray-300 group-hover:text-blue-500";

  return (
    <div 
        className="group cursor-pointer relative flex flex-col items-center w-full p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all" 
        onClick={(e) => { 
            if (isEditMode && !data.deleted) { e.preventDefault(); onEdit(data); } 
            else if (!data.deleted) { setViewingUrl(data.id); } 
        }}
    >
        {/* Tooltip */}
        <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-[200px] pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 group-hover:delay-[1000ms]">
            <div className="bg-gray-900 text-white text-xs px-2 py-1.5 rounded shadow-xl border border-white/10 whitespace-normal break-words text-center z-50">
                <div className="font-bold">{data.title}</div>
                <div className="text-[10px] text-gray-400 mt-0.5 opacity-80 truncate max-w-[180px]">{data.url}</div>
            </div>
        </div>

        {/* ICON CONTAINER */}
        <div className={`w-full aspect-square rounded-2xl border flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all relative z-10 
            ${isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-white/60'} 
            ${isEditMode && !data.deleted ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`
        }>
          <img 
            src={displayIcon} 
            alt={data.title} 
            className="w-[80%] h-[80%] object-contain pointer-events-none select-none drop-shadow-md" 
            onError={(e) => { 
                e.target.onerror = null; 
                if (e.target.src !== getFavicon(data.url)) e.target.src = getFavicon(data.url); 
                else e.target.src = 'https://via.placeholder.com/64?text=?'; 
            }} 
          />
          {isEditMode && !data.deleted && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                  <Pencil className="text-white drop-shadow-md" size={24} />
              </div>
          )}
        </div>

        {/* TITLE FIX - ÁP DỤNG LOGIC ĐÚNG */}
        <div className={`mt-2 w-full min-w-0 px-0.5 text-center`}>
            <p 
               className={`font-medium leading-tight text-center ${titleClass} ${
                   hasSpace 
                    ? 'line-clamp-2 break-words'  // Có dấu cách: Cho phép xuống 2 dòng, ngắt ở dấu cách
                    : 'truncate'                  // Không dấu cách: Cắt ngay lập tức (1 dòng + ...)
               }`} 
               style={{ 
                   fontSize: `${calculatedFontSize}px`,
                   // Nếu có dấu cách thì dùng break-word để xuống dòng đẹp
                   // Nếu không thì để normal (kết hợp với truncate ở trên sẽ ra ...)
                   overflowWrap: hasSpace ? 'break-word' : 'normal',
                   wordBreak: hasSpace ? 'break-word' : 'normal'
               }}
            >
                {data.title}
            </p>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {!data.deleted && !isEditMode && (
              <button 
                onClick={(e) => { e.stopPropagation(); updateStatus(data.id, { isFavorite: !data.isFavorite }); }} 
                className={`p-1.5 rounded-md shadow-sm transition-transform hover:scale-110 ${data.isFavorite ? 'text-yellow-400 bg-black/80' : 'bg-white text-black hover:bg-gray-100'}`}
              >
                  <Star size={10} fill={data.isFavorite ? "currentColor" : "none"}/>
              </button>
          )}
          {isTrash && (
              <>
                <button onClick={(e) => { e.stopPropagation(); updateStatus(data.id, { deleted: false }); }} className="p-1.5 rounded-md bg-green-500 text-white shadow-sm hover:scale-110"><RotateCcw size={10}/></button>
                <button onClick={(e) => { e.stopPropagation(); setItemToDelete(data.id); }} className="p-1.5 rounded-md bg-red-500 text-white shadow-sm hover:scale-110"><Trash2 size={10}/></button>
              </>
          )}
        </div>
        
    </div>
  );
}