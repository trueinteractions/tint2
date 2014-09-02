#!/usr/bin/env bash
echo -n 'Tint unit tests for: '
uname -a 
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
$TINTEXEC tools/initialsetup.js
echo
for file in $@; do
  $TINTEXEC tools/utilities.js $TINTEXEC $file
  test $? -eq 0 || exit $?
done
echo
