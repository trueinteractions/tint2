(function() {
  require('Bridge');
  var utilities = require('Utilities');
  process.bridge.objc.import('Foundation',0);
  process.bridge.objc.import('Cocoa',0);
  process.bridge.objc.import('AppKit',0);
  process.bridge.objc.import('WebKit',0);
  var pool = process.bridge.objc.NSAutoreleasePool('alloc')('init');
  require('AppSchema')(process.cwd());

  var $ = process.bridge.objc;
  /*
  global.Window = require('Window');
  global.WebView = require('WebView');
  global.Menu = require('Menu');
  global.MenuItem = require('MenuItem');
  global.Toolbar = require('Toolbar');
  global.Text = require('TextInput');
  global.Button = require('Button');
  global.Notification = require('Notification');
  */

  function Application() {
    var events = {}, mainMenu = null, name = "", badgeText = "", dockmenu = null;
    var $app = $.NSApplication('sharedApplication'), icon = "";
    var delegateClass = $.AppDelegate.extend('AppDelegate2');
    delegateClass.addMethod('applicationDockMenu:','@@:@',function(self,cmd,sender) {
      return dockmenu.native;
    });
    delegateClass.register();
    var delegate = delegateClass('alloc')('init');
    $app('setDelegate',delegate);
    function fireEvent(event, args) {
      if(events[event])
        (events[event]).forEach(function(item,index,arr) { item.apply(null,args); });
    }

    this.preferences = {animateWhenPossible:false};

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }
    this.launch = function() { fireEvent('launch'); }.bind(this);
    this.uninstall = function() { console.warn('unimplemented'); }

    Object.defineProperty(this, 'packaged', {
      get:function() { return false; }
    });

    this.resource = function(path) {
      if(path.indexOf('app://') == -1) path = 'app://' + path;
      var url = $.NSURL('URLWithString',$("http://www.xmission.com"));
      var data = $.NSData('dataWithContentsOfURL',url);
      return data;
    }

    Object.defineProperty(this, 'name', {
      get:function() { return name; },
      set:function(e) {  name = e; }
    });

    Object.defineProperty(this, 'badge', {
      get:function() { return badgeText; },
      set:function(e) { 
        badgeText = e;
        $app('dockTile')('setBadgeLabel',$(badgeText));
      }
    });

    Object.defineProperty(this, 'dockmenu', {
      get:function() { return dockmenu; },
      set:function(e) { dockmenu = e; }
    });

    Object.defineProperty(this, 'icon', {
      get:function() { return icon; },
      set:function(e) { 
        icon = e;
        if(e.indexOf(':') > -1) {
          //TODO: RELEASE NSImage???
          $app('setApplicationIconImage',$.NSImage('alloc')('initWithContentsOfURL',$NSURL('URLWithString',$(e))));
        } else if (e.indexOf('/') > -1 || e.indexOf('.') > -1) {
          $app('setApplicationIconImage',$.NSImage('alloc')('initWithContentsOfFile',$(e)));
        } else {
          var imageRef = utilities.getImageFromString(e);
          if(imageRef==null) {
            console.warn('Image referenced as: '+imageRef+'('+e+') could not be found.');
            img = null;
            return;
          }
          $app('setApplicationIconImage', $.NSImage('imageNamed',$(imageRef)));
        }
      }
    });

    Object.defineProperty(this, 'native', { get:function() { return $app; } });

    this.attention = function(critical) {
      $app('requestUserAttention', (critical ? $.NSCriticalRequest : $.NSInformationalRequest) );
      return {cancel:function() { $app('cancelUserAttentionRequest', (critical ? $.NSCriticalRequest : $.NSInformationalRequest) ); }.bind(this)};
    }

    this.paste = function() { $app('sendAction', 'paste:', 'to', null, 'from', $app); }
    this.copy = function() { $app('sendAction', 'copy:', 'to', null, 'from', $app); }
    this.cut = function() { $app('sendAction', 'cut:', 'to', null, 'from', $app); }
    this.undo = function() { $app('sendAction', 'undo:', 'to', null, 'from', app); }
    this.redo = function() { $app('sendAction', 'redo:', 'to', null, 'from', $app); }
    this.delete = function() { $app('sendAction', 'delete:',' to', null, 'from', $app); }
    this.selectAll = function() { $app('sendAction', 'selectAll:', 'to', null, 'from', $app); }
    $app('setActivationPolicy', $.NSApplicationActivationPolicyRegular);
    $app('activateIgnoringOtherApps', true);
  }

  /*Application.osxBuildDefaultMainMenu = function() {
    $MenuClass = require('./modules/Menu/Menu_mac.js');
    $MenuItemClass = require('./modules/Menu/MenuItem_mac.js');
    $MenuItemSeperatorClass = require('./modules/Menu/MenuItemSeperator_mac.js');

    var appleMenu = new $MenuClass("");
    appleMenu.appendChild(new $MenuItemClass('About '+name, null);
    appleMenu.appendChild(new $MenuItemSeperatorClass());
    appleMenu.appendChild(new $MenuItemClass('Hide '+name, 'h'));
    appleMenu.appendChild(new $MenuItemClass('Hide Others', null);
    appleMenu.appendChild(new $MenuItemClass('Show All', null));
    appleMenu.appendChild(new $MenuItemSeperatorClass());
    appleMenu.appendChild(new $MenuItemClass('Quit '+name, null));
  }*/


  global.application = new Application();
})();
