var $ = require('../');
var memwatch = require('memwatch');
var hd = new memwatch.HeapDiff();
var hrstart = ( process.hrtime ? process.hrtime() : Date.now() )
$.import('Foundation')
$.import('Cocoa')
$.import('WebKit')
$.import('AppKit')
$.import('CoreGraphics')
$.import('CoreFoundation')
$.import('DebugSymbols')
$.import('ScriptingBridge')
$.import('AVKit')
$.import('Accelerate')
$.import('AddressBook')
$.import('ApplicationServices')
$.import('Automator')
$.import('CFNetwork')
$.import('CalendarStore')
$.import('CoreAudio')
$.import('CoreAudioKit')
$.import('CoreData')
$.import('CoreMedia')
var hrend = ( process.hrtime ? process.hrtime(hrstart) : Date.now() );
var diff = hd.end();
if(process.hrtime) {
	process.stdout.write("\033[90m memory ["+diff.change.size_bytes+' bytes]');
	process.stdout.write(" time ["+hrend[0]+"s "+(hrend[1]/1000000)+" ms] \033[0m");
} else {
	process.stdout.write("\033[90m memory ["+diff.change.size_bytes+' bytes]');
	process.stdout.write(" time ["+((hrend - hrstart)/1000)+" s] \033[0m");
}