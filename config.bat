@ECHO OFF

@echo off
:GetWindowsSdkDir
@call :GetWindowsSdkDirHelper HKLM
@if errorlevel 1 call :GetWindowsSdkDirHelper HKCU
@if errorlevel 1 echo WindowsSdkDir not found
@exit /B 0

:GetWindowsSdkDirHelper
@SET WindowsSdkDir=
@for /F "tokens=1,2*" %%i in ('reg query "%1\SOFTWARE\Wow6432Node\Microsoft\Microsoft SDKs\Windows" /v "CurrentInstallFolder"') DO (
if "%%i"=="CurrentInstallFolder" (
echo Using Windows SDK @ %%k
SET "WindowsSdkDir=%%k"
)
)
@if "%WindowsSdkDir%"=="" exit /B 1

set newpath=C:\Python27;C:\Python26;C:\Python
echo %path%|findstr /i /c:"python">nul  || set path=%path%;%newpath%

set newlibpath=%WindowsSdkDir%lib\x64
if /i "%1"=="x86" set newlibpath=%WindowsSdkDir%lib
echo %libpath%|findstr /i /c:"Microsoft SDKs\Windows">nul  || set libpath=%libpath%;%newlibpath%
echo Library Path %libpath%
:: dir "%newlibpath%"

if NOT exist .\libraries\node\node.gyp (
  git submodule init
  git submodule update
)

set arch=x64
if /i "%1"=="x86" set arch=ia32

call build.bat release nobuild nosign %arch%