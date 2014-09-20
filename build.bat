@echo off
set arg1=%1

if exist "%PYTHON%" (
  if exist "%PYTHON\python" (
    set pythoncmd="%PYTHON%\python"
  ) else (
    set pythoncmd="%PYTHON%"
  )
) else (
  set pythoncmd="C:\Python27\python.exe"
)

reg.exe query "HKLM\SOFTWARE\Microsoft\MSBuild\ToolsVersions\4.0" /v MSBuildToolsPath > nul 2>&1
if ERRORLEVEL 1 goto MissingMSBuildRegistry

for /f "skip=2 tokens=2,*" %%A in ('reg.exe query "HKLM\SOFTWARE\Microsoft\MSBuild\ToolsVersions\4.0" /v MSBuildToolsPath') do SET MSBUILDDIR=%%B

IF NOT EXIST %MSBUILDDIR%nul goto MissingMSBuildToolsPath
IF NOT EXIST %MSBUILDDIR%msbuild.exe goto MissingMSBuildExe

if "%arg1%" == "debug" (
  set CONFIG="Debug"
) else (
  set CONFIG="Release"
)

::if defined VS110COMNTOOLS if exist "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat" (
::  SETLOCAL
::    copy /Y tools\v8_js2c_fix.py libraries\node\deps\v8\tools\js2c.py > nul
::    call "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat"
::    "%MSBUILDDIR%msbuild.exe" /m /P:Configuration=%CONFIG% /clp:NoSummary;NoItemAndPropertyList;ShowCommandLine; /verbosity:minimal /target:tint /nologo build\msvs\tint.sln 
::  ENDLOCAL
::) else if defined VS100COMNTOOLS if exist "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat" (
:: call "%VS100COMNTOOLS%\VCVarsQueryRegistry.bat"
  vcvarsall.bat
  SETLOCAL
    if exist "%VS120COMNTOOLS%\..\..\vc\vcvarsall.bat" (
      echo "Visual Studio 2013"
      copy /Y tools\v8_js2c_fix.py libraries\node\deps\v8\tools\js2c.py > nul
      call "%VS120COMNTOOLS%\..\..\vc\vcvarsall.bat" x64
      echo "Windows SDK: %WindowsSdkDir%"
      "%MSBUILDDIR%msbuild.exe" /m /P:Configuration=%CONFIG% /clp:NoSummary;NoItemAndPropertyList;ShowCommandLine; /verbosity:minimal /target:tint /nologo build\msvs\tint.sln 
    ) else if exist "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat" (
      echo "Visual Studio 2012"
      copy /Y tools\v8_js2c_fix.py libraries\node\deps\v8\tools\js2c.py > nul
      call "%VS110COMNTOOLS%\..\..\vc\vcvarsall.bat" x64
      echo "Windows SDK: %WindowsSdkDir%"
      "%MSBUILDDIR%msbuild.exe" /m /P:Configuration=%CONFIG% /clp:NoSummary;NoItemAndPropertyList;ShowCommandLine; /verbosity:minimal /target:tint /nologo build\msvs\tint.sln 
    ) else if exist "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat" (
      echo "Visual Studio 2010"
      copy /Y tools\v8_js2c_fix.py libraries\node\deps\v8\tools\js2c.py > nul
      call "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat" x64
      echo "Windows SDK: %WindowsSdkDir%"
      "%MSBUILDDIR%msbuild.exe" /m /P:Configuration=%CONFIG% /clp:NoSummary;NoItemAndPropertyList;ShowCommandLine; /verbosity:minimal /target:tint /nologo build\msvs\tint.sln 
    )
  ENDLOCAL
::) else (
::  goto MissingMSBuildToolsPath
::)

goto:eof
::ERRORS
::---------------------
:MissingMSBuildRegistry
echo Cannot obtain path to MSBuild tools from registry
goto:eof
:MissingMSBuildToolsPath
echo The MSBuild tools path from the registry '%MSBUILDDIR%' does not exist
goto:eof
:MissingMSBuildExe
echo The MSBuild executable could not be found at '%MSBUILDDIR%'
goto:eof
