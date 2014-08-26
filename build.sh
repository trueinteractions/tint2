#!/bin/sh
if [ "$(uname)" == "Darwin" ]; then
  if [ "$(which xcodebuild)" == "" ]; then
    if [ "$(which ninja)" == ""]; then
      echo "You do not have Xcode or ninja installed. One of these is required."
    else
      ninja -v -C build/out/Release
    fi
  else
    xcodebuild -configuration Release -project build/tint.xcodeproj build    
  fi
else
  echo "Your platform is unfortunately not supported right now."
fi
