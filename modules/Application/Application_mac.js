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

    Object.defineProperty(this, 'private', {value:{}, configurable:false, enumerable:false});

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
      if(data && data('length') > 0) {
        return process.bridge.reinterpret(data('bytes'),data('length'),0);
      } else {
        if(this.warn) {
          console.warn('Cannot find resource at: ', path);
        }
        return null;
      }
    };

    //
    // @member windows
    // @type {array}
    // @memberof Application
    // @description Gets an array of windows that the application has ownership of. 
    //              If you loose your window object or a new one is created by a seperate
    //              module you can access any window that the application owns from this.
    //              Note: When you create or remove a window this is automatically updated.
    //              and subsequently should only be read from, the array should not be changed.
    //
    //Object.defineProperty(this, 'windows', {
    //  get:function() { return nswindows; }
    //});
    
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
     * @member background
     * @type {boolean}
     * @memberof process
     * @description If process.background is set to true prior to using require('Common') or require('Application')
     *              the application is launched as a background application (e.g., does not appear in the dock or
     *              taskbar.)
     * @see Window
     */
    if(!process.background) {
      $app('setActivationPolicy', $.NSApplicationActivationPolicyRegular);
    }
    $app('activateIgnoringOtherApps', true);
  }

  global.application = new Application();

  // Include the app schema. app:// registers on NSURL and for node require().
  require('AppSchema');
})();
