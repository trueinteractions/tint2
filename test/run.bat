
@echo off

set TINTEXEC=..\build\msvs\Release\tint.exe
for /f %%i in ("%0") do set curpath=%%~dpi

if "%1"=="" goto all
if "%1"=="*.js" goto all

call "%curpath%%TINTEXEC%" tools\utilities.js %curpath%%TINTEXEC% %1 || EXIT /B 1
goto done

:all
for %%f in (.\*.js) do (
  call "%curpath%%TINTEXEC%" tools\utilities.js %curpath%%TINTEXEC% %%f || EXIT /B 1
  echo %%f ran with exit code %ERRORLEVEL%
)

:done
