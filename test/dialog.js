var fs = require('fs');
var logfile = __filename + '.log';
var fd = fs.openSync(logfile, 'w');
/**
 * @unit-test-setup
 * @ignore
 */
function setup() {
	global.Window = require('Window');
	global.Dialog = require('Dialog');
	fs.closeSync(2);
}

function baseline() {
}

/**
 * @see {Notification}
 * @example
 */
function run($utils) {
	var w = new Window();
	w.x = 0;
	w.y = 0;
	w.bringToFront();
	var d = new Dialog("open");
	d.title = "Dialog Title";
	d.message = "Message dialog";
	d.prompt = "PROMPT";
	d.allowMultiple = true;
	d.directory = "~/Pictures";
	d.allowFileTypes = ["jpg","png"];
	d.filename = "somefile.png";
	d.addEventListener('select', function() {
		console.log('selected values: ',d.selection);
	});
	d.addEventListener('cancel', function() {
		/* @hidden */ w.close();
		/* @hidden */ $utils.ok();
	});
	d.open(w);
	/* @hidden */ $utils.assert(d.title == "Dialog Title")
	/* @hidden */ $utils.assert(d.message == "Message dialog")
	/* @hidden */ $utils.assert(d.prompt == "PROMPT")
	/* @hidden */ $utils.assert(d.allowMultiple == true)
	/* @hidden */ $utils.assert(d.allowMultiple == true)
	/* @hidden */ $utils.assert(d.directory == "file:///Users/tlinton/Pictures/",d.directory);
	/* @hidden */ $utils.assert(d.filename == "somefile.png");
	/* @hidden */ $utils.assert(d.type == "open");
	/* @hidden */ setTimeout(function() {
	/* @hidden */ 	// $utils.takeSnapshotOfCurrentWindow('assets/dialog_mac.png');
	/* @hidden */ 	d.cancel();
	/* @hidden */ },2000);
}

/**
 * @unit-test-shutdown
 * @ignore
 */
function shutdown() {
	fs.closeSync(fd);
	var log = fs.readFileSync(logfile, 'utf8');
	fs.unlinkSync(logfile);
}

module.exports = {
	setup:setup, 
	run:run, 
	shutdown:shutdown, 
	shell:false,
	name:"Dialog",
};