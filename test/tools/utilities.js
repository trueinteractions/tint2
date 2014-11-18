require('Application');

var os = require('os');
var fs = require('fs');
var ismac = os.platform().toLowerCase() == "darwin";
var log = null;
var exit = null;
var isappveyor = process.env['APPVEYOR'] ? true : false;
var debugappveyor = true;
var debug = debugappveyor && isappveyor;

if(ismac) {
  process.bridge.objc.import('Foundation');
  process.bridge.objc.import('Quartz');
  process.bridge.objc.import('Cocoa');
  process.bridge.objc.import('AppKit');
  process.bridge.objc.import('CoreGraphics');
  var $ = process.bridge.objc;
  var successMark = '✓';
  var failureMark = '✕';
  var nl = '\n';
  log = function(e) { process.stdout.write(e); };
  exit = function(code) { process.exit(code); };
} else {
  var $ = process.bridge.dotnet;
  var successMark = 'Pass';
  var failureMark = 'Fail';
  var $w32 = process.bridge.win32;
  var nl = '\r\n';
  log = function(e) {
    e = e.toString();
    while(e.length > 512) {
      fs.writeSync(1, e.substring(0,512));
      e = e.substring(512);
    }
    fs.writeSync(1, e);
  }
  exit = function(code) {
    fs.writeSync(1, ''); // fix for appveyor
    fs.writeSync(2, '');  // fix for appveyor
    //fs.fsyncSync(1);
    //fs.fsyncSync(2);
    process.exit(code);
  }
}

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var args = require('./minimist');
var grayedOutBegin = '\033[90m';
var brightRedBegin = '\033[31m'
var brightBlueBegin = '\033[36m'
var colorEnd = '\033[0m';
var currentTest = null;
var createBaseline = false;
var ex = {};
var tintexec;


if (ismac) {
    function convertBoundsToCGPoint(p) {
      return p;
    }
    ex.disableCrashReporter = function disableCrashReporter() { 
      exec('defaults write com.apple.CrashReporter DialogType none');
    }
    ex.enableCrashReporter = function enableCrashReporter() {
      exec('defaults write com.apple.CrashReporter DialogType crashreport');
    }
    ex.keyCodeFromChar = function keyCodeFromChar(keyString)
    {
      switch(keyString) {
        case "a": return 0;
        case "s": return 1;
        case "d": return 2;
        case "f": return 3;
        case "h": return 4;
        case "g": return 5;
        case "z": return 6;
        case "x": return 7;
        case "c": return 8;
        case "v": return 9;
        // what is 10?
        case "b": return 11;
        case "q": return 12;
        case "w": return 13;
        case "e": return 14;
        case "r": return 15;
        case "y": return 16;
        case "t": return 17;
        case "1": return 18;
        case "2": return 19;
        case "3": return 20;
        case "4": return 21;
        case "6": return 22;
        case "5": return 23;
        case "=": return 24;
        case "9": return 25;
        case "7": return 26;
        case "-": return 27;
        case "8": return 28;
        case "0": return 29;
        case "]": return 30;
        case "o": return 31;
        case "u": return 32;
        case "[": return 33;
        case "i": return 34;
        case "p": return 35;
        case "RETURN": return 36;
        case "l": return 37;
        case "j": return 38;
        case "'": return 39;
        case "k": return 40;
        case ";": return 41;
        case "\\": return 42;
        case ",": return 43;
        case "/": return 44;
        case "n": return 45;
        case "m": return 46;
        case ".": return 47;
        case "TAB": return 48;
        case "SPACE": return 49;
        case "`": return 50;
        case "BACK": return 51;
        case "ENTER": return 52;
        case "ESCAPE": return 53;
        // some more missing codes abound, reserved I presume, but it would
        // have been helpful for Apple to have a document with them all listed
        case ".": return 65;
        case "*": return 67;
        case "+": return 69;
        case "CLEAR": return 71;
        case "/": return 75;
        case "ENTER-NUM": return 76;  // numberpad on full kbd
        case "=": return 78;
        case "=": return 81;
        case "0": return 82;
        case "1": return 83;
        case "2": return 84;
        case "3": return 85;
        case "4": return 86;
        case "5": return 87;
        case "6": return 88;
        case "7": return 89;
        case "8": return 91;
        case "9": return 92;
        case "F5": return 96;
        case "F6": return 97;
        case "F7": return 98;
        case "F3": return 99;
        case "F8": return 100;
        case "F9": return 101;
        case "F11": return 103;
        case "F13": return 105;
        case "F14": return 107;
        case "F10": return 109;
        case "F12": return 111;
        case "F15": return 113;
        case "HELP": return 114;
        case "HOME": return 115;
        case "PGUP": return 116;
        case "DELETE": return 117;
        case "F4": return 118;
        case "END": return 119;
        case "F2": return 120;
        case "PGDN": return 121;
        case "F1": return 122;
        case "LEFT": return 123;
        case "RIGHT": return 124;
        case "DOWN": return 125;
        case "UP": return 126;
        default:
          return 0;
      }
    }
    ex.keyAtControl = function keyAtControl(input) {
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateKeyboardEvent(null, this.keyCodeFromChar(input), true));
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateKeyboardEvent(null, this.keyCodeFromChar(input), false));
    }
    ex.rightClickAtControl = function rightClickAtControl(control) {
      var bounds = control.boundsOnScreen;
      bounds.x = bounds.x + bounds.width/2;
      bounds.y = bounds.y + bounds.height/2;
      var point = $.CGPointMake(bounds.x, bounds.y);
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, convertBoundsToCGPoint(point), 0));
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventRightMouseDown, convertBoundsToCGPoint(point), 0));
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventRightMouseUp, convertBoundsToCGPoint(point), 0));
    }
    ex.scrollAt = function scrollAt(x, y, upOrDown) {
      var point = $.CGPointMake(x, y);
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, convertBoundsToCGPoint(point), 0));
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateScrollWheelEvent($.kCGScrollEventUnitPixel, 1, upOrDown));
    }
    ex.scrollAtControl = function scrollAtControl(control, upOrDown) {
      var bounds = control.boundsOnScreen;
      bounds.x = bounds.x + bounds.width/2;
      bounds.y = bounds.y + bounds.height/2;
      var point = $.CGPointMake(bounds.x, bounds.y);
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, convertBoundsToCGPoint(point), 0));
      var scrollEvent = $.CGEventCreateScrollWheelEvent(null, 1, 1, upOrDown);
      $.CGEventPost($.kCGHIDEventTap, scrollEvent);
    }
    ex.clickAtControl = function clickAtControl(control) {
      var bounds = control.boundsOnScreen;
      bounds.x = bounds.x + bounds.width/2;
      bounds.y = bounds.y + bounds.height/2;
      var point = $.CGPointMake(bounds.x, bounds.y);
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, convertBoundsToCGPoint(point), 0));
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, convertBoundsToCGPoint(point), 0));
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, convertBoundsToCGPoint(point), 0));
    }
    ex.clickAt = function clickAt(x,y) {
      var point = $.CGPointMake(x, y);
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, convertBoundsToCGPoint(point), 0));
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, convertBoundsToCGPoint(point), 0));
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp, convertBoundsToCGPoint(point), 0));
    }
    ex.rightClickAt = function rightClickAt(x,y) {
      var point = $.CGPointMake(x, y);
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventMouseMoved, convertBoundsToCGPoint(point), 0));
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventRightMouseDown, convertBoundsToCGPoint(point), 0));
      $.CGEventPost($.kCGHIDEventTap, $.CGEventCreateMouseEvent(null, $.kCGEventRightMouseUp, convertBoundsToCGPoint(point), 0));
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
    ex.takeSnapshotOfActiveScreen = function takeSnapshotOfActiveScreen(path) {
      var cgimage = $.CGWindowListCreateImage($.CGRectInfinite, $.kCGWindowListOptionAll, $.kCGNullWindowID, $.kCGWindowImageDefault);
      var bitmapRep = $.NSBitmapImageRep('alloc')('initWithCGImage',cgimage);
      var imageData = bitmapRep('representationUsingType',$.NSPNGFileType, 'properties', null);
      var base64String = imageData('base64EncodedStringWithOptions',0);
      return base64String;
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
    ex.setupShell = function setupShell(name, cmd) {
      execAndPump("mkdir "+name+"-test", function() {
        execAndPump("cp -a -p tools/Shell.app "+name+"-test", function() {
          execAndPump("cp -a -p "+tintexec+" "+name+"-test/Shell.app/Contents/MacOS/Runtime", function() {
            execAndPump("cp "+name+".js ./"+name+"-test/Shell.app/Contents/Resources/test.js", function() {
              execAndPump("cat tools/shell-stub.js >> ./"+name+"-test/Shell.app/Contents/Resources/test.js", cmd, notok)
            }, notok);
          }, notok);
        }, notok);
      }, notok);
    }

    ex.runShell = function runShell(name, cb, err, options) {
      spawnAndPump("./"+name+"-test/Shell.app/Contents/MacOS/Runtime ./"+name+"-test/Shell.app/Contents/Resources/test.js tests", cb, err, options);
    }
    ex.runBaseline = function runBaseline(name, cb, err, options) {
      spawnAndPump("./"+name+"-test/Shell.app/Contents/MacOS/Runtime ./"+name+"-test/Shell.app/Contents/Resources/test.js baseline", cb, err, options);
    }
    ex.shutdownShell = function shutdownShell(name, cb) {
      execAndPump("rm -rf ./"+name+"-test/", cb, function() { console.log('*** FATAL *** Cannot cleanup!'); });
    }
} // END MAC SPECIFIC CODE
else 
{ // BEGIN WINDOWS SPECIFIC CODE

    ex.keyCodeFromChar = function keyCodeFromChar(keyString)
    {
      var keys = {
        '\b':0x0008,
        '\t':0x0009,
        'TAB':0x0009,
        '\n':0x000D,
        'SHIFT':0x0010,
        'CONTROL':0x0011,
        'ALT':0x0012,
        'CAPSLOCK':0x0014,
        'PAUSE':0x0013,
        'ESC':0x001B,
        ':':0x0020,
        'PGUP':0x0021,
        'PGDN':0x0022,
        'UP':0x0026,
        'DOWN':0x0028,
        'DEL':0x002E,
        '0':0x0030,
        '1':0x0031,
        '2':0x0032,
        '3':0x0033,
        '4':0x0034,
        '5':0x0035,
        '6':0x0036,
        '7':0x0037,
        '8':0x0038,
        '9':0x0039,
        'a':0x0041,
        'b':0x0042,
        'c':0x0043,
        'd':0x0044,
        'e':0x0045,
        'f':0x0046,
        'g':0x0047,
        'h':0x0048,
        'i':0x0049,
        'j':0x004A,
        'k':0x004B,
        'l':0x004C,
        'm':0x004D,
        'n':0x004E,
        'o':0x004F,
        'p':0x0050,
        'q':0x0051,
        'r':0x0052,
        's':0x0053,
        't':0x0054,
        'u':0x0055,
        'v':0x0056,
        'w':0x0057,
        'x':0x0058,
        'y':0x0059,
        'z':0x005A,
        '0':0x0060,
        '1':0x0061,
        '2':0x0062,
        '3':0x0063,
        '4':0x0064,
        '5':0x0065,
        '6':0x0066,
        '7':0x0067,
        '8':0x0068,
        '9':0x0069,
        '*':0x006A,
        '+':0x006B,
        ',':0x006C,
        '-':0x006D,
        '.':0x006E,
        '/':0x006F,
        'F1':0x0070,
        'F2':0x0071,
        'F3':0x0072,
        'F4':0x0073,
        'F5':0x0074,
        'F6':0x0075,
        'F7':0x0076,
        'F8':0x0077,
        'F9':0x0078,
        'F10':0x0079,
        'F11':0x007A,
        'F12':0x007B,
        'LSHIFT':0x00A0,
        'RSHIFT':0x00A1,
        'LCONTROL':0x00A2,
        'RCONTROL':0x00A3,
        'LALT':0x00A4,
        'RALT':0x00A5,
        ':':0x00BA,
        '+':0x00BB,
        ',':0x00BC,
        '-':0x00BD,
        '.':0x00BE,
        '?':0x00BF,
        '~':0x00C0,
        '[':0x00DB,
        '\\':0x00DC,
        ']':0x00DD,
        '"':0x00DE,
        '!':0x00DF,
        '<':0x00E2,
        'RETURN':0x000D
      };
    return keys[keyString];
  }


  ex.keyAtControl = function keyAtControl(input) {
    if(debug) log('-- keyAtControl: '+input+' ');
    var key = ex.keyCodeFromChar(input);
    if(debug) log(key+' ');
    $w32.user32.keybd_event(key, 0, 0, 0);
    if(debug) log(' up ');
    $w32.user32.keybd_event(key, 0, 0x0002, 0);
    if(debug) log(' down\n');
  }
  ex.rightClickAtControl = function rightClickAtControl(control) {
    var z = control.boundsOnScreen;
    return ex.rightClickAt(Math.round(z.x + z.width/2) ,Math.round(z.y + z.height/2));
  }
  ex.scrollAt = function scrollAt(x, y, upOrDown) {
    if(debug) log('-- scrollAt: '+x+' '+y+' upOrDown '+upOrDown+'\n');
    ex.clickAt(x,y);
    if(upOrDown > 0) {
      ex.keyAtControl('UP');
      ex.keyAtControl('UP');
      ex.keyAtControl('UP');
      ex.keyAtControl('UP');
      ex.keyAtControl('UP');
      ex.keyAtControl('UP');
    }
    else {
      ex.keyAtControl('DOWN');
      ex.keyAtControl('DOWN');
      ex.keyAtControl('DOWN');
      ex.keyAtControl('DOWN');
      ex.keyAtControl('DOWN');
      ex.keyAtControl('DOWN');
    }
  }
  ex.scrollAtControl = function scrollAtControl(control, upOrDown) {
    if(debug) log('-- scrollAtControl\n');
    var z = control.boundsOnScreen;
    ex.scrollAt(Math.round(z.x + z.width/2) ,Math.round(z.y + z.height/2),upOrDown);
  }
  ex.clickAtControl = function clickAtControl(control) {
    if(debug) log('-- clickAtControl\n');
    var z = control.boundsOnScreen;
    return ex.clickAt(Math.round(z.x + z.width/2) ,Math.round(z.y + z.height/2));
  }
  ex.clickAt = function clickAt(x,y) {
    if(debug) log('-- clickAt '+x+' '+y+' ');
    var dpi = Screens.active.scaleFactor;
    var w = Screens.active.bounds.width;
    var h = Screens.active.bounds.height;
    if(debug) log(' dpi '+dpi+' ');
    //$w32.user32.ShowCursor(0); // On VM's we need to turn off the cursor
    //if(debug) log(' cursorhidden ');
    //$w32.user32.SetPhysicalCursorPos(Math.round(x*dpi),Math.round(y*dpi));
    //if(debug) log(' cursorposset('+(x*dpi)+','+(y*dpi)+') ');
    $w32.user32.mouse_event(0x8000|0x0001, Math.round(((x/w))*65535), Math.round(((y/h))*65535), 0, 0);  //MOUSEMOVE 
    $w32.user32.mouse_event(0x8000|0x0002, Math.round(((x/w))*65535), Math.round(((y/h))*65535), 0, 0);  //LMOUSEDOWN 
    if(debug) log(' lmousedown ');
    $w32.user32.mouse_event(0x8000|0x0004, Math.round(((x/w))*65535), Math.round(((y/h))*65535), 0, 0); //LMOUSEUP
    if(debug) log(' lmouseup\n');
    //$w32.user32.ShowCursor(1);
    //if(debug) log(' cursorshown ');
  }
  ex.rightClickAt = function rightClickAt(x,y) {
    var dpi = Screens.active.scaleFactor;
    //log('right clicking at: ('+x+','+y+') with desktop DPI: '+(96 * dpi));
    $w32.user32.ShowCursor(0); // On VM's we need to turn off the cursor
    $w32.user32.SetPhysicalCursorPos(Math.round(x*dpi),Math.round(y*dpi));
    $w32.user32.ShowCursor(1);
    $w32.user32.mouse_event(0x0008, 0, 0, 0, 0); //RMOUSEDOWN
    $w32.user32.mouse_event(0x0010, 0, 0, 0, 0); //RMOUSEUP
  }
  ex.writeImage = function writeImage(image, path) { }
  ex.takeSnapshotOfActiveScreen = function takeSnapshotOfActiveScreen(path) {
    var bounds = $.System.Windows.Forms.Screen.PrimaryScreen.Bounds;
    var screenBmp = new $.System.Drawing.Bitmap(bounds.Width, bounds.Height, $.System.Drawing.Imaging.PixelFormat.Format24bppRgb)
    var bmpGraphics = $.System.Drawing.Graphics.FromImage(screenBmp);
    bmpGraphics.CopyFromScreen(bounds.Left,bounds.Top, 0, 0, new $.System.Drawing.Size(bounds.Width,bounds.Height));
    var data = new $.System.IO.MemoryStream();
    screenBmp.Save(data,$.System.Drawing.Imaging.ImageFormat.Jpeg);
    var s = $.System.Convert.ToBase64String(data.ToArray());
    return s;
  }
  ex.takeSnapshotOfTopWindow = function takeSnapshotOfTopWindow(path) { }
  ex.takeSnapshotOfWindowNumber = function takeSnapshotOfWindowNumber(windowNumber, path) { }
  ex.takeSnapshotOfCurrentWindow = function takeSnapshotOfCurrentWindow(path) { }
  function setupShell(name, cmd) { /* Do nothing */ }
  function runShell(name, cb, err, options) { spawnAndPump(tintexec + " "+" name.js", cb, err, options); }
  function runBaseline(name, cb, err, options) { /* Do nothing */ }
  function shutdownShell(name, cb) { /* Do nothing */ }

} // END WINDOWS SPECIFIC CODE

ex.assert = function assert(condition,value) {
	if(!condition) {
		var msg;
		try { throw new Error(value ? value : ''); } catch(e) { msg = e; };
		log('assertion failed.');
		log(msg.message);
		log(msg.stack);
		exit(1);
	}
}
function spawnAndPump(cmd, cb, err, options) {
	var cmds = cmd.split(' ');
	var child = spawn(cmds[0], cmds.slice(1), { stdio: 'inherit' }).on('exit',function(code, signal) {
		if(code !== 0) {
			log(brightRedBegin+failureMark+colorEnd+' ["'+cmd.replace(new RegExp('\n','g'),'')+'"]'+nl+'\texited abnormally: '+code+' signal: '+signal);
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
			log('got error'+nl);
			if(error) log('\t'+error+nl);
			if(stderr) log('\t'+stderr+nl);
		} else if(stdout)
			log(stdout);
	}).on('exit',function(code, signal) {
		if(code != 0) {
			log(brightRedBegin+failureMark+colorEnd+' ["'+cmd.replace(new RegExp('\n','g'),'')+'"]'+nl+'\texited abnormally: '+code+' signal: '+signal);
			if(err) err(code,signal);
		} else {
			if(cb) cb();
		}
	});
	return child;
}
ex.ok = function ok() {
	if(currentTest.shell && ismac) ex.shutdownShell(currentTest.name, function() {});
	log(brightBlueBegin + successMark + colorEnd +nl);
  exit(0);
}
ex.fail = function fail() {
	log('explicit fail thrown'+nl);
  exit(1);
}
function notok(code) {
	if(currentTest.shell && ismac) {
		ex.shutdownShell(currentTest.name, function() { exit(1); });
	}
  log(brightRedBegin+failureMark+colorEnd+' notok:['+code+']'+nl);
  exit(1);
}
function test(item) {
	currentTest = require('../'+item);
	log(grayedOutBegin + ' ' + currentTest.name + ' ' + colorEnd);

	if(currentTest.shell && ismac) {
		ex.setupShell(currentTest.name,function() {
			if(createBaseline) ex.runBaseline(currentTest.name,ex.ok,notok,currentTest.shell_options); 
			else ex.runShell(currentTest.name,ex.ok,notok,currentTest.shell_options); 
		},notok);
	} else {
		try {
			currentTest.setup();
			currentTest.run(ex);
			currentTest.shutdown();
      if(currentTest.timeout) {
        setTimeout(function() {
          log('timeout exceeded.'+nl);
          log(ex.takeSnapshotOfActiveScreen(''));
          exit(1);
        }, 50000);
      }
		} catch(e) {
			notok(e.message);
		}
	}
}
ex.log = function(e) { log(e); }
if(process.argv[2] != 'baseline' && process.argv[2] != 'tests') {
  tintexec = process.argv[2];
	var argv = args(process.argv.slice(3));
	if(argv.baseline == "true") createBaseline = true;
	var inputs = argv['_'];
	test(inputs[0]);
}
ex.debug = debug;
module.exports = ex;

