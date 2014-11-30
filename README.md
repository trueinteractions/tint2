<h1>Tint</h1>

Create Desktop Javascript Applications.

With Tint your options are no longer bound to browsers or emulators, use our SDK to build cross-compatible applications or directly interface with Objective-C frameworks or Windows DLL's to create OS-specific functionality.

```javascript
require('Application');
Window = require('Window');

var mainWindow = new Window();
mainWindow.visible = true;
mainWindow.title = "I'm a native window built in node.";
```

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

<h2>Get Started</h2>

* Download the release candidate: https://github.com/trueinteractions/tint2/releases/ or at https://www.trueinteractions.com/tint-2.0-rc2.zip
* Browse initial (unstable) API documentation: https://www.trueinteractions.com/tint2/docs/
* Ask questions, get help, and search for answers: https://groups.google.com/forum/#!categories/trueinteractions
* Need commercial support? https://www.trueinteractions.com

<h2>Why is Tint different?</h2>
There are many alternatives to creating javascript based applications, phonegap, tidekit, tidesdk, cordova based sets, node-webkit, appjs and a few others. Tint isn't a hybrid approach, it doesn't mask javascript as a native API.  Tint uses language bridges to natively represent (and allow you to use) real C++, C# and Objective-C objects directly in javascript safely.  

With Tint you have options, you can use the SDK to create native applications or use Tint's language bridge to directly interface with Objective-C/C#/C++ or C directly in javascript. 

If you don't want to learn (or deal with) native OS languages, you're in luck, there's a wide variety of cross-compatible widgets for javascript to choose from.

<h2>Using .NET CLR & Objective-C in Tint</h2>
See the wiki's language bridge page for more information on using C++, C# and Objective-C directly in Tint. https://github.com/trueinteractions/tint2/wiki/Tint's-Language-Bridge

<h2>Status</h2>

           | OSX        | Windows    | Linux      | iOS        | Android    
---------- | ---------- | ---------- | ---------- | ---------- | ----------
Build | [![Build Status](https://travis-ci.org/trueinteractions/tint2.svg?branch=master)](https://travis-ci.org/trueinteractions/tint2) | [![Build status](https://ci.appveyor.com/api/projects/status/8drwkx2kohd1wkdd/branch/master)](https://ci.appveyor.com/project/trevorlinton/tint2/branch/master) | N/A | N/A | N/A
Unit Tests | [![Build Status](https://travis-ci.org/trueinteractions/tint2.svg?branch=master)](https://travis-ci.org/trueinteractions/tint2) | [![Build status](https://ci.appveyor.com/api/projects/status/8drwkx2kohd1wkdd/branch/master)](https://ci.appveyor.com/project/trevorlinton/tint2/branch/master) | N/A | N/A | N/A

*This is intended as a preview release for Tint 2, currently only supported on OSX and Windows.*

Preview releases for Linux (QT), iOS, and Android are in tests at the moment.

<h2>Building Tint from Source</h2>

<h3>MacOS X</h3>
Ensure you have Xcode, OSX Mountain Lion, git and Python 2.6 (or 2.7).

```bash
mkdir tint
cd tint
git clone https://github.com/trueinteractions/tint2.git .
./config.sh
./build.sh
./test.sh
```
<h3>Windows</h3>
Ensure you have Visual Studio 2010 SP1 and WinSDK 7.0 (note problems occur with different WinSDK's and Visual Studio Systems), Windows 7, git and Python 2.6 (or 2.7).  Building does not require (nor support) cygwin or other shell systems.

64-bit build (default)

```bash
mkdir tint
cd tint
git clone https://github.com/trueinteractions/tint2.git .
config.bat
build.bat
test.bat
```

32-bit build

```bash
mkdir tint
cd tint
git clone https://github.com/trueinteractions/tint2.git .
config.bat x86
build.bat release x86
test.bat
```

<h3>Post-Build</h3>
After building you'll find the binary in ``build/xcode/Release/tint`` or ``build\msvs\Release\tint.exe``. You can also use the Xcode project files or MSVS 2010 files in ``build\xcode`` and ``build\msvs``. Optionally you can use ninja build files that are generated in ``build/ninja/out/Release`` and ``build/ninja/out/Debug`` on posix (OSX only at the moment).

<h3>Troubleshooting Builds</h3>
If you have issues compiling ensure you're using Python 2.7 or 2.6 (``./config.sh`` (``config.bat`` on Windows) will print out the python version it plans to use).  In addition ensure your CC environment variable is set to Xcode's built in clang and not an alternate GCC version.  Use ``echo $PYTHON`` (``echo %PYTHON%`` on Windows) and ``echo $CC`` (``echo %CC%`` on Windows) to check to see if any of these are set to alternate versions.

On OSX some third-party utility systems such as brew may overwrite these to values that are not compatible with OSX Xcode/clang builds.  If you're still having issues you can build using the Xcode project files in ``./build/xcode/`` directory.

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

