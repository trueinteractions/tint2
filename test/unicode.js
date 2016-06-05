var os = require('os');

function setup() {
  require('Common');
}

function baseline() {
}

function run($utils) {
	var ismac = (os.platform().toLowerCase() === "darwin" || os.platform().toLowerCase() === "mac");
	var c = new Buffer("Æ");
	if(!ismac) {
		var $ = process.bridge.dotnet;
		var a = $.System.String.Copy("Æ");
		var b = new Buffer($.System.String.Copy("Æ"));
		console.assert(a.toString('utf8') === b.toString('utf8'), 'a does not equal b');
		console.assert(b.toString('utf8') === c.toString('utf8'), 'b does not equal c');
	}
	var d = "Æ";
	console.assert(c.toString('utf8') === d, 'Ensure c equals d');
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