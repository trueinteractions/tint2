$ = require('../../nodobjc');
$.import('Foundation',0);
$.import('Cocoa',0);
$.import('AppKit',0);
$.import('WebKit',0);
var pool = $.NSAutoreleasePool('alloc')('init');

require('../modules/Application/Application_mac.js');
Window = require('../modules/Window/Window_mac.js');
WebView = require('../modules/WebView/WebView_mac.js');
Menu = require('../modules/Menu/Menu_mac.js');
MenuItem = require('../modules/Menu/MenuItem_mac.js');
Toolbar = require('../modules/Toolbar/Toolbar_mac.js');
Text = require('../modules/TextInput/TextInput_mac.js');
Button = require('../modules/Button/Button_mac.js');
Notification = require('../modules/Notification/Notification_mac.js');
require('../modules/Utilities/AppSchema_mac.js');

//NSFullSizeContentViewWindowMask
//segmentedControl.segmentStyle = NSSegmentStyleSeparated;

/** App Schema
 $.NSURLProtocol('registerClass',$.URLAppSchema('class'));
**/

application.addEventListener('launch', function() {
	
	/** Notifications
	var notify = new Notification();
	notify.title = "Title";
	notify.subtitle = "Sub-Title";
	notify.text = "Main text for the notify";
	notify.sound = true;
	notify.mainButtonLabel = "Main";
	notify.auxillaryButtonLabel = "Aux";
	notify.dispatch();
	**/

	/** Alerts & Attention
	var control = application.attention(true);
	setTimeout(function() { control.cancel(); },2000);
	**/

	/** Windows! **/
	this.mainWindow = new Window();
	this.mainWindow.maximizeButton = true;
	this.mainWindow.minimizeButton = true;
	this.mainWindow.closeButton = true;
	//TODO: Is this deprecated?
	//this.mainWindow.fullscreenButton = true;
	this.mainWindow.resizable = true;
	/** Background color for window example
	this.mainWindow.backgroundColor = 'rgba(0,0,0,0.2);';
	this.mainWindow.alpha=0.5;
	**/
	/** Making a transparent frame 
	this.mainWindow.backgroundColor = 'transparent';
	this.mainWindow.frame = false;
	this.mainWindow.alpha = 1;**/
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
	this.mainWindow.addEventListener('resize', function() {
		//console.log('window resize');
	});
	/** Controlling visibility and always on top!
	this.mainWindow.visible = false;
	console.assert(this.mainWindow.visible === false, 'Did not register as invisible.');
	console.assert(this.mainWindow.alwaysOnTop === false, 'Always on top 1 failed.');
	this.mainWindow.alwaysOnTop = true;
	console.assert(this.mainWindow.alwaysOnTop === true, 'Always on top failed.');
	**/
	
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
	/** Window states
	this.mainWindow.state = "maximized";
	this.mainWindow.state = "maximized";
	this.mainWindow.state = "minimized";
	**/

	/** WebViews **/
	this.webView = new WebView(this.mainWindow);
	/** Setting a user agent
	this.webView.useragent = 'Im a user agent.';
	console.assert(this.webView.useragent == 'Im a user agent.', 'user agent failed to set.');
	**/
	/** Making a webview transparent
	console.assert(this.webView.transparent === false, 'transparent is not false.');
	this.webView.transparent = true; 
	console.assert(this.webView.transparent === true, 'transparent is not true'); **/
	this.webView.location = 'http://www.google.com/';
	this.webView.addEventListener('load', function() { textfield.value=this.webView.location; }.bind(this));
	this.webView.addEventListener('unload', function() { });
	this.webView.addEventListener('request', function() { });
	this.webView.addEventListener('locationchange', function() { });
	this.webView.addEventListener('loading', function() { });
	this.webView.addEventListener('error', function() { });
	this.webView.addEventListener('cancel', function() { });
	this.webView.addEventListener('redirect', function() { });
	this.webView.addEventListener('title', function() { this.mainWindow.title = this.webView.title; }.bind(this));
	this.webView.width = 750;
	this.webView.height = 380;

	/**
	 * Posting to a page on a webview!
	this.webView.postMessage('HELLO'); **/
	this.mainWindow.appendChild(this.webView);
	//TODO: This isn't working, returning undefined.
	//console.log(this.mainWindow.actualWidth);
	//console.log(this.mainWindow.actualHeight);

	/** Menuing **/
	var appleMenu = new Menu("");
	var someSuperMenuItem = new MenuItem('');
	var someMenu = new Menu("About ");
	var someMenuItem = new MenuItem("HEY CHANTEL!","z");
	someMenuItem.addEventListener('click', function() { });
	someSuperMenuItem.submenu = someMenu;
	appleMenu.appendChild(someSuperMenuItem);
	someMenu.appendChild(someMenuItem);
	var someOtherSuperMenuItem = new MenuItem('','');
	var someMenu2 = new Menu("File");
	someOtherSuperMenuItem.submenu = someMenu2;
	var someMenuItem3 = new MenuItem("New","n","shift");
	someMenuItem3.addEventListener('click', function() { });
	appleMenu.appendChild(someOtherSuperMenuItem);
	someMenu2.appendChild(someMenuItem3);
	someMenuItem3.enabled = true;
	this.mainWindow.menu = appleMenu;


	/** Text Fields **/
	var textfield = new Text();
	textfield.addEventListener('input', function() {
	});
	textfield.addEventListener('inputend', function() {
		var url = textfield.value;
		if(url.indexOf(':') == -1) url = "http://"+url;
		this.webView.location = url;
		//TODO: causes mouse focus slip
		//textfield.alignment = 'center';
	});
	textfield.addEventListener('inputstart', function() {
		//TODO: causes mouse focus slip
		//textfield.alignment = 'left';
	});
	textfield.alignment = 'center';
	textfield.linewrap = false;
	textfield.scrollable = true;
	textfield.width = 400;
	textfield.widthMaximum = 450;
	textfield.widthMinimum = 20;
	textfield.widthCanResize = true;
	textfield.rightMarginCanResize = true;
	console.assert(textfield.width == 400, 'width not set');
	console.assert(textfield.widthMaximum == 450, 'widthMaximum not set');
	console.assert(textfield.widthMinimum == 20, 'widthMinimum not set');
	console.assert(textfield.widthCanResize === true, 'widthCanResize wasnt set!');
	console.assert(textfield.rightMarginCanResize === true, 'rightMarginCanResize wasnt set!');


	/** Buttons **/
	var backButton = new Button();
	backButton.image = 'back';
	backButton.addEventListener('click',function() { this.webView.back(); });
	var forwardButton = new Button();
	forwardButton.image = 'forward';
	forwardButton.addEventListener('click',function() { this.webView.forward(); });


	/** Toolbars **/
	var toolbar = new Toolbar();
	toolbar.appendChild(backButton);
	toolbar.appendChild(forwardButton);
	toolbar.appendChild("space");
	toolbar.appendChild(textfield);
	toolbar.appendChild("space");
	forwardButton.autosize();	
	backButton.autosize();
	this.mainWindow.toolbar = toolbar;
});
application.addEventListener('unload', function() { });
application.launch();
