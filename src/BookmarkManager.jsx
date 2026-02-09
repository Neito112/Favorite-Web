import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Film, Music, Image, Link, Maximize2, MoreHorizontal
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

// --- [COMPONENT] GIAO DIỆN CỬA SỔ MAGIC TOOL ---
function MagicToolWindow() {
    const [items, setItems] = useState([]);
    const [isAnimated, setIsAnimated] = useState(false);
    const [animOrigin, setAnimOrigin] = useState('center center'); 
    
    const [filter, setFilter] = useState('all');
    const [inputLink, setInputLink] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsAnimated(true), 50);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleDataUpdate = (event, newItems) => {
            setItems(prev => {
                const existingUrls = new Set(prev.map(i => i.url));
                const uniqueNew = newItems.filter(i => !existingUrls.has(i.url));
                return [...uniqueNew, ...prev];
            });
        };

        const handleAnimOrigin = (event, coords) => {
            const originX = coords.x - window.screenX;
            const originY = coords.y - window.screenY;
            setAnimOrigin(`${originX}px ${originY}px`);
            setIsAnimated(false);
            setTimeout(() => setIsAnimated(true), 50);
        };

        ipcRenderer.on('magic-data-update', handleDataUpdate);
        ipcRenderer.on('set-anim-origin', handleAnimOrigin);

        return () => { 
            ipcRenderer.removeAllListeners('magic-data-update');
            ipcRenderer.removeAllListeners('set-anim-origin'); 
        };
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
            alert(result.error);
        }
    };
    
    const getFileType = (item) => {
        const ext = item.name.split('.').pop().toLowerCase();
        if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
        return 'image';
    };
    const filteredItems = items.filter(item => filter === 'all' || getFileType(item) === filter);

    return (
        <div 
            className={`
                flex flex-col h-screen bg-[#1e1e1e] text-white overflow-hidden border border-gray-700
                transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform
                ${isAnimated ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
            `}
            style={{ transformOrigin: animOrigin }}
        >
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

// --- [COMPONENT] MODAL CHỈNH SỬA (SỬ DỤNG PORTAL) ---
const EditBookmarkModal = React.memo(({ isOpen, onClose, editingData, onSave, onDelete, t, currentAccent, isDark }) => {
    const [draftData, setDraftData] = useState({ title: '', url: '', iconUrl: '' });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (editingData) {
                setDraftData({ 
                    title: editingData.title || '', 
                    url: editingData.url || '', 
                    iconUrl: editingData.iconUrl || '' 
                });
            } else {
                setDraftData({ title: '', url: '', iconUrl: '' });
            }
        }
    }, [isOpen, editingData]);

    const handleIconUpload = (e) => { 
        const file = e.target.files[0]; 
        if (file) { 
            const reader = new FileReader(); 
            reader.onloadend = () => setDraftData(prev => ({ ...prev, iconUrl: reader.result })); 
            reader.readAsDataURL(file); 
        } 
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(draftData); 
    };

    if (!isOpen) return null;

    const inputClass = `w-full px-3 py-2.5 rounded-xl border outline-none font-medium text-sm transition-colors
        ${isDark 
            ? 'bg-[#0f172a] border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
            : 'bg-white border-gray-200 text-slate-800 placeholder-gray-400 focus:border-blue-500'
        } focus:ring-1 focus:ring-blue-500/50`;

    const labelClass = `text-[11px] font-bold uppercase tracking-wider mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
            <div 
                className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col relative overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} 
                onClick={e => e.stopPropagation()}
            >
                <div className={`px-5 py-4 border-b flex justify-between items-center ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {editingData ? t('editTitle') : t('addTitle')}
                    </h3>
                    <button type="button" onClick={onClose} className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-black/5 hover:text-black'}`}><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className={labelClass}>{t('urlLabel')} <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className={`absolute left-3 top-3 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><Globe size={18}/></div>
                            <input autoFocus placeholder="https://example.com" className={`${inputClass} pl-10`} value={draftData.url} onChange={e => setDraftData({...draftData, url: e.target.value})} autoComplete="off" spellCheck="false" />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>{t('titleLabel')}</label>
                        <input placeholder="Tiêu đề..." className={inputClass} value={draftData.title} onChange={e => setDraftData({...draftData, title: e.target.value})} autoComplete="off" spellCheck="false"/>
                    </div>
                    <div>
                        <label className={labelClass}>{t('iconLabel')}</label>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Link ảnh..." className={inputClass} value={draftData.iconUrl} onChange={e => setDraftData({...draftData, iconUrl: e.target.value})} autoComplete="off" spellCheck="false"/>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleIconUpload} />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className={`px-3 border rounded-xl flex items-center justify-center transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300 bg-[#0f172a]' : 'border-gray-200 hover:bg-gray-100 text-gray-600 bg-white'}`}><Upload size={20}/></button>
                        </div>
                    </div>
                    <div className="pt-2 flex justify-between gap-3 items-center">
                        {editingData ? (<button type="button" onClick={() => onDelete(editingData.id)} className="px-4 py-2 rounded-xl font-bold text-sm text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors">{t('delete')}</button>) : (<div></div>)}
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className={`px-5 py-2 rounded-xl font-bold text-sm transition-colors ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-gray-100'}`}>{t('cancel')}</button>
                            <button type="submit" className="px-6 py-2 rounded-xl font-bold text-sm text-white shadow-lg active:scale-95 transition-transform" style={{ backgroundColor: currentAccent }}>{editingData ? t('update') : t('save')}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
});

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);
  
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(0); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [isProcessingDrop, setIsProcessingDrop] = useState(false);
  const [dropResults, setDropResults] = useState(null);
  const [isDropZoneHovered, setIsDropZoneHovered] = useState(false);
  const [isDropResultOpen, setIsDropResultOpen] = useState(false);

  // --- [RESTORED] ĐA NHIỆM (TABS) NHƯNG HIỂN THỊ DẠNG POP-UP ---
  const [sessions, setSessions] = useState([]); 
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const [contextMenu, setContextMenu] = useState({ 
      visible: false, x: 0, y: 0, 
      mediaType: 'none', hasSelection: false,
      targetSessionId: null 
  });
  
  // Refs
  const webviewRefs = useRef({}); 
  const bgInputRef = useRef(null);
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

  const handleDropLink = async (e) => {
      e.preventDefault();
      setIsDropZoneHovered(false);
      const text = e.dataTransfer.getData('text');
      if (!text || !text.startsWith('http')) return;
      setIsProcessingDrop(true);
      setDropResults(null);
      const result = await ipcRenderer.invoke('process-drop-link', text);
      setIsProcessingDrop(false);
      if (result.success) {
          setDropResults(result.items);
          setIsDropResultOpen(true);
      } else {
          alert('Lỗi phân tích: ' + result.error);
      }
  };

  useEffect(() => {
      const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { ipcRenderer.invoke('save-settings', settings); }, 500);
    return () => clearTimeout(timer);
  }, [settings]);

  // --- LOGIC UI SCALE ---
  const baseUiWidth = 1100;
  const uiScale = isMiniMode ? 1 : Math.max(0.65, Math.min(1, windowSize.width / baseUiWidth));
  const REFERENCE_WIDTH = 1550;
  const REFERENCE_PADDING = 48; 
  const sidebarWidthAtRef = 170; 
  const targetItemWidth = (REFERENCE_WIDTH - sidebarWidthAtRef - REFERENCE_PADDING) / (settings.gridCols || 6);
  const currentSidebarWidth = isMiniMode ? 50 : (isSidebarOpen ? (256 * uiScale) : 0);
  const availableWidth = windowSize.width - currentSidebarWidth - 48;
  const calculatedCols = Math.floor(availableWidth / targetItemWidth);
  const effectiveGridCols = Math.max(2, calculatedCols);

  const openModal = (bookmark = null) => {
    if (bookmark) setEditingId(bookmark.id);
    else setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSaveBookmark = useCallback(async (data) => {
    if (!data.url) return;
    let finalUrl = data.url.replace(/^(?:https?:\/\/)?/, 'https://');
    const iconToDownload = data.iconUrl || `https://www.google.com/s2/favicons?domain=${new URL(finalUrl).hostname}&sz=128`;
    
    if (editingId) {
        const changes = { id: editingId, title: data.title || 'Website', url: finalUrl, iconUrl: iconToDownload };
        const result = await ipcRenderer.invoke('update-bookmark', changes);
        if (result.success) {
            const updatedItem = { ...result.data, localIconPath: result.data.localIconPath ? `${result.data.localIconPath}?t=${Date.now()}` : result.data.localIconPath };
            setBookmarks(prev => prev.map(b => b.id === editingId ? updatedItem : b));
            setIsModalOpen(false);
        } else { alert("Lỗi cập nhật: " + result.error); }
    } else {
        const newBookmark = { title: data.title || 'Website', url: finalUrl, iconUrl: iconToDownload, category: 'Uncategorized', deleted: false, isFavorite: false };
        const result = await ipcRenderer.invoke('add-bookmark', newBookmark);
        if (result.success) {
            setBookmarks(prev => [result.data, ...prev]);
            setIsModalOpen(false);
        } else { alert("Lỗi lưu file: " + result.error); }
    }
  }, [editingId]);

  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);
  const handleDeleteModal = useCallback((id) => { setItemToDelete(id); setIsModalOpen(false); }, []);

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
  const openSession = (input) => {
      let url, title, bookmarkId = null;
      
      // Xử lý Input (có thể là ID Bookmark hoặc URL mới từ Middle Click)
      if (typeof input === 'string' && (input.startsWith('http') || input.startsWith('file'))) {
          url = input;
          title = "New Tab";
          bookmarkId = 'temp';
      } else {
          // Input là Bookmark ID
          const bookmark = bookmarks.find(b => b.id === input);
          if (!bookmark) return;
          url = bookmark.url;
          title = bookmark.title;
          bookmarkId = bookmark.id;
      }

      // Check xem đã có session chưa (nếu là bookmark)
      const existingSessions = sessions.filter(s => s.bookmarkId === bookmarkId && bookmarkId !== 'temp');
      if (existingSessions.length > 0) {
          setActiveSessionId(existingSessions[existingSessions.length - 1].sessionId);
      } else {
          // Tạo session mới
          const newSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
          const newSession = {
              sessionId: newSessionId,
              bookmarkId: bookmarkId,
              title: title,
              url: url,
              createdAt: Date.now()
          };
          setSessions(prev => [...prev, newSession]);
          setActiveSessionId(newSessionId);
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
          title: `Tab ${existingCount + 1}`,
          url: bookmark.url,
          createdAt: Date.now()
      };
      setSessions(prev => [...prev, newSession]);
      setActiveSessionId(newSessionId);
  };

  const closeSession = (sessionId, e) => {
      if (e) e.stopPropagation();
      if (webviewRefs.current[sessionId]) delete webviewRefs.current[sessionId];
      
      const remainingSessions = sessions.filter(s => s.sessionId !== sessionId);
      setSessions(remainingSessions);

      if (activeSessionId === sessionId) {
          if (remainingSessions.length > 0) {
             setActiveSessionId(remainingSessions[remainingSessions.length - 1].sessionId);
          } else {
             setActiveSessionId(null);
          }
      }
  };

  const closeAllSessionsOfBookmark = (bookmarkId) => {
      setSessions(prev => prev.filter(s => s.bookmarkId !== bookmarkId));
      if (activeSessionId && sessions.find(s => s.sessionId === activeSessionId)?.bookmarkId === bookmarkId) setActiveSessionId(null);
  };

  const toggleMiniMode = async () => {
      const newState = !isMiniMode;
      setIsMiniMode(newState);
      await ipcRenderer.invoke('set-always-on-top', newState);
      if (newState) await ipcRenderer.invoke('resize-window', { width: 435, height: 295 });
      else await ipcRenderer.invoke('resize-window', { width: 1280, height: 800 });
  };

  // --- HANDLE ACTIONS CHO WEBVIEWS TRONG POPUP ---
  const handleAction = useCallback((actionType, sessionId = null, value = null) => {
    // Nếu không chỉ định ID, dùng Active ID
    const targetId = sessionId || activeSessionId;
    const wv = webviewRefs.current[targetId];
    if (!wv) return;

    try {
        switch (actionType) {
            case 'goBack': if (wv.canGoBack()) wv.goBack(); break;
            case 'goForward': if (wv.canGoForward()) wv.goForward(); break;
            case 'reload': wv.reload(); break;
            case 'goHome': 
                // Close active tab
                if (targetId) closeSession(targetId);
                break;
            case 'zoomIn': const zIn = wv.getZoomLevel() + 0.5; wv.setZoomLevel(zIn); setCurrentZoom(zIn); break;
            case 'zoomOut': const zOut = wv.getZoomLevel() - 0.5; wv.setZoomLevel(zOut); setCurrentZoom(zOut); break;
            case 'zoomReset': wv.setZoomLevel(0); setCurrentZoom(0); break;
            case 'setZoom': if (value !== null) { wv.setZoomLevel(Number(value)); setCurrentZoom(Number(value)); } break;
            default: break;
        }
    } catch (err) { console.error("Action Error:", err); }
  }, [activeSessionId]);

  const attachWebviewEvents = (wv, sessionId) => {
      if (!wv) return;

      const handleShortcutLogic = (key, isCtrl, isAlt) => {
        const k = key.toLowerCase();
        if (k === 'f5' || (isCtrl && k === 'r')) { handleAction('reload', sessionId); return true; }
        if (isAlt && k === 'arrowleft') { handleAction('goBack', sessionId); return true; }
        if (isAlt && k === 'arrowright') { handleAction('goForward', sessionId); return true; }
        if (isCtrl && (key === '=' || key === '+')) { handleAction('zoomIn', sessionId); return true; }
        if (isCtrl && key === '-') { handleAction('zoomOut', sessionId); return true; }
        if (isCtrl && key === '0') { handleAction('zoomReset', sessionId); return true; }
        if (k === 'escape') {
            if (contextMenu.visible) { setContextMenu(prev => ({ ...prev, visible: false })); return true; }
            // ESC đóng tab hiện tại
            closeSession(sessionId);
            return true;
        }
        return false;
      };

      const onInput = (e) => { const input = e.input; if (input?.type !== 'keyDown') return; handleShortcutLogic(input.key, input.control || input.meta, input.alt); };
      
      const onContextMenu = (e) => {
          const params = e.params || {}; const rect = wv.getBoundingClientRect(); setCurrentZoom(wv.getZoomLevel());
          setContextMenu({ visible: true, x: (params.x || 0) + rect.x, y: (params.y || 0) + rect.y, mediaType: params.mediaType, hasSelection: !!params.selectionText, targetSessionId: sessionId });
      };
      
      const onNewWindow = (e) => { 
          e.preventDefault(); 
          if (e.url) openSession(e.url); // Mở trong tab mới của Popup
      };

      const onDomReady = () => {
          const scrollbarCSS = `
            ::-webkit-scrollbar { width: 10px; height: 10px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { 
                background: rgba(128, 128, 128, 0.5); 
                border-radius: 99px; 
                border: 2px solid transparent; 
                background-clip: content-box; 
            }
            ::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 128, 0.8); }
            ::-webkit-scrollbar-corner { background: transparent; }
          `;
          try { wv.insertCSS(scrollbarCSS); } catch (err) {}
      };

      try {     
          wv.removeEventListener('before-input-event', onInput); 
          wv.removeEventListener('context-menu', onContextMenu); 
          wv.removeEventListener('new-window', onNewWindow); 
          wv.removeEventListener('dom-ready', onDomReady); 
      } catch(e){}

      wv.addEventListener('before-input-event', onInput); 
      wv.addEventListener('context-menu', onContextMenu); 
      wv.addEventListener('new-window', onNewWindow);
      wv.addEventListener('dom-ready', onDomReady);
  };

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
  const onMenuClick = (action, val) => { handleAction(action, contextMenu.targetSessionId, val); if (action !== 'setZoom') { setContextMenu(prev => ({ ...prev, visible: false })); } };

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
        ::-webkit-scrollbar-thumb:hover { background-color: ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}; }
        ::-webkit-scrollbar-corner { background: transparent; }
        
        /* Ẩn scrollbar cho Tab List */
        .custom-scrollbar-none::-webkit-scrollbar { display: none; }
        .custom-scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>    
      
      {/* HEADER CHÍNH (Chỉ hiện khi không ở Mini Mode) */}
      {!isMiniMode && (
        <div className={`h-10 flex items-center justify-between pl-2 pr-1 flex-shrink-0 border-b backdrop-blur-md z-[500] relative`} style={{ ...theme.glassPanel, WebkitAppRegion: 'drag' }}>
            <div className="flex items-center gap-2 flex-1 min-w-0 h-full">
                <div className="flex items-center gap-2 px-2 opacity-70">
                    <LayoutGrid size={16} style={{ color: currentAccent }} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Bookmark Manager</span>
                </div>
            </div>
                
            {/* KHU VỰC MAGIC TOOL */}
            <div 
                className="flex items-center gap-2 mx-2 pl-2 border-l border-gray-500/20"
                style={{ WebkitAppRegion: 'no-drag' }}
                onDragOver={(e) => { e.preventDefault(); setIsDropZoneHovered(true); }}
                onDragLeave={() => setIsDropZoneHovered(false)}
                onDrop={handleDropLink}
            >
                <button
                    onClick={(e) => {
                        const clickCoords = { x: e.screenX, y: e.screenY, type: 'toggle' };
                        ipcRenderer.send('open-magic-tool', clickCoords);
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all active:scale-95 ${dropResults && dropResults.length > 0 ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-500/20' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-500 hover:border-blue-500'}`}
                    title="Mở Magic Downloader"
                >
                    {dropResults && dropResults.length > 0 ? <PackageCheck size={16}/> : <PackageOpen size={16}/>}
                </button>
            </div>            
            {/* Window Controls */}
            <div className="flex items-center gap-1 pl-4" style={{ WebkitAppRegion: 'no-drag' }}>
                <button onClick={toggleMiniMode} className="p-1.5 hover:bg-blue-500 hover:text-white rounded transition-colors opacity-60 hover:opacity-100" title={t('miniMode')}><PictureInPicture size={16} /></button>
                <div className="w-px h-3 bg-gray-500/30 mx-2"></div>
                <button onClick={() => ipcRenderer.send('app-minimize')} className="p-1.5 opacity-50 hover:opacity-100 hover:bg-black/5 rounded"><Minus size={14}/></button>
                <button onClick={() => ipcRenderer.send('app-maximize')} className="p-1.5 opacity-50 hover:opacity-100 hover:bg-black/5 rounded"><Maximize size={14}/></button>
                <button onClick={() => ipcRenderer.send('app-quit')} className="p-1.5 hover:bg-red-500 hover:text-white rounded transition-colors ml-1"><X size={14}/></button>
            </div>
        </div>
      )}

      {/* --- BODY CHÍNH (SIDEBAR + GRID) --- */}
      <div className={`flex-1 flex overflow-hidden relative w-full h-full ${isMiniMode ? 'flex-row' : 'flex-col'}`}>
        
        {/* MINI MODE SIDEBAR */}
        {isMiniMode && (
           <div 
             className="w-10 bg-gray-900 border-r border-white/10 flex flex-col items-center pt-3 z-50 select-none gap-3"
             style={{ WebkitAppRegion: 'drag' }}
           >
              <button onClick={toggleMiniMode} className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all" title={t('exitMiniMode')} style={{ WebkitAppRegion: 'no-drag' }}><LogOut size={18} className="rotate-180"/></button>
              <div className="w-6 h-px bg-white/10 my-1"></div>
              {/* Fav Icon */}
              <div className="relative group flex justify-center w-full" style={{ WebkitAppRegion: 'no-drag' }}>
                  <div className="p-1.5 text-yellow-500 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"><Star size={18} fill="currentColor"/></div>
                  <div className="absolute left-full top-0 ml-1 w-64 bg-gray-900 border border-white/10 rounded-lg shadow-2xl p-2 invisible opacity-0 translate-x-[-10px] group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-[9999]" style={{ transitionDelay: '500ms' }}>
                      <div className="text-[10px] font-bold uppercase text-gray-500 mb-2 pb-1 border-b border-white/10">{t('favorites')}</div>
                      <div className="max-h-[80vh] overflow-y-auto custom-scrollbar space-y-1">
                          {bookmarks.filter(b => b.isFavorite).map(b => (
                              <div key={b.id} onClick={() => openSession(b.id)} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 cursor-pointer text-gray-300 hover:text-white"><img src={b.iconUrl} className="w-3 h-3 rounded-sm" alt=""/><span className="text-xs truncate">{b.title}</span></div>
                          ))}
                      </div>
                  </div>
              </div>
              {/* Active Tabs Icon (Mini Mode) */}
              <div className="relative group flex justify-center w-full" style={{ WebkitAppRegion: 'no-drag' }}>
                  <div className="p-1.5 text-blue-400 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"><Layers size={18} /></div>
                  <div className="absolute left-full top-0 ml-1 w-64 bg-gray-900 border border-white/10 rounded-lg shadow-2xl p-2 invisible opacity-0 translate-x-[-10px] group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-[9999]" style={{ transitionDelay: '500ms' }}>
                      <div className="text-[10px] font-bold uppercase text-gray-500 mb-2 pb-1 border-b border-white/10">Active Tabs</div>
                      <div className="max-h-[80vh] overflow-y-auto custom-scrollbar space-y-1">
                          {sessions.map(sess => (
                              <div key={sess.sessionId} onClick={() => setActiveSessionId(sess.sessionId)} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer ${activeSessionId === sess.sessionId ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-white/10'}`}><div className={`w-1.5 h-1.5 rounded-full ${activeSessionId === sess.sessionId ? 'bg-green-500' : 'bg-gray-500'}`}></div><span className="text-xs truncate">{sess.title}</span></div>
                          ))}
                          {sessions.length === 0 && <div className="text-xs text-gray-500 italic p-1">Trống</div>}
                      </div>
                  </div>
              </div>
           </div>
        )}

        {/* CONTAINER CHÍNH */}
        <div className="flex-1 relative w-full h-full overflow-hidden flex">
            
            {/* SIDEBAR (Normal Mode) */}
            <aside 
                className={`flex-col border-r transition-all duration-300 ${isSidebarOpen && !isMiniMode ? 'w-[170px] flex' : 'w-0 hidden'} backdrop-blur-xl origin-top-left`} 
                style={{ ...theme.glassPanel, zoom: uiScale }} 
            >
               <nav className="p-4 space-y-1">
                 {['all', 'favorites', 'trash'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab ? 'text-white shadow-lg' : 'opacity-60 hover:opacity-100 hover:bg-black/5'}`} style={activeTab === tab ? { backgroundColor: currentAccent } : {}}>{tab === 'all' ? <Folder size={18}/> : tab === 'favorites' ? <Star size={18}/> : <Trash2 size={18}/>}{t(tab === 'all' ? 'dashboard' : tab)}</button>))}
               </nav>
            </aside>

            {/* MAIN CONTENT (DASHBOARD) */}
            <main className="flex-1 flex flex-col h-full min-w-0">
               {/* HEADER CỦA DASHBOARD */}
               {!isMiniMode && (
                   <header 
                        className="h-16 flex items-center justify-between px-6 border-b border-gray-500/10 shrink-0 backdrop-blur-md z-[500] relative origin-top-left" 
                        style={{ ...theme.glassPanel, zoom: uiScale }} 
                   >
                      <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <Menu size={20}/>
                        </button>
                        <div className="relative" ref={headerMenuRef}>
                            <button onClick={() => { if (!isSidebarOpen) setIsHeaderMenuOpen(!isHeaderMenuOpen); }} className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${!isSidebarOpen ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 pr-3' : 'cursor-default'}`}>
                                <h2 className="text-xl font-bold tracking-tight select-none">{t(activeTab === 'all' ? 'dashboard' : activeTab)}</h2>
                                {!isSidebarOpen && (<ChevronDown size={18} className={`opacity-50 transition-transform duration-200 ${isHeaderMenuOpen ? 'rotate-180' : ''}`}/>)}
                            </button>
                            {isHeaderMenuOpen && !isSidebarOpen && (
                                <div className={`absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl border p-2 animate-in fade-in zoom-in-95 duration-200 z-[100] origin-top-left flex flex-col gap-1`} style={theme.glassPanel}>
                                    {[{ id: 'all', icon: Folder, label: 'dashboard' }, { id: 'favorites', icon: Star, label: 'favorites' }, { id: 'trash', icon: Trash2, label: 'trash' }].map((item) => (
                                        <button key={item.id} onClick={() => { setActiveTab(item.id); setIsHeaderMenuOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === item.id ? 'text-white shadow-md' : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'}`} style={activeTab === item.id ? { backgroundColor: currentAccent } : {}}>
                                            <item.icon size={18} />{t(item.label)}{activeTab === item.id && <Check size={14} className="ml-auto"/>}
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
               )}

               {/* 3. CONTENT (GRID) */}
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {isMiniMode && (
                       <div className="w-full text-center pb-4 opacity-50 text-xs">{t('miniMode')} Active</div>
                  )}
                  <div 
                    className="grid gap-2 pb-10" 
                    style={{ gridTemplateColumns: `repeat(${effectiveGridCols}, minmax(0, 1fr))` }}
                  >
                      {bookmarks.filter(b => { if (activeTab === 'trash') return b.deleted; if (b.deleted) return false; if (activeTab === 'favorites') return b.isFavorite; return b.title.toLowerCase().includes(searchQuery.toLowerCase()); }).map(b => (
                        <BookmarkCard 
                           key={b.id} 
                           data={b} 
                           getFavicon={getFavicon} 
                           isDark={isDark} 
                           isTrash={activeTab === 'trash'} 
                           // [CHANGE] CLICK THÌ MỞ BROWSER SESSION
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
               </div>
            </main>
            
            {/* --- [NEW] TRÌNH DUYỆT POP-UP (OVERLAY) ĐA NHIỆM --- */}
            {/* Hiển thị khi có ít nhất 1 session đang mở */}
            {activeSessionId && (
                <div className="absolute inset-0 z-[600] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    {/* Browser Toolbar (Tích hợp Tabs) */}
                    <div className={`h-10 flex items-center gap-2 px-2 border-b select-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                         
                         {/* Nav Controls */}
                         <div className="flex items-center gap-1">
                             <button onClick={() => handleAction('goBack')} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded" title="Back"><ArrowLeft size={18}/></button>
                             <button onClick={() => handleAction('reload')} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded" title="Reload"><RefreshCw size={16}/></button>
                             <button onClick={() => handleAction('goForward')} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded" title="Forward"><ArrowLeft size={18} className="rotate-180"/></button>
                             <button onClick={() => handleAction('goHome')} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded ml-1" title="Close"><Home size={18}/></button>
                         </div>

                         <div className="h-5 w-px bg-gray-500/20 mx-1"></div>

                         {/* [TABS] Danh sách các tab đang mở */}
                         <div className="flex-1 flex items-center h-full overflow-x-auto gap-1 custom-scrollbar-none">
                             {sessions.map(sess => (
                                 <div 
                                    key={sess.sessionId} 
                                    onClick={() => setActiveSessionId(sess.sessionId)} 
                                    className={`group relative flex items-center gap-2 px-3 h-7 rounded-lg text-xs font-bold cursor-pointer transition-all min-w-[100px] max-w-[180px] border 
                                        ${activeSessionId === sess.sessionId 
                                            ? 'bg-white dark:bg-white/10 border-gray-300 dark:border-white/10 shadow-sm' 
                                            : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100'
                                        }`}
                                 >
                                     <div className={`w-2 h-2 rounded-full shrink-0 ${activeSessionId === sess.sessionId ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                                     <span className="truncate flex-1 pb-0.5">{sess.title}</span>
                                     <button onClick={(e) => closeSession(sess.sessionId, e)} className="opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded-full p-0.5 transition-all"><X size={10} /></button>
                                 </div>
                             ))}
                             {/* Nút thêm tab mới (Clone tab hiện tại) */}
                             {activeSession && (
                                <button onClick={() => createSession(activeSession.bookmarkId)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-60 hover:opacity-100" title={t('cloneTab')}><Plus size={16} /></button>
                             )}
                         </div>

                         {/* Window Actions */}
                         <div className="flex items-center gap-2 pl-2 border-l border-gray-500/20">
                             <button onClick={() => { setSessions([]); setActiveSessionId(null); }} className="p-1.5 hover:bg-red-500 hover:text-white rounded transition-colors" title="Close All"><X size={18}/></button>
                         </div>
                    </div>
                    
                    {/* Webview Container */}
                    <div className="flex-1 bg-white relative">
                         {/* Render tất cả webview nhưng chỉ hiện cái active (để giữ state) */}
                         {sessions.map(session => (
                             <div 
                                 key={session.sessionId} 
                                 className={`absolute inset-0 w-full h-full ${activeSessionId === session.sessionId ? 'z-10 visible' : 'z-0 invisible'}`}
                             >
                                 <webview 
                                     ref={(el) => {
                                         if (el) {
                                             webviewRefs.current[session.sessionId] = el;
                                             if (!el.dataset.attached) {
                                                 attachWebviewEvents(el, session.sessionId);
                                                 el.dataset.attached = "true";
                                             }
                                         }
                                     }}
                                     src={session.url} 
                                     className="w-full h-full"
                                     style={{ display: 'inline-flex' }}
                                 />
                             </div>
                         ))}
                    </div>
                </div>
            )}

            {/* --- CONTEXT MENU (Dùng chung cho Pop-up) --- */}
            {contextMenu.visible && (<div className="fixed inset-0 z-[9000] cursor-default" onClick={() => setContextMenu({ ...contextMenu, visible: false })} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ ...contextMenu, visible: false }); }}></div>)}
            {contextMenu.visible && (
              <div className={`fixed z-[9001] w-64 rounded-xl shadow-2xl border p-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-2`} style={{ left: getSmartMenuPosition().x, top: getSmartMenuPosition().y, ...theme.glassPanel }} onClick={e => e.stopPropagation()}>
                <div className="flex gap-1"><button onClick={() => onMenuClick('goBack')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-black/5 ${isDark ? 'hover:bg-white/10' : ''}`} title="Back"><ArrowLeft size={16}/></button><button onClick={() => onMenuClick('reload')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-black/5 ${isDark ? 'hover:bg-white/10' : ''}`} title="Reload"><RefreshCw size={15}/></button><button onClick={() => onMenuClick('goForward')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-black/5 ${isDark ? 'hover:bg-white/10' : ''}`} title="Forward"><ArrowLeft size={16} className="rotate-180"/></button><button onClick={() => onMenuClick('goHome')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-blue-500 hover:text-white`} title="Close"><Home size={16}/></button></div>
                <div className={`rounded-lg p-2 ${isDark ? 'bg-black/20' : 'bg-black/5'}`}><div className="flex justify-between items-center text-[10px] font-bold opacity-60 mb-1 px-1"><span>Zoom</span><span>{Math.round(100 * Math.pow(1.2, currentZoom))}%</span></div><div className="relative h-6 flex items-center"><div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-current opacity-30 -translate-x-1/2 pointer-events-none h-full z-0"></div><input type="range" min="-3" max="3" step="0.1" value={currentZoom} onChange={(e) => onMenuClick('setZoom', e.target.value)} className="w-full h-1 bg-gray-500/30 rounded-lg appearance-none cursor-pointer z-10 relative" style={{ accentColor: currentAccent }}/></div><div className="flex justify-between text-[9px] opacity-40 px-1 mt-1 font-mono"><span>-</span><span className="cursor-pointer hover:opacity-100" onClick={() => onMenuClick('zoomReset')}>RESET (100%)</span><span>+</span></div></div>
                {/* Clone Tab Option in Context Menu */}
                <button onClick={() => { if(contextMenu.targetSessionId) { const sess = sessions.find(s=>s.sessionId===contextMenu.targetSessionId); if(sess) createSession(sess.bookmarkId); setContextMenu(prev => ({ ...prev, visible: false })); } }} className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 hover:bg-blue-500 hover:text-white`}><Copy size={12} /> {t('cloneTab')}</button>
              </div>
            )}
        </div>
      </div>

      {/* --- MODALS --- */}
      {isEmptyTrashOpen && (<div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsEmptyTrashOpen(false)}><div className={`w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}><Trash2 size={40} className="mx-auto text-red-500 mb-4 bg-red-500/10 p-2 rounded-full"/><h3 className="font-bold text-lg mb-2">{t('emptyConfirmTitle')}</h3><p className="text-sm opacity-60 mb-6">{t('emptyConfirmDesc')}</p><div className="flex gap-3"><button onClick={() => setIsEmptyTrashOpen(false)} className="flex-1 py-2 rounded-lg font-bold border opacity-60 hover:opacity-100">{t('cancel')}</button><button onClick={executeEmptyTrash} className="flex-1 py-2 rounded-lg font-bold bg-red-500 text-white shadow-lg">{t('delete')}</button></div></div></div>)}
      {itemToDelete && (<div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setItemToDelete(null)}><div className={`w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}><AlertTriangle size={40} className="mx-auto text-red-500 mb-4 bg-red-500/10 p-2 rounded-full"/><h3 className="font-bold text-lg mb-6">{activeTab === 'trash' ? t('deletePermanentTitle') : t('deleteConfirmTitle')}</h3><div className="flex gap-3"><button onClick={() => setItemToDelete(null)} className="flex-1 py-2 rounded-lg font-bold border opacity-60 hover:opacity-100">{t('cancel')}</button><button onClick={executeDelete} className="flex-1 py-2 rounded-lg font-bold bg-red-500 text-white shadow-lg">{t('delete')}</button></div></div></div>)}
      <EditBookmarkModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingData={editingId ? bookmarks.find(b => b.id === editingId) : null}
          onSave={handleSaveBookmark}
          onDelete={handleDeleteModal}
          t={t}
          currentAccent={currentAccent}
          isDark={isDark}
      />
      {isDropResultOpen && dropResults && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setIsDropResultOpen(false)}>
            <div className="w-[80vw] h-[80vh] bg-[#1e1e1e] rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <PackageOpen className="text-green-500"/> Kho dữ liệu tạm ({dropResults.length})
                    </h3>
                    <button onClick={() => setIsDropResultOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} className="text-white"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
                        {dropResults.map((item, idx) => (
                            <div key={idx} className="relative group bg-black/40 rounded-xl overflow-hidden border border-white/5 hover:border-blue-500 transition-all">
                                {item.isDownloaded ? (
                                    <>
                                        <div className="aspect-square flex items-center justify-center bg-checkerboard">
                                            {item.name.endsWith('.mp4') ? (<video src={`local-resource://${item.localPath}`} className="w-full h-full object-cover"/>) : (<img src={`local-resource://${item.localPath}`} className="w-full h-full object-cover"/>)}
                                        </div>
                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-2">
                                            <button onClick={() => ipcRenderer.invoke('copy-image-to-clipboard', item.localPath)} className="w-full py-1.5 bg-white text-black text-[10px] font-bold rounded hover:bg-gray-200 flex items-center justify-center gap-1"><Copy size={12}/> Copy</button>
                                            <button onClick={() => ipcRenderer.invoke('save-file-from-temp', { sourcePath: item.localPath, defaultName: item.name })} className="w-full py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-500 flex items-center justify-center gap-1"><Download size={12}/> Lưu</button>
                                        </div>
                                        <div className="absolute bottom-1 right-1 bg-black/50 px-1 rounded text-[10px] text-white pointer-events-none">{(item.size / 1024).toFixed(0)} KB</div>
                                    </>
                                ) : (
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

export default function AppEntry() {
    const [route, setRoute] = useState(window.location.hash);
    useEffect(() => {
        const handleHashChange = () => setRoute(window.location.hash);
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    if (route === '#magic-tool') { return <MagicToolWindow />; }
    return <MainApp />;
}

function BookmarkCard({ data, getFavicon, isDark, isTrash, setViewingUrl, setItemToDelete, updateStatus, hasBg, isEditMode, onEdit, baseGridSize }) {
  const calculatedFontSize = Math.max(11, Math.min(15, 12 + (6 - baseGridSize) * 0.9));
  const hasSpace = data.title.trim().includes(' ');
  const displayIcon = getFavicon(data.url, data.localIconPath) || data.iconUrl;
  const titleClass = hasBg ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" : "text-gray-700 dark:text-gray-300 group-hover:text-blue-500";

  return (
    <div 
        className="group cursor-pointer relative flex flex-col items-center w-full p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all" 
        onClick={(e) => { 
            if (isEditMode && !data.deleted) { e.preventDefault(); onEdit(data); } 
            else if (!data.deleted) { setViewingUrl(data.id); } 
        }}
    >
        <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-[200px] pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 group-hover:delay-[1000ms]">
            <div className="bg-gray-900 text-white text-xs px-2 py-1.5 rounded shadow-xl border border-white/10 whitespace-normal break-words text-center z-50">
                <div className="font-bold">{data.title}</div>
                <div className="text-[10px] text-gray-400 mt-0.5 opacity-80 truncate max-w-[180px]">{data.url}</div>
            </div>
        </div>

        <div className={`w-full aspect-square rounded-2xl border flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all relative z-10 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-white/60'} ${isEditMode && !data.deleted ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}>
          <img 
            src={displayIcon} alt={data.title} className="w-[80%] h-[80%] object-contain pointer-events-none select-none drop-shadow-md" 
            onError={(e) => { e.target.onerror = null; if (e.target.src !== getFavicon(data.url)) e.target.src = getFavicon(data.url); else e.target.src = 'https://via.placeholder.com/64?text=?'; }} 
          />
          {isEditMode && !data.deleted && (<div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]"><Pencil className="text-white drop-shadow-md" size={24} /></div>)}
        </div>

        <div className={`mt-2 w-full min-w-0 px-0.5 text-center`}>
            <p className={`font-medium leading-tight text-center ${titleClass} ${hasSpace ? 'line-clamp-2 break-words' : 'truncate'}`} style={{ fontSize: `${calculatedFontSize}px`, overflowWrap: hasSpace ? 'break-word' : 'normal', wordBreak: hasSpace ? 'break-word' : 'normal' }}>{data.title}</p>
        </div>

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {!data.deleted && !isEditMode && (
              <button onClick={(e) => { e.stopPropagation(); updateStatus(data.id, { isFavorite: !data.isFavorite }); }} className={`p-1.5 rounded-md shadow-sm transition-transform hover:scale-110 ${data.isFavorite ? 'text-yellow-400 bg-black/80' : 'bg-white text-black hover:bg-gray-100'}`}><Star size={10} fill={data.isFavorite ? "currentColor" : "none"}/></button>
          )}
          {isTrash && (<><button onClick={(e) => { e.stopPropagation(); updateStatus(data.id, { deleted: false }); }} className="p-1.5 rounded-md bg-green-500 text-white shadow-sm hover:scale-110"><RotateCcw size={10}/></button><button onClick={(e) => { e.stopPropagation(); setItemToDelete(data.id); }} className="p-1.5 rounded-md bg-red-500 text-white shadow-sm hover:scale-110"><Trash2 size={10}/></button></>)}
        </div>
    </div>
  );
}