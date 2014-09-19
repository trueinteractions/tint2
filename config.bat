
@ECHO OFF

if NOT exist .\libraries\node\node.gyp (
  git submodule init
  git submodule update
)

SETLOCAL
    :: if defined VS110COMNTOOLS if exist "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat" (
    :: call "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat"
    :: ) else if defined VS100COMNTOOLS if exist "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat" (
    :: call "%VS100COMNTOOLS%\VCVarsQueryRegistry.bat"
    call "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat"
    :: ) else (
    :: goto MSBuildNotFound
    :: )
  set msiplatform=x64
  set noetw_msi_arg=/p:NoETW=1
  set noperfctr_msi_arg=/p:NoPerfCtr=1
  set target_arch=x64

  python tools\tint_conf.py --without-snapshot --without-etw --without-perfctr --dest-cpu=x64 --tag= > nul
ENDLOCAL

goto:eof
:MSBuildNotFound
echo "Error: Cannot find environment variable VS110COMNTOOLS (Visual Studio 2012 and 2013) or VS100COMNTOOLS (Visual Studio 2010)"
echo "Error: Download and install Visual Studio 2010 or greater and Windows SDK 7.0 or greater. Visit http://www.microsoft.com"
