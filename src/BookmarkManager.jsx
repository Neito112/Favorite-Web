import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Trash2, LayoutGrid, X, 
  Star, Settings, Folder, Menu, Monitor, 
  ArrowLeft, RefreshCw, Globe, Upload,
  AlertTriangle, RotateCcw, Wand2, SlidersHorizontal,
  ChevronLeft, ChevronRight, HelpCircle, Keyboard,
  MousePointer2, Mouse, Home, Image as ImageIcon, Type,
  Maximize, Minimize, ExternalLink, Type as FontIcon, FolderOpen,
  Check, ChevronDown, Minus, StopCircle, Pencil, Save, XCircle
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
    closeSession: 'Đóng trang này'
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
    closeSession: 'Close Session'
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

export default function BookmarkApp() {
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
  
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(0); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // [MULTITASKING] State quản lý các phiên chạy ngầm
  const [activeBookmarkId, setActiveBookmarkId] = useState(null); // ID của bookmark đang hiển thị
  const [runningSessions, setRunningSessions] = useState(new Set()); // Danh sách ID các trang đang chạy ngầm
  const [popupUrl, setPopupUrl] = useState(null); 

  const [contextMenu, setContextMenu] = useState({ 
      visible: false, x: 0, y: 0, 
      mediaType: 'none', hasSelection: false,
      targetWebview: 'main'
  });
  
  // [MULTITASKING] Refs cho nhiều webview (Map: id -> element)
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

  useEffect(() => {
    const timer = setTimeout(() => { ipcRenderer.invoke('save-settings', settings); }, 500);
    return () => clearTimeout(timer);
  }, [settings]);

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

  const handleDeleteFromModal = async () => {
     if (!editingId) return;
     setItemToDelete(editingId);
     setIsModalOpen(false);
  };

  const executeDelete = async () => {
      if (!itemToDelete) return;
      if (activeTab === 'trash') {
          await ipcRenderer.invoke('delete-bookmark', itemToDelete);
          setBookmarks(prev => prev.filter(b => b.id !== itemToDelete));
          closeSession(itemToDelete); // Đóng tab nếu bị xóa
      } else {
          const item = bookmarks.find(b => b.id === itemToDelete);
          if (item) {
              const updated = { ...item, deleted: true };
              await ipcRenderer.invoke('update-bookmark', updated);
              setBookmarks(prev => prev.map(b => b.id === itemToDelete ? updated : b));
              closeSession(itemToDelete); // Đóng tab nếu chuyển vào thùng rác
          }
      }
      setItemToDelete(null);
  };

  const executeEmptyTrash = async () => {
      const trashItems = bookmarks.filter(b => b.deleted);
      for (const item of trashItems) {
          await ipcRenderer.invoke('delete-bookmark', item.id);
          closeSession(item.id);
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

  // --- [NEW] SESSION MANAGEMENT LOGIC ---
  const openSession = (id) => {
      setRunningSessions(prev => new Set(prev).add(id));
      setActiveBookmarkId(id);
      setCurrentZoom(0); // Reset zoom hiển thị trên UI (webview thực tế giữ zoom cũ)
  };

  const closeSession = (id) => {
      setRunningSessions(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
      });
      if (activeBookmarkId === id) {
          setActiveBookmarkId(null);
      }
      if (webviewRefs.current[id]) {
          delete webviewRefs.current[id];
      }
  };

  const closeCurrentSession = () => {
      if (activeBookmarkId) closeSession(activeBookmarkId);
  };

  // --- HÀM XỬ LÝ TRUNG TÂM ---
  const handleAction = useCallback((actionType, target = 'main', value = null) => {
    // [UPDATED] Lấy webview active dựa trên ID
    let wv = null;
    if (target === 'popup') wv = popupWebviewRef.current;
    else if (activeBookmarkId) wv = webviewRefs.current[activeBookmarkId];

    if (!wv) return;

    try {
        switch (actionType) {
            case 'goBack': if (wv.canGoBack()) wv.goBack(); break;
            case 'goForward': if (wv.canGoForward()) wv.goForward(); break;
            case 'reload': wv.reload(); break;
            case 'goHome': 
                if (target === 'popup') setPopupUrl(null); 
                else setActiveBookmarkId(null); // Chỉ ẩn UI, không đóng session
                break;
            case 'zoomIn': 
                const zIn = wv.getZoomLevel() + 0.5;
                wv.setZoomLevel(zIn); 
                setCurrentZoom(zIn); 
                break;
            case 'zoomOut': 
                const zOut = wv.getZoomLevel() - 0.5;
                wv.setZoomLevel(zOut); 
                setCurrentZoom(zOut); 
                break;
            case 'zoomReset': 
                wv.setZoomLevel(0); 
                setCurrentZoom(0); 
                break;
            case 'setZoom': 
                if (value !== null) {
                    wv.setZoomLevel(Number(value));
                    setCurrentZoom(Number(value));
                }
                break;
            default: break;
        }
    } catch (err) { console.error("Action Error:", err); }
  }, [activeBookmarkId]);

  // --- LOGIC SỰ KIỆN WEBVIEW ---
  const attachWebviewEvents = (wv, type = 'main') => {
      if (!wv) return;

      const handleShortcutLogic = (key, isCtrl, isAlt) => {
        const k = key.toLowerCase();
        if (k === 'f5' || (isCtrl && k === 'r')) { handleAction('reload', type); return true; }
        if (isAlt && k === 'arrowleft') { handleAction('goBack', type); return true; }
        if (isAlt && k === 'arrowright') { handleAction('goForward', type); return true; }
        if (isCtrl && (key === '=' || key === '+')) { handleAction('zoomIn', type); return true; }
        if (isCtrl && key === '-') { handleAction('zoomOut', type); return true; }
        if (isCtrl && key === '0') { handleAction('zoomReset', type); return true; }

        if (k === 'escape') {
            if (contextMenu.visible) {
                setContextMenu(prev => ({ ...prev, visible: false }));
                return true;
            }
            if (isModalOpen || isSettingsOpen || itemToDelete || isEmptyTrashOpen) return false;
            
            const now = Date.now();
            if (now - lastEscTime.current < 500) { 
                handleAction('goHome', type);
                lastEscTime.current = 0;
            } else {
                lastEscTime.current = now;
            }
            return true;
        }
        return false;
      };

      const onInput = (e) => {
          const input = e.input;
          if (input?.type !== 'keyDown') return;
          handleShortcutLogic(input.key, input.control || input.meta, input.alt);
      };

      const onContextMenu = (e) => {
          const params = e.params || {};
          const rect = wv.getBoundingClientRect();
          setCurrentZoom(wv.getZoomLevel());
          setContextMenu({
            visible: true,
            x: (params.x || 0) + rect.x,
            y: (params.y || 0) + rect.y,
            mediaType: params.mediaType,
            hasSelection: !!params.selectionText,
            targetWebview: type
          });
      };

      const onNewWindow = (e) => {
        e.preventDefault();
        if (type === 'main' && e.url) {
            setPopupUrl(e.url);
        }
      };

      // Xóa listener cũ trước khi thêm mới để tránh double event
      try {
        wv.removeEventListener('before-input-event', onInput);
        wv.removeEventListener('context-menu', onContextMenu);
        wv.removeEventListener('new-window', onNewWindow);
      } catch(e){}

      wv.addEventListener('before-input-event', onInput);
      wv.addEventListener('context-menu', onContextMenu);
      wv.addEventListener('new-window', onNewWindow);
  };

  const setPopupWebviewRef = useCallback((node) => {
      if (node) {
          popupWebviewRef.current = node;
          attachWebviewEvents(node, 'popup');
      }
  }, [popupUrl]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
        if (e.key === 'Escape') {
             if (popupUrl) setPopupUrl(null); 
             else if (isModalOpen || isSettingsOpen || itemToDelete || isEmptyTrashOpen) {
                 setIsModalOpen(false); setIsSettingsOpen(false); setItemToDelete(null); setIsEmptyTrashOpen(false);
            }
        }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [popupUrl, isModalOpen, isSettingsOpen, itemToDelete, isEmptyTrashOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
          setIsSettingsOpen(false);
          setIsFontDropdownOpen(false); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, iconUrl: reader.result });
      reader.readAsDataURL(file);
    }
  };
  
  const onMenuClick = (action, val) => {
     handleAction(action, contextMenu.targetWebview, val);
     if (action !== 'setZoom') { 
        setContextMenu(prev => ({ ...prev, visible: false }));
     }
  };

  const isDark = settings.theme === 'dark';
  const hasBg = !!settings.bgImage;
  const currentAccent = settings.accentColor || '#22d3ee';
  
  const currentFontObj = availableFonts.find(f => f.value === settings.font);
  const currentFontName = currentFontObj?.name || 'Chọn Font';
  const currentFontScale = currentFontObj?.scale || 1;

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
    <div className="flex flex-col h-screen overflow-hidden select-none transition-all duration-300" style={theme.appStyle}>
      
      {/* TITLE BAR - Z-INDEX 500 ĐỂ KHÔNG BỊ CHE */}
      <div className={`h-9 flex items-center justify-between px-2 flex-shrink-0 border-b backdrop-blur-md z-[500] relative`} style={{ ...theme.glassPanel, WebkitAppRegion: 'drag' }}>
        <div className="flex items-center gap-1 pl-1" style={{ WebkitAppRegion: 'no-drag' }}>
          {!activeBookmarkId ? (
            <div className="flex items-center gap-2 px-2 opacity-70"><LayoutGrid size={14} style={{ color: currentAccent }} /><span className="text-[10px] font-bold uppercase tracking-widest">Bookmark Manager</span></div>
          ) : (
            <>
              <button onClick={() => handleAction('goHome')} className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors" title="Home (Esc x2)"><Home size={16} /></button>
              <div className="w-px h-3 bg-gray-500/30 mx-1"></div>
              <button onClick={() => handleAction('goBack')} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded" title="Back (Alt+Left)"><ChevronLeft size={16} /></button>
              <button onClick={() => handleAction('goForward')} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded" title="Forward (Alt+Right)"><ChevronRight size={16} /></button>
              <button onClick={() => handleAction('reload')} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded" title="Reload (F5 / Ctrl+R)"><RefreshCw size={14} /></button>
            </>
          )}
        </div>
        
        {/* Nút đóng hoàn toàn phiên làm việc hiện tại */}
        {activeBookmarkId && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
                <span className="text-xs font-bold opacity-50 truncate max-w-[200px]">
                    {bookmarks.find(b => b.id === activeBookmarkId)?.title}
                </span>
                <button 
                    onClick={closeCurrentSession}
                    className="p-1 rounded-full hover:bg-red-500 hover:text-white transition-colors opacity-50 hover:opacity-100"
                    title={t('closeSession')}
                >
                    <XCircle size={14} />
                </button>
            </div>
        )}

        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
          <button onClick={() => ipcRenderer.send('app-minimize')} className="p-1.5 opacity-50 hover:opacity-100 hover:bg-black/5 rounded" title={t('min')}><Minus size={14}/></button>
          <button onClick={() => ipcRenderer.send('app-maximize')} className="p-1.5 opacity-50 hover:opacity-100 hover:bg-black/5 rounded" title={t('max')}><Maximize size={14}/></button>
          <div className="w-px h-3 bg-gray-500/30 mx-1"></div>
          <button onClick={() => ipcRenderer.send('app-quit')} className="p-1.5 hover:bg-red-500 hover:text-white rounded transition-colors" title={t('quitDesc')}><X size={14}/></button>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative w-full h-full">
        
        {/* LỚP 1: WEBVIEWS CHẠY NGẦM (MULTITASKING) */}
        {/* Luôn render các webview trong runningSessions, nhưng chỉ hiển thị cái nào đang active */}
        {Array.from(runningSessions).map(sessionId => {
            const bookmark = bookmarks.find(b => b.id === sessionId);
            if (!bookmark) return null;
            const isActive = activeBookmarkId === sessionId;

            return (
                <div 
                    key={sessionId} 
                    className={`absolute inset-0 z-20 bg-white ${isActive ? 'flex' : 'hidden'}`} // Sử dụng hidden để ẩn nhưng vẫn chạy ngầm
                >
                    <webview 
                        ref={(el) => {
                            if (el) {
                                webviewRefs.current[sessionId] = el;
                                // Chỉ attach event 1 lần khi mount
                                if (!el.dataset.attached) {
                                    attachWebviewEvents(el, 'main');
                                    el.dataset.attached = "true";
                                }
                            }
                        }}
                        src={bookmark.url} 
                        className="w-full h-full"
                        style={{ display: 'inline-flex' }}
                    />
                </div>
            );
        })}

        {/* LỚP 2: DASHBOARD (Hiển thị khi không có activeBookmarkId) */}
        <div className={`absolute inset-0 z-10 flex w-full h-full ${!activeBookmarkId ? 'flex' : 'hidden'}`}>
            <aside className={`flex-col border-r transition-all duration-300 ${isSidebarOpen ? 'w-64 flex' : 'w-0 hidden'} backdrop-blur-xl`} style={theme.glassPanel}>
               <nav className="p-4 space-y-1">
                 {['all', 'favorites', 'trash'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab ? 'text-white shadow-lg' : 'opacity-60 hover:opacity-100 hover:bg-black/5'}`} style={activeTab === tab ? { backgroundColor: currentAccent } : {}}>{tab === 'all' ? <Folder size={18}/> : tab === 'favorites' ? <Star size={18}/> : <Trash2 size={18}/>}{t(tab === 'all' ? 'dashboard' : tab)}</button>))}
               </nav>
            </aside>
            <main className="flex-1 flex flex-col h-full min-w-0">
               {/* HEADER CỦA DASHBOARD */}
               <header className="h-16 flex items-center justify-between px-6 border-b border-gray-500/10 shrink-0 backdrop-blur-md z-[500] relative" style={theme.glassPanel}>
                  <div className="flex items-center gap-4">
                      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-black/5"><Menu size={20}/></button>
                      <h2 className="text-xl font-bold tracking-tight">{t(activeTab === 'all' ? 'dashboard' : activeTab)}</h2>
                  </div>
                  
                  {/* --- DASHBOARD BUTTONS --- */}
                  <div className="flex items-center gap-3">
                      <div className="relative" ref={settingsRef}>
                        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 rounded-lg text-sm font-bold shadow-sm border transition-all ${isSettingsOpen ? 'text-blue-500 border-blue-500 bg-blue-50' : 'hover:bg-black/5 bg-white/50 border-transparent'}`} title={t('settings')}>
                            <Settings size={18} className={isSettingsOpen ? 'animate-spin-slow' : ''} />
                        </button>
                        
                        {/* SETTINGS PANEL */}
                        {isSettingsOpen && (
                            <div className={`absolute right-0 top-full mt-3 w-80 rounded-2xl shadow-2xl border p-5 z-[1000] animate-in fade-in zoom-in-95 duration-200 origin-top-right`} style={theme.settingsPanel}>
                                <div className="space-y-6 pr-1"> 
                                    <div className="flex items-center justify-between pb-4 border-b border-gray-500/10"><h4 className="font-bold text-lg flex items-center gap-2"><SlidersHorizontal size={18}/> {t('settings')}</h4></div>
                                    
                                    <div><label className={`text-xs font-bold uppercase tracking-wider mb-2 block opacity-70`}>{t('theme')}</label><div className={`flex rounded-xl p-1 border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`}><button onClick={() => updateSetting('theme', 'light')} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${!isDark ? 'bg-white shadow-sm' : 'opacity-50 hover:opacity-100'}`}>{t('light')}</button><button onClick={() => updateSetting('theme', 'dark')} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${isDark ? 'bg-slate-700 shadow-sm' : 'opacity-50 hover:opacity-100'}`}>{t('dark')}</button></div></div>
                                    
                                    <div><label className={`text-xs font-bold uppercase tracking-wider mb-2 block opacity-70`}>{t('accentColor')}</label><div className="flex items-center gap-3"><div className="relative w-8 h-8 rounded-full border shadow-sm flex-shrink-0 overflow-hidden group cursor-pointer" style={{ backgroundColor: currentAccent }}><input type="color" value={currentAccent.length === 7 ? currentAccent : '#22d3ee'} onChange={(e) => updateSetting('accentColor', e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"/><div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none transition-opacity"><Wand2 size={12} className="text-white"/></div></div><div className="flex-1"><button onClick={() => updateSetting('accentColor', null)} className="text-xs underline opacity-60 hover:opacity-100">{t('resetColor')}</button></div></div></div>
                                    
                                    <div><label className={`text-xs font-bold uppercase tracking-wider mb-2 block opacity-70`}>{t('background')}</label>{settings.bgImage ? (<div className="relative group rounded-xl overflow-hidden h-24 border border-gray-500/20"><img src={settings.bgImage} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" /><button onClick={() => updateSetting('bgImage', null)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"><Trash2 size={16} className="mr-1"/> {t('removeBg')}</button></div>) : (<div onClick={() => bgInputRef.current?.click()} className={`h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 ${isDark ? 'border-slate-700' : 'border-slate-300'}`} style={{ ':hover': { borderColor: currentAccent } }}><Upload size={20} className="opacity-50 mb-1" /><span className="text-xs font-bold opacity-60">{t('uploadBg')}</span></div>)}<input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />{settings.bgImage && (<div className="mt-3"><div className="flex justify-between text-xs mb-1 opacity-70"><span>{t('bgOpacity')}</span><span>{settings.bgOpacity}%</span></div><input type="range" min="0" max="100" value={settings.bgOpacity} onChange={(e) => updateSetting('bgOpacity', Number(e.target.value))} className="w-full h-1 bg-gray-500/20 rounded-lg appearance-none cursor-pointer" style={{ accentColor: currentAccent }} /></div>)}</div>
                                    
                                    <div><div className="flex justify-between mb-2"><label className={`text-xs font-bold uppercase tracking-wider opacity-70`}>{t('gridCols')}</label><span className="text-xs font-bold bg-black/10 px-1.5 py-0.5 rounded">{settings.gridCols || 6}</span></div><input type="range" min="4" max="12" step="1" value={settings.gridCols || 6} onChange={(e) => updateSetting('gridCols', Number(e.target.value))} className="w-full h-1 bg-gray-500/20 rounded-lg appearance-none cursor-pointer" style={{ accentColor: currentAccent }} /></div>
                                    
                                    <div>
                                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block opacity-70`}>{t('language')}</label>
                                        <div className={`flex rounded-lg border overflow-hidden mb-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>{['vi', 'en'].map(lang => (<button key={lang} onClick={() => updateSetting('lang', lang)} className={`flex-1 py-1.5 text-xs font-bold ${settings.lang === lang ? 'bg-black/10' : 'hover:bg-black/5'}`} style={settings.lang === lang ? { color: currentAccent } : {}}>{lang.toUpperCase()}</button>))}</div>
                                        
                                        <div className="flex justify-between items-center mb-2">
                                            <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 opacity-70`}><FontIcon size={12}/> {t('font')}</label>
                                            <button onClick={() => ipcRenderer.send('open-fonts-folder')} className="text-[10px] font-bold opacity-50 hover:opacity-100 flex items-center gap-1 hover:text-blue-500" title={t('openFontFolder')}><FolderOpen size={10}/> Folder</button>
                                        </div>
                                        
                                        {/* CUSTOM FONT DROPDOWN */}
                                        <div className="relative" ref={fontDropdownRef}>
                                           <button onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs border outline-none font-medium transition-all ${isDark ? 'bg-slate-900 border-slate-700 hover:border-slate-600' : 'bg-slate-100 border-slate-200 hover:border-slate-300'}`}>
                                              <span className="truncate flex-1 text-left">{currentFontName}</span>
                                              <ChevronDown size={14} className={`opacity-50 transition-transform ${isFontDropdownOpen ? 'rotate-180' : ''}`}/>
                                           </button>
                                           
                                           {isFontDropdownOpen && (
                                               <div className={`absolute bottom-full left-0 right-0 mb-2 z-[70] max-h-48 overflow-y-auto custom-scrollbar rounded-xl border shadow-xl ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                                   <div className="p-1 space-y-0.5">
                                                       {availableFonts.map((f, i) => (
                                                           <button 
                                                               key={i} 
                                                               onClick={() => { updateSetting('font', f.value); setIsFontDropdownOpen(false); }}
                                                               className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${settings.font === f.value ? (isDark ? 'bg-white/10' : 'bg-black/5') : (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')}`}
                                                               style={{ fontFamily: f.value }}
                                                           >
                                                               <span className="truncate">{f.name}</span>
                                                               {settings.font === f.value && <Check size={12} className="text-blue-500"/>}
                                                           </button>
                                                       ))}
                                                   </div>
                                               </div>
                                           )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                      </div>

                      {/* Nút Dọn rác (Trash) hoặc Edit Mode */}
                      {activeTab === 'trash' ? (
                         <button onClick={() => setIsEmptyTrashOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg bg-red-500 hover:bg-red-600 active:scale-95 transition-all">
                            <Trash2 size={18} /> <span className="hidden sm:inline">{t('emptyTrash')}</span>
                         </button>
                      ) : (
                         <>
                             <button onClick={() => setIsEditMode(!isEditMode)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold shadow-sm border transition-all ${isEditMode ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-white/50 border-transparent hover:bg-black/5'}`} title={t('editMode')}>
                                <Pencil size={16} /> <span className="hidden sm:inline">{t('editMode')}</span>
                             </button>
                             <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg active:scale-95 transition-transform" style={{ backgroundColor: currentAccent }}>
                                <Plus size={18} /> <span className="hidden sm:inline">{t('addNew')}</span>
                             </button>
                         </>
                      )}
                  </div>
               </header>
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="grid gap-6 pb-10" style={{ gridTemplateColumns: `repeat(${settings.gridCols}, 1fr)` }}>
                      {bookmarks.filter(b => { if (activeTab === 'trash') return b.deleted; if (b.deleted) return false; if (activeTab === 'favorites') return b.isFavorite; return b.title.toLowerCase().includes(searchQuery.toLowerCase()); }).map(b => (
                        <BookmarkCard 
                            key={b.id} 
                            data={b} 
                            getFavicon={getFavicon} 
                            isDark={isDark} 
                            isTrash={activeTab === 'trash'} 
                            setViewingUrl={openSession} // [UPDATED] Dùng openSession thay vì setViewingUrl trực tiếp
                            setItemToDelete={setItemToDelete} 
                            updateStatus={updateBookmarkStatus}
                            hasBg={hasBg} 
                            isEditMode={isEditMode} 
                            onEdit={openModal}      
                        />
                      ))}
                  </div>
                  {bookmarks.filter(b => !b.deleted).length === 0 && activeTab !== 'trash' && (<div className="h-full flex flex-col items-center justify-center opacity-30 mt-[-50px]"><Monitor size={60} strokeWidth={1} /><p className="mt-2 text-sm font-bold">{t('notFound')}</p></div>)}
               </div>
            </main>
        </div>

        {/* --- POPUP NỘI BỘ (Chưa hỗ trợ đa nhiệm cho popup con) --- */}
        {popupUrl && (
            <div className="absolute inset-0 z-[150] bg-black animate-in fade-in zoom-in-95 duration-200">
                <button 
                    onClick={() => setPopupUrl(null)} 
                    className="absolute top-4 right-4 z-[200] p-2.5 rounded-full bg-black/50 text-white/80 hover:bg-red-600 hover:text-white hover:scale-110 transition-all backdrop-blur-md shadow-xl border border-white/20 group cursor-pointer"
                    title="Đóng"
                >
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300"/>
                </button>
                <webview 
                    ref={setPopupWebviewRef}
                    src={popupUrl}
                    className="w-full h-full bg-white"
                    style={{ display: 'inline-flex' }}
                />
            </div>
        )}
        
        {/* --- CONTEXT MENU CHUNG --- */}
        {contextMenu.visible && (
            <div 
                className="fixed inset-0 z-[190] cursor-default" 
                onClick={() => setContextMenu({ ...contextMenu, visible: false })}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ ...contextMenu, visible: false }); }}
            ></div>
        )}
        {contextMenu.visible && (
          <div 
             className={`fixed z-[200] w-64 rounded-xl shadow-2xl border p-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-2`} 
             style={{ left: contextMenu.x, top: contextMenu.y, ...theme.glassPanel }} 
             onClick={e => e.stopPropagation()} 
          >
            <div className="flex gap-1">
                 <button onClick={() => onMenuClick('goBack')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-black/5 ${isDark ? 'hover:bg-white/10' : ''}`} title="Back"><ArrowLeft size={16}/></button>
                 <button onClick={() => onMenuClick('reload')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-black/5 ${isDark ? 'hover:bg-white/10' : ''}`} title="Reload"><RefreshCw size={15}/></button>
                 <button onClick={() => onMenuClick('goForward')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-black/5 ${isDark ? 'hover:bg-white/10' : ''}`} title="Forward"><ArrowLeft size={16} className="rotate-180"/></button>
                 <button onClick={() => onMenuClick('goHome')} className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-colors hover:bg-blue-500 hover:text-white`} title="Home"><Home size={16}/></button>
            </div>

            <div className={`rounded-lg p-2 ${isDark ? 'bg-black/20' : 'bg-black/5'}`}>
                <div className="flex justify-between items-center text-[10px] font-bold opacity-60 mb-1 px-1">
                    <span>Zoom</span>
                    <span>{Math.round(100 * Math.pow(1.2, currentZoom))}%</span>
                </div>
                <div className="relative h-6 flex items-center">
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-current opacity-30 -translate-x-1/2 pointer-events-none h-full z-0"></div>
                    <input 
                        type="range" 
                        min="-3" max="3" step="0.1" 
                        value={currentZoom} 
                        onChange={(e) => onMenuClick('setZoom', e.target.value)}
                        className="w-full h-1 bg-gray-500/30 rounded-lg appearance-none cursor-pointer z-10 relative"
                        style={{ accentColor: currentAccent }}
                    />
                </div>
                <div className="flex justify-between text-[9px] opacity-40 px-1 mt-1 font-mono">
                    <span>-</span>
                    <span className="cursor-pointer hover:opacity-100" onClick={() => onMenuClick('zoomReset')}>RESET (100%)</span>
                    <span>+</span>
                </div>
            </div>

            {contextMenu.mediaType === 'image' && (<div className="px-2 py-1 text-xs opacity-50 flex gap-2 items-center"><ImageIcon size={12}/> Image Selected</div>)}
            {contextMenu.hasSelection && (<div className="px-2 py-1 text-xs opacity-50 flex gap-2 items-center"><Type size={12}/> Text Selected</div>)}
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      {isEmptyTrashOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsEmptyTrashOpen(false)}>
           <div className={`w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <Trash2 size={40} className="mx-auto text-red-500 mb-4 bg-red-500/10 p-2 rounded-full"/>
              <h3 className="font-bold text-lg mb-2">{t('emptyConfirmTitle')}</h3>
              <p className="text-sm opacity-60 mb-6">{t('emptyConfirmDesc')}</p>
              <div className="flex gap-3"><button onClick={() => setIsEmptyTrashOpen(false)} className="flex-1 py-2 rounded-lg font-bold border opacity-60 hover:opacity-100">{t('cancel')}</button><button onClick={executeEmptyTrash} className="flex-1 py-2 rounded-lg font-bold bg-red-500 text-white shadow-lg">{t('delete')}</button></div>
           </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setItemToDelete(null)}>
           <div className={`w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <AlertTriangle size={40} className="mx-auto text-red-500 mb-4 bg-red-500/10 p-2 rounded-full"/>
              <h3 className="font-bold text-lg mb-6">{activeTab === 'trash' ? t('deletePermanentTitle') : t('deleteConfirmTitle')}</h3>
              <div className="flex gap-3"><button onClick={() => setItemToDelete(null)} className="flex-1 py-2 rounded-lg font-bold border opacity-60 hover:opacity-100">{t('cancel')}</button><button onClick={executeDelete} className="flex-1 py-2 rounded-lg font-bold bg-red-500 text-white shadow-lg">{t('delete')}</button></div>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
           <div className={`w-full max-w-lg rounded-2xl p-0 shadow-2xl overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-500/10 flex justify-between items-center bg-black/5">
                <h3 className="font-bold">{editingId ? t('editTitle') : t('addTitle')}</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={18}/></button>
              </div>
              <form onSubmit={handleSaveBookmark} className="p-6 space-y-4">
                <div><label className="text-xs font-bold uppercase opacity-60 mb-1 block">{t('urlLabel')} <span className="text-red-500">*</span></label><div className="relative"><Globe size={16} className="absolute left-3 top-3 opacity-50"/><input autoFocus placeholder="example.com" className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} /></div></div>
                <div><label className="text-xs font-bold uppercase opacity-60 mb-1 block">{t('titleLabel')}</label><input placeholder="My Website" className="w-full px-3 py-2.5 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                <div><label className="text-xs font-bold uppercase opacity-60 mb-1 block">{t('iconLabel')}</label><div className="flex gap-2"><input type="text" placeholder="Image URL..." className="flex-1 px-3 py-2.5 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500" value={formData.iconUrl} onChange={e => setFormData({...formData, iconUrl: e.target.value})} /><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleIconUpload} /><button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 border rounded-xl hover:bg-black/5"><Upload size={18}/></button></div></div>
                
                <div className="pt-4 flex justify-between gap-3">
                    {editingId ? (
                        <button type="button" onClick={handleDeleteFromModal} className="px-4 py-2 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-colors">{t('delete')}</button>
                    ) : (
                        <div></div> 
                    )}
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-xl font-bold opacity-60 hover:opacity-100 hover:bg-black/5">{t('cancel')}</button>
                        <button type="submit" className="px-6 py-2 rounded-xl font-bold text-white shadow-lg transform active:scale-95 transition-all" style={{ backgroundColor: currentAccent }}>{editingId ? t('update') : t('save')}</button>
                    </div>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

function ShortcutRow({ keys, keys2, desc, icon, isDark }) {
  return (
    <div className="flex items-center justify-between group">
       <span className="text-sm font-bold opacity-70 flex items-center gap-2 group-hover:opacity-100 transition-opacity">{icon} {desc}</span>
       <div className="flex flex-col items-end gap-1">
         <div className="flex gap-1">{keys.map((k, i) => (<span key={i} className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border shadow-sm ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>{k}</span>))}</div>
         {keys2 && (<div className="flex gap-1 opacity-60 scale-90">{keys2.map((k, i) => (<span key={i} className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border shadow-sm ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>{k}</span>))}</div>)}
       </div>
    </div>
  );
}

function BookmarkCard({ data, getFavicon, isDark, isTrash, setViewingUrl, setItemToDelete, updateStatus, hasBg, isEditMode, onEdit }) {
  const displayIcon = getFavicon(data.url, data.localIconPath) || data.iconUrl;

  const titleClass = hasBg 
    ? "text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" 
    : "font-bold opacity-80 group-hover:opacity-100 group-hover:text-blue-500 transition-colors";

  return (
    <div 
        className="group cursor-pointer relative flex flex-col items-center w-full" 
        onClick={(e) => {
             if (isEditMode && !data.deleted) {
                 e.preventDefault();
                 onEdit(data);
             } else if (!data.deleted) {
                 setViewingUrl(data.id); // [UPDATED] Truyền ID thay vì URL để quản lý session
             }
        }}
    >
        <div className={`w-full aspect-square rounded-2xl border flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md hover:scale-105 transition-all relative z-10 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-white/60'} ${isEditMode && !data.deleted ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}>
          <img 
            src={displayIcon} 
            alt={data.title} 
            className="w-[80%] h-[80%] object-contain pointer-events-none drop-shadow-sm select-none" 
            style={{ willChange: 'transform' }} 
            onError={(e) => { e.target.onerror = null; if (e.target.src !== getFavicon(data.url)) e.target.src = getFavicon(data.url); else e.target.src = 'https://via.placeholder.com/64?text=?'; }} 
          />
          {isEditMode && !data.deleted && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                  <Pencil className="text-white drop-shadow-md" size={32} />
              </div>
          )}
        </div>
        
        <p className={`mt-2 text-center text-xs truncate w-full px-1 ${titleClass}`}>
            {data.title}
        </p>

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {!data.deleted && !isEditMode && (
             <button onClick={(e) => { e.stopPropagation(); updateStatus(data.id, { isFavorite: !data.isFavorite }); }} className={`p-1.5 rounded-md shadow-sm ${data.isFavorite ? 'text-yellow-400 bg-black/80' : 'bg-white text-black'}`}>
                <Star size={12} fill={data.isFavorite ? "currentColor" : "none"}/>
             </button>
          )}
          
          {isTrash && (
             <>
                 <button onClick={(e) => { e.stopPropagation(); updateStatus(data.id, { deleted: false }); }} className="p-1.5 rounded-md bg-green-500 text-white shadow-sm" title="Khôi phục">
                    <RotateCcw size={12}/>
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); setItemToDelete(data.id); }} className="p-1.5 rounded-md bg-red-500 text-white shadow-sm" title="Xóa vĩnh viễn">
                    <Trash2 size={12}/>
                 </button>
             </>
          )}
        </div>
    </div>
  );
}