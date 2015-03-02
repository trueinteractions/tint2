
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
	var ismac = require('os').platform().toLowerCase() === "darwin";
	var spawn = require('child_process').spawn,
    	resc  = spawn(ismac ? '../build/xcode/Release/tint' : '..\\build\\msvs\\Release\\tint.exe' , ['packagetest/lib/main.js']);

	resc.on('close', function (code, signal) {
  		$utils.assert(code === 0);
  		$utils.ok();
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