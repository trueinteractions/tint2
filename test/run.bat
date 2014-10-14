
@echo off

set TINTEXEC="..\\build\\msvs\\Release\\tint.exe"

if "%1"=="" goto all

%TINTEXEC% tools/utilities.js %TINTEXEC% %1
if %ERRORLEVEL% GEQ 1 exit /b %ERRORLEVEL%

goto done


:all
for %%f in (.\\*.js) do (
  %TINTEXEC% tools/utilities.js %TINTEXEC% %%f
  if %ERRORLEVEL% GEQ 1 exit /b %ERRORLEVEL%
)

:done