
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
	var spawn = require('child_process').spawn,
    	resc  = spawn(ismac ? '../build/xcode/Release/tint' : '..\\build\\msvs\\Release\\tint.exe' , 
        ['../tools/compiler/tntbuild.js','--no-windows-build','--osx-runtime=../build/xcode/Release/tint','--out=./packagetestfail-build/','./packagetestfail/package.json']
        );
	resc.on('close', function (code, signal) {
  		$utils.assert(code === 1);
      if(ismac) {
        var rmdir = spawn('rm', ['-rf', './packagetestfail-build/']);
        rmdir.on('close', function(code, signal) {
          $utils.assert(code === 0);
          $utils.ok();
        });
      } else {
        var rmdir = spawn('rmdir', ['/S', '.\\packagetestfail-build\\']);
        rmdir.on('close', function(code, signal) {
          $utils.assert(code === 0);
          $utils.ok();
        });
      }
  		
	});
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
  name:"ResourcesCommandLine",
};