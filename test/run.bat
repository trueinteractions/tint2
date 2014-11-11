
@echo off


:: this is necessary to remove any login screens that impede 
:: GDI/HWND creation and mouse movements (obviously.)
if defined APPVEYOR (
	echo Building as %USERDOMAIN%\%USERNAME%
	runas /trustlevel:0x20000 "net user %USERNAME% /ACTIVE:YES"
)

set TINTEXEC=..\build\msvs\Release\tint.exe
for /f %%i in ("%0") do set curpath=%%~dpi

if "%1"=="" goto all
if "%1"=="*.js" goto all

call "%curpath%%TINTEXEC%" tools\utilities.js %curpath%%TINTEXEC% %1 || EXIT /B 1
goto done

:all
for %%f in (.\*.js) do (
  call "%curpath%%TINTEXEC%" tools\utilities.js %curpath%%TINTEXEC% %%f || EXIT /B 1
)

::   echo %%f ran with exit code %ERRORLEVEL%
:done
