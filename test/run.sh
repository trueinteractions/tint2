#!/usr/bin/env bash

if [ ! -f "../build/Release/tint" ]; then
  if [ ! -f "../build/out/Release/tint" ]; then
    echo "Cannot find the binary for tint, exiting."
    exit 0
  else
    TINTEXEC="../build/out/Release/tint"
  fi
else
  TINTEXEC="../build/Release/tint"
fi

echo
for file in $@; do
  $TINTEXEC tools/utilities.js $file
  test $? -eq 0 || exit $?
done
echo
