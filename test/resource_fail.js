
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
	var ismac = require('os').platform().toLowerCase() == "darwin";
  if(ismac) {
  	var spawn = require('child_process').spawn,
      	resc  = spawn('../build/xcode/Release/tint' , 
          ['../tools/compiler/tntbuild.js','--no-windows-build','--osx-runtime=../build/xcode/Release/tint','--out=./packagetestfail-build/','./packagetestfail/package.json']
          );
  	resc.on('close', function (code, signal) {
  		$utils.assert(code === 1);
      
        var rmdir = spawn('rm', ['-rf', './packagetestfail-build/']);
        rmdir.on('close', function(code, signal) {
          $utils.assert(code === 0);
          $utils.ok();
        });
    });

  } else {
    var spawn = require('child_process').spawn,
      resc  = spawn('..\\build\\msvs\\Release\\tint.exe' , 
        ['../tools/compiler/tntbuild.js','--no-osx-build','--windows-runtime=../build/msvs/Release/tint.exe','--out=./packagetestfail-build/','./packagetestfail/package.json']
        );
    resc.on('close', function (code, signal) {
      $utils.assert(code === 1);
      var rmdir = spawn('cmd', ['/C','rmdir','/Q','/S', '.\\packagetestfail-build\\'],{ stdio: 'inherit' });
      rmdir.on('close', function(code, signal) {
        $utils.assert(code === 0);
        $utils.ok();
      });
      rmdir.on('error', function(err) {
        console.log('rmdir: ', err);
        $utils.notok();
      });

    });
    resc.on('error', function(err) {
      console.log('resc error');
      
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
  name:"ResourcesCommandLineFail",
};