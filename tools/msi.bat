@echo off

:msbuild2013
if not defined VS120COMNTOOLS goto vc-set-2010
if not exist "%VS120COMNTOOLS%\..\..\vc\vcvarsall.bat" goto vc-set-2010
if not defined VCINSTALLDIR call "%VS120COMNTOOLS%\..\..\vc\vcvarsall.bat"
if not defined VCINSTALLDIR goto msbuild
goto msbuild-found


:msbuild
if not defined VS110COMNTOOLS goto vc-set-2010
if not exist "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat" goto vc-set-2010
if not defined VCINSTALLDIR call "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat"
if not defined VCINSTALLDIR goto vc-set-2010
goto msbuild-found

:vc-set-2010
if not defined VS100COMNTOOLS goto msbuild-not-found
if not exist "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat" goto msbuild-not-found
if not defined VCINSTALLDIR call "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat"
if not defined VCINSTALLDIR goto msbuild-not-found
goto msbuild-found

:msbuild-found
del ..\build\dist\license.rtf
del ..\build\dist\tint_version.exe
del tint_version.obj

cl /DBUILD_AS_TOOL /Fe..\build\dist\tint_version.exe /Tc tint_version.h

for /F "delims=" %%i IN ('..\build\dist\tint_version.exe') DO set TINT_VERSION=%%i

node ..\libraries\node\tools\license2rtf.js < license.txt > ..\build\dist\license.rtf
msbuild "win-installer\tintmsi.sln" /m /t:Clean,Build /p:Configuration=Release /p:Platform=x64 /p:TintVersion=%TINT_VERSION% /clp:NoSummary;NoItemAndPropertyList;Verbosity=minimal /nologo

del ..\build\dist\license.rtf

:msbuild-not-found