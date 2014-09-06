(function() {
  require('Bridge');
  var utilities = require('Utilities');
  process.bridge.objc.import('Foundation',0);
  process.bridge.objc.import('Cocoa',0);
  process.bridge.objc.import('AppKit',0);
  process.bridge.objc.import('WebKit',0);
  
  // Help reign in garbage collection
  var pool = process.bridge.objc.NSAutoreleasePool('alloc')('init');
  
  // Include the app schema. app:// registers on NSURL and for node require().
  require('AppSchema')(process.cwd());

  // Register our font factory.
  require('FontInternals');

  var $ = process.bridge.objc;

  function Application() {
    var events = {}, mainMenu = null, 
        name = "", badgeText = "", 
        dockmenu = null, icon = "", nswindows = [];

    var $app = $.NSApplication('sharedApplication');
    var delegateClass = $.AppDelegate.extend('AppDelegate2');
    delegateClass.addMethod('applicationDockMenu:','@@:@',function(self,cmd,sender) {
      try {
        if(dockmenu == null) return null;
        else return dockmenu.native;
      } catch(e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    });
    delegateClass.register();
    var delegate = delegateClass('alloc')('init');
    $app('setDelegate',delegate);
    
    function fireEvent(event, args) {
      if(events[event])
        (events[event]).forEach(function(item,index,arr) { item.apply(null,args); });
    }

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }
    this.launch = function() { fireEvent('launch'); }.bind(this);
    this.uninstall = function() { console.warn('unimplemented'); }

    this.private = {};

    Object.defineProperty(this, 'packaged', {
      get:function() { return false; }
    });

    this.resource = function(path) {
      if(path.indexOf('app:///') == -1) path = 'app:///' + path.replace("app://","");
      var url = $.NSURL('URLWithString',$(path.toString()));
      var data = $.NSData('dataWithContentsOfURL',url);
      if(data)
        return process.bridge.reinterpret(data('bytes'),data('length'),0);
      else {
        if(application.warn) console.warn('Cannot find resource at: ', path);
        return null;
      }
    }

    Object.defineProperty(this, 'windows', {
      get:function() { return nswindows; }
    });

    Object.defineProperty(this, 'name', {
      get:function() { 
        if(!name || name == "") return process.cwd();
        return name; 
      },
      set:function(e) { 
        name = e; 
      }
    });

    Object.defineProperty(this, 'badge', {
      get:function() { return badgeText; },
      set:function(e) { 
        badgeText = e;
        $app('dockTile')('setBadgeLabel',$(badgeText.toString()));
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
        e = utilities.makeNSImage(e);
        if(e) $app('setApplicationIconImage', e);
      }
    });

    Object.defineProperty(this, 'native', { get:function() { return $app; } });

    this.hideAllOtherApplications = function() { $app('hideOtherApplications', $app); }
    this.unhideAllOtherApplications = function() { $app('unhideAllApplications', $app); }

    Object.defineProperty(this, 'visible', {
      get:function() { return $app('isHidden') == $.NO ? true : false; },
      set:function(e) { if(e) $app('unhide',$app); else $app('hide', $app); }
    })

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

  global.application = new Application();
})();
