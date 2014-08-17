process.bridge = require('../../../nodobjc');
process.bridge.import('Foundation');
process.bridge.import('Quartz');
process.bridge.import('Cocoa');
process.bridge.import('AppKit');
process.bridge.import('CoreGraphics');
require('Application');

var $ = process.bridge;
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var args = require('minimist');
var grayedOutBegin = '\033[90m';
var brightRedBegin = '\033[31m'
var brightBlueBegin = '\033[36m'
var colorEnd = '\033[0m';
var successMark = '✓';
var failureMark = '✕';
var currentTest = null;
var createBaseline = false;
var ex = {};

//try {
	ex.assert = function assert(condition,value) {
		if(!condition) {
			var msg;
			try { throw new Error(value ? value : ''); } catch(e) { msg = e; };
			console.log('assertion failed.');
			console.error(msg.message);
			console.error(msg.stack);
			process.exit(1);
		}
	}
	ex.disableCrashReporter = function disableCrashReporter() { 
		exec('defaults write com.apple.CrashReporter DialogType none');
	}
	ex.enableCrashReporter = function enableCrashReporter() {
		exec('defaults write com.apple.CrashReporter DialogType crashreport');
	}
	/*
	   kCGEventNull                = NX_NULLEVENT,
	   kCGEventLeftMouseDown       = NX_LMOUSEDOWN,
	   kCGEventLeftMouseUp         = NX_LMOUSEUP,
	   kCGEventRightMouseDown      = NX_RMOUSEDOWN,
	   kCGEventRightMouseUp        = NX_RMOUSEUP,
	   kCGEventMouseMoved          = NX_MOUSEMOVED,
	   kCGEventLeftMouseDragged    = NX_LMOUSEDRAGGED,
	   kCGEventRightMouseDragged   = NX_RMOUSEDRAGGED,
	   kCGEventKeyDown             = NX_KEYDOWN,
	   kCGEventKeyUp               = NX_KEYUP,
	   kCGEventFlagsChanged        = NX_FLAGSCHANGED,
	   kCGEventScrollWheel         = NX_SCROLLWHEELMOVED,
	   kCGEventTabletPointer       = NX_TABLETPOINTER,
	   kCGEventTabletProximity     = NX_TABLETPROXIMITY,
	   kCGEventOtherMouseDown      = NX_OMOUSEDOWN,
	   kCGEventOtherMouseUp        = NX_OMOUSEUP,
	   kCGEventOtherMouseDragged   = NX_OMOUSEDRAGGED,
	   kCGEventTapDisabledByTimeout = 0xFFFFFFFE,
	   kCGEventTapDisabledByUserInput = 0xFFFFFFFF
	*/
	/*ex.screenShotAt = function screenShotAt(x,y) {
		console.log('trying.... ugh. taking a screen shot at x, y ', x, y);
		var point = $.CGPointMake(x, y);
		$.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
		$.CGEventCreateKeyboardEvent(null,0x37,true); // cmd
		$.CGEventCreateKeyboardEvent(null,0x38,true); // shift
		$.CGEventCreateKeyboardEvent(null,0x15,true); // 4

		$.CGEventCreateKeyboardEvent(null,0x37,false); // cmd
		$.CGEventCreateKeyboardEvent(null,0x38,false); // shift
		$.CGEventCreateKeyboardEvent(null,0x15,false); // 4
	}*/
	ex.clickAt = function clickAt(x,y) {
		var point = $.CGPointMake(x, y);
		$.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, point, 0));
		$.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, point, 0));
		$.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, point, 0));

	}
	ex.writeImage = function writeImage(image, path) {
	 	var url = $.NSURL('fileURLWithPath',$(path));
	 	var pathcf = $.CFStringCreateWithCString($.kCFAllocatorDefault,"public.png",$.kCFStringEncodingASCII);
	    var destination = $.CGImageDestinationCreateWithURL(url, pathcf, 1, null);
	    $.CGImageDestinationAddImage(destination, image, null);

	    if (!$.CGImageDestinationFinalize(destination)) {
	        $.NSLog($("Failed to write image to %@"), $(path));
	    }
	}
	ex.takeSnapshotOfTopWindow = function takeSnapshotOfTopWindow(path) {
		var image = $.CGWindowListCreateImage($.CGRectNull, $.kCGWindowListExcludeDesktopElements, 1, $.kCGWindowImageDefault);
		this.writeImage(image, path);
	}
	ex.takeSnapshotOfWindowNumber = function takeSnapshotOfWindowNumber(windowNumber, path) {
		var image = $.CGWindowListCreateImage($.CGRectNull, $.kCGWindowListOptionIncludingWindow | ($.kCGWindowListOptionOnScreenAboveWindow ^ $.kCGWindowListExcludeDesktopElements), windowNumber, $.kCGWindowImageDefault);
		this.writeImage(image, path);
	}
	ex.takeSnapshotOfCurrentWindow = function takeSnapshotOfCurrentWindow(path) {
		var currentWindow = $.NSApplication('sharedApplication')('mainWindow');
		if(currentWindow == null) throw new Error('There is no current window.');
		var windowNumber = currentWindow('windowNumber');
		this.takeSnapshotOfWindowNumber(windowNumber, path);
	}
	function spawnAndPump(cmd, cb, err, options) {
		var cmds = cmd.split(' ');
		var child = spawn(cmds[0], cmds.slice(1), { stdio: 'inherit' }).on('exit',function(code, signal) {
			if(code !== 0) {
				console.error(brightRedBegin+failureMark+colorEnd+' ["'+cmd.replace(new RegExp('\n','g'),'')+'"]\n\texited abnormally: '+code+' signal: '+signal);
				if(err) err(code,signal);
			} else {
				if(cb) cb();
			}
		});
		return child;

	}
	function execAndPump(cmd, cb, err, options) {
		var child =exec(cmd, options, function(error,stdout,stderr) { 
			if(error || stderr) {
				console.log('got error');
				if(error) console.error('\t',error);
				if(stderr) console.error('\t',stderr);
				//throw new Error('Tests failed, a test error occured.')
			} else if(stdout)
				console.log(stdout);
		}).on('exit',function(code, signal) {
			if(code !== 0) {
				console.error(brightRedBegin+failureMark+colorEnd+' ["'+cmd.replace(new RegExp('\n','g'),'')+'"]\n\texited abnormally: '+code+' signal: '+signal);
				if(err) err(code,signal);
			} else {
				if(cb) cb();
			}
		});
		return child;
	}

	function setupShell(name, cmd) {
		execAndPump("mkdir "+name+"-test", function() {
			execAndPump("cp -a -p ../Shell.app "+name+"-test", function() {
				execAndPump("cp -a -p ../build/Release/tint "+name+"-test/Shell.app/Contents/MacOS/Runtime", function() {
					execAndPump("cp "+name+".js ./"+name+"-test/Shell.app/Contents/Resources/test.js", function() {
						execAndPump("cat tools/shell-stub.js >> ./"+name+"-test/Shell.app/Contents/Resources/test.js", cmd, notok)
					}, notok);
				}, notok);
			}, notok);

		}, notok);
	}

	function runShell(name, cb, err, options) {
		spawnAndPump("./"+name+"-test/Shell.app/Contents/MacOS/Runtime ./"+name+"-test/Shell.app/Contents/Resources/test.js tests", cb, err, options);
	}
	function runBaseline(name, cb, err, options) {
		spawnAndPump("./"+name+"-test/Shell.app/Contents/MacOS/Runtime ./"+name+"-test/Shell.app/Contents/Resources/test.js baseline", cb, err, options);
	}
	function shutdownShell(name, cb) {
		execAndPump("rm -rf ./"+name+"-test/", cb, function() { console.error('*** FATAL *** Cannot cleanup!'); });
	}

	ex.ok = function ok() {
		if(currentTest.shell) shutdownShell(currentTest.name, function() {});
		process.stdout.write(brightBlueBegin + successMark + colorEnd + '\n');
		nextTest();
	}

	function notok(code) {
		if(currentTest.shell) shutdownShell(currentTest.name, function() { });
	}

	function nextTest() {
		if(inputs.length > 0)
			test(inputs.pop());
		else if (inputs.length == 0)
			process.exit(0);
	}

	function test(item) {
		currentTest = require('../'+item);
		process.stdout.write(grayedOutBegin + ' ' + currentTest.name + ' ' + colorEnd);

		if(currentTest.shell) {
			setupShell(currentTest.name,function() {
				if(createBaseline) runBaseline(currentTest.name,ex.ok,notok,currentTest.shell_options); 
				else runShell(currentTest.name,ex.ok,notok,currentTest.shell_options); 
			},notok);
		} else {
			try {
				if(createBaseline) {
					currentTest.setup();
					currentTest.baseline();
					currentTest.shutdown();
				} else {
					currentTest.setup();
					currentTest.run(ex);
					currentTest.shutdown();
				}
			} catch(e) {
				notok();
				throw e;
				process.exit(code);
			}
		}
	}

	if(process.argv[2] != 'baseline' && process.argv[2] != 'tests') {
		var argv = args(process.argv.slice(2));
		if(argv.baseline == "true") createBaseline = true;
		var inputs = argv['_'];
		nextTest();
	}
//} catch(e) {
	// clean up
//	console.error(e);
//	process.exit(1);
//}


module.exports = ex;