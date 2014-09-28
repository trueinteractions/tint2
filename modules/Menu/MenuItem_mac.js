module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  var Container = require('Container');

  if(!$.TintMenuItemDelegate) {
    if(!process.bridge.objc.delegates) process.bridge.objc.delegates = {};
    var TintMenuItemDelegate = $.NSObject.extend('TintMenuItemDelegate');
    TintMenuItemDelegate.addMethod('initWithJavascriptObject:', ['@',[TintMenuItemDelegate,$.selector,'@']], 
      utilities.errorwrap(function(self, cmd, id) {
        self.callback = process.bridge.objc.delegates[id.toString()];
        process.bridge.objc.delegates[id.toString()] = null;
        return self;
    }));
    TintMenuItemDelegate.addMethod('click:','v@:@', 
      utilities.errorwrap(function(self,_cmd,frame) { 
        self.callback.fireEvent('click');
    }));
    TintMenuItemDelegate.register();
  }

  function MenuItem(titlestring,keystring,keymodifiers) {
    if(typeof(keystring)=='undefined') keystring = "";
    if(typeof(keymodifiers)=='undefined') keymodifiers = "";

    this.private = {events:{},submenu:null,modifiers:"",imgOn:null,imgOff:null,img:null,custom:null};

    var id = (Math.random()*100000).toString();
    process.bridge.objc.delegates[id] = this;
    var menuDelegate = TintMenuItemDelegate('alloc')('initWithJavascriptObject', $(id));
  	this.native = $.NSMenuItem('alloc')('initWithTitle',$(titlestring),'action','click:','keyEquivalent',$(keystring));
    this.native('setTarget',menuDelegate);
    this.native('setAction','click:');
    if(titlestring) this.title = titlestring;
    if(keystring) this.key = keystring;
    if(keymodifiers) this.modifiers = keymodifiers;
  }

  MenuItem.prototype.fireEvent = function(event, args) {
    if(this.private.events[event]) 
      (this.private.events[event]).forEach(function(item,index,arr) { item.apply(null,args); });
  }

  MenuItem.prototype.addEventListener = function(event, func) { 
    if(!this.private.events[event]) 
      this.private.events[event] = []; 
    this.private.events[event].push(func); 
  }

  MenuItem.prototype.removeEventListener = function(event, func) { 
    if(this.private.events[event] && this.private.events[event].indexOf(func) != -1) 
      this.private.events[event].splice(this.private.events[event].indexOf(func), 1); 
  }

  Object.defineProperty(MenuItem.prototype, 'imageOn', {
    get:function() { return this.private.imgOn; },
    set:function(e) { 
      this.private.imgOn = e; 
      e = utilities.makeNSImage(e);
      if(e) this.native('setOnStateImage', e);
    }
  });

  Object.defineProperty(MenuItem.prototype, 'imageOff', {
    get:function() { return this.private.imgOff; },
    set:function(e) { 
      this.private.imgOff = e; 
      e = utilities.makeNSImage(e);
      if(e) this.native('setOffStateImage', e);
    }
  });

  Object.defineProperty(MenuItem.prototype, 'image', {
    get:function() { return this.private.img; },
    set:function(e) { 
      this.private.img = e;
      e = utilities.makeNSImage(e);
      if(e) this.native('setImage', e);
    }
  });

  Object.defineProperty(MenuItem.prototype, 'submenu', {
    get:function() { return this.private.submenu; },
    set:function(e) { 
      this.private.submenu = e;
      this.native('setSubmenu',e.native);
    }
  });

  Object.defineProperty(MenuItem.prototype, 'title', {
    get:function() { return this.native('title')('UTF8String'); },
    set:function(e) { return this.native('setTitle',$(e)); }
  });

  Object.defineProperty(MenuItem.prototype, 'enabled', {
    get:function() { return this.native('isEnabled'); },
    set:function(e) { return this.native('setEnabled',e); }
  });

  Object.defineProperty(MenuItem.prototype, 'hidden', {
    get:function() { return this.native('isHidden'); },
    set:function(e) { return this.native('setHidden',e); }
  });

  Object.defineProperty(MenuItem.prototype, 'key', {
    get:function() { return this.native('keyEquivalent')('UTF8String'); },
    set:function(e) { return this.native('setKeyEquivalent',$(e)); }
  });

  Object.defineProperty(MenuItem.prototype, 'modifiers', {
    get:function() {
      var modifiersFlags = this.native('keyEquivalentModifierMask');
      var modifiersString = "";
      if(modifierFlags & $.NSShiftKeyMask)
        modifiersString += ",shift";
      if(modifierFlags & $.NSAlternateKeyMask)
        modifiersString += ",alt";
      if(modifiersFlags & $.NSCommandKeyMask)
        modifiersString += ",cmd";
      if(modifiersFlags & $.NSControlKeyMask)
        modifiersString += ",ctrl";
      return modifiersString.length > 0 ? modifiersString.substring(1) : "";
    },
    set:function(e) { 
      var modifiers = e.split(',');
      var modifierFlags = 0;
      modifiers.forEach(function(item,index,arr) {
        if(item=='shift') modifierFlags = modifierFlags | $.NSShiftKeyMask;
        if(item=='alt') modifierFlags = modifierFlags | $.NSAlternateKeyMask;
        if(item=='cmd') modifierFlags = modifierFlags | $.NSCommandKeyMask;
        if(item=='ctrl') modifierFlags = modifierFlags | $.NSControlKeyMask;
      });
      this.native('setKeyEquivalentModifierMask',modifierFlags);
    }
  });

  Object.defineProperty(MenuItem.prototype, 'tooltip', {
    get:function() { return this.native('toolTip')('UTF8String'); },
    set:function(e) { return this.native('setToolTip',$(e)); }
  });

  Object.defineProperty(MenuItem.prototype, 'custom', {
    get:function() { return this.private.custom; },
    set:function(e) {
      if(e instanceof Container) {
        this.private.custom = e;
        this.nativeView = e.nativeView;
        return this.native('setView',e.nativeView);
      }
      else throw new Error("The passed in object was not a valid container or control.");
    }
  });
  return MenuItem;

})();