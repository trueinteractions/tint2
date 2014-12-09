@echo off
cd ..
call config.bat
call build.bat release
call build.bat gui release
cd tools