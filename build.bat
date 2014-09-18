@echo off
set arg1=%1

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

SETLOCAL
  call "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat"
ENDLOCAL

"%MSBUILDDIR%msbuild.exe" /m /P:Configuration=%CONFIG% /target:tint /clp:NoSummary;NoItemAndPropertyList;ShowCommandLine; /verbosity:minimal /nologo tint.sln 


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
