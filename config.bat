@ECHO OFF

if NOT exist .\libraries\node\node.gyp (
  git submodule init
  git submodule update
)

set arch=x64
if /i "%1"=="x86" set arch=ia32

call build.bat release nobuild nosign %arch%