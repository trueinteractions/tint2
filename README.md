<h1>Tint</h1>

Create Desktop Javascript Applications.

https://www.trueinteractions.com/tint2/docs/

This documentation is for contributors to Tint.  

<h2>Getting Started</h2>

* Download: https://github.com/trueinteractions/tint2/releases/
* Documentation/Tutorials: https://www.trueinteractions.com/tint2/docs/
* Questions: https://groups.google.com/forum/#!categories/trueinteractions
* Commercial Support https://www.trueinteractions.com

<h2>Status</h2>

           | OSX        | Windows    | Linux      | iOS        | Android    
---------- | ---------- | ---------- | ---------- | ---------- | ----------
Build | [![Build Status](https://travis-ci.org/trueinteractions/tint2.svg?branch=master)](https://travis-ci.org/trueinteractions/tint2) | [![Build status](https://ci.appveyor.com/api/projects/status/8drwkx2kohd1wkdd/branch/master)](https://ci.appveyor.com/project/trevorlinton/tint2/branch/master) | N/A | Yes | N/A
Unit Tests | [![Build Status](https://travis-ci.org/trueinteractions/tint2.svg?branch=master)](https://travis-ci.org/trueinteractions/tint2) | [![Build status](https://ci.appveyor.com/api/projects/status/8drwkx2kohd1wkdd/branch/master)](https://ci.appveyor.com/project/trevorlinton/tint2/branch/master) | N/A | No (48% Pass) | N/A

Code Quality? [![Codacy Badge](https://www.codacy.com/project/badge/6ea8c1d425af42cf9211a3ddf7a42240)](https://www.codacy.com/public/trevorlintongithub/tint2)

<h2>Compiling Tint</h2>

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

