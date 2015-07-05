module.exports = (function() {
  var center = process.bridge.objc.NSUserNotificationCenter('defaultUserNotificationCenter');
  var util = require('Utilities');
  /**
   * @class Notification
   * @description Creates a new notification.  Notifications are small two-three line notifications
   *              about an event that may have happened.  The user is given a short period to respond
   *              to the notification before it disappears.  The notification may have a specific call
   *              to action. This is useful to let the user know about new developments, for example
   *              in a mail application this may show a new message that arrived, the text could have
   *              the subject line, the specific CTA may be "Trash" or "Delete" while clicking anywhere
   *              in the notification would open the email.
   */
  /**
   * @new 
   * @memberof Notification
   * @description Creates a new notification that is initially hidden and not shown.
   */
  function Notification()
  {
    var $ = process.bridge.objc;
    var titlestring = "", textstring = "", subtitlestring = "", 
        soundEnabled = false, actionbuttontitle = "", otherbuttontitle = "";

    util.defEvents(this);
    /**
     * @event click
     * @memberof Notification
     * @description Fires when a user presses a button on the notification, the first parameter passed in
     *              to the callback on the event indicates the area that was clicked.  The value is either
     *              'contents', 'button' or 'unknown'.
     */
    var NSUserNotificationCenterDelegate = $.NSObject.extend('NSUserNotificationCenterDelegate'+Math.round(Math.random()*10000));
    NSUserNotificationCenterDelegate.addMethod('init:', '@@:', function(self) { return self; });
    NSUserNotificationCenterDelegate.addMethod('userNotificationCenter:shouldPresentNotification:','B@:@@', function(self,_cmd,center,notify) { return $.YES; });
    NSUserNotificationCenterDelegate.addMethod('userNotificationCenter:didActivateNotification:','v@:@@', function(self,_cmd,center,notify) {
      if(notify('activationType') === $.NSUserNotificationActivationTypeContentsClicked) {
        this.fireEvent('click',['contents']);
      } else if(notify('activationType') === $.NSUserNotificationActivationTypeActionButtonClicked) {
        this.fireEvent('click',['button']);
      } else {
        this.fireEvent('click', ['unknown']);
      }
    }.bind(this));
    NSUserNotificationCenterDelegate.addMethod('userNotificationCenter:didDeliverNotification:','v@:@@', function(self,_cmd,center,notify) { this.fireEvent('fired'); }.bind(this));
    NSUserNotificationCenterDelegate.register();

    if(center != null) {
      var userNotifyInstance = NSUserNotificationCenterDelegate('alloc')('init');
      center('setDelegate',userNotifyInstance);
    }

    /**
     * @member title
     * @type {string}
     * @memberof Notification
     * @description Gets or sets the title for the notification.  This should be a very short message, less than 10 words.
     */
    Object.defineProperty(this, 'title', {
      get:function() { return titlestring; },
      set:function(e) { titlestring = e; }
    });
    /**
     * @member subtitle
     * @type {string}
     * @memberof Notification
     * @description Gets or sets the sub-title for the notification.  This should be a very short message, less than 10 words.
     */
    Object.defineProperty(this, 'subtitle', {
      get:function() { return subtitlestring; },
      set:function(e) { subtitlestring = e; }
    });
    /**
     * @member text
     * @type {string}
     * @memberof Notification
     * @description Gets or sets the text in the notification, this can hold, on average, up to 25 words.
     */
    Object.defineProperty(this, 'text', {
      get:function() { return textstring; },
      set:function(e) { textstring = e; }
    });

    /**
     * @member sound
     * @type {boolean}
     * @memberof Notification
     * @description Gets or sets whether the system should play a default attention system sound when the notification happens.
     *              The default for this is false. Note that sound may not play depending on the user preferences set on the
     *              operating system.
     */
    Object.defineProperty(this, 'sound', {
      get:function() { return soundEnabled; },
      set:function(e) { soundEnabled = e ? true : false; }
    });

    /**
     * @member buttonLabel
     * @type {string}
     * @memberof Notification
     * @description Gets or sets the text label for the call-to-action button. This is optional, and if left blank removes
     *              the button from the notification.  
     */
    Object.defineProperty(this, 'buttonLabel', {
      get:function() { return actionbuttontitle; },
      set:function(e) { actionbuttontitle = e; }
    });

    /*Object.defineProperty(this, 'auxillaryButtonLabel', {
      get:function() { return otherbuttontitle; },
      set:function(e) { otherbuttontitle = e; }
    });*/

    /**
     * @method dispatch
     * @memberof Notification
     * @returns {boolean}
     * @description Dispatches the notification and shows it.  Once dispatched there is no way to 
     *              cancel to notification from showing. This method returns false if the notification
     *              failed to show (see requestPermission).
     */
    this.dispatch = function() {

      var $notify = $.NSUserNotification('alloc')('init');
      // Get the default notification center
      if(center === null) {
        console.warn('Attempted to deliver notification, but only packaged apps may use notifcations.');
        return false;
      }

      if(!titlestring || titlestring === "") {
        return false;
      }
      if(!textstring || textstring === "") {
        return false;
      }

      // Set the title of the notification
      $notify('setTitle',$(titlestring));
      
      // Set the text of the notification
      $notify('setInformativeText',$(textstring));
      
      // Set the sound, this can be either nil for no sound, 
      // NSUserNotificationDefaultSoundName for the default sound (tri-tone) 
      // and a string of a .caf file that is in the bundle (filname and extension)
      if(soundEnabled) {
        $notify('setSoundName',$.NSUserNotificationDefaultSoundName);
      } else {
        $notify('setSoundName',null);
      }

      if(otherbuttontitle !== "" && otherbuttontitle && (!actionbuttontitle || actionbuttontitle === "")) {
        console.warn('The auxillary button was set to a value, but the main button was not, neither will be used.');
      } 
      else if(actionbuttontitle && actionbuttontitle !== "")
      {
        $notify('setActionButtonTitle',$(actionbuttontitle));
        if(otherbuttontitle && otherbuttontitle !== "") {
          $notify('setOtherButtonTitle',$(otherbuttontitle));
        }
        $notify('setHasActionButton',$.YES);
        var num = $.NSNumber('numberWithDouble',1);
        $notify('setValue', num, 'forKey', $('_showsButtons'));
      }

      center('deliverNotification', $notify);
      return true;
    }
  }

  /**
   * @method requestPermission
   * @param {function} callback A function to callback as to the result of the request. 
   *                            The function will be passed on parameter that is either true or false.
   * @memberof Notification
   * @description This method requests permission to use notifications from the underlying operating system. At the moment this always returns true unless there
   *              is an explicit ban on the application pushing notifications (perhaps it was done too often or the user has explicitly set them not to show in
   *              the system preferences).  This method is static and does not require creating a notification object.  It also is not required to be used prior
   *              to creating a notification.
   */
  Notification.requestPermission = function(callback){
    if(callback) {
      callback({handleEvent:function() { return center ? true : false; }});
    }
    return center ? true : false;
  }

  return Notification;
})();