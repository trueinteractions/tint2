:: Created by npm, please don't edit manually.
@IF EXIST "%~dp0\tint.exe" (
  "%~dp0\tint.exe" "%~dp0\tntbuild.js" %*
) ELSE (
  tint "%~dp0\tntbuild.js" %*
)