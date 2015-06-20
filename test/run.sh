#!/bin/bash

if [ $CI ]; then
 echo -n 'Tint unit tests for: '
 uname -a 
fi

if [ -f "../build/xcode/Release/tint" ]; then
  TINTEXEC="../build/xcode/Release/tint"
elif [ -f "../build/ninja/out/Release/tint" ]; then
  TINTEXEC="../build/ninja/out/Release/tint"
elif [ -f "../tint" ]; then
  TINTEXEC="../tint"
elif [ -f "./tint" ]; then
  TINTEXEC="./tint"
elif [ -f "../build/linux/Release/tint" ]; then
  TINTEXEC="../build/linux/Release/tint"
else
  echo "Cannot find the binary for tint, exiting."
  exit 1
fi

if [ $CI ]; then
  $TINTEXEC tools/initialsetup.js
fi
for file in $@; do
  $TINTEXEC tools/utilities.js $TINTEXEC $file
  test $? -eq 0 || exit $?
  sleep 0.5
done
echo
