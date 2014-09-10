module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  var Container = require('Container');
  var Menu = require('Menu');

  if(!$.TintStatusBarDelegate) {
    if(!process.bridge.objc.delegates) process.bridge.objc.delegates = {};
    var TintStatusBarDelegate = $.NSObject.extend('TintStatusBarDelegate');
    TintStatusBarDelegate.addMethod('initWithJavascriptObject:', ['@',[TintStatusBarDelegate,$.selector,'@']], 
      utilities.errorwrap(function(self, cmd, id) {
        self.callback = process.bridge.objc.delegates[id.toString()];
        process.bridge.objc.delegates[id.toString()] = null;
        return self;
    }));
    TintStatusBarDelegate.addMethod('click:','v@:@', 
      utilities.errorwrap(function(self,_cmd,frame) { 
        self.callback.fireEvent('click');
    }));
    TintStatusBarDelegate.register();
  }

  function StatusBar() {
    this.private = {events:{},submenu:null,imgOn:null,img:null,custom:null,custommenu:null};

    var id = (Math.random()*100000).toString();
    process.bridge.objc.delegates[id] = this;
    var delegate = TintStatusBarDelegate('alloc')('initWithJavascriptObject', $(id));
    this.native = $.NSStatusBar('systemStatusBar')('statusItemWithLength',-1);
    this.native('retain'); // required else we'll find it GC'd 
    this.native('setTarget',delegate);
    this.native('setAction','click:');
  }

  StatusBar.prototype.fireEvent = function(event, args) {
    if(this.private.events[event]) 
      (this.private.events[event]).forEach(function(item,index,arr) { item.apply(null,args); });
  }

  StatusBar.prototype.addEventListener = function(event, func) { 
    if(!this.private.events[event]) 
      this.private.events[event] = []; 
    this.private.events[event].push(func); 
  }

  StatusBar.prototype.removeEventListener = function(event, func) { 
    if(this.private.events[event] && this.private.events[event].indexOf(func) != -1) 
      this.private.events[event].splice(this.private.events[event].indexOf(func), 1); 
  }

  StatusBar.prototype.close = function() { 
    this.native('release');
  }

  Object.defineProperty(StatusBar.prototype, 'imageHighlighted', {
    get:function() { return this.private.imgOn; },
    set:function(e) { 
      this.private.imgOn = e; 
      e = utilities.makeNSImage(e);
      if(e) this.native('setAlternateImage', e);
    }
  });

  Object.defineProperty(StatusBar.prototype, 'image', {
    get:function() { return this.private.img; },
    set:function(e) { 
      this.private.img = e;
      e = utilities.makeNSImage(e);
      if(e) this.native('setImage', e);
    }
  });

  Object.defineProperty(StatusBar.prototype, 'length', {
    get:function() { return this.native('length'); },
    set:function(e) { this.native('setLength', e); }
  });

  Object.defineProperty(StatusBar.prototype, 'menu', {
    get:function() { return this.private.submenu; },
    set:function(e) { 
      if(e instanceof Menu) {
        this.private.submenu = e;
        this.native('setMenu',e.native);
      } else throw new Error("The passed in object was not a valid menu object.");
    }
  });

  Object.defineProperty(StatusBar.prototype, 'highlight', {
    get:function() { return this.native('highlightMode') == $.YES ? true : false; },
    set:function(e) { this.native('setHighlightMode', e ? $.YES : $.NO); }
  });

  Object.defineProperty(StatusBar.prototype, 'title', {
    get:function() { return this.native('title')('UTF8String'); },
    set:function(e) { return this.native('setTitle',$(e)); }
  });

  Object.defineProperty(StatusBar.prototype, 'enabled', {
    get:function() { return this.native('isEnabled'); },
    set:function(e) { return this.native('setEnabled',e); }
  });

  Object.defineProperty(StatusBar.prototype, 'tooltip', {
    get:function() { return this.native('toolTip')('UTF8String'); },
    set:function(e) { return this.native('setToolTip',$(e)); }
  });

  // Note: setting a custom view overrides title, tooltip, enabled, highlight, menu
  // and events such as mousedown, mouseup, etc.
  Object.defineProperty(StatusBar.prototype, 'custom', {
    get:function() { return this.private.custom; },
    set:function(e) {
      if(e instanceof Container) {
        this.private.custom = e;
        this.nativeView = e.nativeView;
        if(this.length == -1) this.length = 22; // set a default.
        return this.native('setView',e.nativeView);
      }
      else throw new Error("The passed in object was not a valid container or control.");
    }
  });

  Object.defineProperty(StatusBar.prototype, 'custommenu', {
    get:function() { return this.private.custommenu; },
    set:function(e) {
      if(e instanceof Menu) {
        this.private.custommenu = e;
        return this.native('popUpStatusItemMenu',e.native);
      } else throw new Error("The passed in object was not a valid menu object.");
    }
  });
  return StatusBar;

})();
