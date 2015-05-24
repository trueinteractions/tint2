@IF NOT EXIST "%ProgramFiles%\nodejs\node.exe" (
  echo You do not have node.js installed, ensure youve installed the latest node.js from https://joyent.com/nodejs and try again.
  echo Looked for node.js in "%ProgramFiles%\nodejs\" and couldnt find it.
  exit /B 1
)
if NOT EXIST "%APPDATA%\npm\node_modules\node-inspector\bin\node-debug.js" (
  echo You do not have node-debug or node-inspecter installed, run npm -g install node-inspector and try again.
  echo Looked in %APPDATA%\npm\node_modules\ and couldn't find node-debug or node-inspector.
  exit /B 1
)
@SETLOCAL
@SET PATHEXT=%PATHEXT:;.JS;=;%
tint "%APPDATA%\npm\node_modules\node-inspector\bin\node-debug.js" %*
