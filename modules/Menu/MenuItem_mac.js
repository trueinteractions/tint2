module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');

  if(!$.TintMenuItemDelegate) {
    var TintMenuItemDelegate = $.NSObject.extend('TintMenuItemDelegate');
    TintMenuItemDelegate.addMethod('initWithJavascriptObject:', ['@',[TintMenuItemDelegate,$.selector,'@']], 
      utilities.errorwrap(function(self, cmd, id) {
        self.callback = application.private.delegateMap[id.toString()];
        application.private.delegateMap[id.toString()] = null;
        return self;
    }));
    TintMenuItemDelegate.addMethod('click:','v@:@', 
      utilities.errorwrap(function(self,_cmd,frame) { 
        self.callback.fireEvent('click');
    }));
    TintMenuItemDelegate.register();
  }

  function MenuItem(titlestring,keystring,keymodifiers) 
  {
    if(typeof(keystring)=='undefined') keystring = "";
    if(typeof(keymodifiers)=='undefined') keymodifiers = "";

    var events = {};

    function fireEvent(event, args) {
      if(events[event]) (events[event]).forEach(function(item,index,arr) { item.apply(null,args); });
    }

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }

    var id = (Math.random()*100000).toString();
    application.private.delegateMap[id] = this;
    var menuDelegate = TintMenuItemDelegate('alloc')('initWithJavascriptObject', $(id));
  	var $menu = $.NSMenuItem('alloc')('initWithTitle',$(titlestring),'action','click:','keyEquivalent',$(keystring));
    $menu('setTarget',menuDelegate);
    $menu('setAction','click:');

  	var submenu=null, modifiers = "";

  	Object.defineProperty(this, 'submenu', {
      get:function() { return submenu; },
      set:function(e) { 
        submenu = e;
        $menu('setSubmenu',e.native);
      }
    });

    Object.defineProperty(this, 'title', {
      get:function() { return $menu('title')('UTF8String'); },
      set:function(e) { return $menu('setTitle',$(e)); }
    });

    Object.defineProperty(this, 'enabled', {
      get:function() { return $menu('isEnabled'); },
      set:function(e) { return $menu('setEnabled',e); }
    });

    Object.defineProperty(this, 'hidden', {
      get:function() { return $menu('isHidden'); },
      set:function(e) { return $menu('setHidden',e); }
    });

    Object.defineProperty(this, 'key', {
      get:function() { return $menu('keyEquivalent')('UTF8String'); },
      set:function(e) { return $menu('setKeyEquivalent',$(e)); }
    });

    Object.defineProperty(this, 'modifiers', {
      get:function() {
        var modifiersFlags = $menu('keyEquivalentModifierMask');
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
        $menu('setKeyEquivalentModifierMask',modifierFlags);
      }
    });

    Object.defineProperty(this, 'tooltip', {
      get:function() { return $menu('toolTip')('UTF8String'); },
      set:function(e) { return $menu('setToolTip',$(e)); }
    });

    Object.defineProperty(this, 'native', {
      get:function() { return $menu; }
    });

    if(titlestring) this.title = titlestring;
    if(keystring) this.key = keystring;
    if(keymodifiers) this.modifiers = keymodifiers;
  }
  return MenuItem;
})();