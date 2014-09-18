#!/bin/sh
if [ "$(uname)" == "Darwin" ]; then
  if [ "$(which xcodebuild)" == "" ]; then
    if [ "$(which ninja)" == ""]; then
      echo "You do not have Xcode or ninja installed. One of these is required."
    else
      ninja -v -C build/ninja/out/Release
    fi
  else
    xcodebuild -configuration Release -project tint.xcodeproj build    
  fi
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  if [ "$(which make)" == "" ]; then
    if [ "$(which ninja)" == ""]; then
      echo "You do not have make or ninja installed. One of these is required."
    else
      ninja -v -C build/ninja/out/Release
    fi
  else
    make -f build/make/Makefile tint
  fi
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
  cmd build.bat
else
  echo "Your platform is unfortunately not supported right now."
fi
