#!/bin/sh

if [ $CC ]; then
  echo "Warning using a pre-set compiler $CC"
fi

if [ ! $PYTHON ]; then
   PYTHON=`which python`;
   echo "No python environment set, assuming $PYTHON"
   $PYTHON -V
fi

if [ ! -f "./libraries/node/" ]; then
  git submodule init
  git submodule update
fi

$PYTHON ./tools/tint_conf.py --without-snapshot --without-etw --without-perfctr --dest-cpu=x64 --xcode --tag= 

# if [ "$(uname)" == "Darwin" ]; then
  # GYP_GENERATORS=xcode,ninja
  # ./tools/gyp/gyp tint.gyp -f ninja -D android=true -D target_arch=and -Goutput_dir=./build/android --generator-output=./build/android/ --depth=. -I./libraries/node/config.gyp -I./build/common.gypi
  # ./tools/gyp/gyp tint.gyp -f xcode -D arm_emu=true -D target_arch=ios -Goutput_dir=./build/xcode-ios --generator-output=./build/xcode-ios/ --depth=. -I./libraries/node/config.gyp -I./build/common.gypi
  # ./libraries/node/tools/gyp/gyp tint.gyp -f xcode -D target_arch=x64 -Goutput_dir=./build/xcode  --generator-output=./build/xcode/ --depth=. -I./libraries/node/config_mac.gypi -I./build/common.gypi
  # ./libraries/node/tools/gyp/gyp tint.gyp -f ninja -D target_arch=x64 -Goutput_dir=./build/ninja --generator-output=./build/ninja/ --depth=. -I./libraries/node/config_mac.gypi -I./build/common.gypi
# elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
  # GYP_GENERATORS=make,ninja
  # ./tools/gyp/gyp tint.gyp -f ninja -D android=true -D target_arch=and -Goutput_dir=./build/android --generator-output=./build/android/ --depth=. -I./libraries/node/config.gyp -I./build/common.gypi
  # ./libraries/node/tools/gyp/gyp tint.gyp -f make -D target_arch=x64 -Goutput_dir=./build/make  --generator-output=./build/make/ --depth=. -I./libraries/node/config.gypi -I./build/common.gypi
  # ./libraries/node/tools/gyp/gyp tint.gyp -f ninja -D target_arch=x64 -Goutput_dir=./build/ninja --generator-output=./build/ninja/ --depth=. -I./libraries/node/config.gypi -I./build/common.gypi
# elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
  # cmd ./config.bat
# else
  # echo "Unfortunately your build platform is not supported."
# fi
