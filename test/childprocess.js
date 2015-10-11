
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
  // This is a manual test
  $utils.skip('manual');
  var fs = require('fs');
  var path = require('path');
  var ismac = (require('os').platform().toLowerCase() === "darwin" || require('os').platform().toLowerCase() === "mac");
  var spawnSync = require('child_process').spawnSync;
  var spawn = require('child_process').spawn;
  if(ismac) {
    var tintBundle = path.join(process.cwd(), '../build/xcode/Release/tint');
    var tintRuntime = path.join(process.cwd(), './childprocess.app/Contents/MacOS/Runtime');
    console.log('tint bundle: ', tintBundle);
    console.log('tint runtime: ', tintRuntime);
    var result = spawnSync('cp', [tintBundle, tintRuntime]);

    var resc = spawn(tintRuntime, [], { stdio: 'inherit' });
    resc.on('close', function(code, signal) {
      var rmdir = spawn('rm', ['-rf', tintRuntime]);
      $utils.assert(code === 0, 'The process exited with the code: '+code);
      rmdir.on('close', function (code, signal) {
        $utils.assert(code === 0);
        $utils.assert(!fs.existsSync(tintRuntime));
        $utils.ok();
      });
      rmdir.on('error', function(err) {
        console.log('error on rmdir');
        console.log(err);
        $utils.notok();
      });
    });
    resc.on('error', function(err) {
      console.log('error on exec');
      console.log(err);
      $utils.notok();
    });
  } else {
    spawnSync('cmd',['/C','copy', '..\\build\\msvs\\Release\\tint_windows.exe', '.\\childprocess.app\\Contents\\Runtime.exe'], { stdio: 'inherit' });
    var resc = spawn('./childprocess.app/Contents/Runtime.exe', { stdio: 'inherit' });
    resc.on('close', function(code, signal) {
      var rmpkg = spawn('cmd', ['/C','del','.\\childprocess.app\\Contents\\Runtime.exe']);
      $utils.assert(code === 0, 'Expected code to be 0, instead it was: '+code);
      rmdir.on('close', function (code, signal) {
        $utils.assert(code === 0);
        $utils.assert(!fs.existsSync('.\\childprocess.app\\Contents\\Runtime.exe'));
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
  name:"ChildProcess",
};