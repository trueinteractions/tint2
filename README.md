<h1>Tint</h1>

Compile native applications with Javascript, CSS, HTML5 and node.

<h2>What is Tint?</h2>

Tint is a slightly modified version of NodeJS, it allows you to go beyond the shell command of node and turns javascript based node applications into fully functional desktop applications. It's also backwards compatible with node 0.10.

You can perform various things you'd never be able to do normally with node. For example:


```javascript
require('Application');
Window = require('Window');

var mainWindow = new Window();
mainWindow.title = "I'm a native window built in node.";
```

Tint contains a set of native components such as Window, Toolbar, Button, WebView, Text Inputs, Panels, Menus, etc. It also allows you to integrate with the OS on many levels and supports alerts and native notifications. 

<h2>Why is Tint different?</h2>
There are many alternatives to creating javascript based applications, phonegap, tidekit, tidesdk, cordova based sets, node-webkit, appjs and a few others. Tint isn't a hybrid approach, it doesn't try to mask javascript as a native API.  Tint uses language bridges to natively represent real C++, C# and Objective-C objects directly in javascript safely.  This allows developers to create applications that integrate into the OS, but also allows developers to enhance its capabilities beyond what the Tint SDK allows. Make your own widgets, create your own OS integration methods, if you know C++, C, C# or Objective-C you have no limitations. 

If you're just interested in creating cross-platform apps with javascript? You're in luck, there's a wide variety of components and classes using just javascript to choose from.

You can even create custom components and views that are cross-platform compatible in javascript.

<h2>Status</h2>
This is intended as a preview release for Tint 2, currently only supported on OSX.  Preview releases for Windows, iOS, and Android are in tests at the moment.

<h2>License</h2>
Tint is licensed under the MIT license.

<h2>Building</h2>

You'll need OSX 10.7 or higher and Xcode in addition to the Xcode bin utils package.

```bash
mkdir tint
cd tint
git clone https://github.com/trueinteractions/tint2.git .
./config.sh
./build.sh
./runtests.sh
```

After building you'll find the binary in 'build/Release/tint'. You can also use the Xcode project files contained in the 'build' directory. Optionally you can use ninja build files that are generated in 'build/out/Release' and 'build/out/Debug'.

<h2>Running</h2>
You can run applications using:

```bash
> tint some.js
```

Or you can run it in interactive mode.

```bash
> tint
```

In addition applications can be packaged as normal apps using a shell package system (more instructions coming on this).

<h2>Current Built-In Modules</h2>

* Application
* Application Schema (app:// protocol for packaged apps)
* Button
* Dialogs (Alerts, sheets, etc)
* DropDown
* FileDialog (Save/Open)
* Menu (and MenuItem)
* Notification
* PopOver
* ProgressBar
* Screen Devices
* SelectInput (Combo Boxes)
* SearchInput (look ahead while typing)
* Status Bars (System Tray's)
* TextInput
* Toolbar
* WebView (WebKit)
* Window
* process.bridge (Objective-C objects and execution bridge in OSX, C# objects and execution bridge in Windows)

<h2>Documentation</h2>
Currently documentation is fairly sparse, look at the individual modules for information on each component, in addition the test folder has examples (unit tests) for various components.  

<h2>Node Compatibility</h2>
Tint is binary compatible with node 0.10.x (it can include native compiled C/C++ modules), in addition its command line compatible with node 0.10.x.
<h2>Creating a Browser in Tint</h2>

```javascript
  // Include the widgets we'll need.
  require('Application');
  global.Window = require('Window');
  global.WebView = require('WebView');
  global.Toolbar = require('Toolbar');
  global.Button = require('Button');
  global.TextInput = require('TextInput');

  // Create the widgets.
  var mainWindow = new Window();
  var urlLocation = new TextInput();
  var webView = new WebView();
  var toolbar = new Toolbar();
  var backButton = new Button();
  var forwardButton = new Button();

  // Images can be a URL or a string representing a built in OS icon.
  backButton.image = 'back';
  forwardButton.image = 'forward';

  // Attach our webview to the window, everything else goes into the toolbar.
  mainWindow.appendChild(webView);
  toolbar.appendChild(backButton);
  toolbar.appendChild(forwardButton);
  toolbar.appendChild('space');
  toolbar.appendChild(urlLocation);
  toolbar.appendChild('space');
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
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webView, firstAttribute:'top',
    secondItem:mainWindow, secondAttribute:'top',
    multiplier:1.0, constant:0.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webView, firstAttribute:'bottom',
    secondItem:mainWindow, secondAttribute:'bottom',
    multiplier:1.0, constant:0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webView, firstAttribute:'left',
    secondItem:mainWindow, secondAttribute:'left',
    multiplier:0.0, constant:0.0
  });
  mainWindow.addLayoutConstraint({
    priority:'required', relationship:'=',
    firstItem:webView, firstAttribute:'right',
    secondItem:mainWindow, secondAttribute:'right',
    multiplier:1.0, constant:0
  });
```

<h2>FAQ</h2>
* **Why not as a node module, why a whole other executable?** node does not have bindings for application event loops, in addition resources (when an application is packaged) must be available prior to node spinning up, this required modifiying the front start up layer of node to perform these actions, outside of that the code base for node is pretty much the same.
* **What platforms does this aim to support?** For the moment OSX and Windows are nearing completion, OSX is in preview release and the Windows preview is coming in October. Shortly after we'll have a QT Linux version. iOS and Android have several other issues/challenges that make it difficult to integrate, but our hope and target is to support all platforms.
* **How do you manage inconsistencies in interfaces?** Very carefully, unit tests for the GUI are essential to ensuring the same behavior for the same application across different operating systems and their OS versions.  If a complementary (or similar in functionality) native widget exists in one OS and not another, its not included as the SDK (but that's not stopping you from creating it or using non-cross-compatible components). The Tint SDK aims at providing 100% reliable behavior across any OS.
* **Are there any major differences in desktop programming?** Yes, layout can be tricky and is currently done using layout constraints in C#/Obj-C. Work is continuing on this front. You don't use CSS/HTML for layout, just javascript. The application lifetime is also very different, most websites actually have memory leaks, but users a very rarely there long enough to have it affect system performance considerably, this is not the case with desktop applications.  In addition sandboxed environments can introduce complexities for those not familiar with desktop security practices.
* **When will this be stable?** In short, October 2014. However prior to that we're encouraging people to download and use it for fun or to contribute, this is why there is no downloadable binary. The stable releases in October will support OSX and Windows.
* **Where can I find a binary download?** Since this isn't stable we're discouraging users who aren't familiar with development processes from using it, e.g., the only way to run it is to follow the build instructions above. Once stable in October we'll post binaries for OSX and Windows.
