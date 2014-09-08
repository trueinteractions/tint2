#!/bin/sh

if [ $CC ]; then
  echo "Warning using a pre-set compiler $CC"
fi

if [ ! $PYTHON ]; then
   PYTHON=`which python`;
   echo "No python environment set, assuming $PYTHON"
   $PYTHON -V
fi

if [ ! -f "./libraries/node/config.gypi" ]; then
  git submodule init
  git submodule update
  cd libraries/node/
  $PYTHON ./configure
  cd ../..
fi

if [ "$(uname)" == "Darwin" ]; then
  GYP_GENERATORS=xcode,ninja
  #./tools/gyp/gyp tint.gyp -f ninja -D android=true -D target_arch=and --generator-output=./build/android/ --depth=. -I./build/config.gyp -I./build/common.gypi
  #./tools/gyp/gyp tint.gyp -f xcode -D arm_emu=true -D target_arch=ios --generator-output=./build/xcode-ios/ --depth=. -I./build/config.gyp -I./build/common.gypi
  ./tools/gyp/gyp tint.gyp -f xcode -D target_arch=x64  --generator-output=./build/xcode/ --depth=. -I./build/config.gypi -I./build/common.gypi
  ./tools/gyp/gyp tint.gyp -f ninja -D target_arch=x64 --generator-output=./build/ninja/ --depth=$PWD -I./build/config.gypi -I./build/common.gypi
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  GYP_GENERATORS=make,ninja
  #./tools/gyp/gyp tint.gyp -f ninja -D android=true -D target_arch=and --generator-output=./build/android/ --depth=. -I./build/config.gyp -I./build/common.gypi
  ./tools/gyp/gyp tint.gyp -f make -D target_arch=x64  --generator-output=./build/make/ --depth=. -I./build/config.gypi -I./build/common.gypi
  ./tools/gyp/gyp tint.gyp -f ninja -D target_arch=x64 --generator-output=./build/ninja/ --depth=$PWD -I./build/config.gypi -I./build/common.gypi
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
  GYP_GENERATORS=msvs,ninja
  #./tools/gyp/gyp tint.gyp -f ninja -D android=true -D target_arch=and --generator-output=./build/android/ --depth=. -I./build/config.gyp -I./build/common.gypi
  ./tools/gyp/gyp tint.gyp -f msvs -D target_arch=x64  --generator-output=./build/msvs/ --depth=. -I./build/config.gypi -I./build/common.gypi
  ./tools/gyp/gyp tint.gyp -f ninja -D target_arch=x64 --generator-output=./build/ninja/ --depth=$PWD -I./build/config.gypi -I./build/common.gypi
else
  echo "Unfortunately your build platform is not supported."
fi
