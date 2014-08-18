#!/bin/sh
if [ ! $1 ]; then
	export SCRIPTS=*.js
else
	export SCRIPTS=$1
fi

../build/Release/tint tools/utilities.js $SCRIPTS
