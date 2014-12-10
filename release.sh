#!/usr/bin/env bash

if [ ! -f "./build/xcode/Release/tint" ]; then
  echo "An OSX build is required for release"
  exit 1;
fi

gcc -DBUILD_AS_TOOL -x c tools/tint_version.h -o ./build/xcode/Release/tint_version
export TINT_VERSION=`./build/xcode/Release/tint_version`


# ./clean.sh
# ./config.sh
# ./build.sh release
# read -p "Run tools/release.bat on Windows... "

if [ ! -f "./build/msvs/Release/tint_console.exe" ]; then
  read -p "Run 'build.bat' on Windows... "
  if [ ! -f "./build/msvs/Release/tint_console.exe" ]; then
	echo "Cannot find WIN64 console binary for tint, exiting."
  	exit 1
  fi
fi
if [ ! -f "./build/msvs/Release/tint_windows.exe" ]; then
  read -p "Run 'build.bat gui' on Windows... "
  if [ ! -f "./build/msvs/Release/tint_windows.exe" ]; then
	echo "Cannot find WIN64 gui binary for tint, exiting."
  	exit 1
  fi
fi

if [ ! -f "./test/run.bat" ]; then
  echo "Cannot find test scripts, exiting."
  exit 1
fi

if [ ! -d "./build/dist/" ]; then
	mkdir ./build/dist
fi

if [ ! -d "./build/dist/tint" ]; then
	mkdir ./build/dist/tint
else
	rm -rf ./build/dist/tint
	mkdir ./build/dist/tint
fi

cp -a ./build/xcode/Release/tint ./build/dist/tint/
cp -a ./build/msvs/Release/tint_console.exe ./build/dist/tint/tint.exe
mkdir ./build/dist/tint/test
cp -a ./test/*.js ./build/dist/tint/test
cp -a ./test/tools ./build/dist/tint/test/tools
cp -a ./test/assets ./build/dist/tint/test/assets
cp -a test.bat ./build/dist/tint/
cp -a test.sh ./build/dist/tint/
cp -a test/run.sh ./build/dist/tint/test
cp -a test/run.bat ./build/dist/tint/test
cp -a tools/compiler/tntbuild.js ./build/dist/tint/tntbuild
chmod +x ./build/dist/tint/tntbuild
cat ./build/xcode/Release/tint | openssl base64 | tr -d '\n' > tintb64
cat ./build/msvs/Release/tint_windows.exe | openssl base64 | tr -d '\n' > tintexeb64
perl -pe "s/\@\@\@TINT_VERSION\@\@\@/'$TINT_VERSION'/ge" -i ./build/dist/tint/tntbuild
perl -pe 's/\@\@\@TINT_WINDOWS_EXECUTABLE\@\@\@/`cat tintexeb64`/ge' -i ./build/dist/tint/tntbuild
perl -pe 's/\@\@\@TINT_OSX_EXECUTABLE\@\@\@/`cat tintb64`/ge' -i ./build/dist/tint/tntbuild
cp ./build/dist/tint/tntbuild ./build/dist/tint/tntbuild.js
cp ./tools/compiler/tntbuild.cmd ./build/dist/tint/tntbuild.cmd
rm ./build/tmp1
rm tintexeb64
rm tintb64

if [ -f "./build/tint-$TINT_VERSION.zip" ]; then
	rm ./build/dist/tint-$$TINT_VERSION.zip
fi

# Create a generic zip file.
cd ./build/dist/
zip tint-$TINT_VERSION.zip -r tint/*
cd ../..

# Create an OSX package installer
rm -rf ./build/.osx-pkg-dist/
mkdir ./build/.osx-pkg-dist/
mkdir ./build/.osx-pkg-dist/usr/
mkdir ./build/.osx-pkg-dist/usr/local/
mkdir ./build/.osx-pkg-dist/usr/local/bin/
cp -a ./build/xcode/Release/tint ./build/.osx-pkg-dist/usr/local/bin/
cp -a ./build/dist/tint/tntbuild ./build/.osx-pkg-dist/usr/local/bin/
rm tools/welcome_tmp.txt

if [ -f "./build/tint.pkg" ]; then
	rm ./build/dist/tint.pkg
fi
echo "Tint $TINT_VERSION" > tools/welcome_tmp.txt
echo "" >> tools/welcome_tmp.txt
cat tools/welcome.txt >> tools/welcome_tmp.txt
pkgbuild --root ./build/.osx-pkg-dist/ --identifier com.trueinteractions.tint --install-location=/ ./build/dist/tint.pkg
productbuild --product tools/osx-pkg-reqs.xml --package-path ./build/dist/ --distribution tools/osx-pkg-dist.xml --resources tools --identifier com.trueinteractions.tint ./build/dist/tint-$TINT_VERSION.pkg

rm ./build/dist/tint.pkg
rm -rf ./build/.osx-pkg-dist/
rm tools/welcome_tmp.txt


read -p "Run tools/msi.bat on Windows... "

# See if we should post these.
# if [ "$TINT_HOST" = "" -o "$TINT_PATH" = "" -o "$TINT_USER" = ""]; then
#	echo "Not uploading to server, could not find destination information."
#	echo "To send directly to server define env vars TINT_HOST, TINT_PATH, and TINT_USER"
#	exit 1
# else
#	scp ./build/dist/tint-$TINT_VERSION.zip $TINT_USER@$TINT_HOST:$TINT_PATH
# fi
