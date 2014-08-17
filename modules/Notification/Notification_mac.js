module.exports = (function() {
  var center = process.bridge.NSUserNotificationCenter('defaultUserNotificationCenter');

  function Notification()
  {
    var $ = process.bridge;
    var events = {};
    var titlestring = "", textstring = "", subtitlestring = "", soundEnabled = false;
    var actionbuttontitle = "", otherbuttontitle = "";

    function fireEvent(event, args) {
      if(events[event]) (events[event]).forEach(function(item,index,arr) { item.apply(null,args); });
    }

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }

    var NSUserNotificationCenterDelegate = process.bridge.NSObject.extend('NSUserNotificationCenterDelegate'+Math.round(Math.random()*10000));
    NSUserNotificationCenterDelegate.addMethod('init:', '@@:', function(self) { return self; });
    NSUserNotificationCenterDelegate.addMethod('userNotificationCenter:shouldPresentNotification:','B@:@@', function(self,_cmd,center,notify) { 
      return process.bridge.YES;
    });
    NSUserNotificationCenterDelegate.addMethod('userNotificationCenter:didActivateNotification:','v@:@@', function(self,_cmd,center,notify) {
      if(notify('activationType') == $.NSUserNotificationActivationTypeContentsClicked) fireEvent('click',['contents']);
      else if(notify('activationType') == $.NSUserNotificationActivationTypeActionButtonClicked) fireEvent('click',['button']);
    });
    NSUserNotificationCenterDelegate.addMethod('userNotificationCenter:didDeliverNotification:','v@:@@', function(self,_cmd,center,notify) {
      fireEvent('fired');
    });
    NSUserNotificationCenterDelegate.register();

    if(center != null) {
      var userNotifyInstance = NSUserNotificationCenterDelegate('alloc')('init');
      center('setDelegate',userNotifyInstance);
    }

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

      $notify = $.NSUserNotification('alloc')('init');
      
      // Get the default notification center
      if(center == null) {
        console.warn('Attempted to deliver notification, but only packaged apps may use notifcations.');
        return false;
      }

      if(!titlestring || titlestring == "") return false;
      if(!textstring || textstring == "") return false;

      // Set the title of the notification
      $notify('setTitle',$(titlestring));
      
      // Set the text of the notification
      $notify('setInformativeText',$(textstring));
      
      // Set the sound, this can be either nil for no sound, 
      // NSUserNotificationDefaultSoundName for the default sound (tri-tone) 
      // and a string of a .caf file that is in the bundle (filname and extension)
      if(soundEnabled) $notify('setSoundName',$.NSUserNotificationDefaultSoundName);
      else $notify('setSoundName',null);

      if(otherbuttontitle != "" && otherbuttontitle && (!actionbuttontitle || actionbuttontitle == "")) {
        console.warn('The auxillary button was set to a value, but the main button was not, neither will be used.');
      } 
      else if(actionbuttontitle && actionbuttontitle != "")
      {
        $notify('setActionButtonTitle',$(actionbuttontitle));
        if(otherbuttontitle && otherbuttontitle != "") $notify('setOtherButtonTitle',$(otherbuttontitle));
        //$notify('setHasActionButton',$.YES);
      }

      center('deliverNotification', $notify);
      return true;
    }
  }
  
  Notification.requestPermission = function(callback){
    if(callback) callback({handleEvent:function() { return center ? true : false; }});
    return center ? true : false;
  }

  return Notification;
})();