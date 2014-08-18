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
 * @see {Dialog}
 * @example
 */
function run($utils) {
	var win = new Window();
	win.x = 0;
	win.y = 0;
	win.bringToFront();
	var dialog = new Dialog("open");
	dialog.title = "Dialog Title";
	dialog.message = "Message dialog";
	dialog.prompt = "PROMPT";
	dialog.allowMultiple = true;
	dialog.directory = "~/Pictures";
	dialog.allowFileTypes = ["jpg","png"];
	dialog.filename = "somefile.png";
	dialog.addEventListener('select', function() {
		console.log('selected values: ',dialog.selection);
	});
	dialog.addEventListener('cancel', function() {
		/* @hidden */ win.close();
		/* @hidden */ $utils.ok();
	});
	dialog.open(win);
	/* @hidden */ $utils.assert(dialog.title == "Dialog Title")
	/* @hidden */ $utils.assert(dialog.message == "Message dialog")
	/* @hidden */ $utils.assert(dialog.prompt == "PROMPT")
	/* @hidden */ $utils.assert(dialog.allowMultiple == true)
	/* @hidden */ $utils.assert(dialog.allowMultiple == true)
	/* @hidden */ $utils.assert(dialog.directory == "file:///Users/tlinton/Pictures/",dialog.directory);
	/* @hidden */ $utils.assert(dialog.filename == "somefile.png");
	/* @hidden */ $utils.assert(dialog.type == "open");
	/* @hidden */ setTimeout(function() {
	/* @hidden */ 	//$utils.takeSnapshotOfCurrentWindow('assets/dialog_mac.png');
	/* @hidden */ 	dialog.cancel();
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
	name:"Dialog"
};