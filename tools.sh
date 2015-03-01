#!/bin/sh

if [ "$1" == "config" ]; then
  git apply build/node.diff 2> /dev/null
  if [ $CC ]; then
    echo "Warning using a pre-set compiler $CC"
  fi
  if [ ! $PYTHON ]; then
     PYTHON=`which python`;
  fi
  if [ ! -f "./libraries/node/" ]; then
    git submodule init
    git submodule update
  fi
  $PYTHON ./tools/tint_conf.py --subsystem=console --without-snapshot --dest-cpu=x64 --xcode --tag= > /dev/null
elif [ "$1" == "build" ]; then
  if [ "$2" == "debug" ]; then
    CONFIG="Debug"
  else
    CONFIG="Release"
  fi
  if [ "$(uname)" == "Darwin" ]; then
    xcodebuild -configuration $CONFIG -project build/xcode/tint.xcodeproj build
  elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    echo "Linux is not yet supported."
  elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
    cmd build.bat $CONFIG
  else
    echo "Your platform is unfortunately not supported right now."
  fi
elif [ "$1" == "clean" ]; then
  rm -rf ./build/msvs/
  rm -rf ./build/ninja/
  rm -rf ./build/xcode/
  rm -rf ./build/Release/
  rm -rf ./build/Debug/
  rm -rf ./build/out/
  rm -rf ./build/tint.build
  rm -rf ./build/dist/tint
elif [ "$1" == "test" ]; then
  cd test
  ./run.sh *.js
else
  echo "$0 config|build|test|clean [debug|release]"
fi