@echo off

:: This must come before GetWindowsSdkDir as GetWindowsSdkDir tramples on 
:: the passed in arguments.
set arch=x64
if /i "%1"=="x86" set arch=ia32

:GetWindowsSdkDir
@call :GetWindowsSdkDirHelper HKLM
@if errorlevel 1 call :GetWindowsSdkDirHelper HKCU
@if errorlevel 1 echo WindowsSdkDir not found
@exit /B 0

:GetWindowsSdkDirHelper
:: Microsoft Windows SDK regkey differs depending on the architecture
@SET RegPath=
if "%2"=="x64" SET RegPath=Wow6432Node\
@SET WindowsSdkDir=
@for /F "tokens=1,2*" %%i in ('reg query "%1\SOFTWARE\%RegPath%Microsoft\Microsoft SDKs\Windows" /v "CurrentInstallFolder"') DO (
if "%%i"=="CurrentInstallFolder" (
echo Using Windows SDK @ %%k
SET "WindowsSdkDir=%%k"
)
)
@if "%WindowsSdkDir%"=="" exit /B 1

set newpath=C:\Python27;C:\Python26;C:\Python
echo %path%|findstr /i /c:"python">nul  || set path=%path%;%newpath%

set newlibpath=%WindowsSdkDir%lib\x64
if /i "%arch%"=="ia32" set newlibpath=%WindowsSdkDir%lib
echo %libpath%|findstr /i /c:"Microsoft SDKs\Windows">nul  || set libpath=%libpath%;%newlibpath%
echo Windows SDK Library Path %newlibpath%
echo Architecture %arch%

if NOT exist .\libraries\node\node.gyp (
  git submodule init
  git submodule update
)

call build.bat release nobuild nosign %arch%
