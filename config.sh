#!/bin/sh
if [ "$(uname)" == "Darwin" ]; then
        GYP_GENERATORS=xcode
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
        GYP_GENERATORS=make
elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
        GYP_GENERATORS=msvs
fi

if [ ! -f "./libraries/node/config.gypi" ]; then
	cd libraries/node/
	./configure
	cd ../..
fi

if [ ! -d "./build" ]; then
	mkdir build
fi

# -Dtarget_arch=x64 

./tools/gyp/gyp tint.gyp -f $GYP_GENERATORS -D target_arch=x64 -D gyp_output_dir=build --generator-output=build --depth=$PWD -I./config.gypi -I./common.gypi
./tools/gyp/gyp tint.gyp -f ninja -D target_arch=x64 -D gyp_output_dir=build --generator-output=build --depth=$PWD -I./config.gypi -I./common.gypi