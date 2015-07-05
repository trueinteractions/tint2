require('Common');
var assert = require('assert');
assert(process.argv.length === 2, 'The process had too many parameters: ' + JSON.stringify(process.argv));
var child = require('child_process');
var n = child.fork('test2.js' , ['hello']);
n.on('message', function(m) {
  assert(m.foo === 'bar', 'The returned message was invalid.');
  process.exit(0);
});
n.send({ hello: 'world' });


/*
require('Common');
var $ = process.bridge.dotnet;

  var mainWindow = new Window();
  mainWindow.visible = true;
  var input = new SelectInput();
  var input2 = new SelectInput();

  input.addItem('One');
  input.addItem('Two');
  input.addItem('Three');

  mainWindow.appendChild(input);
  mainWindow.appendChild(input2);

  input.top = 10;
  input.height = 20;
  input.left = 10;
  input.right = 10;
  input2.top = 60;
  input2.height = 20;
  input2.left = 10;
  input2.right = 10;
*/
/*
var before = $.System.GC.GetTotalMemory(true);
console.log('before: ', (before/(1024*1024)) );
var win = new Window();
win.on('blur', function() { console.log('blur'); });
win.on('focus', function() { console.log('focus'); });
win.visible = true;
setTimeout(function() {
  console.log('timeout');
  gc();
var after = $.System.GC.GetTotalMemory(true);
console.log('after: ', (after/(1024*1024)) );
console.log('diff: ', (after-before)/(1024*1024) );
console.log('node has: ', process.memoryUsage());
}, 1000);
*/
//var i=0;
//var s= null;
//setInterval(function() {
  //i++;
  //process.bridge.dotnet.System.Console.WriteLine("Hello " + i);
  //console.log('Hello ' + i);

  //process.bridge.dotnet.System.GC.Collect(0, process.bridge.dotnet.System.GCCollectionMode.Forced);
//},10);

/*
var $ = process.bridge.objc;
var $$ = process.bridge;

var getIdleTime = function() {
    debugger;
    console.log();
    var properties = $.alloc($$.ref.types.void).ref(),
        obj,
        masterPort = $.alloc($$.ref.types.void).ref(),
        iter = $.alloc($$.ref.types.void).ref(),
        curObj,
        KERN_SUCCESS = 0,
        MACH_PORT_NULL = 0;

    $.IOMasterPort(MACH_PORT_NULL, masterPort.ref());

    var ioSM = $.IOServiceMatching("IOHIDSystem");
    console.log(ioSM);
    $.IOServiceGetMatchingServices(masterPort, ioSM, iter.ref());
    if (iter.address() == 0) {
      console.log('iterator was null.');
        return -1;
    }
    else {
        curObj = $.IOIteratorNext(iter);
    }
    console.log('curObj: ', curObj, 'masterPort: ', masterPort, 'iterator: ', iter);
    var ioreturn = $.IORegistryEntryCreateCFProperties(curObj, properties.ref(), $.kCFAllocatorDefault, 0);
    if (ioreturn == KERN_SUCCESS && properties.address() != 0) {
        obj = $.CFDictionaryGetValue(properties, $("HIDIdleTime"));
        $.CFRetain(obj);
    }
    else {
      console.log('io registry was not KERN_SUCCESS, properties is: ', properties, ioreturn);
        return -1;
    }

    var tHandle = $.alloc(0).ref();

    if (obj) {
        var type = $.CFGetTypeID(obj);

        if (type == $.CFDataGetTypeID())
        {
            $.CFDataGetBytes(obj, $.CFRangeMake(0, sizeof(tHandle)), tHandle);
        }
        else if (type == $.CFNumberGetTypeID())
        {
            $.CFNumberGetValue(obj, $.kCFNumberSInt64Type, tHandle);
        }
        else
        {
            // error
            tHandle = 0;
        }

        $.CFRelease(obj);

        tHandle /= 1000000; // return as milliseconds
    } else {
        tHandle = -1;
    }

    $.CFRelease(properties);
    $.IOObjectRelease(curObj);
    $.IOObjectRelease(iter);
    return tHandle;
}   

setInterval(function() {
    console.log(getIdleTime());
}, 1000);
*/

/*

require('Common');
var win = new Window();
var imageWell = new ImageWell();
imageWell.image = "./tools/tint.png"
imageWell.width = 22;
imageWell.height = 22;

imageWell.on('rightmousedown', function() {
  console.log('right mouse down');
})
imageWell.on('mousedown', function() {
  var bounds = imageWell.boundsOnScreen;
  win.x = bounds.x;
  win.y = bounds.y;
  win.visible = true;
});

var statusBar = new StatusBar();
statusBar.custom = imageWell;



*/

/*
require('Common');
var popOver = new PopOver();
var webview = new WebViews ();
webview.left = webview.right = webview.top = webview.bottom = 0;
popOver.appendChild(webview);
var imageWell = new ImageWell();
imageWell.image = "./tools/tint.png"
imageWell.width = 22;
imageWell.height = 22;

imageWell.on('mousedown', function() {
  webview.location = "https://github.com/trueinteractions/tint2/";
  popOver.open(imageWell, 'bottom');
});

var statusBar = new StatusBar();
statusBar.custom = imageWell;
*/

/*require('Bridge');
require('Application');
var Window = require('Window');
console.log('a');
var $ = process.bridge.dotnet;
console.log('b');
var win = new Window();
//console.log('here'); 
win.visible = true;

console.log('end');*/
/*require('Common');
var win = new Window();
win.visible = true;
var container = new Box();
win.appendChild(container);
container.left = container.right = container.top = container.bottom = 20;

container.addEventListener('dropping', function() {
  console.log('dropping');
});
container.addEventListener('dragenter', function() {
  console.log('dragenter');
});
container.addEventListener('dragexit', function() {
  console.log('dragexit');
});
//container.addEventListener('drop', function() {
//  console.log('drop fired');
//});
container.addEventListener('dropped', function(objects) {
  console.log('dropped fired with: ',objects);
});

container.acceptsDroppedTypes = ['image', 'file'];*/


/*
  var label = new TextInput();

  label.readonly = true;
  label.value = "This is a label";
  label.top = 10;
  label.height = 25;
  label.left = 10;
  label.right = 10;

  var dropdown = new DropDown();
  dropdown.top = 35;
  dropdown.left = 10;
  dropdown.right = 10;
  dropdown.height = 25;

  var dockmenu = new Menu("DockMenu");
  var someMenu = new Menu("SomeMenu");
  var someSuperMenuItem = new MenuItem('Some Item 1');
  someSuperMenuItem.submenu = someMenu;
  var someMenuItem = new MenuItem("Test Menu","z");
  someMenu.appendChild(someMenuItem);
  var someOtherSuperMenuItem = new MenuItem('This Item');
  var someOtherMenuItem = new MenuItem("New","n","shift");
  someOtherMenuItem.enabled = true;
  someOtherSuperMenuItem.addEventListener('click', function() {
    console.log('click fired.');
  });
  var someOtherMenu = new Menu("SomeMenu2");
  someOtherMenu.appendChild(someOtherMenuItem);
  someOtherSuperMenuItem.submenu = someOtherMenu;
  dockmenu.appendChild(someSuperMenuItem);
  dockmenu.appendChild(someOtherSuperMenuItem);
  dropdown.options = dockmenu;

  mainWindow.appendChild(label);
  mainWindow.appendChild(dropdown);

*/

//for(var i=0; i < 1000; i++) {
//  table.addRow(i);
//  table.setValueAt('Header',i,i.toString() + "hello.");
//}
/*
var webview = new WebView();
win.appendChild(split);
split.appendChild(table);
split.appendChild(webview);
table.addRow(0);
table.addColumn('Company');
table.setValueAt('Company',0,'Hello');
win.visible = true;
*/

// 1. add column placed above add row (or before add row that is) will cause the column/row to not render.
// 2. split doesnt respect the initial placement.
// 3. clicking on table blows up.
// 4. Split without the right amount of views blows up when you set the position.

/*require('Common');
var win = new Window(); // Create a new window.
win.visible = true; // make sure the window is shown.
// Create a menu in OSX
var mainMenu = new Menu();
var appleMenu = new MenuItem(application.name, '');
var fileMenu = new MenuItem('File', '');
var editMenu = new MenuItem('Edit', '');
var windowMenu = new MenuItem('Window', '');
var helpMenu = new MenuItem('Help', '');
mainMenu.appendChild(appleMenu);
mainMenu.appendChild(fileMenu);
mainMenu.appendChild(editMenu);
mainMenu.appendChild(windowMenu);
mainMenu.appendChild(helpMenu);

var appleSubmenu = new Menu(application.name);
appleSubmenu.appendChild(new MenuItem('About '+application.name, ''));
appleSubmenu.appendChild(new MenuItemSeparator());
appleSubmenu.appendChild(new MenuItem('Hide '+application.name, 'h'))
   .addEventListener('click', function() { application.visible = false; });
appleSubmenu.appendChild(new MenuItem('Hide Others', ''))
   .addEventListener('click', function() { application.hideAllOtherApplications(); });
appleSubmenu.appendChild(new MenuItem('Show All', ''))
   .addEventListener('click', function() { application.unhideAllOtherApplications(); });
appleSubmenu.appendChild(new MenuItemSeparator());
appleSubmenu.appendChild(new MenuItem('Quit '+application.name, 'q'))
   .addEventListener('click', function() { process.exit(0); });
appleMenu.submenu = appleSubmenu;

var fileSubmenu = new Menu('File');
fileSubmenu.appendChild(new MenuItem('New File', 'f'));
fileSubmenu.appendChild(new MenuItem('Open...', 'o'));
fileSubmenu.appendChild(new MenuItem('Save', 's'));
fileSubmenu.appendChild(new MenuItem('Save As...', 'S', 'shift'));
fileSubmenu.appendChild(new MenuItemSeparator());
fileSubmenu.appendChild(new MenuItem('Close', 'c', 'cmd'));
fileMenu.submenu = fileSubmenu;

var editSubmenu = new Menu('Edit');
var undo = new MenuItem('Undo', 'u');
undo.addEventListener('click', function() { application.undo(); });
editSubmenu.appendChild(undo);
editSubmenu.appendChild(new MenuItem('Redo', 'r'))
   .addEventListener('click', function() { application.redo(); });
editSubmenu.appendChild(new MenuItemSeparator());
editSubmenu.appendChild(new MenuItem('Copy', 'c'))
   .addEventListener('click', function() { application.copy(); });
editSubmenu.appendChild(new MenuItem('Cut', 'x'))
    .addEventListener('click', function() { application.cut(); });
editSubmenu.appendChild(new MenuItem('Paste', 'p'))
   .addEventListener('click', function() { application.paste(); });
editMenu.submenu = editSubmenu;

var windowSubmenu = new Menu('Window');
windowSubmenu.appendChild(new MenuItem('Minimize', 'm'))
    .addEventListener('click', function() { win.state = "minimized"; });
windowSubmenu.appendChild(new MenuItem('Zoom', ''))
    .addEventListener('click', function() { win.state = "maximized"; });
windowSubmenu.appendChild(new MenuItemSeparator());
windowSubmenu.appendChild(new MenuItem('Bring All to Front', ''))
    .addEventListener('click', function() { win.bringToFront(); });
windowSubmenu.appendChild(new MenuItemSeparator());
windowMenu.submenu = windowSubmenu;

var helpSubmenu = new Menu('Help');
helpSubmenu.appendChild(new MenuItem('Website', ''));
helpSubmenu.appendChild(new MenuItem('Online Documentation', ''));
helpSubmenu.appendChild(new MenuItem('License', ''));
helpMenu.submenu = helpSubmenu;

win.menu = mainMenu;

var searchInput = new SearchInput();
var menuItem = new MenuItem('Search');
menuItem.custom = searchInput;
windowSubmenu.appendChild(menuItem);*/

//var statusbar = new StatusBar();
//statusbar.image = 'tools/compiler/test/tintruntime.png';

//var menu = new Menu();
//var menuItem = new MenuItem('Search');


//var menuItem2 = new MenuItem('Search2');
//menu.appendChild(menuItem2);

//var win = new Window();
//win.visible = true;
//win.menu = menu;


//statusbar.menu = menu;


//console.log(System.home);
//System.showFile("~/test/test.js");
//System.openFile("~/test/debug.log");
//System.openURL('https://www.google.com');
//console.log(System.trashFile("~/test/debug.log"));
//System.beep();
/*
$ = process.bridge.objc;
var win = new Window();
var view = new WebView();
win.appendChild(view);
view.left=view.right=view.top=view.bottom=0;
view.location = 'https://www.google.com';
win.visible = true;
*/


//for(var key in $) {
//  if(key[0]==='W' && key[1]==='K') {
//    console.log(key);
//  }
//}
//console.log($.WKWebInspectorWindow.methods());

/*
var statusBar = new StatusBar();
statusBar.image = 'tools/compiler/test/tintruntime.png';
var popOver = new PopOver();
statusBar.addEventListener('click', function() {
  popOver.open(statusBar);
});*/






/*
var win = new Window();
var btn = new Button();
var text = new TextInput();
text.left = text.top = 10;
text.height = 20;
text.width = 200;
win.appendChild(text);


var text2 = new TextInput();
text2.left = 10;
text2.top = 30;
text2.height = 20;
text2.width = 200;
win.appendChild(text2);

btn.title = 'test';
btn.addEventListener('click', function() {
  console.log(text.focus);
  text.focus();
});
btn.left = 220;
btn.width = 40;
btn.top = 10;
btn.height = 20;
win.appendChild(btn);
win.visible = true;
*/
/*
var split = new Split();
var container = new Box();
var webview = new WebView();

win.appendChild(split);

container.left = container.right = container.top = container.bottom = 0;

webview.left = webview.right = webview.top = webview.bottom = 0;
webview.location = 'http://www.google.com';

split.left = split.right = split.top = split.bottom = 0;

split.appendChild(container);
split.appendChild(webview);

win.visible = true;
*/



/*
// Setup bridge, load Gtk
require('Application');
// Gtk is already loaded, load WebKit for this example.
process.bridge.gobj.load('WebKit');
// For berevity.
var $ = process.bridge.gobj.Gtk;
var $$ = process.bridge.gobj.WebKit;
// create a new window
var win = new $.Window({type:$.WindowType.toplevel});
win.title = 'WebKit example in GTK.';
win.resize_to_geometry(640,480);
// create a scroll view to place the webview in.
var sw = new $.ScrolledWindow();
win.add(sw);
var view = new $$.WebView();
view.load_uri("https://www.google.com/");
sw.add(view);
// Note, do not use win.show() unless only the top window (and none of the children) will be shown.
win.show_all();
*/
// 
// win.move(200,200);
// Example of static class:
//$.Window.set_default_icon_from_file('./tools/compiler/test/tintruntime.png');
//win.reset_style();
//console.log(win.get_style_context());
//win.set_decorated(true); // frame (true/false)
//win.set_resizable(false);
//win.set_opacity(0.5);
//win.maximize(); // console.log('maximized: ')
//win.unmaximize();
//win.close();
//win.hide();
//win.destroy();
//win.iconify();
//win.deiconify();
//win.fullscreen();
//win.unfullscreen();
//win.set_keep_above();

/*






console.log(win.get_size());
win.resize(400,200);
console.log(win.__get_property__("size"));
win.set_opacity(0.5);
console.log(win.get_opacity());
*/
/*
require('Common');
var SearchInput = require('./modules/SearchInput/SearchInput_win.js');
var win = new Window();
win.visible = true;
var search = new SearchInput();

search.title = "Third";
search.left = '20px'; // Position it left
search.top = '100px'; // align it 100px of the parent height
                           // from the bottom.
search.height = '22px';
search.width = '200px'; // make the width equal to buttonSecond.
                                  // or 50% of the width.

// Add the buttons to the window.
win.appendChild(search);
*/
/*
require('Application');
delete global.__TINT.Control;
var Menu = require('./modules/Control_mac.js');
var Menu = require('./modules/Menu/Menu_mac.js');
delete global.__TINT.MenuItem;
var MenuItem = require('./modules/Menu/MenuItem_mac.js');
var StatusBar = require('./modules/StatusBar/StatusBar_mac.js');
var SearchInput = require('./modules/SearchInput/SearchInput_mac.js');

var statusbar = new StatusBar();
statusbar.image = '../tintruntime.png';

var menu = new Menu();
var menuItem = new MenuItem('Search');

var searchInput = new SearchInput();
menuItem.custom = searchInput;

menu.appendChild(menuItem);


var menuItem2 = new MenuItem('Search2');
menu.appendChild(menuItem2);

statusbar.menu = menu;*/


/*
var google = {};
process.bridge.objc.importOnto('/Applications/Google Chrome.app/Contents/Versions/42.0.2311.90/Google Chrome Framework.framework', google);

//console.log(keys);

var app = google.AppController('alloc')('init');
console.log(app);
app('applicationWillFinishLaunching', null);
app('applicationDidFinishLaunching', null);
*/
/*
require('./modules/Bridge/Bridge_win.js');

  process.bridge.dotnet.import('mscorlib');
  process.bridge.dotnet.import('System.dll');
  process.bridge.dotnet.import('WPF\\WindowsBase.dll');
  process.bridge.dotnet.import('WPF\\PresentationCore.dll');
  process.bridge.dotnet.import('WPF\\PresentationFramework.dll');
  process.bridge.dotnet.import('System.Drawing'); 


$ = process.bridge.dotnet; // for brevity.

var protoClass = $.System.Object.extend('MyNewClass'); // creates a new class "template"
protoClass.addMethod(
  "myMethod", // The method name
  false, // static or instance, true = static, false = instance, 
  true, // public=true, private = false, protected does not exist in runtime.
  false, // whether to override an existing method name.
  $.System.Void, // the return type, lets go with true/false.
  [ ], // The argument types it takes as an array.
  function() { // Some javascript function to exec when myMethod is called
    console.log('hello');
  }
);
//var dotnet = process.bridge;
var MyNewClass = protoClass.register(); // create a new REAL class.
//console.log($.System.String);
//console.log(MyNewClass);
//MyNewClass.myMethod('hello2');
var instance = new MyNewClass();
instance.myMethod();
*/

/*var classPtr = dotnet.classRegister(protoClass.pointer);
console.log('classptr: ', classPtr);
var name = dotnet.execGetProperty(classPtr,'AssemblyQualifiedName');
console.log('qname: ', name);
// classPtr  appears to be a valid class. perhaps pass into jsinstance?...
// below... is .. i dunno. an instance ptr?..
var realClassPtr = dotnet.execNew(classPtr);
console.log(realClassPtr);*/


//var name2 = dotnet.execGetProperty(realClassPtr,'AssemblyQualifiedName');
//console.log('qname2: ', name2);

// Fails because it assumes an object not a type.
//var classMaybe = process.bridge.dotnet.fromPointer(classPtr);
//console.log('classMaybe: ', classMaybe);


//console.log(MyNewClass);
// Now we can create a new instance:
//var inst = new MyNewClass();
//console.log(inst);
//inst.myMethod('This is a c++ DOT net class, but in JS!');
//var inst2 = new inst();
//inst.myMethod('this is a c++ DOT net class');
/*var Window = require('./modules/Window/Window_win.js');
var win = new Window();
var btn = new Button();
btn.title = "Foo";
win.appendChild(btn);
btn.left = btn.top = 0;
btn.width = 120;
btn.height = 20;
win.textured = true;
win.visible = true;
*/

/*$ = process.bridge.dotnet;
var win = new Window();
win.visible = true;
win.backgroundColor = 'red';

var web = new WebView();
web.left = web.right = web.top = web.bottom = 0;
web.addEventListener('load', function() { });
win.native.WindowStyle = $.System.Windows.WindowStyle.None;
win.native.AllowTransparency = true;

//web.private.interop.Background = $.System.Windows.Media.Brushes.Transparent;
//web.private.interop.Foreground = $.System.Windows.Media.Brushes.Transparent;
web.location = "http://madebyevan.com/webgl-water/"
//web.private.browser.DocumentText = "<html style='background-color:transparent'><body style='background-color:transparent'>test</body></html>";
win.appendChild(web);
//console.log(web.private.interop.Handle.pointer);
*/



/*
require('Common');
//var PopOver = require('./modules/PopOver/PopOver_win.js');
var win = new Window();
win.visible = true;

var popover = new PopOver();
popover.height = 100;
popover.open(win, 'bottom');
var btn = new Button();
btn.title = "Hello";
popover.appendChild(btn);
btn.left=0;
btn.top=0;
btn.width = 35;
*/

/*

var popover2 = new PopOver();
popover2.height = 100;
popover2.open(win, 'right');

var popover3 = new PopOver();
popover3.height = 100;
popover3.open(win, 'top');


var popover4 = new PopOver();
popover4.height = 100;
popover4.open(win, 'bottom');
*/


//win.appendChild(popover);
/*require('Common');

$ = process.bridge.dotnet;

var win = new Window();
  win.visible = true;
  win.x = 0;
  win.y = 0;
  win.bringToFront();
  var dialog = new FileDialog("open");
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
     win.destroy();
     $utils.ok();
  });

  dialog.open({native:$.System.Windows.Application.Current.MainWindow});
*/


  /*var $utils = require('./test/tools/utilities.js');
  

  var trackLoc = false;
  application.exitAfterWindowsClose = false;
  var mainWindow = new Window();
  mainWindow.visible = true;
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.top = webview.left = webview.right = webview.bottom = 0;

  webview.addEventListener('load', function() {
    mainWindow.title = webview.title;

     //var count = 4;
    //setTimeout(function() { 
    //  $utils.assert(webview.title === 'Test'+count, 'expected window.title['+webview.title+'] == Test'+count);
    //  $utils.ok(); 
    //},1000);
    webview.postMessage('hello');
    webview.postMessage('hello2');
    webview.postMessage('hello3');
  });
  //webview.addEventListener('location-change', function() {

  //});
  webview.location = 'app://test/assets/webview-test.html';
*/



/*
require('Common');

  var mainWindow = new Window();
  mainWindow.visible = true;
  var webview = new WebView();
  mainWindow.appendChild(webview);
  webview.left = webview.right = webview.top = webview.bottom = 0;
  webview.addEventListener('new-window', function(newWebView) {
    var newWindow = new Window();
    newWindow.visible = true;
    newWindow.x += 20;
    newWindow.appendChild(newWebView);
    newWebView.left=newWebView.right=newWebView.top=newWebView.bottom=0;
  });

  webview.addEventListener('error', function(e) { console.log('an error occured: '+e); });
  webview.addEventListener('load', function() { 
  	console.log('load occured'); 
  	//webview.boundsOnWindowOfElement('#newwin', function(coords) {
  		//console.log(coords);
  	//});
  });                      
  webview.addEventListener('location-change', function(oldUrl, newUrl) { console.log('locationchange occured', oldUrl, newUrl); });
  webview.addEventListener('loading', function() { console.log('loading occured'); });                
  webview.addEventListener('request', function() { console.log('request occured'); });                
  webview.addEventListener('redirect', function() { console.log('redirect occured'); });
  webview.addEventListener('policy', function() { console.log('policy occured'); });

  webview.location = 'https://www.google.com';
*/

// test 404?
// test location-change only on url diff
// test event order?
// test progress?


/*  WebView Toolbar Dev

	var $ = process.bridge.dotnet;
  var WebView = require('./modules/WebView/WebView_win.js');
  var mainWindow = new Window();
  mainWindow.visible = true;
  var urlLocation = new TextInput();
  var webView = new WebView();
  var toolbar = new Toolbar();
  var backButton = new Button();
  var forwardButton = new Button();

  backButton.image = 'back';
  forwardButton.image = 'forward';

  mainWindow.x = 0;
  mainWindow.y = 0;
  mainWindow.appendChild(webView);
  toolbar.appendChild([backButton, forwardButton,'space', urlLocation,'space']);
  mainWindow.toolbar = toolbar;

  mainWindow.titleVisible = false;
  mainWindow.animateOnSizeChange = true;
  mainWindow.animateOnPositionChange = true;

  urlLocation.alignment = 'center';
  urlLocation.linewrap = false;
  urlLocation.scrollable = true;

  backButton.addEventListener('click',function() { webView.back(); });
  forwardButton.addEventListener('click',function() { webView.forward(); });

  urlLocation.addEventListener('inputend', function() {
    var url = urlLocation.value;
    if(url.indexOf(':') == -1) url = "http://"+url;
    webView.location = url;
  });

  webView.addEventListener('load', function() { 
    urlLocation.value = webView.location;
    //$utils.ok();
  });
  webView.top = webView.bottom = webView.left = webView.right = 0;
 	webView.location = "http://www.reddit.com";
  //setTimeout(function() { webView.execute("document.location = 'https://www.google.com';"); },2500);

  //console.log(getBoundsOnScreenOfWPFItem(toolbar.native));
  console.log(webView.boundsOnWindow);
*/


  /*
  var mainWindow = new Window();
  var webview = new WebView();
  mainWindow.visible = true;
  mainWindow.appendChild(webview);
  webview.top = webview.left = webview.right = webview.bottom = 0;
  webview.addEventListener('error', function(e) { console.log('an error occured: '+e); });
  webview.addEventListener('load', function() { console.log('load occured'); });                      
  webview.addEventListener('location-change', function(oldUrl, newUrl) { console.log('locationchange occured', oldUrl, newUrl); });
  webview.addEventListener('loading', function() { console.log('loading occured'); });                
  webview.addEventListener('request', function() { console.log('request occured'); });                
  webview.addEventListener('redirect', function() { console.log('redirect occured'); });
  webview.addEventListener('policy', function() { console.log('policy occured'); });                
  
  webview.location = "https://www.google.com/"
  //webview.location = "app://test/assets/webview-transparency.html";
  mainWindow.title = "You should be able to see this.";
  //console.log(process.bridge.objc.WKWebView.methods());
  //mainWindow.frame = false;
  webview.transparent = true;
  //mainWindow.alpha = 0;*/



//var member = webview.private.comObject.GetType().GetEvents();
//console.log(member);
//console.log(member.Name);
//var enums = members.GetEnumerator();
//while(enums.MoveNext()) {
//	console.log(enums.Current.Name);
//}
//win.resizable = false;

// Keep for testing (future unit tests)
/*
debugger;
require('Common');
var win = new Window();

win.backgroundColor = 'rgba(0,0,0,1)';
win.extendIntoTitle = true;	// Extend where you normally draw into the 
							// window "frame" below its buttons
win.titleTransparent = true; // Make the titlebar transparent, 
							 // otherwise "blur" effect or washout occurs.
win.titleVisible = true; // The titlebar can be disabled (either true or false)
win.appearance = "dark"; // (can be "light", "dark", "aqua", or "vibrant")
win.title = "Im a dark window.";
var box = new Box();
box.borderRadius = 5.5;
box.borderColor = 'rgba(0,1,0,1)'; // bright green.
win.appendChild(box);
box.left=box.right=box.top=box.bottom = 0;
win.visible = true;
*/
// Keep for testing (future unit tests)



/*
var webview = new WebView();
win.appendChild(webview);
webview.left = webview.right = webview.top = webview.bottom = 0;
webview.location = 'https://www.google.com'
*/
/*
var win = new Window();
var win2 = new Window();
var webview = new WebView();
var btn = new Button();
btn.title = "foo";
win.title = "Foo";
win2.appendChild(webview);
win.appendChild(btn);
btn.left = 0;
btn.top = 0;
btn.width = '200px';
webview.top = 0;
webview.left = webview.right = webview.bottom = 0;
win.visible = true;
win2.visible = true;
webview.location = "https://www.google.com";
win.backgroundColor = 'rgba(0,0,0,1)';

setTimeout(function() {
	var bnds = btn.nativeView('bounds');
	console.log('Btn nativeView(bounds): ', bnds.origin.x, bnds.origin.y, bnds.size.width, bnds.size.height);
	console.log('Btn bounds', btn.bounds);
	console.log('Btn boundsOnWindow', btn.boundsOnWindow);
	console.log('Btn baseline offset: ', btn.nativeView('baselineOffsetFromBottom'));
	console.log('---');
	var bnds2 = win.nativeView('bounds');
	console.log('Win nativeView(bounds): ', bnds2.origin.x, bnds2.origin.y, bnds2.size.width, bnds2.size.height);
	console.log('Win bounds', win.bounds);
	console.log('Win boundsOnWindow', win.boundsOnWindow);
	console.log('---');
	var bnds3 = webview.nativeView('bounds');
	console.log('Win nativeView(bounds): ', bnds3.origin.x, bnds3.origin.y, bnds3.size.width, bnds3.size.height);
	console.log('webview bounds', webview.bounds);
	console.log('webview boundsOnWindow', webview.boundsOnWindow);
	console.log('---');
	//console.log(win.nativeView('isEqual', win.nativeView('window')('contentView')));
	//console.log(win.nativeView('frame'), win.nativeView('window')('contentView')('frame'));
	//console.log('our frame ', btn.nativeView('frame'));
	//console.log('parent frame ', btn.nativeView('superview')('frame'));
	//console.log('window frame ', win.native('frame'));
	//console.log(webview.bounds);
	//console.log(webview.boundsOnWindow);
},1009);*/
/*require('Application');
var Window = require('Window');
var Scroll = require('Scroll');
var TextInput = require('TextInput');
var Table = require('./modules/Table/Table_win.js');

var mainWindow = new Window();
mainWindow.visible = true;

var table = new Table();
var scroll = new Scroll();
var textInput = new TextInput();

mainWindow.appendChild(scroll);
table.columnsCanBeResized = true;
table.addEventListener('row-added', function(e) {
});
table.addEventListener('row-removed', function(e) { });
table.addEventListener('select', function(e) { });
textInput.value = "Test";
scroll.setChild(table);
scroll.left = scroll.right = scroll.top = scroll.bottom = 0;
scroll.left = null; // test for left acceptance.
scroll.left = 0;
table.multipleSelection = true;
table.alternatingColors = true;
table.addColumn('First Column');
table.addColumn('Second Column');
table.addColumn('Third Column');
table.addRow();
table.addRow();
table.addRow();
table.setValueAt('First Column',0,textInput);
table.setColumnWidth('First Column', 300);
table.addEventListener('column-resized', function() {
	console.log('column resized.');
})
table.selectedRows = [1];
setTimeout(function() {
	table.alternatingColors = false;
	table.moveColumn(1,0);
},2000);*/
/*
var $ = process.bridge.dotnet;
var story = new $.System.Windows.Media.Animation.Storyboard();
var animation = new $.System.Windows.Media.Animation.DoubleAnimation();
animation.Duration = new $.System.Windows.Duration($.System.TimeSpan.FromMilliseconds(350))
animation.From = 0.00000001;
animation.To = 300.00000001;
animation.SetValue($.System.Windows.Media.Animation.Storyboard.TargetProperty, win.native);
animation.SetValue($.System.Windows.Media.Animation.Storyboard.TargetPropertyProperty, new $.System.Windows.PropertyPath($.System.Windows.Window.LeftProperty));
animation.EasingFunction = new $.System.Windows.Media.Animation.QuadraticEase();
animation.EasingFunction.EaseMode = $.System.Windows.Media.Animation.EasingMode.EaseInOut;
story.Children.Add(animation);
story.Begin();
*/
