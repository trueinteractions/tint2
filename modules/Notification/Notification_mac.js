module.exports = (function() {
  // TODO: The return back isn't awknowledged
  // this causes the NSNotificationCenter to only
  // work when the app is not in focus.
  var NSUserNotificationCenterDelegate = $.NSObject.extend('NSUserNotificationCenterDelegate'+Math.round(Math.random()*10000));
  NSUserNotificationCenterDelegate.addMethod('init:', '@@:', function(self) { return self; });
  NSUserNotificationCenterDelegate.addMethod('userNotificationCenters:shouldPresentNotification:','B@:@@', function(self,_cmd,center,notify) { 
    return $.YES;
  });
  NSUserNotificationCenterDelegate.addMethod('userNotificationCenters:didActivateNotification:','B@:@@', function(self,_cmd,center,notify) {  });
  NSUserNotificationCenterDelegate.addMethod('userNotificationCenters:didDeliverNotification:','B@:@@', function(self,_cmd,center,notify) {  });
  NSUserNotificationCenterDelegate.register();
  var userNotifyInstance = NSUserNotificationCenterDelegate('alloc')('init');
  var center = $.NSUserNotificationCenter('defaultUserNotificationCenter');
  if(center != null) 
    center('setDelegate',userNotifyInstance);

  function Notification() 
  {
    var events = {};
    var titlestring = "", textstring = "", subtitlestring = "", soundEnabled = false;
    var actionbuttontitle = "", otherbuttontitle = "";

    function fireEvent(event, args) {
      if(events[event]) (events[event]).forEach(function(item,index,arr) { item.apply(args); });
    }

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }

  	var $notify = $.NSUserNotification('alloc')('init');

    Object.defineProperty(this, 'title', {
      get:function() { return titlestring; },
      set:function(e) { titlestring = e; }
    });

    Object.defineProperty(this, 'subtitle', {
      get:function() { return subtitlestring; },
      set:function(e) { subtitlestring = e; }
    });

    Object.defineProperty(this, 'text', {
      get:function() { return textstring; },
      set:function(e) { textstring = e; }
    });

    Object.defineProperty(this, 'sound', {
      get:function() { return soundEnabled; },
      set:function(e) { soundEnabled = e ? true : false; }
    });

    Object.defineProperty(this, 'mainButtonLabel', {
      get:function() { return actionbuttontitle; },
      set:function(e) { actionbuttontitle = e; }
    });

    Object.defineProperty(this, 'auxillaryButtonLabel', {
      get:function() { return otherbuttontitle; },
      set:function(e) { otherbuttontitle = e; }
    });

    this.dispatch = function() {
      //Set the title of the notification
      $notify('setTitle',$(titlestring));
      //Set the text of the notification
      $notify('setInformativeText',$(textstring));
      //Set the sound, this can be either nil for no sound, NSUserNotificationDefaultSoundName for the default sound (tri-tone) and a string of a .caf file that is in the bundle (filname and extension)
      if(soundEnabled) $notify('setSoundName',$.NSUserNotificationDefaultSoundName);
      else $notify('setSoundName',null);

      if(actionbuttontitle && actionbuttontitle != "")
      {
        $notify('setActionButtonTitle',$(actionbuttontitle));
        if(otherbuttontitle && otherbuttontitle != "")
          $notify('setOtherButtonTitle',$(otherbuttontitle));
        $notify('setHasActionButton',$.YES);
      }      
      //Get the default notification center
      if(center == null)
        console.warn('Attempted to deliver notification, but only packaged apps main send/recieve notifcations.');
      else {
        center('deliverNotification',$notify);
      }
      // causes:
      //(node) warning: possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit.
      //process.on('exit', function() {
      //  $notify;
      //})
    }
/*
  	var submenu=null, modifiers = "";

  	Object.defineProperty(this, 'permission', {
      get:function() { return true; }
    });


    Object.defineProperty(this, 'title', {
      get:function() { return $notify('title'); },
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

    Object.defineProperty(this, 'internal', {
      get:function() { return $menu; }
    });

    if(titlestring) this.title = titlestring;
    if(keystring) this.key = keystring;
    if(keymodifiers) this.modifiers = keymodifiers;*/
  }
  Notification.requestPermission = function(callback){
    if(callback) callback({handleEvent:function() { return true; }});
    return true;
  }
  return Notification;
})();