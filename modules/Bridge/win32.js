var ffi = require('ffi'),
 ref = require('ref'),
 Struct = require('struct');
 
var win32 = {}; 
module.exports = win32;

win32.NULL = ref.NULL;
win32.isNull = ref.isNull;
win32.structs = {};
var types = win32.types = {};


function PTR(type){
  return ref.refType(type);
}
 
function TYPEDEF(name, type){
  win32.types[name] = type
  return win32.types[name];
}
function STRUCT(name, fields){
  win32.structs[name] = Struct(fields)
  return win32.structs[name];
}
 
function ARRAY(type, length){
  var fields = {};
  Array.apply(null, new Array(length)).forEach(function(x, i){
    fields[i] = type;
  });
  return STRUCT(type.name+'x'+length, fields);
}

var VOID = types.void = ffi.types.void,
 int8 = types.int8 = ffi.types.int8,
 char = types.char = ffi.types.char,
 uchar = types.uchar = ffi.types.uchar,
 short = types.short = ffi.types.short,
 ushort = types.ushort = ffi.types.ushort,
 int = types.int = ffi.types.int,
 uint = types.uint = ffi.types.uint,
 long = types.long = ffi.types.long,
 ulong = types.ulong = ffi.types.ulong,
 DWORD = TYPEDEF('DWORD', ulong),
 BOOL = TYPEDEF('BOOL', int),
 BYTE = TYPEDEF('BYTE', uchar),
 TCHAR = TYPEDEF('TCHAR', char),
 LPDWORD = TYPEDEF('LPDWORD', PTR(ulong)),
 UINT = TYPEDEF('UINT', uint),
 ULONG_PTR = TYPEDEF('ULONG_PTR', ulong),
 LONG = TYPEDEF('LONG', long),
 WCHAR = TYPEDEF('WCHAR', ushort),
 LPCSTR = TYPEDEF('LPCSTR', PTR(int8)),
 HANDLE = TYPEDEF('HANDLE', PTR(VOID)),
 HRESULT = TYPEDEF('HRESULT', long),
 WPARAM = TYPEDEF('WPARAM', uint),
 LPARAM = TYPEDEF('LPARAM', long),
 COLORREF = TYPEDEF('COLORREF', ulong),
 HWND = TYPEDEF('HWND', HANDLE),
 HBRUSH = TYPEDEF('HBRUSH', HANDLE),
 HDC = TYPEDEF('HDC', HANDLE),
 HICON = TYPEDEF('HICON', HANDLE),
 HMENU = TYPEDEF('HMENU', HANDLE),
 RECT = STRUCT('RECT', {
  left:LONG,
  top:LONG,
  right:LONG,
  bottom:LONG
 }),
 LPRECT = TYPEDEF('LPRECT', PTR(RECT)),
 MARGINS = STRUCT('MARGINS', {
  cxLeftWidth:int,
  cxRightWidth:int,
  cyTopHeight:int,
  cyBottomHeight:int,
}),
COLORIZATIONPARAMS = STRUCT('COLORIZATIONPARAMS', {
  clrColor:COLORREF,
  clrAftGlow:COLORREF,
  nIntensity:UINT,
  clrAftGlowBal:UINT,
  clrBlurBal:UINT,
  clrGlassReflInt:UINT,
  fOpaque:BOOL
}),
SHSTOCKICONINFO = STRUCT('SHSTOCKICONINFO', {
  cbSize:DWORD,
  hIcon:HICON,
  iSysImageIndex:int,
  iIcon:int,
  szPath:ARRAY(WCHAR,255)
}),
SHFILEINFO = STRUCT('SHFILEINFO', {
  hIcon:HICON,
  iIcon:int,
  dwAttributes:DWORD,
  szDisplayName:ARRAY(TCHAR,255),
  szTypeName:ARRAY(TCHAR,80)
}),
LPSHFILEINFO = TYPEDEF('LPSHFILEINFO', PTR(SHFILEINFO)),
LPSHSTOCKICONINFO = TYPEDEF('LPSHSTOCKICONINFO', PTR(SHSTOCKICONINFO)),
POINT = STRUCT('POINT', {
  x:LONG,
  y:LONG
}),
LPPOINT = TYPEDEF('POINT', PTR(POINT));


/* Import windows 32 C functions needed for 
 * low-level operations */
win32.user32 = new ffi.Library('user32.dll', {
  GetWindowRect: [BOOL, [HWND, LPRECT]],
  GetDesktopWindow: [HWND, []],
  GetWindowDC: [HDC, [HWND]],
  GetForegroundWindow: [HWND, []],
  GetWindowLongA: [ LONG, [ HWND, int ] ],
  GetWindowLongW: [ LONG, [ HWND, int ] ],
  SetWindowLongA: [ LONG, [ HWND, int, LONG ] ],
  SetWindowLongW: [ LONG, [ HWND, int, LONG ] ],
  GetSystemMenu: [ HMENU, [ HWND, BOOL ] ],
  EnableMenuItem: [ BOOL, [ HMENU, UINT, UINT ] ],
  PostMessageA: [ BOOL, [ HWND, UINT, WPARAM, LPARAM ] ],
  PostMessageW: [ BOOL, [ HWND, UINT, WPARAM, LPARAM ] ],
  GetCursorPos: [ BOOL, [ LPPOINT ]],
  SetCursorPos: [ BOOL, [ int, int ]],
  BroadcastSystemMessage: [ long, [ DWORD, LPDWORD, UINT, WPARAM, LPARAM ] ],
  ShowCursor: [ int, [ BOOL ] ],
  SetPhysicalCursorPos: [ BOOL, [ int, int ]],
  mouse_event: [ VOID, [ DWORD, DWORD, DWORD, DWORD, ULONG_PTR ]],
  keybd_event: [ VOID, [ BYTE, BYTE, DWORD, ULONG_PTR ]],
  DrawIconEx: [ BOOL, [ HDC, int, int, HICON, int, int, UINT, HBRUSH, UINT ]],
  DestroyIcon: [ BOOL, [ HICON ]]
});
win32.user32.GetWindowLong = win32.user32.GetWindowLongW;
win32.user32.SetWindowLong = win32.user32.SetWindowLongW;
win32.user32.WM_SYSCOMMAND = 0x0112;
win32.user32.WS_MAXIMIZEBOX = 0x10000;
win32.user32.WS_MINIMIZEBOX = 0x20000;
win32.user32.WS_SIZEBOX = 0x40000;
win32.user32.WS_THICKFRAME = win32.user32.WS_SIZEBOX;
win32.user32.WS_CAPTION = 0xC00000;
win32.user32.WS_EX_WINDOWEDGE = 0x00000100;
win32.user32.WS_SYSMENU = 0x80000;
win32.user32.GWL_STYLE = -16;
win32.user32.MF_BYCOMMAND = 0x00000000;
win32.user32.MF_BYPOSITION = 0x00000400;
win32.user32.MF_DISABLED = 0x00000002;
win32.user32.MF_ENABLED = 0x00000000;
win32.user32.MF_GRAYED = 0x00000001;
win32.user32.SC_CLOSE = 0xF060;
win32.user32.SC_CONTEXTHELP = 0xF180;
win32.user32.SC_DEFAULT = 0xF160;
win32.user32.SC_HOTKEY = 0xF150;
win32.user32.SC_HSCROLL = 0xF080;
win32.user32.SC_KEYMENU = 0xF100;
win32.user32.SC_MAXIMIZE = 0xF030;
win32.user32.SC_MINIMIZE = 0xF020;
win32.user32.HWND_BROADCAST = 0xffff;
win32.user32.GCLP_HBRBACKGROUND = -10;
win32.user32.WM_MOUSEMOVE = 0x0200;
win32.user32.WM_LBUTTONUP = 0x0202;
win32.user32.WM_LBUTTONDOWN = 0x0201;
win32.user32.WM_RBUTTONUP = 0x0205;
win32.user32.WM_RBUTTONDOWN = 0x0204;
win32.user32.WM_MOUSELEAVE = 0x02A3;
win32.user32.WM_MOUSEHOVER = 0x02A1;
win32.user32.MK_LBUTTON = 0x0001;
win32.user32.WM_KEYUP = 0x0101;
win32.user32.WM_KEYDOWN = 0x0100;

/* Import shell 32 low-level c functions */
win32.shell32 = new ffi.Library('shell32.dll', {
  SHGetStockIconInfo:[HRESULT,[UINT,UINT,LPSHSTOCKICONINFO]],
  SHGetFileInfo:[LPDWORD,[LPCSTR,DWORD,LPSHFILEINFO,UINT,UINT]]
});

win32.shell32.SHGFI_ADDOVERLAYS = 0x000000020;
win32.shell32.SHGFI_ATTR_SPECIFIED = 0x000020000;
win32.shell32.SHGFI_ATTRIBUTES = 0x000000800;
win32.shell32.SHGFI_DISPLAYNAME = 0x000000200;
win32.shell32.SHGFI_EXETYPE = 0x000002000;
win32.shell32.SHGFI_ICON = 0x000000100;
win32.shell32.SHGFI_ICONLOCATION = 0x000001000;
win32.shell32.SHGFI_LARGEICON = 0x000000000;
win32.shell32.SHGFI_LINKOVERLAY = 0x000008000;
win32.shell32.SHGFI_OPENICON = 0x000000002;
win32.shell32.SHGFI_OVERLAYINDEX = 0x000000040;
win32.shell32.SHGFI_PIDL = 0x000000008;
win32.shell32.SHGFI_SELECTED = 0x000010000;
win32.shell32.SHGFI_SHELLICONSIZE = 0x000000004;
win32.shell32.SHGFI_SMALLICON = 0x000000001;
win32.shell32.SHGFI_SYSICONINDEX = 0x000004000;
win32.shell32.SHGFI_TYPENAME = 0x000000400;
win32.shell32.SHGFI_USEFILEATTRIBUTES = 0x000000010;

win32.shell32.SHSTOCKFLAG = {
  SHGSI_ICONLOCATION:0,
  SHGSI_ICON:0x000000100,
  SHGSI_SYSICONINDEX:0x000004000,
  SHGSI_LINKOVERLAY:0x000008000,
  SHGSI_SELECTED:0x000010000,
  SHGSI_LARGEICON:0x000000000,
  SHGSI_SMALLICON:0x000000001,
  SHGSI_SHELLICONSIZE:0x000000004
};

win32.shell32.SHSTOCKICONID = {
  SIID_DOCNOASSOC:0,
  SIID_DOCASSOC:1,
  SIID_APPLICATION:2,
  SIID_FOLDER:3,
  SIID_FOLDEROPEN:4,
  SIID_DRIVE525:5,
  SIID_DRIVE35:6,
  SIID_DRIVEREMOVE:7,
  SIID_DRIVEFIXED:8,
  SIID_DRIVENET:9,
  SIID_DRIVENETDISABLED:10,
  SIID_DRIVECD:11,
  SIID_DRIVERAM:12,
  SIID_WORLD:13,
  SIID_SERVER:15,
  SIID_PRINTER:16,
  SIID_MYNETWORK:17,
  SIID_FIND:22,
  SIID_HELP:23,
  SIID_SHARE:28,
  SIID_LINK:29,
  SIID_SLOWFILE:30,
  SIID_RECYCLER:31,
  SIID_RECYCLERFULL:32,
  SIID_MEDIACDAUDIO:40,
  SIID_LOCK:47,
  SIID_AUTOLIST:49,
  SIID_PRINTERNET:50,
  SIID_SERVERSHARE:51,
  SIID_PRINTERFAX:52,
  SIID_PRINTERFAXNET:53,
  SIID_PRINTERFILE:54,
  SIID_STACK:55,
  SIID_MEDIASVCD:56,
  SIID_STUFFEDFOLDER:57,
  SIID_DRIVEUNKNOWN:58,
  SIID_DRIVEDVD:59,
  SIID_MEDIADVD:60,
  SIID_MEDIADVDRAM:61,
  SIID_MEDIADVDRW:62,
  SIID_MEDIADVDR:63,
  SIID_MEDIADVDROM:64,
  SIID_MEDIACDAUDIOPLUS:65,
  SIID_MEDIACDRW:66,
  SIID_MEDIACDR:67,
  SIID_MEDIACDBURN:68,
  SIID_MEDIABLANKCD:69,
  SIID_MEDIACDROM:70,
  SIID_AUDIOFILES:71,
  SIID_IMAGEFILES:72,
  SIID_VIDEOFILES:73,
  SIID_MIXEDFILES:74,
  SIID_FOLDERBACK:75,
  SIID_FOLDERFRONT:76,
  SIID_SHIELD:77,
  SIID_WARNING:78,
  SIID_INFO:79,
  SIID_ERROR:80,
  SIID_KEY:81,
  SIID_SOFTWARE:82,
  SIID_RENAME:83,
  SIID_DELETE:84,
  SIID_MEDIAAUDIODVD:85,
  SIID_MEDIAMOVIEDVD:86,
  SIID_MEDIAENHANCEDCD:87,
  SIID_MEDIAENHANCEDDVD:88,
  SIID_MEDIAHDDVD:89,
  SIID_MEDIABLURAY:90,
  SIID_MEDIAVCD:91,
  SIID_MEDIADVDPLUSR:92,
  SIID_MEDIADVDPLUSRW:93,
  SIID_DESKTOPPC:94,
  SIID_MOBILEPC:95,
  SIID_USERS:96,
  SIID_MEDIASMARTMEDIA:97,
  SIID_MEDIACOMPACTFLASH :98,
  SIID_DEVICECELLPHONE:99,
  SIID_DEVICECAMERA:100,
  SIID_DEVICEVIDEOCAMERA:101,
  SIID_DEVICEAUDIOPLAYER:102,
  SIID_NETWORKCONNECT:103,
  SIID_INTERNET:104,
  SIID_ZIPFILE:105,
  SIID_SETTINGS:106,
  SIID_DRIVEHDDVD:132,
  SIID_DRIVEBD:133,
  SIID_MEDIAHDDVDROM:134,
  SIID_MEDIAHDDVDR:135,
  SIID_MEDIAHDDVDRAM:136,
  SIID_MEDIABDROM:137,
  SIID_MEDIABDR:138,
  SIID_MEDIABDRE:139,
  SIID_CLUSTEREDDRIVE:140,
  SIID_MAX_ICONS:175
};

/* Import windows 32 graphics device low-level c functions */
win32.gdi32 = new ffi.Library('gdi32.dll', {
  BitBlt: [ BOOL, [HDC, int, int, int, int, HDC, int, int, DWORD]]
});

/* Import windows 32 desktop window management API low-level c functions */
win32.dwmapi = new ffi.Library('dwmapi.dll', {
  DwmExtendFrameIntoClientArea: [ HRESULT, [ HWND, MARGINS ] ]
});
win32.dwmapi.MARGINS = MARGINS;
win32.dwmapi.COLORIZATIONPARAMS = COLORIZATIONPARAMS;

win32.kernel32 = win32.kernel32 || {};
win32.kernel32.FILE_ATTRIBUTE_NORMAL = 0x80;
win32.kernel32.FILE_ATTRIBUTE_SYSTEM = 0x4;

win32.urlmon = new ffi.Library('urlmon.dll', {
  UrlMkSetSessionOption: [ HRESULT, [DWORD, "string", DWORD, DWORD] ]
});
win32.urlmon.INTERNET_OPTION_PROXY = 38;
win32.urlmon.INTERNET_OPTION_REFRESH = 37;
win32.urlmon.URLMON_OPTION_USERAGENT = 0x10000001;
win32.urlmon.URLMON_OPTION_USERAGENT_REFRESH = 0x10000002;
