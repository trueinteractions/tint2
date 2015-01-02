#!/bin/sh
if [ "$1" == "debug" ]; then
  CONFIG="Debug"
else
  CONFIG="Release"
fi

if [ "$2" == "ios" ]; then
  xcodebuild -configuration $CONFIG -project build/xcode-ios/tint.xcodeproj build 
  exit 0
fi

if [ "$(uname)" == "Darwin" ]; then
  if [ "$(which xcodebuild)" == "" ]; then
    if [ "$(which ninja)" == ""]; then
      echo "You do not have Xcode or ninja installed. One of these is required."
    else
      ninja -v -C build/ninja/out/$CONFIG
    fi
  else
    xcodebuild -configuration $CONFIG -project build/xcode/tint.xcodeproj build    
  fi
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  if [ "$(which make)" == "" ]; then
    if [ "$(which ninja)" == ""]; then
      echo "You do not have make or ninja installed. One of these is required."
    else
      ninja -v -C build/ninja/out/$CONFIG
    fi
  else
    make -f build/make/Makefile tint $CONFIG
  fi
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
  cmd build.bat $CONFIG
else
  echo "Your platform is unfortunately not supported right now."
fi
