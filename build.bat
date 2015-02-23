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

:next-arg
if "%1"=="" goto args-done
if /i "%1"=="debug"         set config=Debug&goto arg-ok
if /i "%1"=="release"       set config=Release&goto arg-ok
if /i "%1"=="clean"         set target=Clean&goto arg-ok
if /i "%1"=="ia32"          set target_arch=ia32&goto arg-ok
if /i "%1"=="x86"           set target_arch=ia32&goto arg-ok
if /i "%1"=="x64"           set target_arch=x64&goto arg-ok
if /i "%1"=="config" 	    set gyp=1&goto arg-ok
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
if defined upload goto upload
if defined jslint goto jslint

if "%config%"=="Debug" set debug_arg=--debug
if "%target_arch%"=="x64" set msiplatform=x64
if defined nosnapshot set nosnapshot_arg=--without-snapshot
if defined noetw set noetw_arg=--without-etw& set noetw_msi_arg=/p:NoETW=1
if defined noperfctr set noperfctr_arg=--without-perfctr& set noperfctr_msi_arg=/p:NoPerfCtr=1

:project-gen
if defined NIGHTLY set TAG=nightly-%NIGHTLY%
SETLOCAL
	if defined VS120COMNTOOLS if exist "%VS120COMNTOOLS%\VCVarsQueryRegistry.bat" (
		echo Configuring Platform Toolset V120
		call "%VS120COMNTOOLS%\VCVarsQueryRegistry.bat"
		set GYP_MSVS_VERSION=2013
		set platformtoolset=v120
		goto inner-config
	)
	if defined VS110COMNTOOLS if exist "%VS110COMNTOOLS%\VCVarsQueryRegistry.bat" (
		echo Configuring Platform Toolset V110
		call "%VS110COMNTOOLS%\VCVarsQueryRegistry.bat"
		set GYP_MSVS_VERSION=2012
		set platformtoolset=v110
		goto inner-config
	)
	if defined VS100COMNTOOLS if exist "%VS100COMNTOOLS%\VCVarsQueryRegistry.bat" (
		echo Configuring Platform Toolset V100
		call "%VS100COMNTOOLS%\VCVarsQueryRegistry.bat"
		set GYP_MSVS_VERSION=2010
		set platformtoolset=v100
		goto inner-config
	)
	echo Cannot find visual studio VCVarsQueryRegistry.bat
	goto exit

:inner-config
	python tools\tint_conf.py %debug_arg% %nosnapshot_arg% %noetw_arg% %noperfctr_arg% --subsystem=%subsystem% --dest-cpu=%target_arch% --tag=%TAG% > nul
	if errorlevel 1 goto create-msvs-files-failed
	if not exist build\msvs\tint.sln goto create-msvs-files-failed
ENDLOCAL

:msbuild
if defined nobuild goto sign
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
	msbuild build\msvs\tint.sln /maxcpucount:3 /t:%target% /p:Configuration=%config%;PlatformToolset=%platformtoolset%;CreateHardLinksForCopyFilesToOutputDirectoryIfPossible=true;CreateHardLinksForCopyAdditionalFilesIfPossible=true;CreateHardLinksForPublishFilesIfPossible=true;CreateHardLinksForCopyLocalIfPossible=true /clp:NoSummary;NoItemAndPropertyList;Verbosity=minimal /nologo
	if errorlevel 1 goto exit
ENDLOCAL

copy /Y build\msvs\%config%\tint.exe build\msvs\%config%\tint_%subsystem%.exe

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
echo build.bat [debug/release] [config] [nobuild] [x86/x64]
goto exit

:exit
goto :EOF

:getnodeversion
goto :EOF
