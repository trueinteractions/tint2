// dependencies
var ObjC = require('../../');
 
// ObjC dependencies
ObjC.import('Foundation');
ObjC.import('Cocoa');
ObjC.import('AppKit');
ObjC.import('QuartzCore');
 
// using ARC
var pool = ObjC.NSAutoreleasePool('new');
 
// application
var app  = ObjC.NSApplication('sharedApplication');
 
// show dock icon - to hide use: ObjC.NSApplicationActivationPolicyProhibited
app('setActivationPolicy', ObjC.NSApplicationActivationPolicyRegular);
 
// app name string
var appName = ObjC('TestApp');
 
var menuBar = ObjC.NSMenu('new')('autorelease');
var appMenuItem = ObjC.NSMenuItem('new')('autorelease');
menuBar('addItem', appMenuItem);
app('setMainMenu', menuBar);
 
var appMenu = ObjC.NSMenu('new')('autorelease');
var quitTitle = ObjC('Quit ')('stringByAppendingString', appName);
var quitMenuItem = ObjC.NSMenuItem('alloc')('initWithTitle', quitTitle, 'action', 'terminate:', 'keyEquivalent', ObjC('q'))('autorelease');
appMenu('addItem', quitMenuItem);
appMenuItem('setSubmenu', appMenu);
 
var styleMask = ObjC.NSTitledWindowMask | ObjC.NSClosableWindowMask; // | ObjC.NSResizableWindowMask;
var window = ObjC.NSWindow('alloc')('initWithContentRect', ObjC.NSMakeRect(0,0,400,400), 'styleMask', styleMask, 'backing', ObjC.NSBackingStoreBuffered, 'defer', false)('autorelease');
window('cascadeTopLeftFromPoint', ObjC.NSMakePoint(20,20));
window('setTitle', appName);
 
// set up the app delegate
var AppDelegate = ObjC.NSObject.extend('AppDelegate');
AppDelegate.addMethod('applicationDidFinishLaunching:', 'v@:@', function (self, _cmd, notif) {
	console.log('got applicationDidFinishLauching');
	console.log(notif);
});
AppDelegate.register();
 
var appDelegate = AppDelegate('alloc')('init');
app('setDelegate', appDelegate);
 
var RedRectView = ObjC.NSView.extend('RedRectView');
RedRectView.addMethod('drawRect:', [ObjC.void,[RedRectView,ObjC.selector,ObjC.NSRect]], function (self, _cmd, rect) {
	//console.log(self);
	ObjC.NSColor('redColor')('set');
	ObjC.NSRectFill(ObjC.NSMakeRect(0,0,100,100));
	//self.super('drawRect',rect);
	//RedRectView.getSuperclass()('drawRect', self);
});
RedRectView.register();
 
var redRectView = RedRectView('alloc')('initWithFrame', ObjC.NSMakeRect(0,0,100,100));
window('contentView')('addSubview', redRectView);
window('makeKeyAndOrderFront', window);
 
app('activateIgnoringOtherApps', true);
app('run');
 
pool('release');
