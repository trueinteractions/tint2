
@ECHO OFF

if NOT exist .\libraries\node\node.gyp (
  git submodule init
  git submodule update
)

SETLOCAL
  call "%VS100COMNTOOLS%\VCVarsQueryRegistry.bat"
  call "%VS100COMNTOOLS%\..\..\vc\vcvarsall.bat"
ENDLOCAL

set msiplatform=x64
set noetw_msi_arg=/p:NoETW=1
set noperfctr_msi_arg=/p:NoPerfCtr=1
set target_arch=x64

python tools\tint_conf.py --without-snapshot --without-etw --without-perfctr --dest-cpu=x64 --tag=

:: python tools\gyp_tint
:: .\libraries\node\tools\gyp\gyp.bat tint.gyp -f msvs -D target_arch=x64 -Goutput_dir=./build/msvs --generator-output=./build/msvs/ --depth=. -I./libraries/node/config.gypi -I./build/common.gypi
:: .\libraries\node\tools\gyp\gyp.bat tint.gyp -f ninja -D target_arch=x64 -Goutput_dir=./build/ninja --generator-output=./build/ninja/ --depth=. -I./libraries/node/config.gypi -I./build/common.gypi
