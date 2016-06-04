var os = require('os');
var ismac = (os.platform().toLowerCase() === "darwin" || os.platform().toLowerCase() === "mac");
var $ = process.bridge.dotnet;

if(ismac) {
	process.exit(0);
}
function setup() {
  require('Common');
}

function baseline() {
}

function run($utils) {
	var a = $.System.String.Copy("Æ");
	var b = new Buffer($.System.String.Copy("Æ"));
	var c = new Buffer("Æ");
	console.assert(a.toString('utf8') === b.toString('utf8'), 'a does not equal b');
	console.assert(b.toString('utf8') === c.toString('utf8'), 'b does not equal c');
	$utils.ok();
}
function shutdown() {
}

module.exports = {
  setup:setup, 
  run:run, 
  shutdown:shutdown, 
  shell:false,
  timeout:50000,
  name:"Unicode",
};