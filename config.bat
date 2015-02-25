@echo off
git apply build/node.diff 2> nul

:CheckOS
IF EXIST "%PROGRAMFILES(X86)%" (GOTO 64BIT) ELSE (GOTO 32BIT)

:64BIT
set hostarch=x64
goto begin

:32BIT
set hostarch=x86
:begin

:: This must come before GetWindowsSdkDir as GetWindowsSdkDir tramples on 
:: the passed in arguments.
set arch=x64
if /i "%1"=="x86" set arch=ia32

set newpath=C:\Python27;C:\Python26;C:\Python
echo %path%|findstr /i /c:"python">nul  || set path=%path%;%newpath%

echo Architecture %arch% (host architecture %hostarch%)

if NOT exist .\libraries\node\node.gyp (
  git submodule init
  git submodule update
)

call build.bat config nobuild nosign %arch%
