#!/bin/sh
if [ "$(uname)" == "Darwin" ]; then
        GYP_GENERATORS=xcode
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
        GYP_GENERATORS=make
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
        GYP_GENERATORS=msvs
fi

if [ ! -f "./libraries/node/config.gypi" ]; then
  git submodule init
  git submodule update
  cd libraries/node/
  ./configure
  cd ../..
fi

# -Dtarget_arch=x64 
# -D gyp_output_dir=./build/xcode/
./tools/gyp/gyp tint.gyp -f xcode -D target_arch=x64  --generator-output=./build/xcode/ --depth=. -I./build/config.gypi -I./build/common.gypi
./tools/gyp/gyp tint.gyp -f ninja -D target_arch=x64 --generator-output=./build/ninja/ --depth=$PWD -I./build/config.gypi -I./build/common.gypi