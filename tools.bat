@echo off

cd %~dp0

if /i "%1"=="help" goto help
if /i "%1"=="--help" goto help
if /i "%1"=="-help" goto help
if /i "%1"=="/help" goto help
if /i "%1"=="?" goto help
if /i "%1"=="-?" goto help
if /i "%1"=="--?" goto help
if /i "%1"=="/?" goto help

@rem Process arguments.
set clean=
set config=Release
set msiplatform=x64
set target=Build
set target_arch=x64
set debug_arg=
set nosnapshot_arg=
set gyp=
set nobuild=
set nosign=
set nosnapshot=1
set test=
set test_args=
set msi=
set licensertf=
set upload=
set jslint=
set buildnodeweak=
set noetw=1
set noetw_arg=1
set noetw_msi_arg=1
set noperfctr=1
set noperfctr_arg=1
set noperfctr_msi_arg=1
set subsystem=console
set platformtoolset=v110
set build=

:next-arg
if "%1"=="" goto args-done
if /i "%1"=="debug"         set config=Debug&goto arg-ok
if /i "%1"=="release"       set config=Release&goto arg-ok
if /i "%1"=="clean"       	set clean=1&goto arg-ok
if /i "%1"=="clean_msvs"    set target=Clean&goto arg-ok
if /i "%1"=="ia32"          set target_arch=ia32&goto arg-ok
if /i "%1"=="x86"           set target_arch=ia32&goto arg-ok
if /i "%1"=="x64"           set target_arch=x64&goto arg-ok
if /i "%1"=="config" 	    set gyp=1&goto arg-ok
if /i "%1"=="build"		    set build=1&goto arg-ok
if /i "%1"=="nobuild"       set nobuild=1&goto arg-ok
if /i "%1"=="nosign"        set nosign=1&goto arg-ok
if /i "%1"=="nosnapshot"    set nosnapshot=1&goto arg-ok
if /i "%1"=="noetw"         set noetw=1&goto arg-ok
if /i "%1"=="noperfctr"     set noperfctr=1&goto arg-ok
if /i "%1"=="licensertf"    set licensertf=1&goto arg-ok
if /i "%1"=="test-uv"       set test=test-uv&goto arg-ok
if /i "%1"=="test-internet" set test=test-internet&goto arg-ok
if /i "%1"=="test-pummel"   set test=test-pummel&goto arg-ok
if /i "%1"=="test-simple"   set test=test-simple&goto arg-ok
if /i "%1"=="test-message"  set test=test-message&goto arg-ok
if /i "%1"=="test-gc"       set test=test-gc&set buildnodeweak=1&goto arg-ok
if /i "%1"=="test-all"      set test=test-all&set buildnodeweak=1&goto arg-ok
if /i "%1"=="test"          set test=test&goto arg-ok
if /i "%1"=="msi"           set msi=1&set licensertf=1&goto arg-ok
if /i "%1"=="upload"        set upload=1&goto arg-ok
if /i "%1"=="jslint"        set jslint=1&goto arg-ok
if /i "%1"=="gui"			set subsystem=windows&goto arg-ok

echo Warning: ignoring invalid command line option `%1`.

:arg-ok
:arg-ok
shift
goto next-arg

:args-done
if "%config%"=="Debug" set debug_arg=--debug
if "%target_arch%"=="x64" set msiplatform=x64
if defined nosnapshot set nosnapshot_arg=--without-snapshot
if defined noetw set noetw_arg=--without-etw& set noetw_msi_arg=/p:NoETW=1
if defined noperfctr set noperfctr_arg=--without-perfctr& set noperfctr_msi_arg=/p:NoPerfCtr=1
if not defined build if not defined gyp if not defined test if not defined clean goto help


:clean
if not defined clean goto config
rmdir /S /Q .\build\msvs\ >nul 2>&1
rmdir /S /Q .\build\ninja\ >nul 2>&1
rmdir /S /Q .\build\xcode\ >nul 2>&1
rmdir /S /Q .\build\Release\ >nul 2>&1
rmdir /S /Q .\build\Debug\ >nul 2>&1
rmdir /S /Q .\build\out\ >nul 2>&1
rmdir /S /Q .\build\tint.build >nul 2>&1
rmdir /S /Q .\build\dist\tint >nul 2>&1

:config
if not defined gyp goto msbuild
git apply build/node.diff 2> nul

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
  git clone https://github.com/joyent/node.git --depth 2 -b v0.12.0-release libraries\node 
  git clone https://github.com/trueinteractions/wpf-autolayout.git libraries\wpf-autolayout
)

if defined NIGHTLY set TAG=nightly-%NIGHTLY%
SETLOCAL
	if defined VS120COMNTOOLS if exist "%VS120COMNTOOLS%\VCVarsQueryRegistry.bat" (
		echo Configuring Platform Toolset V120
		call "%VS120COMNTOOLS%\VCVarsQueryRegistry.bat"
		set GYP_MSVS_VERSION=2013
		set platformtoolset=v120
	) else if defined VS110COMNTOOLS if exist "%VS110COMNTOOLS%\VCVarsQueryRegistry.bat" (
		echo Configuring Platform Toolset V110
		call "%VS110COMNTOOLS%\VCVarsQueryRegistry.bat"
		set GYP_MSVS_VERSION=2012
		set platformtoolset=v110
	) else if defined VS100COMNTOOLS if exist "%VS100COMNTOOLS%\VCVarsQueryRegistry.bat" (
		echo Configuring Platform Toolset V100
		call "%VS100COMNTOOLS%\VCVarsQueryRegistry.bat"
		set GYP_MSVS_VERSION=2010
		set platformtoolset=v100
	) else (
		echo Cannot find visual studio VCVarsQueryRegistry.bat
		goto exit
	)
	python tools\tint_conf.py %debug_arg% %nosnapshot_arg% %noetw_arg% %noperfctr_arg% --subsystem=%subsystem% --dest-cpu=%target_arch% --tag=%TAG% > nul
	if errorlevel 1 goto create-msvs-files-failed
	if not exist build\msvs\tint.sln goto create-msvs-files-failed
ENDLOCAL



:msbuild
if not defined build goto test

SETLOCAL

	if defined VS120COMNTOOLS if exist "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat" (
		echo Using Platform Toolset V120
		call "%VS120COMNTOOLS%\..\..\vc\vcvarsall.bat"
		set GYP_MSVS_VERSION=2013
		set platformtoolset=v120
		goto msbuild-found
	)
	if defined VS110COMNTOOLS if exist "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat" (
		echo Using Platform Toolset V110
		call "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat"
		set GYP_MSVS_VERSION=2012
		set platformtoolset=v110
		goto msbuild-found
	)
	if defined VS100COMNTOOLS if exist "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat" (
		echo Using Platform Toolset V100
		call "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat"
		set GYP_MSVS_VERSION=2010
		set platformtoolset=v100
		goto msbuild-found
	)
	echo Cannot find vcvarsall.bat for visual studio
	goto exit


:msbuild-found
 	copy /Y tools\v8_js2c_fix.py libraries\node\deps\v8\tools\js2c.py > nul
 	set start=%time%
	msbuild build\msvs\tint.sln /t:%target% /m:3 /p:Configuration=%config%;PlatformToolset=%platformtoolset%;CreateHardLinksForCopyFilesToOutputDirectoryIfPossible=true;CreateHardLinksForCopyAdditionalFilesIfPossible=true;CreateHardLinksForPublishFilesIfPossible=true;CreateHardLinksForCopyLocalIfPossible=true /clp:NoSummary;NoItemAndPropertyList;Verbosity=minimal /nologo
	if errorlevel 1 goto exit
	set end=%time%
	set options="tokens=1-4 delims=:."
	for /f %options% %%a in ("%start%") do set start_h=%%a&set /a start_m=100%%b %% 100&set /a start_s=100%%c %% 100&set /a start_ms=100%%d %% 100
	for /f %options% %%a in ("%end%") do set end_h=%%a&set /a end_m=100%%b %% 100&set /a end_s=100%%c %% 100&set /a end_ms=100%%d %% 100

	set /a hours=%end_h%-%start_h%
	set /a mins=%end_m%-%start_m%
	set /a secs=%end_s%-%start_s%
	set /a ms=%end_ms%-%start_ms%
	if %hours% lss 0 set /a hours = 24%hours%
	if %mins% lss 0 set /a hours = %hours% - 1 & set /a mins = 60%mins%
	if %secs% lss 0 set /a mins = %mins% - 1 & set /a secs = 60%secs%
	if %ms% lss 0 set /a secs = %secs% - 1 & set /a ms = 100%ms%
	if 1%ms% lss 100 set ms=0%ms%

	:: mission accomplished
	set /a totalsecs = %hours%*3600 + %mins%*60 + %secs% 
	echo Build took %hours%:%mins%:%secs%.%ms% (%totalsecs%.%ms%s total)
ENDLOCAL

copy /Y build\msvs\%config%\tint.exe build\msvs\%config%\tint_%subsystem%.exe


:test 
if not defined test goto sign
cd test
run.bat *.js

:msbuild-not-found
:sign
:licensertf
:msi
:msibuild
:run
:build-node-weak
:build-node-weak-failed
:run-tests
goto exit

:create-msvs-files-failed
echo Failed to create vc project files. 
goto exit

:upload
goto exit

:jslint
goto exit

:help
echo build.bat [debug/release] [x86/x64] config build test
goto exit

:exit
goto :EOF

:getnodeversion
goto :EOF
