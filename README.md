<h1>Tint</h1>

Compile native applications with Javascript, CSS and HTML5.

* OSX Preview: https://www.trueinteractions.com/preview/Tint2_OSX.zip

<h2>What is Tint?</h2>

Tint is a slightly modified version of NodeJS, it allows you to go beyond the shell command of node and turn javascript based node applications into fully functional desktop applications. It's also backwards compatible with node 0.10.

You can perform various things you'd never be able to do normally with node. For example:


```javascript
require('Application');
Window = require('Window');

var mainWindow = new Window();
mainWindow.title = "I'm a native window built in node.";
```

Tint contains a set of native components such as Window, Toolbar, Button, WebView, Text Inputs, Panels, Menus, etc. It also allows you to integrate with the OS on many levels and supports alerts and native notifications. 

<h2>Status</h2>
This is intended as a preview release for Tint 2, currently only supported on OSX.  Preview releases for Windows, iOS, and Android are in tests at the moment.

<h2>License</h2>
Tint is licensed under the MIT license.

<h2>Building</h2>

```bash
./config.sh
ninja -v -C build/out/Release/

# or you can use the Xcode project files.
```
