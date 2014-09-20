
@ECHO OFF

if exist "%PYTHON%" (
  if exist "%PYTHON\python" (
    set pythoncmd="%PYTHON%\python"
  ) else (
    set pythoncmd="%PYTHON%"
  )
) else (
  set pythoncmd="C:\Python27\python.exe"
)

if NOT exist .\libraries\node\node.gyp (
  git submodule init
  git submodule update
)

::SETLOCAL
  ::if exist "%VS120COMNTOOLS%\..\..\vc\vcvarsall.bat" (
  ::  call "%VS120COMNTOOLS%\..\..\vc\vcvarsall.bat" x64
  ::) else if exist "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat" (
  ::  call "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat" x64
  ::) else if exist "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat" (
  ::  call "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat" x64
  ::)
  ::set msiplatform=x64
  ::set noetw_msi_arg=/p:NoETW=1
  ::set noperfctr_msi_arg=/p:NoPerfCtr=1
  ::set target_arch=x64

  call %pythoncmd% tools\tint_conf.py --without-snapshot --without-etw --without-perfctr --dest-cpu=x64 --tag= > nul
::ENDLOCAL

goto:eof
:MSBuildNotFound
echo "Error: Cannot find environment variable VS120COMNTOOLS (Visual Studio 2013), VS110COMNTOOLS (Visual Studio 2012) or VS100COMNTOOLS (Visual Studio 2010)"
echo "Error: Download and install Visual Studio 2010 or greater and Windows SDK 7.0 or greater. Visit http://www.microsoft.com"
