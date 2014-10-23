<h1>Tint</h1>

Create Desktop Javascript Applications.

With Tint your options are no longer bound to browsers or emulators, use our SDK to build cross-compatible applications or directly interface with Objective-C frameworks or Windows DLL's to create OS-specific functionality.

```javascript
require('Application');
Window = require('Window');

var mainWindow = new Window();
mainWindow.title = "I'm a native window built in node.";
```


<h2>Create real applications with Javascript</h2>


Run an application from a script

```bash
$ tint some.js
```

Prototype functionality quickly in interactive mode

```bash
$ tint
```

Or create a standalone Windows or OSX executable

```bash
$ tntbuild somedir/package.json
```

<h2>Why is Tint different?</h2>
There are many alternatives to creating javascript based applications, phonegap, tidekit, tidesdk, cordova based sets, node-webkit, appjs and a few others. Tint isn't a hybrid approach, it doesn't mask javascript as a native API.  Tint uses language bridges to natively represent (and allow you to use) real C++, C# and Objective-C objects directly in javascript safely.  

With Tint you have options, you can use the SDK to create native applications or use Tint's language bridge to directly interface with Objective-C/C#/C++ or C directly in javascript. 

If you don't want to learn (or deal with) native OS languages, you're in luck, there's a wide variety of cross-compatible widgets for javascript to choose from.

<h2>Help & Questions</h2>
Community, development and other questions can be discussed at https://groups.google.com/forum/#!categories/trueinteractions

In addition we offer commercial support at https://www.trueinteractions.com

<h2>Using .NET CLR & Objective-C in Tint</h2>
See the wiki's language bridge page for more information on using C++, C# and Objective-C directly in Tint. https://github.com/trueinteractions/tint2/wiki/Tint's-Language-Bridge

<h2>Status</h2>

           | OSX        | Windows    | Linux      | iOS        | Android    
---------- | ---------- | ---------- | ---------- | ---------- | ----------
Build | [![Build Status](https://travis-ci.org/trueinteractions/tint2.svg?branch=master)](https://travis-ci.org/trueinteractions/tint2) | [![Build status](https://ci.appveyor.com/api/projects/status/8drwkx2kohd1wkdd/branch/master)](https://ci.appveyor.com/project/trevorlinton/tint2/branch/master) | N/A | N/A | N/A
Unit Tests | [![Build Status](https://travis-ci.org/trueinteractions/tint2.svg?branch=master)](https://travis-ci.org/trueinteractions/tint2) | No, ~67% Pass | N/A | N/A | N/A

*This is intended as a preview release for Tint 2, currently only supported on OSX and Windows.*

Preview releases for Linux (QT), iOS, and Android are in tests at the moment.

<h2>Building Tint from Source</h2>

<h3>MacOS X (Unstable)</h3>
Ensure you have Xcode, OSX Mountain Lion, git and Python 2.6 (or 2.7).
```bash
mkdir tint
cd tint
git clone https://github.com/trueinteractions/tint2.git .
./config.sh
./build.sh
./test.sh
```
<h3>Windows (Experimental)</h3>
Ensure you have Visual Studio 2010 (or the free msbuild compiler and Windows SDK 7.0A+), Windows 7, git and Python 2.6 (or 2.7).  Building does not require (nor support) cygwin or other shell systems.
```bash
mkdir tint
cd tint
git clone https://github.com/trueinteractions/tint2.git .
config.bat
build.bat
test.bat
```

<h3>Post-Build</h3>
After building you'll find the binary in ``build/xcode/Release/tint`` or ``build\msvs\Release\tint.exe``. You can also use the Xcode project files or MSVS 2010 files in ``build\xcode`` and ``build\msvs``. Optionally you can use ninja build files that are generated in ``build/ninja/out/Release`` and ``build/ninja/out/Debug`` on posix (OSX only at the moment).

<h3>Troubleshooting Builds</h3>
If you have issues compiling ensure you're using Python 2.7 or 2.6 (``./config.sh`` (``config.bat`` on Windows) will print out the python version it plans to use).  In addition ensure your CC environment variable is set to Xcode's built in clang and not an alternate GCC version.  Use ``echo $PYTHON`` (``echo %PYTHON%`` on Windows) and ``echo $CC`` (``echo %CC%`` on Windows) to check to see if any of these are set to alternate versions.

On OSX some third-party utility systems such as brew may overwrite these to values that are not compatible with OSX Xcode/clang builds.  If you're still having issues you can build using the Xcode project files in ``./build/xcode/`` directory.


<h2>Current Built-In Modules</h2>

* Application
* Application Schema (app:// protocol for packaged apps)
* Box (Generic segmentation/border/well widget)
* Button (Normal, Toggle, Radio, Checkbox)
* Button Groups (Segmented Buttons)
* Color, Color Picker, ColorWell (ColorLabel)
* Container (Generic view)
* Date Well (Date View, Date Picker)
* Dialogs (Alerts, sheets, etc)
* DropDown
* FileDialog (Save/Open)
* Fonts, Font Managers and FontPanel
* Image Well (Image Views)
* Menu (and MenuItem)
* Notification
* Panels (Inspector and Utility)
* PopOver
* ProgressBar
* Screen Devices
* Scroll (Scroll views)
* SelectInput (Combo Boxes)
* SearchInput (look ahead while typing)
* Slider (range value)
* Split (Divider, Panes)
* Status Bars (System Tray's)
* Tables (Table View)
* TextInput
* Toolbar
* WebView (WebKit)
* Window
* process.bridge (Objective-C objects and execution bridge in OSX, .NET CLR C#/C++ objects and execution bridge in Windows)

<h2>Documentation</h2>
Currently documentation is fairly sparse, look at the individual modules for information on each component, in addition the test folder has examples (unit tests) for various components.  

<h2>Creating a Browser in Tint</h2>

```javascript
  // Include the widgets we'll need. Note you can 
  // individually include Application, TextInput, WebView etc.
  require('Common');

  // Create the widgets.
  var mainWindow = new Window();
  mainWindow.visible = true; // show the window
  var urlLocation = new TextInput();
  var webView = new WebView();
  var toolbar = new Toolbar();
  var backButton = new Button();
  var forwardButton = new Button();

  // Images can be a URL or a string representing a built in OS icon.
  backButton.image = 'back';
  forwardButton.image = 'forward';

  // Attach our webview to the window
  mainWindow.appendChild(webView);

  // everything else goes into the toolbar.
  toolbar.appendChild([backButton, forwardButton, 'space', urlLocation, 'space']);
  mainWindow.toolbar = toolbar;

  // Set some styling.
  mainWindow.titleVisible = false;
  mainWindow.preferences.animateOnSizeChange = true;
  mainWindow.preferences.animateOnPositionChange = true;

  urlLocation.alignment = 'center';
  urlLocation.linewrap = false;
  urlLocation.scrollable = true;

  // Attach some listeners to go back/forward and change the URL.
  backButton.addEventListener('click',function() { webView.back(); });
  forwardButton.addEventListener('click',function() { webView.forward(); });

  urlLocation.addEventListener('inputend', function() {
    var url = urlLocation.value;
    if(url.indexOf(':') == -1) url = "http://"+url;
    webView.location = url;
  });

  webView.addEventListener('load', function() { urlLocation.value = webView.location; });

  // Tell the webview to take up as much space in the parent as possible.
  webView.left = webView.right = webView.top = webView.bottom = 0;

  // Set the URL to somewhere.
  webView.location = 'https://www.google.com/';
```

<h2>FAQ</h2>
* **Why not as a node module, why a whole other executable?** node does not have bindings for application event loops, in addition resources (when an application is packaged) must be available prior to node spinning up, this required modifiying the front start up layer of node to perform these actions, outside of that the code base for node is the same.
* **What platforms does this aim to support?** For the moment OSX and Windows are nearing completion, OSX and Windows have preview releases that will be stable in October. Shortly after we'll have a QT Linux version. iOS and Android have several other issues/challenges that make it difficult to integrate, but our hope and target is to support all platforms.
* **How do you manage inconsistencies in interfaces?** Very carefully, unit tests for the GUI are essential to ensuring the same behavior for the same application across different operating systems and their OS versions.  If a complementary (or similar in functionality) native widget exists in one OS and not another, it's not included in the SDK (but that's not stopping you from creating it or using non-cross-compatible components). The Tint SDK aims at providing 100% reliable behavior across any OS.
* **Are there any major differences in desktop programming?** The application lifetime of an app vs. a website is very different, most websites actually have memory leaks, but users are very rarely there long enough to have it affect system performance considerably, this is not the case with desktop applications.  In addition sandboxed environments can introduce complexities for those not familiar with desktop security practices.
* **When will this be stable?** In short, October 2014. However prior to that we're encouraging people to download and use it for fun or to contribute, this is why there is no downloadable binary. The stable releases in October will support OSX and Windows.
* **Where can I find a binary download?** Since this isn't stable we're discouraging users who aren't familiar with development processes from using it, e.g., the only way to run it is to follow the build instructions above. Once stable in October we'll post binaries for OSX and Windows.


<h2>Credits</h2>

Tint relies on these amazing open source projects.  Check them out. 

* Node by Joyent+Contributors https://github.com/joyent/node/
* NodObjC https://github.com/TooTallNate/NodObjC/
* Node FFI & FFI Library (Google libffi/node-ffi ?)
* node-ref, node-buffer https://github.com/TooTallNate/
* Cassowary .NET Constraint Solver
* V8 by Google
* (Inspired content also from Edge.JS, although not used).

<h2>License</h2>
Tint is licensed under the MIT license.

For the latest updates/news http://www.twitter.com/trevorlinton

Commercial support available at http://www.trueinteractions.com/

Copyright &copy; 2014 True Interactions

