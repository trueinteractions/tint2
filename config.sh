#!/bin/sh

git apply build/node.diff 2> /dev/null

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

if [ "$1" == "ios" ]; then
	$PYTHON ./tools/tint_conf.py --subsystem=console --with-arm7 --with-arm-float-abi=soft --without-snapshot --without-etw --without-perfctr --dest-cpu=arm --xcode --dest-os=ios --tag= 
else
	$PYTHON ./tools/tint_conf.py --subsystem=console --without-snapshot --without-etw --without-perfctr --dest-cpu=x64 --xcode --tag= > /dev/null
fi
