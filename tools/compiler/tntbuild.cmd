@IF EXIST "%~dp0\tint.exe" (
  "%~dp0\tint.exe" "%~dp0\tntbuild.js" %*
) ELSE (
  tint "%~dp0\tntbuild.js" %*
)