
#include <v8.h>
#include <node.h>
#include <node_buffer.h>
#include <stdio.h>
#include <vcclr.h>
#include <vector>
#include <msclr/marshal.h>
#include <windows.h>
#include <Shellapi.h>
#include <comdef.h>
#include "../AutoLayoutPanel.cpp"

#using <System.dll>
#using <System.Core.dll>
#using <WPF/WindowsBase.dll>
#using <WPF/PresentationCore.dll>
#using <WPF/PresentationFramework.dll>
#using <System.Windows.Forms.dll>
#using <System.Drawing.dll>

using namespace v8;
using namespace System::Collections::Generic;
using namespace System::Reflection;
using namespace System::Reflection::Emit;
using namespace System::Runtime::InteropServices;
using namespace System::Threading::Tasks;
using namespace System::Threading;
using namespace Microsoft::Win32;

// #define GC_DEBUG 1

extern "C" void uv_run_nowait();

namespace v8 {
  namespace internal {
    class Object {};
  }
  struct HeapStatsUpdate {};
}
Persistent<Function> bufferConstructor;

struct wrapv8obj {
  v8::Persistent<v8::Function> function;
};

#ifndef SHGSI_ICON
typedef struct _SHSTOCKICONINFO
{
    DWORD cbSize;
    HICON hIcon;
    int   iSysImageIndex;
    int   iIcon;
    WCHAR szPath[MAX_PATH];
} SHSTOCKICONINFO;

#define SHGSI_ICONLOCATION      0 // you always get the icon location
#define SHGSI_ICON              SHGFI_ICON
#define SHGSI_SYSICONINDEX      SHGFI_SYSICONINDEX
#define SHGSI_LINKOVERLAY       SHGFI_LINKOVERLAY
#define SHGSI_SELECTED          SHGFI_SELECTED
#define SHGSI_LARGEICON         SHGFI_LARGEICON
#define SHGSI_SMALLICON         SHGFI_SMALLICON
#define SHGSI_SHELLICONSIZE     SHGFI_SHELLICONSIZE

//  Shell icons
typedef enum SHSTOCKICONID
{
    SIID_DOCNOASSOC = 0,          // document (blank page), no associated program
    SIID_DOCASSOC = 1,            // document with an associated program
    SIID_APPLICATION = 2,         // generic application with no custom icon
    SIID_FOLDER = 3,              // folder (closed)
    SIID_FOLDEROPEN = 4,          // folder (open)
    SIID_DRIVE525 = 5,            // 5.25" floppy disk drive
    SIID_DRIVE35 = 6,             // 3.5" floppy disk drive
    SIID_DRIVEREMOVE = 7,         // removable drive
    SIID_DRIVEFIXED = 8,          // fixed (hard disk) drive
    SIID_DRIVENET = 9,            // network drive
    SIID_DRIVENETDISABLED = 10,   // disconnected network drive
    SIID_DRIVECD = 11,            // CD drive
    SIID_DRIVERAM = 12,           // RAM disk drive
    SIID_WORLD = 13,              // entire network
    SIID_SERVER = 15,             // a computer on the network
    SIID_PRINTER = 16,            // printer
    SIID_MYNETWORK = 17,          // My network places
    SIID_FIND = 22,               // Find
    SIID_HELP = 23,               // Help
    SIID_SHARE = 28,              // overlay for shared items
    SIID_LINK = 29,               // overlay for shortcuts to items
    SIID_SLOWFILE = 30,           // overlay for slow items
    SIID_RECYCLER = 31,           // empty recycle bin
    SIID_RECYCLERFULL = 32,       // full recycle bin
    SIID_MEDIACDAUDIO = 40,       // Audio CD Media
    SIID_LOCK = 47,               // Security lock
    SIID_AUTOLIST = 49,           // AutoList
    SIID_PRINTERNET = 50,         // Network printer
    SIID_SERVERSHARE = 51,        // Server share
    SIID_PRINTERFAX = 52,         // Fax printer
    SIID_PRINTERFAXNET = 53,      // Networked Fax Printer
    SIID_PRINTERFILE = 54,        // Print to File
    SIID_STACK = 55,              // Stack
    SIID_MEDIASVCD = 56,          // SVCD Media
    SIID_STUFFEDFOLDER = 57,      // Folder containing other items
    SIID_DRIVEUNKNOWN = 58,       // Unknown drive
    SIID_DRIVEDVD = 59,           // DVD Drive
    SIID_MEDIADVD = 60,           // DVD Media
    SIID_MEDIADVDRAM = 61,        // DVD-RAM Media
    SIID_MEDIADVDRW = 62,         // DVD-RW Media
    SIID_MEDIADVDR = 63,          // DVD-R Media
    SIID_MEDIADVDROM = 64,        // DVD-ROM Media
    SIID_MEDIACDAUDIOPLUS = 65,   // CD+ (Enhanced CD) Media
    SIID_MEDIACDRW = 66,          // CD-RW Media
    SIID_MEDIACDR = 67,           // CD-R Media
    SIID_MEDIACDBURN = 68,        // Burning CD
    SIID_MEDIABLANKCD = 69,       // Blank CD Media
    SIID_MEDIACDROM = 70,         // CD-ROM Media
    SIID_AUDIOFILES = 71,         // Audio files
    SIID_IMAGEFILES = 72,         // Image files
    SIID_VIDEOFILES = 73,         // Video files
    SIID_MIXEDFILES = 74,         // Mixed files
    SIID_FOLDERBACK = 75,         // Folder back
    SIID_FOLDERFRONT = 76,        // Folder front
    SIID_SHIELD = 77,             // Security shield. Use for UAC prompts only.
    SIID_WARNING = 78,            // Warning
    SIID_INFO = 79,               // Informational
    SIID_ERROR = 80,              // Error
    SIID_KEY = 81,                // Key / Secure
    SIID_SOFTWARE = 82,           // Software
    SIID_RENAME = 83,             // Rename
    SIID_DELETE = 84,             // Delete
    SIID_MEDIAAUDIODVD = 85,      // Audio DVD Media
    SIID_MEDIAMOVIEDVD = 86,      // Movie DVD Media
    SIID_MEDIAENHANCEDCD = 87,    // Enhanced CD Media
    SIID_MEDIAENHANCEDDVD = 88,   // Enhanced DVD Media
    SIID_MEDIAHDDVD = 89,         // HD-DVD Media
    SIID_MEDIABLURAY = 90,        // BluRay Media
    SIID_MEDIAVCD = 91,           // VCD Media
    SIID_MEDIADVDPLUSR = 92,      // DVD+R Media
    SIID_MEDIADVDPLUSRW = 93,     // DVD+RW Media
    SIID_DESKTOPPC = 94,          // desktop computer
    SIID_MOBILEPC = 95,           // mobile computer (laptop/notebook)
    SIID_USERS = 96,              // users
    SIID_MEDIASMARTMEDIA = 97,    // Smart Media
    SIID_MEDIACOMPACTFLASH = 98,  // Compact Flash
    SIID_DEVICECELLPHONE = 99,    // Cell phone
    SIID_DEVICECAMERA = 100,      // Camera
    SIID_DEVICEVIDEOCAMERA = 101, // Video camera
    SIID_DEVICEAUDIOPLAYER = 102, // Audio player
    SIID_NETWORKCONNECT = 103,    // Connect to network
    SIID_INTERNET = 104,          // Internet
    SIID_ZIPFILE = 105,           // ZIP file
    SIID_SETTINGS = 106,          // Settings
    // 107-131 are internal Vista RTM icons
    // 132-159 for SP1 icons
    SIID_DRIVEHDDVD = 132,        // HDDVD Drive (all types)
    SIID_DRIVEBD = 133,           // BluRay Drive (all types)
    SIID_MEDIAHDDVDROM = 134,     // HDDVD-ROM Media
    SIID_MEDIAHDDVDR = 135,       // HDDVD-R Media
    SIID_MEDIAHDDVDRAM = 136,     // HDDVD-RAM Media
    SIID_MEDIABDROM = 137,        // BluRay ROM Media
    SIID_MEDIABDR = 138,          // BluRay R Media
    SIID_MEDIABDRE = 139,         // BluRay RE Media (Rewriable and RAM)
    SIID_CLUSTEREDDRIVE = 140,    // Clustered disk
    // 160+ are for Windows 7 icons
    SIID_MAX_ICONS = 174,
} SHSTOCKICONID;

#define SIID_INVALID ((SHSTOCKICONID)-1)

SHSTDAPI SHGetStockIconInfo(SHSTOCKICONID siid, UINT uFlags, __inout SHSTOCKICONINFO *psii);
#endif

Handle<v8::Value> MarshalCLRToV8(System::Object^ netdata);
System::String^ exceptionV82stringCLR(Handle<v8::Value> exception);


/**
 ** Supporting WPF / Windows Functions, Methods and Classes
 **/

namespace TintInterop {
  public ref class WPFAnimator 
  {
  public:
      WPFAnimator(UIElement^ element_, DependencyProperty^ property_, double from_, double to_, double duration_) {
          this->element = element_;
          this->property = property_;
          this->from = from_;
          this->to = to_;
          this->duration = duration_;
          this->passed = gcnew System::Diagnostics::Stopwatch();
          this->passed->Start();
      }
      void RenderCallback(Object^ sender, EventArgs^ e) {
          double diff = ((double)this->passed->ElapsedMilliseconds)/(this->duration);
          if(diff >= 1) {
              this->passed->Stop();
              this->element->SetValue(this->property, this->to);
              System::Windows::Media::CompositionTarget::Rendering -= this->selfRef;
          } else {
              double target = ((this->to - this->from) * diff ) + this->from;
              this->element->SetValue(this->property, target);
          }
      }
      static void Render(UIElement^ element_, DependencyProperty^ property_, double from_, double to_, double duration_) {
        WPFAnimator^ an = gcnew WPFAnimator(element_, property_, from_, to_, duration_);
        an->selfRef = gcnew EventHandler(an, &WPFAnimator::RenderCallback);
        System::Windows::Media::CompositionTarget::Rendering += an->selfRef;
      }
      EventHandler ^selfRef;
  private:
      UIElement^ element;
      DependencyProperty^ property;
      double to;
      double from;
      double duration;
      System::Diagnostics::Stopwatch^ passed;
  };

  public ref class Wpf32Window : System::Windows::Forms::IWin32Window
  {
  public:
    property System::IntPtr Handle {
      virtual System::IntPtr get() { return _handle; };
      void set(IntPtr h) { _handle = h; };
    }

    Wpf32Window(System::Windows::Window^ wpfWindow)
    {
        this->Handle = (gcnew System::Windows::Interop::WindowInteropHelper(wpfWindow))->Handle;
    }
  private:
    IntPtr _handle;
  };

  public ref class Shell
  {
  public:

    static System::String^ GetIconFromFile(System::String^ file, int index) {
      HICON hIcon;
      UINT n = ExtractIconEx((const char*)(void*)Marshal::StringToHGlobalAnsi(file), index, &(hIcon), NULL, 1);
      if(n == 0) n = ExtractIconEx((const char*)(void*)Marshal::StringToHGlobalAnsi(file), index, NULL, &(hIcon), 1);
      if(n != 0) {
        System::Drawing::Icon^ icon = System::Drawing::Icon::FromHandle(System::IntPtr((void *)hIcon));
        System::Windows::Media::Imaging::BitmapSource^ source = System::Windows::Interop::Imaging::CreateBitmapSourceFromHIcon(
          icon->Handle,
          System::Windows::Int32Rect(0,0,icon->Width,icon->Height),
          System::Windows::Media::Imaging::BitmapSizeOptions::FromEmptyOptions()
        );
        
        System::Windows::Media::Imaging::PngBitmapEncoder^ encoder = gcnew System::Windows::Media::Imaging::PngBitmapEncoder();
        encoder->Frames->Add( System::Windows::Media::Imaging::BitmapFrame::Create(source) );

        System::IO::MemoryStream^ stream = gcnew System::IO::MemoryStream();
        encoder->Save(stream);
        return System::Convert::ToBase64String(stream->ToArray());
      } else {
        return nullptr;
      }
    }

    static System::String^ GetSystemIcon(int Id) 
    {
      SHSTOCKICONINFO stock = {0};
      stock.cbSize = sizeof(SHSTOCKICONINFO);
      HRESULT r = SHGetStockIconInfo((SHSTOCKICONID)Id, (SHGSI_ICON | SHGSI_LARGEICON), &stock);
      if(r == S_OK)
      {
        System::Drawing::Icon^ icon = System::Drawing::Icon::FromHandle(System::IntPtr((void *)stock.hIcon));

        System::Windows::Media::Imaging::BitmapSource^ source = System::Windows::Interop::Imaging::CreateBitmapSourceFromHIcon(icon->Handle,
          System::Windows::Int32Rect(0,0,icon->Width,icon->Height),
          System::Windows::Media::Imaging::BitmapSizeOptions::FromEmptyOptions());
        
        System::Windows::Media::Imaging::PngBitmapEncoder^ encoder = gcnew System::Windows::Media::Imaging::PngBitmapEncoder();
        encoder->Frames->Add( System::Windows::Media::Imaging::BitmapFrame::Create(source) );

        System::IO::MemoryStream^ stream = gcnew System::IO::MemoryStream();
        encoder->Save(stream);
        return System::Convert::ToBase64String(stream->ToArray());
      } else {
        return nullptr;
      }
    }

    static System::String^ GetIconForFile(System::String^ file) 
    {
      SHFILEINFO shfi;
      SHGetFileInfo((const char*)(void*)Marshal::StringToHGlobalAnsi(file), FILE_ATTRIBUTE_NORMAL, &shfi, sizeof(SHFILEINFO), 
        SHGFI_USEFILEATTRIBUTES | SHGFI_ICON | SHGFI_LARGEICON);
      
      System::Drawing::Icon^ icon = System::Drawing::Icon::FromHandle(System::IntPtr((void *)shfi.hIcon));

      System::Windows::Media::Imaging::BitmapSource^ source = System::Windows::Interop::Imaging::CreateBitmapSourceFromHIcon(icon->Handle,
        System::Windows::Int32Rect(0,0,icon->Width,icon->Height),
        System::Windows::Media::Imaging::BitmapSizeOptions::FromEmptyOptions());
      
      System::Windows::Media::Imaging::PngBitmapEncoder^ encoder = gcnew System::Windows::Media::Imaging::PngBitmapEncoder();
      encoder->Frames->Add( System::Windows::Media::Imaging::BitmapFrame::Create(source) );

      System::IO::MemoryStream^ stream = gcnew System::IO::MemoryStream();
      encoder->Save(stream);

      return System::Convert::ToBase64String(stream->ToArray());
    }
  };

  public ref class CommonDialogExtensions
  {
  public:
    static System::Windows::Forms::DialogResult^ ShowDialog(System::Windows::Forms::CommonDialog^ dialog, System::Windows::Window^ parent)
    {
        return dialog->ShowDialog(gcnew Wpf32Window(parent));
    }
  };

  public ref class AsyncEventDelegate {
  public:
    AsyncEventDelegate(System::Object^ target, MethodInfo^ method, array<System::Object^>^ cshargs)
    {
      this->target = target;
      this->method = method;
      this->cshargs = cshargs;
    }

    void DoWorkHandler(System::Object^ sender, System::ComponentModel::DoWorkEventArgs^ e) {
      try {
        System::Object^ rtn = method->Invoke(target, cshargs);
      } catch (System::Exception^ e) {
        Console::WriteLine(e);
        abort();
      }
    }

  private:
    System::Object^ target;
    MethodInfo^ method;
    array<System::Object^>^ cshargs;
  };
}


namespace IEWebBrowserFix {
  public ref class ScriptInterface
  {
  public:
    ScriptInterface(v8::Persistent<v8::Function> cb) {
      callback = new wrapv8obj();
      callback->function = cb;
    }
    
    [System::Runtime::InteropServices::ComVisibleAttribute(true)]
    void postMessageBack(System::String^ str)
    {
      v8::HandleScope scope;
      v8::Handle<v8::Value> argv[1];

      argv[0] = MarshalCLRToV8(str);

      v8::TryCatch try_catch;

      if (this->callback->function.IsEmpty()) {
        throw gcnew System::Exception("CLR Fatal: Script bridge callback has been garbage collected.");
        abort();
      } else {
        // invoke the registered callback function
        this->callback->function->Call(v8::Context::GetCurrent()->Global(), 1, argv);
      }
      if (try_catch.HasCaught()) {
        throw gcnew System::Exception(exceptionV82stringCLR(try_catch.Exception()));
        exit(1);
      }
    }

  private:
    wrapv8obj *callback;

  };

  static Handle<v8::Value> CreateScriptInterface(const v8::Arguments& args) {
    HandleScope scope;
    v8::Local<v8::Function> callback = v8::Local<v8::Function>::Cast(args[0]);
    return scope.Close(MarshalCLRToV8(gcnew ScriptInterface(Persistent<Function>::New(callback))));
  }
  static bool SetBrowserFeatureControlKey(wstring feature, const wchar_t *appName, DWORD value) {
    HKEY key;
    bool success = true;
    wstring featuresPath(L"Software\\Microsoft\\Internet Explorer\\Main\\FeatureControl\\");
    wstring path(featuresPath + feature);
    if (RegCreateKeyExW(HKEY_CURRENT_USER, path.c_str(), 0, NULL, REG_OPTION_VOLATILE, KEY_WRITE, NULL, &key, NULL) != ERROR_SUCCESS)
      success = false;
    else {
      if (RegSetValueExW(key, appName, 0, REG_DWORD, (const BYTE*) &value, sizeof(value)) != ERROR_SUCCESS) success = false;
      if (RegCloseKey(key) != ERROR_SUCCESS) success = false;
    } 
    return success;
  }

  static void SetBrowserFeatureControl() {
    System::Diagnostics::Process ^process = System::Diagnostics::Process::GetCurrentProcess();
    System::String^ pName = process->Modules[0]->FileName;
    array<wchar_t>^ delim = gcnew array<wchar_t>(1);
    delim[0]='\\';
    array<System::String^>^ path = pName->Split(delim);
    pin_ptr<const wchar_t> fileNameP = PtrToStringChars(path[path->Length-1]);
    const wchar_t *fileName = fileNameP;

    SetBrowserFeatureControlKey(L"FEATURE_96DPI_PIXEL", fileName, 1); // enable high-dpi support.
    SetBrowserFeatureControlKey(L"FEATURE_BROWSER_EMULATION", fileName, 00000); // turn off compatibility mode.
    SetBrowserFeatureControlKey(L"FEATURE_AJAX_CONNECTIONEVENTS", fileName, 1);
    SetBrowserFeatureControlKey(L"FEATURE_ENABLE_CLIPCHILDREN_OPTIMIZATION", fileName, 1);
    SetBrowserFeatureControlKey(L"FEATURE_GPU_RENDERING", fileName, 1); // use GPU rendering
    SetBrowserFeatureControlKey(L"FEATURE_IVIEWOBJECTDRAW_DMLT9_WITH_GDI  ", fileName, 0); // force directX
    SetBrowserFeatureControlKey(L"FEATURE_NINPUT_LEGACYMODE", fileName, 0);
    SetBrowserFeatureControlKey(L"FEATURE_DISABLE_NAVIGATION_SOUNDS", fileName, 1);
    SetBrowserFeatureControlKey(L"FEATURE_SCRIPTURL_MITIGATION", fileName, 1);
    SetBrowserFeatureControlKey(L"FEATURE_SPELLCHECKING", fileName, 0);
    SetBrowserFeatureControlKey(L"FEATURE_STATUS_BAR_THROTTLING", fileName, 1);
    SetBrowserFeatureControlKey(L"FEATURE_VALIDATE_NAVIGATE_URL", fileName, 1);
    SetBrowserFeatureControlKey(L"FEATURE_WEBOC_DOCUMENT_ZOOM", fileName, 1); // allow zoom.
    SetBrowserFeatureControlKey(L"FEATURE_WEBOC_POPUPMANAGEMENT", fileName, 0); // disallow auto-popups
    SetBrowserFeatureControlKey(L"FEATURE_ADDON_MANAGEMENT", fileName, 0); // disallow auto-addons/plugins
    SetBrowserFeatureControlKey(L"FEATURE_WEBSOCKET", fileName, 1);
    SetBrowserFeatureControlKey(L"FEATURE_WINDOW_RESTRICTIONS", fileName, 0); // disallow popups
    SetBrowserFeatureControlKey(L"FEATURE_SECURITYBAND", fileName, 0); // disallow security band (still retains security)
    SetBrowserFeatureControlKey(L"FEATURE_LOCALMACHINE_LOCKDOWN", fileName, 1); // allow file's to integrate with IWebBrowser JS execute.
    SetBrowserFeatureControlKey(L"FEATURE_BLOCK_LMZ_SCRIPT", fileName, 0); // disable activeX security band warnings on local scripts.
    SetBrowserFeatureControlKey(L"FEATURE_BLOCK_LMZ_OBJECT", fileName, 0); // disable activeX security.
    SetBrowserFeatureControlKey(L"FEATURE_RESTRICT_ACTIVEXINSTALL", fileName, 0);
    SetBrowserFeatureControlKey(L"FEATURE_PROTOCOL_LOCKDOWN", fileName, 0);
    SetBrowserFeatureControlKey(L"FEATURE_ZONE_ELEVATION", fileName, 0);
    SetBrowserFeatureControlKey(L"FEATURE_SCRIPTURL_MITIGATION", fileName, 0);
  }
}


/**
 ** Begin CLR Bridge Code
 **/
#ifdef GC_DEBUG
 static int CppClassCount = 0;
#endif
void gchandle_cleanup(char *data, void *hint) {
#ifdef GC_DEBUG
  CppClassCount--;
#endif
  GCHandle handle = GCHandle::FromIntPtr(IntPtr(data));
  handle.Free();
}

// This does not seem to be executed but is the call back for when we have .NET objects,
// when have properties that are pointers, that those pointers are passed back to JS (for example)
// WPF Window .NET CLR object has a property called HWND which is the native win32
// void * pointer to the HWND. We need to both recollect HWND, the WPF Window object (handled
// by CppClass), and the V8 reference to all of it (handled by V8.), we'll hope that the 
// pointer property was not allocated but is a persistant memory need and leave it up to 
// .NET to determine if it needs to be collected.  In otherwords, do nothing.
void wrap_cb(char *data, void *hint) { }


System::String^ stringV82CLR(Handle<v8::String> text)
{
    HandleScope scope;
    v8::String::Utf8Value utf8text(text);
    if (*utf8text)
        return gcnew System::String(*utf8text, 0, utf8text.length(), System::Text::Encoding::UTF8);
    else
        return System::String::Empty;
}

Handle<v8::String> stringCLR2V8(System::String^ text)
{
    HandleScope scope;
    if (text->Length > 0)
    {
      const char* str = (const char*)(void*)Marshal::StringToHGlobalAnsi(text);
      v8::Handle<v8::String> v8str = v8::String::New(str);
      Marshal::FreeHGlobal(IntPtr((void *)str));
      return scope.Close(v8str);
    }
    else
      return scope.Close(v8::String::Empty());
}

System::String^ exceptionV82stringCLR(Handle<v8::Value> exception)
{
  HandleScope scope;
  if (exception->IsObject())
  {
    Handle<Value> stack = exception->ToObject()->Get(v8::String::NewSymbol("stack"));
    if (stack->IsString())
      return gcnew System::String(stringV82CLR(stack->ToString()));
  }
  return gcnew System::String(stringV82CLR(Handle<v8::String>::Cast(exception)));
}

Handle<Value> throwV8Exception(Handle<Value> exception)
{
  HandleScope scope;
  return scope.Close(ThrowException(exception));
}

Handle<v8::Value> MarshalCLRToV8(System::Object^ netdata)
{
  HandleScope scope;
  Handle<v8::Value> jsdata;

  if (netdata == nullptr)
      return scope.Close(Null());

  System::Type^ type = netdata->GetType();
  if (type == System::String::typeid)         jsdata = stringCLR2V8((System::String^)netdata);
  else if (type == System::Char::typeid)      jsdata = stringCLR2V8(((System::Char^)netdata)->ToString());
  else if (type == bool::typeid)              jsdata = v8::Boolean::New((bool)netdata);
  else if (type == System::Guid::typeid)      jsdata = stringCLR2V8(netdata->ToString());
  else if (type == System::DateTime::typeid)
  {
    System::DateTime ^dt = (System::DateTime^)netdata;
    if (dt->Kind == System::DateTimeKind::Local)
        dt = dt->ToUniversalTime();
    else if (dt->Kind == System::DateTimeKind::Unspecified)
        dt = gcnew System::DateTime(dt->Ticks, System::DateTimeKind::Utc);
    long long MinDateTimeTicks = 621355968000000000; // new DateTime(1970, 1, 1, 0, 0, 0).Ticks;
    long long value = ((dt->Ticks - MinDateTimeTicks) / 10000);
    jsdata = v8::Date::New((double)value);
  }
  else if (type == System::DateTimeOffset::typeid)  jsdata = stringCLR2V8(netdata->ToString());
  else if (type == int::typeid)                     jsdata = v8::Integer::New((int)netdata);
  else if (type == System::Int64::typeid)           jsdata = v8::Number::New(((System::IConvertible^)netdata)->ToDouble(nullptr));
  else if (type == double::typeid)                  jsdata = v8::Number::New((double)netdata);
  else if (type == float::typeid)                   jsdata = v8::Number::New((float)netdata);
  else if (type == cli::array<byte>::typeid)
  {
    cli::array<byte>^ buffer = (cli::array<byte>^)netdata;
    node::Buffer* slowBuffer = node::Buffer::New(buffer->Length);
    if (buffer->Length > 0)
    {
      pin_ptr<unsigned char> pinnedBuffer = &buffer[0];
      memcpy(node::Buffer::Data(slowBuffer), pinnedBuffer, buffer->Length);
    }
    Handle<v8::Value> args[] = { slowBuffer->handle_, v8::Integer::New(buffer->Length), v8::Integer::New(0) };
    jsdata = bufferConstructor->NewInstance(3, args);
    (v8::Handle<v8::Object>::Cast(jsdata))->Set(v8::String::NewSymbol("array"), v8::Boolean::New(true));
  } else {
#ifdef GC_DEBUG
  CppClassCount++;
#endif
    GCHandle handle = GCHandle::Alloc(netdata);
    void *ptr = GCHandle::ToIntPtr(handle).ToPointer();
    node::Buffer *buf = node::Buffer::New((char *)(ptr), sizeof(ptr), gchandle_cleanup, NULL);
    jsdata = buf->handle_;
    if(type == System::IntPtr::typeid) {
      void *rawptr = ((System::IntPtr ^)netdata)->ToPointer();
      node::Buffer *bufptr = node::Buffer::New((char *)rawptr, sizeof(rawptr), wrap_cb, NULL);
      (v8::Handle<v8::Object>::Cast(jsdata))->Set(v8::String::NewSymbol("rawpointer"), bufptr->handle_);
    }
  }
  return scope.Close(jsdata);
}

Handle<v8::Object> MarshalCLRObjectToV8(System::Object^ netdata)
{
    HandleScope scope;
    Handle<v8::Object> result = v8::Object::New();
    System::Type^ type = netdata->GetType();

    // Avoid stack overflow due to self-referencing reflection elements
    if (0 == System::String::Compare(type->FullName, "System.Reflection.RuntimeMethodInfo"))
        return scope.Close(result);

    for each (FieldInfo^ field in type->GetFields(BindingFlags::Public | BindingFlags::Instance))
        result->Set(stringCLR2V8(field->Name), MarshalCLRToV8(field->GetValue(netdata)));

    for each (PropertyInfo^ property in type->GetProperties(BindingFlags::GetProperty | BindingFlags::Public | BindingFlags::Instance))
    {
        MethodInfo^ getMethod = property->GetGetMethod();
        if (getMethod != nullptr && getMethod->GetParameters()->Length <= 0)
            result->Set(stringCLR2V8(property->Name), MarshalCLRToV8(getMethod->Invoke(netdata, nullptr)));
    }
    return scope.Close(result);
}

System::Object^ MarshalV8ToCLR(Handle<v8::Value> jsdata)
{
    HandleScope scope;
    if (jsdata->IsArray())
    {
      Handle<v8::Array> jsarray = Handle<v8::Array>::Cast(jsdata);
      cli::array<System::Object^>^ netarray = gcnew cli::array<System::Object^>(jsarray->Length());
      for (unsigned int i = 0; i < jsarray->Length(); i++)
          netarray[i] = MarshalV8ToCLR(jsarray->Get(i));
      return netarray;
    }
    else if (jsdata->IsDate())
    {
      Handle<v8::Date> jsdate = Handle<v8::Date>::Cast(jsdata);
      long long  ticks = (long long)jsdate->NumberValue();
      long long MinDateTimeTicks = 621355968000000000;// (new DateTime(1970, 1, 1, 0, 0, 0)).Ticks;
      System::DateTime ^netobject = gcnew System::DateTime(ticks * 10000 + MinDateTimeTicks, System::DateTimeKind::Utc);
      return netobject;
    }
    else if (jsdata->IsString())      return stringV82CLR(Handle<v8::String>::Cast(jsdata));
    else if (jsdata->IsBoolean())     return jsdata->BooleanValue();
    else if (jsdata->IsInt32())       return jsdata->Int32Value();
    else if (jsdata->IsUint32())      return jsdata->Uint32Value();
    else if (jsdata->IsNumber())      return jsdata->NumberValue();
    else if (jsdata->IsUndefined() || 
      jsdata->IsNull())               return nullptr;
    else if (node::Buffer::HasInstance(jsdata) && (v8::Handle<v8::Object>::Cast(jsdata))->Get(v8::String::NewSymbol("array"))->BooleanValue()) {
      Handle<v8::Object> jsbuffer = jsdata->ToObject();
      cli::array<byte>^ netbuffer = gcnew cli::array<byte>((int)node::Buffer::Length(jsbuffer));
      if (netbuffer->Length > 0) 
      {
        pin_ptr<byte> pinnedNetbuffer = &netbuffer[0];
        memcpy(pinnedNetbuffer, node::Buffer::Data(jsbuffer), netbuffer->Length);
      }
      return netbuffer;
    }
    else if (node::Buffer::HasInstance(jsdata)) 
    {
      void *data = (void *)node::Buffer::Data(jsdata.As<v8::Object>());
      GCHandle handle = GCHandle::FromIntPtr(IntPtr(data));
      return handle.Target;
    }
    else if (jsdata->IsObject()) 
    {
      System::Collections::Generic::IDictionary<System::String^,System::Object^>^ netobject = gcnew System::Dynamic::ExpandoObject();
      Handle<v8::Object> jsobject = Handle<v8::Object>::Cast(jsdata);
      Handle<v8::Array> propertyNames = jsobject->GetPropertyNames();
      for (unsigned int i = 0; i < propertyNames->Length(); i++)
      {
          Handle<v8::String> name = Handle<v8::String>::Cast(propertyNames->Get(i));
          v8::String::Utf8Value utf8name(name);
          System::String^ netname = gcnew System::String(*utf8name);
          System::Object^ netvalue = MarshalV8ToCLR(jsobject->Get(name));
          netobject->Add(netname, netvalue);
      }
      return netobject;
    }
    else
      throw gcnew System::Exception("Unable to convert V8 value to CLR value.");
}

Handle<v8::Value> MarshalCLRExceptionToV8(System::Exception^ exception)
{
  HandleScope scope;
  Handle<v8::Object> result;
  Handle<v8::String> message;
  Handle<v8::String> name;

  if (exception == nullptr)
  {
    result = v8::Object::New();
    message = v8::String::New("Unrecognized exception thrown by CLR.");
    name = v8::String::New("InternalException");
  }
  else
  {
    // Remove AggregateException wrapper from around singleton InnerExceptions
    if (System::AggregateException::typeid->IsAssignableFrom(exception->GetType()))
    {
        System::AggregateException^ aggregate = (System::AggregateException^)exception;
        if (aggregate->InnerExceptions->Count == 1)
            exception = aggregate->InnerExceptions[0];
    }
    else if (System::Reflection::TargetInvocationException::typeid->IsAssignableFrom(exception->GetType())
        && exception->InnerException != nullptr)
    {
        exception = exception->InnerException;
    }

    result = MarshalCLRObjectToV8(exception);
    message = stringCLR2V8(exception->GetType()->FullName + " " + exception->Message + "\n" + exception->StackTrace);
    name = stringCLR2V8(exception->GetType()->FullName);
  }   
      
  // Construct an error that is just used for the prototype - not verify efficient
  // but 'typeof Error' should work in JavaScript
  result->SetPrototype(v8::Exception::Error( message));
  result->Set(v8::String::NewSymbol("message"), message);
  
  // Recording the actual type - 'name' seems to be the common used property
  result->Set(v8::String::NewSymbol("name"), name);

  return scope.Close(result);
}

static int countFound = 0;

public ref class CLREventHandler {
public:
  
  CLREventHandler() : callback(NULL) {
    // line below causes a seg fault.
    cppobject = new gcroot<CLREventHandler ^>(this);
    countFound = countFound + 12;
    id = (gcnew System::Random())->Next(countFound);
  }
  ~CLREventHandler() {
    Delete();
    delete cppobject;
  }
  void SetCallback(v8::Persistent<v8::Function> cb) {
    callback = new wrapv8obj();
    callback->function = cb;
  }
  void *GetReference() {
    return cppobject;
  }
  void PassThru(... cli::array<System::Object^>^ args) {
    v8::HandleScope scope;
    std::vector<v8::Handle<v8::Value>> argv;
    v8::TryCatch try_catch;

    for(int i=0; i < args->Length; i++) 
      argv.push_back(MarshalCLRToV8(args[i]));

    if (this->callback == NULL || this->callback->function.IsEmpty()) {
      ThrowException(v8::Exception::Error(v8::String::New("CLR fatal: Callback has been garbage collected.")));
      exit(1);
    } else {
      // invoke the registered callback function
      this->callback->function->Call(v8::Context::GetCurrent()->Global(), args->Length, argv.data());
    }
    if (try_catch.HasCaught())
      try_catch.ReThrow();
  }

  void Delete() {
    if(callback) {
      callback->function.Dispose();
      callback->function.Clear();
      delete callback;
      callback = NULL;
      delete this;
    }
  }

  void EventHandler(System::Object^ sender, System::EventArgs^ e) {
    v8::HandleScope scope;
    v8::Handle<v8::Value> argv[2];

    argv[0] = MarshalCLRToV8(sender);
    argv[1] = MarshalCLRToV8(e);

    v8::TryCatch try_catch;

    if (this->callback == NULL || this->callback->function.IsEmpty()) {
      throw gcnew System::Exception("CLR Fatal: Callback has been garbage collected.");
      exit(1);
    } else {
      // invoke the registered callback function
      this->callback->function->Call(v8::Context::GetCurrent()->Global(), 2, argv);
    }
    if (try_catch.HasCaught()) {
      throw gcnew System::Exception(exceptionV82stringCLR(try_catch.Exception()));
      exit(1);
    }
  }
  int Name() {
    return id;
  }
private:
  wrapv8obj *callback;
  gcroot<CLREventHandler ^> * cppobject;
  int id;
};

void CLREventHandleCleanupJS(Persistent<Value> object, void *parameter) {
  CLREventHandler ^n = *((gcroot<CLREventHandler ^> *)parameter);
  n->Delete();
}

class CLR {
  CLR() { }

public:

#ifdef GC_DEBUG
  static Handle<v8::Value> GetCppClassCount(const v8::Arguments& args) {
    HandleScope scope;
    return scope.Close(v8::Number::New(CppClassCount));
  }
#endif

  static Handle<v8::Value> GetReferencedAssemblies(const v8::Arguments& args) {
    HandleScope scope;
    try {
      array<System::Reflection::AssemblyName^>^ assemblies = System::Reflection::Assembly::GetExecutingAssembly()->GetReferencedAssemblies();
      return scope.Close(MarshalCLRToV8(assemblies));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> GetLoadedAssemblies(const v8::Arguments& args) {
    HandleScope scope;
    try {
      array<System::Reflection::Assembly^>^ assemblies = System::AppDomain::CurrentDomain->GetAssemblies();
      return scope.Close(MarshalCLRToV8(assemblies));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> LoadAssemblyFromMemory(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::String^ assemblyName = stringV82CLR(args[0]->ToString());
      System::Reflection::Assembly^ assembly = System::Reflection::Assembly::Load(assemblyName);
      return scope.Close(MarshalCLRToV8(assembly->GetTypes()));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  /** Load an Execution of DOTNET CLR **/
  static Handle<v8::Value> LoadAssembly(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::String^ userpath = stringV82CLR(args[0]->ToString());

      System::String^ framworkRegPath = "Software\\Microsoft\\.NetFramework";
      Microsoft::Win32::RegistryKey^ netFramework = Microsoft::Win32::Registry::LocalMachine;
      netFramework = netFramework->OpenSubKey(framworkRegPath, false);
      System::String^ installRoot = netFramework->GetValue("InstallRoot")->ToString();
      System::String^ version = System::String::Format("v{0}.{1}.{2}\\",
        System::Environment::Version->Major, 
        System::Environment::Version->Minor,
        System::Environment::Version->Build); 
      System::String^ netPath = System::IO::Path::Combine(installRoot, version);

      System::Reflection::Assembly^ assembly;
      if(System::IO::File::Exists(netPath + userpath))
        assembly = System::Reflection::Assembly::LoadFrom(netPath + userpath);
      else if (System::IO::File::Exists(userpath))
        assembly = System::Reflection::Assembly::LoadFrom(userpath);
      else
        assembly = System::Reflection::Assembly::Load(userpath);

      return scope.Close(MarshalCLRToV8(assembly->GetTypes()));

    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> GetCLRType(const v8::Arguments& args) {
    HandleScope scope;
    System::Object^ target = MarshalV8ToCLR(args[0]);
    return scope.Close(MarshalCLRToV8(target->GetType()));
  }

  static Handle<v8::Value> GetStaticMemberTypes(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Type^ type = (System::Type^)(target);
      System::Object^ rtn = type->GetMembers(BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::Static | 
        BindingFlags::FlattenHierarchy);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e))); 
    }
  }

  static Handle<v8::Value> GetMemberTypes(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Type^ type = (System::Type^)(target);
      System::Object^ rtn = type->GetMembers(BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::Instance | 
        BindingFlags::FlattenHierarchy);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e))); 
    }
  }

  static Handle<v8::Value> ExecNew(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);

      int argSize = args.Length() - 1;
      array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

      for(int i=0; i < argSize; i++)
        cshargs->SetValue(MarshalV8ToCLR(args[i + 1]),i);

      System::Type^ type = (System::Type^)(target);
      System::Object^ rtn = System::Activator::CreateInstance(type, cshargs);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecSetField(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Object^ value = MarshalV8ToCLR(args[3]);
      System::String^ field = stringV82CLR(args[2]->ToString());

      System::Type^ baseType = target->GetType();
      if(baseType != System::Type::typeid && target == System::Type::typeid)
        baseType = (System::Type ^)target;

      baseType->GetField(field,
        BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy)->SetValue(target, value);
      return scope.Close(Undefined());
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetStaticField(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Type^ target = (System::Type^)MarshalV8ToCLR(args[0]);
      System::String^ field = stringV82CLR(args[1]->ToString());

      //System::Type^ baseType = target->GetType();
      //if(baseType != System::Type::typeid && target == System::Type::typeid)
      //  baseType = (System::Type ^)target;

      System::Reflection::FieldInfo ^fieldinfo = target->GetField(field, 
         BindingFlags::Static | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy);

      System::Object^ rtn = fieldinfo->GetValue(nullptr);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetField(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::String^ field = stringV82CLR(args[1]->ToString());
      System::Type^ baseType = target->GetType();
      if(baseType != System::Type::typeid && target == System::Type::typeid)
        baseType = (System::Type ^)target;

      System::Reflection::FieldInfo ^fieldinfo = baseType->GetField(field, 
         BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy);

      System::Object^ rtn = fieldinfo->GetValue(target);

      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetStaticMethodObject(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Type^ target = (System::Type^)MarshalV8ToCLR(args[0]);
      System::String^ method = stringV82CLR(args[1]->ToString());
      int argSize = args.Length() - 2;
      array<System::Type^>^ cshargs = gcnew array<System::Type^>(argSize);

      for(int i=0; i < argSize; i++)
        cshargs->SetValue(MarshalV8ToCLR(args[i + 2])->GetType(),i);

      MethodInfo^ rtn = target->GetMethod(method, 
        BindingFlags::Static | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy,
        nullptr, cshargs, nullptr);

      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetMethodObject(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Type^ target = (System::Type^)MarshalV8ToCLR(args[0]);
      System::String^ method = stringV82CLR(args[1]->ToString());

      int argSize = args.Length() - 2;
      array<System::Type^>^ cshargs = gcnew array<System::Type^>(argSize);

      for(int i=0; i < argSize; i++) {
        System::Object^ obj = MarshalV8ToCLR(args[i + 2]);
        if(obj != nullptr)
          cshargs->SetValue(obj->GetType(),i);
        else {
          // null was passed in, since we cannot use this to properly get the method overload
          // be reflected types we'll try jut a name match.
          MethodInfo^ rtnl = target->GetMethod(method,BindingFlags::Instance | BindingFlags::Public | BindingFlags::DeclaredOnly);
          if(rtnl == nullptr)
            return scope.Close(throwV8Exception(MarshalCLRToV8("Method could not be found: "+method)));
          else
            return scope.Close(MarshalCLRToV8(rtnl));
        }
      }

      MethodInfo^ rtn = target->GetMethod(method, 
        BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy,
        nullptr,
        cshargs,
        nullptr);

      return scope.Close(MarshalCLRToV8(rtn));
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetStaticPropertyObject(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Type^ target = (System::Type^)MarshalV8ToCLR(args[0]);
      System::String^ property = stringV82CLR(args[1]->ToString());
      PropertyInfo^ rtn = target->GetProperty(property,  
        BindingFlags::Static | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetPropertyObject(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::String^ property = stringV82CLR(args[1]->ToString());
      try {
        PropertyInfo^ rtn = target->GetType()->GetProperty(property, 
          BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy);
        return scope.Close(MarshalCLRToV8(rtn));
      } catch (AmbiguousMatchException^ e) {
        PropertyInfo^ rtn = target->GetType()->GetProperty(property,
          BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy | BindingFlags::DeclaredOnly);
        return scope.Close(MarshalCLRToV8(rtn));
      }
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  // deprecated.
  static Handle<v8::Value> ExecMethodObject(const v8::Arguments& args) {
    HandleScope scope;
    try {
      MethodInfo^ method = (MethodInfo^)MarshalV8ToCLR(args[0]);
      System::Object^ target = MarshalV8ToCLR(args[1]);
      int argSize = args.Length() - 2;
      array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

      for(int i=0; i < argSize; i++)
        cshargs->SetValue(MarshalV8ToCLR(args[i + 2]),i);

      System::Object^ rtn = method->Invoke(target, cshargs);

      return scope.Close(MarshalCLRToV8(rtn));
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecPropertyGet(const v8::Arguments &args) {
    HandleScope scope;
    try {
      PropertyInfo^ prop = (PropertyInfo^)MarshalV8ToCLR(args[0]);
      return scope.Close(MarshalCLRToV8(prop->GetValue(MarshalV8ToCLR(args[1]))));
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecPropertySet(const v8::Arguments &args) {
    HandleScope scope;
    try {
      PropertyInfo^ prop = (PropertyInfo^)MarshalV8ToCLR(args[0]);
      prop->SetValue(MarshalV8ToCLR(args[1]), MarshalV8ToCLR(args[2]));
      return scope.Close(Undefined());
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecSetProperty(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::Object^ value = MarshalV8ToCLR(args[2]);
      System::String^ field = stringV82CLR(args[1]->ToString());
      target->GetType()->GetProperty(field)->SetValue(target, value);
      return scope.Close(Undefined());
    } catch(System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetStaticProperty(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Type^ target = (System::Type^)MarshalV8ToCLR(args[0]);
      System::String^ property = stringV82CLR(args[1]->ToString());
      System::Object^ rtn = target->GetProperty(property,
        BindingFlags::Static | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy)->GetValue(nullptr);
      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecGetProperty(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::String^ property = stringV82CLR(args[1]->ToString());
      try {
        System::Object^ rtn = target->GetType()->GetProperty(property,
          BindingFlags::Instance | BindingFlags::Public | BindingFlags::FlattenHierarchy)->GetValue(target);
        return scope.Close(MarshalCLRToV8(rtn));
      } catch (AmbiguousMatchException^ e) {
        System::Object^ rtn = target->GetType()->GetProperty(property,
          BindingFlags::Instance | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::FlattenHierarchy | BindingFlags::DeclaredOnly)->GetValue(target);
        return scope.Close(MarshalCLRToV8(rtn));
      }
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecStaticMethod(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      int argSize = args.Length() - 2;
      array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

      for(int i=0; i < argSize; i++)
        cshargs->SetValue(MarshalV8ToCLR(args[i + 2]),i);

      System::Type^ type = (System::Type ^)target;
      System::String^ method = stringV82CLR(args[1]->ToString());
      System::Object^ rtn = type->InvokeMember(method,
        BindingFlags::Static | BindingFlags::Public | BindingFlags::NonPublic | BindingFlags::InvokeMethod,
        nullptr,
        target,
        cshargs);

      return scope.Close(MarshalCLRToV8(rtn));
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecMethod(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      int argSize = args.Length() - 2;
      array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

      for(int i=0; i < argSize; i++)
        cshargs->SetValue(MarshalV8ToCLR(args[i + 2]),i);

      System::Type^ type = target->GetType();
      System::String^ method = stringV82CLR(args[1]->ToString());
      System::Object^ rtn = type->InvokeMember(method,
        BindingFlags::Public | BindingFlags::Instance | BindingFlags::NonPublic | BindingFlags::InvokeMethod,
        nullptr,
        target,
        cshargs);

      return scope.Close(MarshalCLRToV8(rtn));
    } 
    catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static Handle<v8::Value> ExecMethodObjectAsync(const v8::Arguments& args) {
    HandleScope scope;
    try {
      MethodInfo^ method = (MethodInfo^)MarshalV8ToCLR(args[0]);
      System::Object^ target = MarshalV8ToCLR(args[1]);
      int argSize = args.Length() - 2;
      array<System::Object^>^ cshargs = gcnew array<System::Object^>(argSize);

      for(int i=0; i < argSize; i++)
        cshargs->SetValue(MarshalV8ToCLR(args[i + 2]),i);

      TintInterop::AsyncEventDelegate^ del = gcnew TintInterop::AsyncEventDelegate(target,method,cshargs);
      System::ComponentModel::BackgroundWorker^ worker = gcnew System::ComponentModel::BackgroundWorker();
      worker->DoWork += gcnew System::ComponentModel::DoWorkEventHandler(del, &(TintInterop::AsyncEventDelegate::DoWorkHandler));
      worker->RunWorkerAsync();
      return scope.Close(Undefined());
    } 
    catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

  static void CLR::HandleMessageLoop(System::Windows::Interop::MSG% msg, bool% handled) {
    if(msg.message == WM_APP+1)
      uv_run_nowait();
  }

  static Handle<v8::Value> ExecAddEvent(const v8::Arguments& args) {
    HandleScope scope;
    try {
      System::Object^ target = MarshalV8ToCLR(args[0]);
      System::String^ event = stringV82CLR(args[1]->ToString());
      System::Reflection::EventInfo^ eInfo = target->GetType()->GetEvent(event);
      v8::Local<v8::Function> callback = v8::Local<v8::Function>::Cast(args[2]);
      CLREventHandler ^handle = gcnew CLREventHandler();
      Persistent<Function> js_callback = Persistent<Function>::New(callback);
      handle->SetCallback(js_callback);
      js_callback.MakeWeak(handle->GetReference(), CLREventHandleCleanupJS);
      System::Reflection::MethodInfo^ eh = handle->GetType()->GetMethod("EventHandler");
      System::Delegate^ d = System::Delegate::CreateDelegate(eInfo->EventHandlerType, handle, eh);
      eInfo->AddEventHandler(target, d);

      return scope.Close(Undefined());
    } catch (System::Exception^ e) {
      return scope.Close(throwV8Exception(MarshalCLRExceptionToV8(e)));
    }
  }

};


extern "C" void CLR_Init(Handle<v8::Object> target) {
  // Fix registry and "FEATURE" controls, these help align IE with a normal behavior
  // expected (on a per app registry setting basis).  This does not set global registry
  // values for anything outside of our application.
  IEWebBrowserFix::SetBrowserFeatureControl();

  bufferConstructor = Persistent<Function>::New(Handle<Function>::Cast(
      Context::GetCurrent()->Global()->Get(v8::String::New("Buffer"))));

  // OLD, non-optimized execution methods.
  NODE_SET_METHOD(target, "execNew", CLR::ExecNew);
  NODE_SET_METHOD(target, "execAddEvent", CLR::ExecAddEvent);
  NODE_SET_METHOD(target, "execMethod", CLR::ExecMethod);
  NODE_SET_METHOD(target, "execStaticMethod", CLR::ExecStaticMethod);
  NODE_SET_METHOD(target, "execSetField", CLR::ExecSetField);
  NODE_SET_METHOD(target, "execGetField", CLR::ExecGetField);
  NODE_SET_METHOD(target, "execGetStaticField", CLR::ExecGetStaticField);
  NODE_SET_METHOD(target, "execSetProperty", CLR::ExecSetProperty);
  NODE_SET_METHOD(target, "execGetProperty", CLR::ExecGetProperty);
  NODE_SET_METHOD(target, "execGetStaticProperty", CLR::ExecGetStaticProperty);

  // get programmatic information
  NODE_SET_METHOD(target, "getReferencedAssemblies", CLR::GetReferencedAssemblies);
  NODE_SET_METHOD(target, "getLoadedAssemblies", CLR::GetLoadedAssemblies);
  NODE_SET_METHOD(target, "loadAssemblyFromMemory", CLR::LoadAssemblyFromMemory);
  NODE_SET_METHOD(target, "loadAssembly", CLR::LoadAssembly);
  NODE_SET_METHOD(target, "getMemberTypes", CLR::GetMemberTypes);
  NODE_SET_METHOD(target, "getStaticMemberTypes", CLR::GetStaticMemberTypes);
  NODE_SET_METHOD(target, "getCLRType", CLR::GetCLRType);

  // 2nd gen optimized execution
  NODE_SET_METHOD(target, "getStaticPropertyObject", CLR::ExecGetStaticPropertyObject);
  NODE_SET_METHOD(target, "getPropertyObject", CLR::ExecGetPropertyObject);
  NODE_SET_METHOD(target, "getMethodObject", CLR::ExecGetMethodObject);
  NODE_SET_METHOD(target, "getStaticMethodObject", CLR::ExecGetStaticMethodObject);
  NODE_SET_METHOD(target, "getProperty", CLR::ExecPropertyGet);
  NODE_SET_METHOD(target, "setProperty", CLR::ExecPropertySet);
  NODE_SET_METHOD(target, "callMethod", CLR::ExecMethodObject);
  NODE_SET_METHOD(target, "callMethodAsync", CLR::ExecMethodObjectAsync);

  NODE_SET_METHOD(target, "createScriptInterface", IEWebBrowserFix::CreateScriptInterface);
  
#ifdef GC_DEBUG
  NODE_SET_METHOD(target, "getCppClassCount", CLR::GetCppClassCount);
#endif

  // Register the thread handle to communicate back to handle application
  // specific events when in WPF mode.
  System::Windows::Interop::ComponentDispatcher::ThreadFilterMessage += 
      gcnew System::Windows::Interop::ThreadMessageEventHandler(CLR::HandleMessageLoop);
}

