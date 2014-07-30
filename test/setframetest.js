$ = require('../../nodobjc');
$.import('Foundation',0);
$.import('Cocoa',0);
$.import('AppKit',0);
$.import('WebKit',0);

require('../modules/Application/Application_mac.js');
Window = require('../modules/Window/Window_mac.js');
WebView = require('../modules/WebView/WebView_mac.js');
Menu = require('../modules/Menu/Menu_mac.js');
MenuItem = require('../modules/Menu/MenuItem_mac.js');
Toolbar = require('../modules/Toolbar/Toolbar_mac.js');
Text = require('../modules/TextInput/TextInput_mac.js');
Button = require('../modules/Button/Button_mac.js');
Notification = require('../modules/Notification/Notification_mac.js');

application.addEventListener('launch', function() {
	// block level test.
	console.assert($.NSThread('isMainThread'),'Were not running in the main thread.');
	this.mainWindow = new Window();
	this.mainWindow.addEventListener('enter-fullscreen', function() {
		//console.log('entering fullscreen');
	});
	this.mainWindow.addEventListener('leave-fullscreen', function() {
		//console.log('leave fullscreen');
	});
	this.mainWindow.addEventListener('focus', function() {
		//console.log('window focus');
	});
	this.mainWindow.addEventListener('blur', function() {
		//console.log('window blur');
	});
	this.mainWindow.addEventListener('minimize', function() {
		//console.log('window minimize');
	});
	this.mainWindow.addEventListener('restore', function() {
		//console.log('window restore');
	});
	this.mainWindow.addEventListener('move', function() {
		//console.log('window move');
	});
	this.mainWindow.addEventListener('close', function() {
		//console.log('window close');
	});

	//TODO: Garbage Collection may ruin us if we don't assign it to this?..
	this.webView = new WebView(this.mainWindow);
	//this.webView.useragent = 'Im a user agent.';

	this.webView.location = 'http://www.google.com/';
	//console.assert(this.webView.useragent == 'Im a user agent.', 'user agent failed to set.');
	
	this.mainWindow.appendChild(this.webView);
	
	//TOOD: The width actually is a percentage of the containers parent width once placed.
	// if we prematurely set the width it affects the rendered size of the contained
	// elements.  This shouldn't happen, we may need to think of a better way of treating
	// styles.
	this.mainWindow.width = 750;
	this.mainWindow.height = 400;
	//this.mainWindow.widthMaximum = 1000;
	//this.mainWindow.widthMinimum = 200;
	//this.mainWindow.heightMaximum = 750;
	//this.mainWindow.heightMinimum = 200;

	//console.assert(this.mainWindow.titleVisible == true, 'title is not visible');
	//this.mainWindow.titleVisible = false;
	//console.assert(this.mainWindow.titleVisible == false, 'title is visible');




	var $foo = $.NSTextField('alloc')('initWithFrame', $.NSMakeRect(0,0,200,20) );
	var z = $.NSMakeRect(0,0,200,20); //$foo('frame');
	z.size.width = 500;
	$foo('setFrame',z);
	var p = $foo('frame');
	console.assert(z.size.width == p.size.width, 'width was invalid: ',z.size.width,p.size.width);
	console.assert(z.size.height == p.size.height, 'height was invalid: ',z.size.height,p.size.height);
	console.assert(z.origin.x == p.origin.x, 'x was invalid: ',z.origin.x,p.origin.x);
	console.assert(z.origin.y == p.origin.y, 'y was invalid: ',z.origin.y,p.origin.y);
	console.log('passed');
});
application.launch();
// This is required to keep this object alive, and subsequent ones.
process.on('exit',function() { 
	application.mainWindow;
	application.webView;
});
