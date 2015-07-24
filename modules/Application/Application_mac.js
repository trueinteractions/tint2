(function() {
  if(typeof(global.__TINT) === 'undefined') {
    global.__TINT = {};
  }
  if(global.application) {
    return global.application;
  }

  require('Bridge');
  var $ = process.bridge.objc;
  process.bridge.objc.import('Foundation',0);
  process.bridge.objc.import('Cocoa',0);
  process.bridge.objc.import('AppKit',0);
  process.bridge.objc.import('WebKit',0);
  var util = require('Utilities');
  var assert = require('assert');
  
  // Help with garbage collection, this allows objective-c to reclaim
  // objective-c objects once we're finished with them. The FFI bridge in
  // modules/Bridge/ for OSX "retain" an Obj-C object on creation with the node::Buffer
  // object, when the node::Buffer object is reclaimed by v8, it calls a release
  // to decremenet the number of handles.  Once no handle exists, objc decides
  // whether it should be reclaimed natively.
  process.bridge.objc.NSAutoreleasePool('alloc')('init');

  // Register our font factory, this is a "boot" step for any app using fonts.
  require('FontInternals');


  /**
   * @class Application
   * @description An object always available named 'application' that allows control over
   *            multiple window contexts and the ability to listen or respond to OS events.
   *            You can use the application object to change its icon, name or request
   *            attention from the user.
   *
   *            Important: The Application object is created automatically.
   * @see process
   */
  function Application() {
    var name = "", badgeText = "", dockmenu = null, icon = "", terminateWhenLastWindowClosed = $.YES;
    var $app = $.NSApplication('sharedApplication');

    var delegateClass = $.AppDelegate.extend('AppDelegate2');
    delegateClass.addMethod('applicationShouldTerminateAfterLastWindowClosed:','B@:@',function() {
      return terminateWhenLastWindowClosed;
    });
    delegateClass.addMethod('applicationDockMenu:','@@:@',function() {
      try {
        if(dockmenu === null) {
          return null;
        } else {
          return dockmenu.native;
        }
      } catch(e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    });
    delegateClass.register();
    var delegate = delegateClass('alloc')('init');
    $app('setDelegate', delegate);
    /**
     * @member background
     * @type {boolean}
     * @memberof process
     * @description If process.background is set to true prior to using require('Common') or require('Application')
     *              the application is launched as a background application (e.g., does not appear in the dock or
     *              taskbar.)
     * @see Window
     */
    if(process.background) {
      $app('setActivationPolicy', $.NSApplicationActivationPolicyAccessory);
    } else {
      $app('setActivationPolicy', $.NSApplicationActivationPolicyRegular);
    }
    $app('activateIgnoringOtherApps', $.YES);

    Object.defineProperty(this, 'private', {value:{}, configurable:false, enumerable:false});

    var hotKeys = [];
    var eventWatchInitialized = false;
    var eventWatchGlobal = false;
    var initializeEventWatch = function() {
      if(eventWatchInitialized) return eventWatchGlobal;
      eventWatchInitialized = true;
      eventWatchGlobal = $.AXIsProcessTrusted();
      var blockCallback = $(function(self, arg) {
        if(arg('type') == $.NSKeyDown) {
          var modifierFlags = arg('modifierFlags');
          var alphashift = modifierFlags & $.NSAlphaShiftKeyMask ? true : false,
              shift = modifierFlags & $.NSShiftKeyMask ? true : false,
              ctrl = modifierFlags & $.NSControlKeyMask  ? true : false,
              cmd = modifierFlags & $.NSCommandKeyMask ? true : false,
              alt = modifierFlags & $.NSAlternateKeyMask ? true : false,
              num = modifierFlags & $.NSNumericPadKeyMask ? true : false,
              help = modifierFlags & $.NSHelpKeyMask ? true : false,
              fn = modifierFlags & $.NSFunctionKeyMask ? true : false,
              key = arg('charactersIgnoringModifiers').toString().toLowerCase();
          hotKeys.forEach(function(item) {
            if( ((item.modifiers.indexOf('alt') > -1 && alt) || (item.modifiers.indexOf('alt') === -1 && !alt)) &&
              ((item.modifiers.indexOf('ctrl') > -1 && ctrl) || (item.modifiers.indexOf('ctrl') === -1 && !ctrl)) &&
              ((item.modifiers.indexOf('cmd') > -1 && cmd) || (item.modifiers.indexOf('cmd') === -1 && !cmd)) &&
              ((item.modifiers.indexOf('shift') > -1 && shift) || (item.modifiers.indexOf('shift') === -1 && !shift)) && 
              key === item.key) 
            {
              item.func();
            }
          });
        }
        return arg;
      }.bind(this), ['@',['@','@']]);
      if(eventWatchGlobal) {
        $.NSEvent('addGlobalMonitorForEventsMatchingMask', $.NSKeyDownMask, 'handler', blockCallback);
      } else {
        $.NSEvent('addLocalMonitorForEventsMatchingMask', $.NSKeyDownMask, 'handler', blockCallback);
      }
      return eventWatchGlobal;
    }.bind(this);

    /**
     * @method registerHotKey
     * @param {string} key The character for the hot key, for example copy or ctrl+C, the character would be 'c', case does not matter.
     * @param {string} modifiers A comma delimited list of modifiers, options are 'alt', 'ctrl', 'cmd', or 'shift'.  For example 'shift,ctrl'
     * @param {function} callback The function executed when the hot key or shortcut is pressed.
     * @returns {Object} An object with the properites: {global,successful,unregister}. 'global' indicates if the hot key successfully registered beyond the
     *                   application context, 'successful' if the registeration was accepted by the OS, and 'unregister' is a 
     *                   function that can be executed to remove the hot key registration.
     * @memberof Application
     * @description The registerHotKey function attempts to assign a global hot key (or shortcut keyboard command) for the application. If a global
     *              hot key cannot be registered it assignts it as a local (application) hot key, if that is unsuccessful the successful
     *              property in the return object is set to false. Note the hot key may not be registered as a global
     *              hot key depending on security settings on Windows, or due to accessibility settings on OSX.
     *              Application entitlements or manually setting the application as an accessible or elevated privileged application will allow it
     *              to register a global hot key. To register a normal hot key, it's customary to use the Menu and MenuItem classes.
     * @example
     * require('Common');
     * var returnedObject = application.registerHotKey('m','ctrl',function() { 
     *  console.log('control m was pressed! ')
     * });
     * // note that the returned object can be used to subsequently unregister
     * // this hot key, e.g., returnedObject.unregister();
     * @no-screenshot
     * @see Menu
     * @see MenuItem
     */
    this.registerHotKey = function(key, modifiers, func) {
      assert(key.length === 1, 'A global hot key may only have one character.');
      key = key[0].toLowerCase();
      initializeEventWatch();
      var hotKeyData = {key:key, modifiers:modifiers, func:func};
      hotKeys.push(hotKeyData);
      var global = initializeEventWatch();
      return { global:global, successful:true, unregister:function() {
        hotKeys.splice(hotKeys.indexOf(hotKeyData),1);
      }};
    };
    /**
     * @method unregisterAllHotKeys
     * @memberof Application
     * @description Removes all hot keys assigned by the application (with the exception of Menu related hot keys).
     * @see Menu
     * @see MenuItem
     */
    this.unregisterAllHotKeys = function() {
      hotKeys.forEach(function(hotKeyData) {
        hotKeys.splice(hotKeys.indexOf(hotKeyData),1);
      });
    }

    /**
     * @method addEventListener
     * @param {string} eventName The name of the application event to start listening to.
     * @param {function} callback The function that will be called when it occurs.
     * @memberof Application
     * @description Adds an event listener for various application level events. The first
     *              parameter is the name of the event, the second parameter is the function
     *              to call when the event happens (e.g., a callback).
     */
    /**
     * @method removeEventListener
     * @param {string} eventName The name of the application event to stop listening to.
     * @param {function} callback The function that would have been called.
     * @memberof Application
     * @description Removes an event listener for various application level events. The first
     *              parameter is the name of the event, the second parameter is the function
     *              that was originally given as the callback for addEventListener.
     */
    util.defEvents(this);

    this.addEventListener('event-listener-added', function(event) {
      if( typeof(event) !== 'undefined' && 
          event === 'open' && 
          typeof(process['_pending_osevents']) !== 'undefined' &&
          process['_pending_osevents'].length > 0) 
      {
        this.fireEvent('open', [process['_pending_osevents']]);
      }
    }.bind(this));

    // unused, stub to help move us a bit closer to a standard spec
    this.launch = function() { fireEvent('launch'); };
    this.uninstall = function() { console.warn('unimplemented'); };

    /**
     * @member packaged
     * @type {boolean}
     * @memberof Application
     * @description Gets a true or false boolean value if the application is packaged
     *              or is being ran as a script.
     * @see Window
     */
    util.def(this, 'packaged', function() { return process.packaged; });

    /**
     * @method resource
     * @param {string} path
     * @returns {Buffer}
     * @memberof Application
     * @description Takes a path to an application resource and returns a {@link Buffer} 
     *              object.  This is useful if you need to get access to packaged 
     *              resources.
     * @see Window
     */
    this.resource = function(path) {
      if(path.indexOf('app:///') === -1) {
        path = 'app:///' + path.replace("app://","");
      }
      if(path === "app:///blank-page-appschema.html") {
        return new Buffer("<!doctype html>\n<html>\n<body></body></html>","utf8");
      }
      var url = $.NSURL('URLWithString',$(path.toString()));
      var data = $.NSData('dataWithContentsOfURL',url);
      if(data && data('length') === 0) {
        return new Buffer(0);
      } else if(data) {
        return process.bridge.reinterpret(data('bytes'),data('length'),0);
      } else {
        if(this.warn) {
          console.warn('Cannot find resource at: ', path);
        }
        return null;
      }
    };
    
    /**
     * @member name
     * @type {string}
     * @memberof Application
     * @description The name property is used to get or set the process name in the task
     *              manager, or when the application is shown.  Note that the packaged
     *              application name should match this name.
     */
    util.def(this, 'name', function() { 
        if(!name || name === "") {
          return process.cwd();
        } else {
          return name;
        }
      },
      function(e) { 
        name = e;
        $.NSProcessInfo('processInfo')('setProcessName',$(name));
        setTimeout(function() { $.NSProcessInfo('processInfo')('setProcessName',$(name)); },1000);
      }
    );

    // Unsupported on Windows, TOOD: Remove or figure out a way to support this on Win?
    util.def(this, 'badge', function() { return badgeText; },
      function(e) { 
        badgeText = e;
        $app('dockTile')('setBadgeLabel',$(badgeText.toString()));
      }
    );

    // Unsupported on Windows, TOOD: Remove or figure out a way to support this on Win?
    util.def(this, 'dockmenu', function() { return dockmenu; }, function(e) { dockmenu = e; });
    
    /**
     * @member icon
     * @type {string}
     * @memberof Application
     * @description The icon property allows you to set or get the current image associated
     *              with the application (and subsequently used in the dock/task bar or on
     *              window decorations).  The string must be a valid URL or path to an image
     *              on the file system or application resource (For best results use 512x512 
     *              PNG image).
     */
    util.def(this, 'icon', function() { return icon; },
      function(e) {
        icon = e;
        e = util.makeNSImage(e);
        if(e) {
          $app('setApplicationIconImage', e);
        }
      }
    );

    /**
     * @member exitAfterWindowsClose
     * @type {boolean}
     * @memberof Application
     * @description Gets or sets if the application should quit (or exit returning 0) when the
     *              last remaining window is closed (Note: hidden windows still count as open
     *              windows and will prevent applications from closing). The default for this is
     *              true. 
     * @default true
     * @see Window
     */
    util.def(this, 'exitAfterWindowsClose',
      function() { return terminateWhenLastWindowClosed === $.YES ? true : false; },
      function(e) { terminateWhenLastWindowClosed = e ? $.YES : $.NO; }
    );

    // Get access to the native NSApplication.
    util.def(this, 'native', function() { return $app; });

    this.hideAllOtherApplications = function() { $app('hideOtherApplications', $app); };
    this.unhideAllOtherApplications = function() { $app('unhideAllApplications', $app); };

    /**
     * @member visible
     * @type {boolean}
     * @memberof Application
     * @description Gets or sets the visibility of the application.  This will reveal or hide
     *              all windows associated with the application.  Note that other OS/UI elements
     *              may not be hidden, such as modal dialogs, or indicator icons in the taskbar.
     * @see Window
     */
    util.def(this, 'visible',
      function() { return $app('isHidden') === $.NO ? true : false; },
      function(e) { 
        if(e) {
          $app('unhide',$app); 
        } else  {
          $app('hide', $app);
        } 
      }
    );

    /**
     * @method attention
     * @param {boolean} critical
     * @returns {Object} An object with one function "cancel" allowing you to cancel the request.
     * @memberof Application
     * @description Animates the icon in the dock or task bar to "bounce" (on OSX) or "highlight" 
     *              (in Windows). If false (or nothing) is passed into this the animation 
     *              is played for a short time (depending on OS preferences), if true is passed in 
     *              (e.g., a critical alert is needed) the icon continues to animate until a window
     *              or the application icon in the dock is clicked.
     */
    this.attention = function(critical) {
      $app('requestUserAttention', (critical ? $.NSCriticalRequest : $.NSInformationalRequest) );
      return {cancel:function() { $app('cancelUserAttentionRequest', (critical ? $.NSCriticalRequest : $.NSInformationalRequest) ); }.bind(this)};
    };
    
    /**
     * @method paste
     * @memberof Application
     * @description Invokes a paste operation, this takes whatever is currently in the clipboard
     *              and sends a paste operation to the focused window and control.
     */
    this.paste = function() { $app('sendAction', 'paste:', 'to', null, 'from', $app); };

    /**
     * @method copy
     * @memberof Application
     * @description Invokes a copy operation, this takes whatever is currently selected in the
     *              focused window and control and places it into the clipboard.
     */
    this.copy = function() { $app('sendAction', 'copy:', 'to', null, 'from', $app); };

    /**
     * @method cut
     * @memberof Application
     * @description Invokes a cut operation, this takes whatever is currently selected in the
     *              focused window and control and places it into the clipboard and removes the
     *              selected element from the application (usually text or images)
     */
    this.cut = function() { $app('sendAction', 'cut:', 'to', null, 'from', $app); };

    /**
     * @method undo
     * @memberof Application
     * @description This rewinds a controls value (e.g., perhaps text in a textbox) for the
     *              currently focused window and control.
     */
    this.undo = function() { $app('sendAction', 'undo:', 'to', null, 'from', $app); };

    /**
     * @method redo
     * @memberof Application
     * @description This repeats the last rewound value of the currently focused window and
     *              control. 
     */
    this.redo = function() { $app('sendAction', 'redo:', 'to', null, 'from', $app); };

    /**
     * @method delete
     * @memberof Application
     * @description Deletes the currently selected value for the currently focused window
     *              and control.
     */
    this.delete = function() { $app('sendAction', 'delete:',' to', null, 'from', $app); };

    /**
     * @method selectAll
     * @memberof Application
     * @description Selects all the values in the UI of the currently focused window and
     *              control.
     */
    this.selectAll = function() { $app('sendAction', 'selectAll:', 'to', null, 'from', $app); };


    /** 
     * @method isRegisteredForFileType
     * @memberof Application
     * @param {string} filetype A file extention without the leading period (e.g., txt, jpg)
     * @description Checks to see if the application is responsible for handling open requests from
     *              the operating system for the specified file type extension (e.g., jpg, txt).
     *              Returns a true or false boolean to indicate whether the application is registered
     *              for the file type.  Note: this method has undefined behavior when the application
     *              has not been bundled or packaged.
     * @returns {boolean} A true or false value if the file type is registered
     */
    this.isRegisteredForFileType = function(t) {
      var fsext = $.CFStringCreateWithCString($.kCFAllocatorDefault, "public.filename-extension", 0);
      var ext = $.CFStringCreateWithCString($.kCFAllocatorDefault, t, 0);
      var id = $.UTTypeCreatePreferredIdentifierForTag(fsext, ext, null);
      var theirBundleId  = $.CFStringGetCStringPtr($.LSCopyDefaultRoleHandlerForContentType(id, $.kLSRolesAll));
      var ourBundleId = $.NSBundle('mainBundle')('bundleIdentifier')('UTF8String');
      return ourBundleId === theirBundleId;
    }

    /** 
     * @method registerFileType
     * @memberof Application
     * @param {string} filetype A file extention without the leading period (e.g., txt, jpg)
     * @description Registers for the specified file type by its extension (e.g., txt, jpg, png). If successful
     *              the application is launched (if not running) and the application's 'open' event is fired with
     *              the location of the file when the user requests the file to be opened through the OS. This
     *              is an expensive operation and should be run sparingly (usually only on install). If
     *              the application is successfully assigned to the file type the method returns true,
     *              otherwise false.  This has undefined behavior if the application is not packaged or
     *              bundled. Note, operating systems may reserve and protect specific file types from 
     *              being re-assigned for security and user experience reasons. This only needs to be
     *              executed once in the life time of the application being installed on the system. In
     *              addition applications that misbehave may find the OS will ignore these requests. It's
     *              generally best practice to check if the registered file type is already assigned 
     *              (using isRegisteredForFileType) before requesting assignment. As a general courtesy, 
     *              ask the user to become the default handler for a file type (unless the file type is 
     *              exclusive to your application and proprietary) before requesting assignment.
     * @returns {boolean} A true or false value indicating if the operation was successful.
     */
    this.registerFileType = function(t) {
      var fsext = $.CFStringCreateWithCString($.kCFAllocatorDefault, "public.filename-extension", 0);
      var ext = $.CFStringCreateWithCString($.kCFAllocatorDefault, t, 0);
      var id = $.UTTypeCreatePreferredIdentifierForTag(fsext, ext, null);
      var bundle = $.CFStringCreateWithCString($.kCFAllocatorDefault, $.NSBundle('mainBundle')('bundleIdentifier')('UTF8String'), 0);
      var result  = $.LSSetDefaultRoleHandlerForContentType(id, $.kLSRolesAll, bundle);
      return result === 0;
    };

    /** 
     * @method isRegisteredForScheme
     * @memberof Application
     * @param {string} scheme A URI scheme (e.g., http, https, ftp, mailto, tel, etc)
     * @description Checks to see if the application is responsible for handling open URI requests from
     *              the operating system for the specified scheme (e.g., http, ftp, https, etc).
     *              Returns a true or false boolean to indicate whether the application is registered
     *              for the scheme.  Note: this method has undefined behavior when the application
     *              has not been bundled or packaged.
     * @returns {boolean} A true or false value if the scheme is registered
     */
    this.isRegisteredForScheme = function(scheme) {
      var theirs = $.CFStringGetCStringPtr($.LSCopyDefaultHandlerForURLScheme($.CFStringCreateWithCString($.kCFAllocatorDefault, scheme, 0)));
      var ours = $.NSBundle('mainBundle')('bundleIdentifier')('UTF8String');
      return theirs === ours;
    };
    /** 
     * @method registerScheme
     * @memberof Application
     * @param {string} scheme A URI scheme as a string (e.g., ftp, https, http)
     * @description Registers for the specified scheme (e.g., ftp, http, https).  If successful
     *              the application is launched (if not running) and the application's 'open' event is fired with
     *              the full URL when the user requests the url to be opened through the OS. This
     *              is an expensive operation and should be run sparingly (usually only on install). If
     *              the application is successfully assigned as the opener for the scheme the method returns true,
     *              otherwise false.  This has undefined behavior if the application is not packaged or
     *              bundled. Note, operating systems may reserve and protect specific schemes from 
     *              being re-assigned for security and user experience reasons (such as tel on phones). 
     *              This only needs to be executed once in the life time of the application being 
     *              installed on the system. In addition applications that misbehave may find the OS will 
     *              ignore these requests. It's generally best practice to check if the registered scheme 
     *              is already assigned (using isRegisteredForScheme) before requesting assignment. As a general courtesy, 
     *              ask the user to become the default handler for a scheme (unless the scheme is 
     *              exclusive to your application and proprietary) before requesting assignment.
     * @returns {boolean} A true or false value indicating if the operation was successful.
     */
    this.registerScheme = function(scheme) {
      var result = $.LSSetDefaultHandlerForURLScheme(
        $.CFStringCreateWithCString($.kCFAllocatorDefault, scheme, 0),
        $.CFStringCreateWithCString($.kCFAllocatorDefault, $.NSBundle('mainBundle')('bundleIdentifier')('UTF8String'), 0)
      );
      if(result !== 0) {
        return false;
      }
      var bundleUrl = $.CFStringCreateWithCString($.kCFAllocatorDefault, $.NSBundle('mainBundle')('bundleURL')('absoluteString')('UTF8String'), 0);
      result = $.LSRegisterURL($.CFURLCreateWithString($.kCFAllocatorDefault, bundleUrl , null), true);
      return result === 0;
    };
  }
  global.application = new Application();


  /** 
   * @event open
   * @memberof Application
   * @description The open event is fired when a file type or scheme that the application is assigned
   *              to handle (through Application.registerScheme or Application.registerFileType) is 
   *              attempted to be opened through a web browser, file browser, or through a seperate
   *              application.  The first argument passed in is an array of url's requesting to be
   *              opened. Note that if your application is not currently running your application is
   *              automatically opened and the open event is fired immediately when an event handler
   *              (function callback) is assigned to the open event.
   */
  process['_osevents'] = function(url) {
    global.application.fireEvent('open', [[url]]);
  };


  // Include the app schema. app:// registers on NSURL and for node require().
  require('AppSchema');
})();
