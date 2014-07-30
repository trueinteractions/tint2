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

//NSFullSizeContentViewWindowMask
//segmentedControl.segmentStyle = NSSegmentStyleSeparated;
//window.titleVisibility = NSWindowTitleHidden

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
		process.exit();
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
	this.mainWindow.widthMaximum = 1000;
	this.mainWindow.widthMinimum = 200;
	this.mainWindow.heightMaximum = 750;
	this.mainWindow.heightMinimum = 200;

	console.assert(this.mainWindow.titleVisible == true, 'title is not visible');
	this.mainWindow.titleVisible = false;
	console.assert(this.mainWindow.titleVisible == false, 'title is visible');
//	this.mainWindow.titleVisible = true;
//	console.assert(this.mainWindow.titleVisible == true, 'title is not visible');
	
	var appleMenu = new Menu("");
	var someSuperMenuItem = new MenuItem('');
	var someMenu = new Menu("About ");
	var someMenuItem = new MenuItem("HEyo","z");
	someMenuItem.addEventListener('click', function() {
	});
	someSuperMenuItem.submenu = someMenu;
	appleMenu.appendChild(someSuperMenuItem);
	someMenu.appendChild(someMenuItem);
	var someOtherSuperMenuItem = new MenuItem('','');
	var someMenu2 = new Menu("File");
	someOtherSuperMenuItem.submenu = someMenu2;
	var someMenuItem3 = new MenuItem("New","n","shift");
	someMenuItem3.addEventListener('click', function() {

	});
	appleMenu.appendChild(someOtherSuperMenuItem);
	someMenu2.appendChild(someMenuItem3);
	someMenuItem3.enabled = true;
	this.mainWindow.menu = appleMenu;
	application.paste();

	var textfield = new Text();
	textfield.addEventListener('input', function() {
	});
	textfield.addEventListener('inputend', function() {
		var url = textfield.text;
		if(url.indexOf(':') == -1) url = "http://"+url;
		this.webView.location = url;
		console.log('setting center');
		textfield.alignment = 'center';
	});
	textfield.addEventListener('inputstart', function() {
		console.log('setting left');
		//textfield.alignment = 'left';
	});

	textfield.alignment = 'center';
	textfield.linewrap = false;
	textfield.scrollable = true;
	var backButton = new Button();
	backButton.image = 'back';
	backButton.addEventListener('click',function() {
		this.webView.back();
	});

	var forwardButton = new Button();
	forwardButton.image = 'forward';
	forwardButton.addEventListener('click',function() {
		this.webView.forward();
	});

	var toolbar = new Toolbar();
	toolbar.appendChild(backButton);
	backButton.autosize();
	toolbar.appendChild(forwardButton);
	forwardButton.autosize();
	toolbar.appendChild("space");
	toolbar.appendChild(textfield);
	toolbar.appendChild("space");
	textfield.width = 400;
	textfield.widthMaximum = 450;
	textfield.widthMinimum = 20;
	textfield.widthCanResize = true;
	textfield.rightMarginCanResize = true;

	//console.assert(textfield.width == 350, 'width not set');
	//console.assert(textfield.widthMaximum == 450, 'widthMaximum not set');
	//console.assert(textfield.widthMinimum == 150, 'widthMinimum not set');
	//console.assert(textfield.widthCanResize === true, 'widthCanResize wasnt set!');
	//console.assert(textfield.rightMarginCanResize === true, 'rightMarginCanResize wasnt set!');


	this.webView.addEventListener('load', function() { textfield.text=this.webView.location; }.bind(this));
	this.webView.addEventListener('unload', function() { });
	this.webView.addEventListener('request', function() { });
	this.webView.addEventListener('locationchange', function() { });
	this.webView.addEventListener('loading', function() { });
	this.webView.addEventListener('error', function() { });
	this.webView.addEventListener('cancel', function() { });
	this.webView.addEventListener('redirect', function() { });
	this.webView.addEventListener('title', function() { this.mainWindow.title = this.webView.title; }.bind(this));
	
	console.assert(this.webView.transparent === false, 'transparent is not false.');
	//this.webView.transparent = true;
	//console.assert(this.webView.transparent === true, 'transparent is not true');

	this.mainWindow.toolbar = toolbar;
	this.mainWindow.maximizeButton = true;
	this.mainWindow.minimizeButton = true;
	this.mainWindow.closeButton = true;
	//TODO: Is this deprecated?
	//this.mainWindow.fullscreenButton = true;
	this.mainWindow.resizable = true;

	//this.mainWindow.backgroundColor = 'transparent';
	//this.mainWindow.frame = false;
	//this.mainWindow.alpha = 1;

	this.mainWindow.addEventListener('resize', function() {
		//console.log('window resize');
	});
	
	//this.mainWindow.frame = true;
	
	//setInterval(function() {
	//	this.webView.postMessage('HELLO');
	//}.bind(this),5000);

	//setTimeout(function() {
	//	this.mainWindow.frame = false;
	//}.bind(this),10000);
	
	//setTimeout(function() { 
		//this.mainWindow.state = "maximized";
		//this.mainWindow.state = "minimized";
		//this.mainWindow.backgroundColor = 'rgb(0,0,0)';
		
		//this.mainWindow.visible = false;
		//console.assert(this.mainWindow.visible === false, 'Did not register as invisible.');
		
		//console.assert(this.mainWindow.alwaysOnTop === false, 'Always on top 1 failed.');
		//this.mainWindow.alwaysOnTop = true;
		//console.assert(this.mainWindow.alwaysOnTop === true, 'Always on top failed.');
		
		//console.log('requesting attention');
		//var control = application.attention(true);
		//setTimeout(function() { control.cancel(); },2000);
	//}.bind(this),10000);

	//setTimeout(function() { 
		//this.mainWindow.state = "maximized";
		
		//this.mainWindow.visible = true;
		//console.log('making visible');
		//console.assert(this.mainWindow.visible === true, 'Did not register as visible.');
		
		//this.mainWindow.alwaysOnTop = false;
		//console.assert(this.mainWindow.alwaysOnTop === false, 'Always on top 2 failed.');
	//}.bind(this),15000);
	

	setTimeout(function() {
		var notify = new Notification();
		notify.title = "Title";
		notify.subtitle = "Sub-Title";
		notify.text = "Main text for the notify";
		notify.sound = true;
		notify.mainButtonLabel = "Main";
		notify.auxillaryButtonLabel = "Aux";
		notify.dispatch();
	},3000);
});
application.addEventListener('unload', function() { });
application.launch();
// This is required to keep this object alive, and subsequent ones.
process.on('exit',function() { 
	application.mainWindow;
	application.webView;
});
