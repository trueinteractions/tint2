#!/usr/bin/env bash

echo
for file in $@; do
  ../build/Release/tint tools/utilities.js $file
  test $? -eq 0 || exit $?
done
echo
