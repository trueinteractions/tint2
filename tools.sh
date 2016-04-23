#!/bin/bash

if [ "$1" == "config" ]; then
  git apply --whitespace=fix build/node.diff
  if [ $CC ]; then
    echo "Warning using a pre-set compiler $CC"
  fi
  if [ ! $PYTHON ]; then
     PYTHON=`which python`;
  fi
  if [ ! -f "./libraries/node/" ]; then
    git submodule init
    git submodule update
  fi
  if [ "$(uname)" == "Darwin" ]; then
    $PYTHON ./tools/tint_conf.py --subsystem=console --without-snapshot --dest-cpu=x64 --xcode --tag= > /dev/null
  else
    # sudo apt-get install build-essential
    # sudo apt-get install clang
    # sudo apt-get install ninja-build
    # sudo apt-get install libgtk-3-dev
    $PYTHON ./tools/tint_conf.py --subsystem=console --without-snapshot --dest-cpu=x64 --ninja --tag= > /dev/null
  fi
elif [ "$1" == "build" ]; then
  if [ "$2" == "debug" ]; then
    CONFIG="Debug"
  else
    CONFIG="Release"
  fi
  if [ "$(uname)" == "Darwin" ]; then
    xcodebuild -configuration $CONFIG -project build/xcode/tint.xcodeproj build
  elif [ "$(uname)" == "Linux" ]; then
    ninja -C build/linux/$CONFIG
  elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
    cmd tools.bat $CONFIG build
  else
    echo "Your platform is unfortunately not supported right now."
  fi
elif [ "$1" == "clean" ]; then
  rm -rf ./build/msvs/
  rm -rf ./build/ninja/
  rm -rf ./build/xcode/
  rm -rf ./build/linux/
  rm -rf ./build/Release/
  rm -rf ./build/Debug/
  rm -rf ./build/out/
  rm -rf ./build/tint.build
  rm -rf ./build/dist/tint
elif [ "$1" == "test" ]; then
  cd test
  ./run.sh *.js
elif [ "$1" == "dist" ]; then

  if [ ! -f "./build/xcode/Release/tint" ]; then
    echo "An OSX build is required for release"
    exit 1;
  fi

  gcc -DBUILD_AS_TOOL -x c tools/tint_version.h -o ./build/xcode/Release/tint_version
  export TINT_VERSION=`./build/xcode/Release/tint_version`

  if [ ! -f "./build/msvs/Release/tint_console.exe" ]; then
    read -p "Run 'tools.bat build' on Windows... "
    if [ ! -f "./build/msvs/Release/tint_console.exe" ]; then
      echo "Cannot find WIN64 console binary for tint, exiting."
      exit 1
    fi
  fi
  if [ ! -f "./build/msvs/Release/tint_windows.exe" ]; then
    read -p "Run 'tools.bat config gui & tools.bat build gui' on Windows... "
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
  codesign -s "$1" ./build/dist/tint/tint
  cp -a ./build/msvs/Release/tint_console.exe ./build/dist/tint/tint.exe
  mkdir ./build/dist/tint/test
  cp -a ./test/*.js ./build/dist/tint/test
  cp -a ./test/tools ./build/dist/tint/test/tools
  cp -a ./test/assets ./build/dist/tint/test/assets
  cp -a test/run.sh ./build/dist/tint/test
  cp -a test/run.bat ./build/dist/tint/test
  cp -a tools/compiler/tntbuild.js ./build/dist/tint/tntbuild
  cp -a tools/tntdbg ./build/dist/tint/tntdbg
  chmod +x ./build/dist/tint/tntbuild
  cat ./build/xcode/Release/tint | openssl base64 | tr -d '\n' > tintb64
  cat ./build/msvs/Release/tint_windows.exe | openssl base64 | tr -d '\n' > tintexeb64
  cat ./tools/msvcp120.dll | openssl base64 | tr -d '\n' > msvcp120b64
  cat ./tools/msvcr120.dll | openssl base64 | tr -d '\n' > msvcr120b64
  perl -pe "s/\@\@\@TINT_VERSION\@\@\@/'$TINT_VERSION'/ge" -i ./build/dist/tint/tntbuild
  perl -pe 's/\@\@\@TINT_WINDOWS_EXECUTABLE\@\@\@/`cat tintexeb64`/ge' -i ./build/dist/tint/tntbuild
  perl -pe 's/\@\@\@TINT_OSX_EXECUTABLE\@\@\@/`cat tintb64`/ge' -i ./build/dist/tint/tntbuild
  perl -pe 's/\@\@\@TINT_WINDOWS_EXECUTABLE_MSVCP120\@\@\@/`cat msvcp120b64`/ge' -i ./build/dist/tint/tntbuild
  perl -pe 's/\@\@\@TINT_WINDOWS_EXECUTABLE_MSVCR120\@\@\@/`cat msvcr120b64`/ge' -i ./build/dist/tint/tntbuild
  cp ./build/dist/tint/tntbuild ./build/dist/tint/tntbuild.js
  cp ./tools/compiler/tntbuild.cmd ./build/dist/tint/tntbuild.cmd
  cp ./tools/compiler/tntdbg.cmd ./build/dist/tint/tntdbg.cmd
  if [ -f "./build/tmp1" ]; then
    rm ./build/tmp1
  fi
  rm tintexeb64
  rm tintb64
  rm msvcp120b64
  rm msvcr120b64

  if [ -f "./build/tint-$TINT_VERSION.zip" ]; then
    rm ./build/dist/tint-$$TINT_VERSION.zip
  fi

  # Create a generic zip file.
  cd ./build/dist/
  zip tint-$TINT_VERSION.zip -r tint/*
  cd ../..

  export DEVELOPERID="`security find-identity -p codesigning -v | grep "Developer ID Application" | sed 's/.*"\(.*\)"[^"]*$/\1/'`"
  export INSTALLERID="`security find-identity -p macappstore -v | grep "Developer ID Installer" | sed 's/.*"\(.*\)"[^"]*$/\1/'`"

  # Create an OSX package installer
  rm -rf ./build/.osx-pkg-dist/
  mkdir ./build/.osx-pkg-dist/
  mkdir ./build/.osx-pkg-dist/usr/
  mkdir ./build/.osx-pkg-dist/usr/local/
  mkdir ./build/.osx-pkg-dist/usr/local/bin/
  cp -a ./build/xcode/Release/tint ./build/.osx-pkg-dist/usr/local/bin/
  codesign -s "$DEVELOPERID" ./build/.osx-pkg-dist/usr/local/bin/tint
  cp -a ./build/dist/tint/tntbuild ./build/.osx-pkg-dist/usr/local/bin/

  codesign -s "$DEVELOPERID" ./build/.osx-pkg-dist/usr/local/bin/tntbuild
  cp -a ./build/dist/tint/tntdbg ./build/.osx-pkg-dist/usr/local/bin/

  codesign -s "$DEVELOPERID" ./build/.osx-pkg-dist/usr/local/bin/tntdbg
  rm -rf ./build/dist/tint.pkg

  if [ -f "tools/welcome_tmp.txt" ]; then
    rm tools/welcome_tmp.txt
  fi
  if [ -f "./build/tint.pkg" ]; then
    rm ./build/dist/tint.pkg
  fi

  echo "Tint $TINT_VERSION" > tools/welcome_tmp.txt
  echo "" >> tools/welcome_tmp.txt
  cat tools/welcome.txt >> tools/welcome_tmp.txt
  pkgbuild --root ./build/.osx-pkg-dist/ --identifier com.trueinteractions.tint --install-location=/ --sign="$INSTALLERID" ./build/dist/tint.pkg
  productbuild --product tools/osx-pkg-reqs.xml --package-path ./build/dist/ --distribution tools/osx-pkg-dist.xml --sign="$INSTALLERID" --resources tools --identifier com.trueinteractions.tint ./build/dist/tint-$TINT_VERSION-x64-osx.pkg

  rm ./build/dist/tint.pkg
  rm -rf ./build/.osx-pkg-dist/
  rm tools/welcome_tmp.txt

  codesign -s "$DEVELOPERID" ./build/dist/tint-$TINT_VERSION-x64-osx.pkg
  read -p "Run tools/msi.bat on Windows... "
  spctl --assess -vvvv --raw ./build/dist/tint-$TINT_VERSION-x64-osx.pkg
  mv ./build/dist/tint-$TINT_VERSION-x64.msi ./build/dist/tint-$TINT_VERSION-x64-win.msi

else
  echo "$0 config|build|test|clean|dist [debug|release]"
fi