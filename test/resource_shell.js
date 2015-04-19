
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
  require('Common');
}

function baseline() {
}

function run($utils) {
  var fs = require('fs');
  var ismac = require('os').platform().toLowerCase() === "darwin";
  var spawn;
  if(ismac) {
    spawn  = require('child_process').spawn;
    var rescBuilder  = spawn('../build/xcode/Release/tint', 
        ['../tools/compiler/tntbuild.js','--no-windows-build','--osx-runtime=../build/xcode/Release/tint','--out=./packagetest-build/','./packagetest/package.json']
        ); //,{ stdio: 'inherit' }
    rescBuilder.on('close', function (code, signal) {
        $utils.assert(code === 0, 'expected code to be 0 but it was: ', code);
        $utils.assert(fs.existsSync('./packagetest-build/'));
        $utils.assert(fs.existsSync('./packagetest-build/MacOS X/shortname.app/Contents/MacOS/Runtime'));
        var resc = spawn('./packagetest-build/MacOS X/shortname.app/Contents/MacOS/Runtime', []);
        resc.on('close', function(code, signal) {
          $utils.assert(code === 0);
          var rmdir = spawn('rm', ['-rf', './packagetest-build/']);
          var rmpkg = spawn('rm', ['-rm','packagebuild.result']);
          rmdir.on('close', function (code, signal) {
            $utils.assert(code === 0);
            $utils.assert(!fs.existsSync('./packagetest-build/'));
            $utils.ok();
          });
          rmdir.on('error', function(err) {
            console.log('error on rmdir');
            console.log(err);
            $utils.notok();
          });
        });

        resc.on('error', function(err) {
          console.log('error on resc');
          console.log(err);
          $utils.notok();
        });
    });
    rescBuilder.on('error', function(err) {
      console.log('error on resc builder');
      console.log(err);
      $utils.notok();
    });
  } else {
    spawn  = require('child_process').spawn,
    rescBuilder  = spawn('..\\build\\msvs\\Release\\tint.exe', 
        ['..\\tools\\compiler\\tntbuild.js','--no-osx-build','--windows-runtime=..\\build\\msvs\\Release\\tint_windows.exe','--out=.\\packagetest-build\\','.\\packagetest\\package.json']
        ); //  ,{ stdio: 'inherit' }
    rescBuilder.on('close', function (code, signal) {
        //$utils.assert(code === 0, 'expected code to be 0 but it was: ', code);
        $utils.assert(fs.existsSync('.\\packagetest-build\\'));
        $utils.assert(fs.existsSync('.\\packagetest-build\\Windows\\shortname.exe'));
        var resc = spawn('cmd',['/C','.\\packagetest-build\\Windows\\shortname.exe'], { stdio: 'inherit' });
        resc.on('close', function(code, signal) {
          var res = fs.readFileSync('packagebuild.result');
          $utils.assert(res.toString() === "0", 'Expected code to be 0, instead it was: '+res.toString());
          var rmdir = spawn('cmd', ['/C','rmdir','/Q','/S', '.\\packagetest-build\\']);
          var rmpkg = spawn('cmd', ['/C','del','.\\packagebuild.result']);
          rmdir.on('close', function (code, signal) {
            $utils.assert(code === 0);
            $utils.assert(!fs.existsSync('..\\..\\packagetest-build\\'));
            $utils.ok();
          });
          rmdir.on('error', function(err) {
            console.log('error on rmdir');
            console.log(err);
            $utils.notok();
          });

        });
        resc.on('error', function(err) {
          console.log('error on resc');
          console.log(err);
          $utils.notok();
        });
    });
    rescBuilder.on('error', function(err) {
      console.log('error on resc builder');
      console.log(err);
      $utils.notok();
    });
  }

}

/**
 * @unit-test-shutdown
 * @ignore
 */
function shutdown() {
}

module.exports = {
  setup:setup, 
  run:run, 
  shutdown:shutdown, 
  shell:false,
  timeout:50000,
  name:"ResourcesShell",
};