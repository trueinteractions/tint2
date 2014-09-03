#!/usr/bin/env bash
if [ $CI ]; then
 echo -n 'Tint unit tests for: '
 uname -a 
fi
if [ ! -f "../build/xcode/Release/tint" ]; then
  if [ ! -f "../build/ninja/out/Release/tint" ]; then
    echo "Cannot find the binary for tint, exiting."
    exit 0
  else
    TINTEXEC="../build/ninja/out/Release/tint"
  fi
else
  TINTEXEC="../build/xcode/Release/tint"
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
