module.exports = (function() {
  var Container = require('Container');
  var utilities = require('Utilities');
  var Delegate = require('Bridge');
  var Color = require('Color');
  var $ = process.bridge.objc;
  /**
   * @class Window
   * @description Creates a new Window for controls to be placed on. The window is
   *              a regular window (vs a panel or tool window or modal dialog).
   * @see Panel
   * @extends Container
   * @see Dialog
   */
  function Window(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    // Set defaults that must be set prior to instantiation.
    options.width = options.width || 500;
    options.height = options.height || 500;
    options.styleMask = options.styleMask || ($.NSTitledWindowMask | $.NSClosableWindowMask | $.NSMiniaturizableWindowMask | 
                                              $.NSResizableWindowMask | $.NSTexturedBackgroundWindowMask);
    // Setup how we will respond to OS requests or inquiries about our window state
    // and behavior. This is done so that we can provide consistant behavior across
    // OSX/Windows, and so we can add functionality and proper events.
    options.delegates = options.delegates || [];
    /**
     * @event close
     * @memberof Window
     * @description Fires when the window is destroyed and resources are released, this is 
     *              fired just before the window is closed.
     */
    /**
     * @event enter-fullscreen
     * @memberof Window
     * @description Fires when the window is entering into full screen mode.
     */
    /**
     * @event leave-fullscreen
     * @memberof Window
     * @description Fires when the window is exiting into full screen mode.
     */
    /**
     * @event focus
     * @memberof Window
     * @description Fires when the window gains focus from the mouse or keyboard.
     */
    /**
     * @event blur
     * @memberof Window
     * @description Fires when the window looses focus from the mouse or keyboard.
     */
    /**
     * @event minimize
     * @memberof Window
     * @description Fires when the state of the window becomes minimized.
     */
    /**
     * @event restore
     * @memberof Window
     * @description Fires when the state of the window goes from being minimized into a new state.
     */
    /**
     * @event move
     * @memberof Window
     * @description Fires when the window is moved by the user through the title bar.
     */
    /**
     * @event resize
     * @memberof Window
     * @description Fires when the window is resized by the user.
     */
    /**
     * @event closed
     * @memberof Window
     * @description Fires after the window has been destroyed and all resources have been
     *              released.  Do not refer to the window during this event.
     */
    options.delegates = options.delegates.concat([
      ['windowWillClose:', 'v@:@@', function(self, cmd, window) { this.fireEvent('close'); return $.YES; }.bind(this)],
      ['windowWillEnterFullScreen:', 'v@:@@', function(self, cmd, notif) { this.fireEvent('enter-fullscreen'); }.bind(this)],
      ['windowWillExitFullScreen:', 'v@:@@', function(self, cmd, notif) { this.fireEvent('leave-fullscreen'); }.bind(this)],
      ['windowDidBecomeKey:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('focus'); }.bind(this)],
      ['windowDidResignKey:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('blur'); }.bind(this)],
      //TODO: Maximize? OSX does not have a default "maximize" state like Windows, it just "zooms" the window.
      ['windowDidMiniaturize:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('minimize'); }.bind(this)],
      ['windowDidDeminiaturize:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('restore'); }.bind(this)],
      ['windowDidMove:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('move'); }.bind(this)],
      ['windowDidResize:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('resize'); }.bind(this)],
      ['windowDidClose:', 'v@:@@', function(self,cmd,notification) { this.fireEvent('closed'); }.bind(this)]
    ]);

    // We detect whether this already has a class passed in so that we can properly use
    // inheritence. If a native object isn't passed in we default to using NSWindow.
    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSWindow, $.NSView, options);

    // We'll need to first detect if we have an object already initialized, if not we'll do it.
    // this is a work around to support inheritence in JS.
    if(!options.nativeObject) {
      this.native = this.nativeClass('alloc')('initWithContentRect', $.NSMakeRect(0,0,options.width,options.height), 
                          'styleMask', options.styleMask,
                          'backing', $.NSBackingStoreBuffered, 
                          'defer', $.YES);
      this.nativeView = this.nativeViewClass('alloc')('init');
      this.native('setContentView',this.nativeView);
    } else {
      this.native = options.nativeObject;
      var contentView = this.native('contentView');
      this.nativeView = this.nativeViewClass('alloc')('init');
      this.native('setContentView',this.nativeView);
      this.native('contentView')('addSubview',contentView);      
    }
    // We need to respond to OS requests, let the OS know we'll be in charge of it. Some controls default
    // to not having a delegate or responder so its necessary to do this rather than further up the
    // inheritence chain.
    this.native('setDelegate',this.nativeView);

    // We need to set some defaults so we properly behave in a cross-platform compatible way.
    // these defaults should give us consistant behavior across Windows and OSX.
    this.native('contentView')('setAutoresizingMask', $.NSViewWidthSizable | $.NSViewHeightSizable | $.NSViewMinXMargin | 
                                                      $.NSViewMaxXMargin | $.NSViewMinYMargin | $.NSViewMaxYMargin );
    this.native('setFrame', $.NSMakeRect(0,0,options.width,options.height), 'display', $.YES, 'animate', $.YES);
    this.native('cascadeTopLeftFromPoint', $.NSMakePoint(20,20));
    this.private.fullscreen = false;
    this.private.background = "auto";
    this.private.menu = null;
    this.private.toolbar = null;
    this.private.defaultStyleMask = options.styleMask;
    this.private.type = "Window";
    this.native('setReleasedWhenClosed', $.YES);
    this.native('setExcludedFromWindowsMenu', $.NO);
    this.native('center');

    // Incase the user loooses control of the object, ensure we hold 
    // on to it via the application.windows array. This has two benefits,
    // one if the user isn't interested in paying attention they can loose and
    // reclaim the window.  Second is if the object is lost and garbage collected
    // it will be closed and collected by Objective-C, so we must hold on to it
    // somewhere, always (until destroyed). 
    application.windows.push(this);

    // This is simply to ensure if we remove our content view we properly adhere
    // to OSX/objective-c behavior. OSX/ObjC requires we notify its removal for
    // consistant behavior of events being thrown from the underlying delegate.
    this.addEventListener('remove', function(control) { this.native('contentView')('willRemoveSubview',control.nativeView); });
  }
  
  Window.prototype = Object.create(Container.prototype);
  Window.prototype.constructor = Window;

  Window.prototype.preferences = {
    animateOnSizeChange:false,
    animateOnPositionChange:false
  }

  /**
   * @member frame
   * @type {boolean}
   * @memberof Window
   * @description Gets or sets whether the window has a native frame, e.g., resize handles, minimize
   *              and maximize buttons and a titlebar.  If set to false, only the content area or
   *              'client area' is rendered. This is useful for splash screens and other informative
   *              windows. By default this is true.
   * @default true
   */
  Object.defineProperty(Window.prototype, 'frame', {
    get:function() { 
      var os = require('os');
      var version = parseInt(os.release().substring(0,os.release().indexOf('.')));
      if(version > 13)
        return this.minimizeButton ||
               this.maximizeButton ||
               this.closeButton ||
               this.resizable ||
               (this.native('styleMask') & $.NSTiledWindowMask);
      else
        return this.minimizeButton || this.maximizeButton || this.closeButton || this.resizable;
    },
    set:function(e) {
      this.minimizeButton = e;
      this.maximizeButton = e;
      this.closeButton = e;
      this.resizable = e;
      var os = require('os');
      var version = parseInt(os.release().substring(0,os.release().indexOf('.')));
      if(version > 13) {
        if(e) this.native('setStyleMask', this.private.defaultStyleMask);
        else this.native('setStyleMask', 0);
      }
    }
  });

  /**
   * @member textured
   * @type {boolean}
   * @memberof Window
   * @description Gets or sets whether the window's style is textured.  By default this is true.
   *              Textured windows use the native OS' texture to render the background, on OSX
   *              this is the metal or brushed look, on some Windows platforms this is a glass
   *              look on the frame elements. Setting this to false disables these.
   */
  Object.defineProperty(Window.prototype, 'textured', {
    get:function() { return this.native('styleMask') & $.NSTexturedBackgroundWindowMask; },
    set:function(e) { 
      if(e) this.native('setStyleMask', this.native('styleMask') | $.NSTexturedBackgroundWindowMask);
      else this.native('setStyleMask', this.native('styleMask') & ~$.NSTexturedBackgroundWindowMask);
      setTimeout(function() {
        this.native('setViewsNeedDisplay', $.YES);
        this.native('contentView')('setNeedsDisplay', $.YES);
        this.native('flushWindow');
      }.bind(this),10);
    }
  });

  Object.defineProperty(Window.prototype, 'shadow', {
    get:function() { return this.native('hasShadow') == $.YES ? true : false; },
    set:function(e) { this.native('setHasShadow', e ? $.YES : $.NO); }
  });

  /**
   * @member menu
   * @type {Menu}
   * @memberof Window
   * @description Gets or sets the menu associated with this Window.  On OSX the same menu is
   *              used for all windows and is not rendered as part of the window.  On Windows
   *              the menu is rendered at the top of the window as part of its frame.
   * @see Menu
   */
  Object.defineProperty(Window.prototype, 'menu', {
    get:function() { return this.private.menu; },
    set:function(e) {
      this.private.menu = e;
      global.application.native('setMainMenu',this.private.menu.native);
    }
  });

  /**
   * @member toolbar
   * @type {Toolbar}
   * @memberof Window
   * @description Gets or sets the toolbar associated with the Window. The toolbar provides
   *              a consistant panel of controls regardless of how the content or child elements
   *              behave. Both OSX and Windows render these at the top (underneath the Menu) as
   *              part of the client area.
   * @see Toolbar
   */
  Object.defineProperty(Window.prototype, 'toolbar', {
    get:function() { return this.private.toolbar; },
    set:function(e) {
      if(this.frame == false && e) {
        if(application.warn) console.warn('Cannot add a toolbar to a window that has Window.frame = false;');
        return;
      }

      if(!e || e == null) {
        this.native('setStyleMask',this.native('styleMask') & ~$.NSUnifiedTitleAndToolbarWindowMask);
      } else {
        this.native('setStyleMask',this.native('styleMask') | $.NSUnifiedTitleAndToolbarWindowMask);
        this.private.toolbar = e;
        this.native('setToolbar', this.private.toolbar.native);
      }
      
    }
  });

  /**
   * @member canBeFullscreen
   * @type {boolean}
   * @memberof Window
   * @description Gets or sets whether the window can be set to "fullscreen".  The behavior of some
   *              operating systems is to default to fullscreen when maximized.  This determines whether
   *              the Window will go into fullscreen on maximize or if it can when the OS requests so.
   */
  Object.defineProperty(Window.prototype, 'canBeFullscreen', {
    get:function() { return this.native('collectionBehavior') && $.NSWindowCollectionBehaviorFullScreenPrimary ? true : false; },
    set:function(e) {
      e = e ? true : false;
      if(e) this.native('setCollectionBehavior', this.native('collectionBehavior') | $.NSWindowCollectionBehaviorFullScreenPrimary);
      else this.native('setCollectionBehavior', this.native('collectionBehavior') ^ $.NSWindowCollectionBehaviorFullScreenPrimary);
      
      // enable the button (or disable the button on Mavericks/Lion)
      if(this.native('standardWindowButton',$.NSWindowFullScreenButton))
        this.native('standardWindowButton',$.NSWindowFullScreenButton)('setHidden',!e);
    }
  });

  /**
   * @member state
   * @type {string} 
   * @memberof Window
   * @description Gets or sets the state of the window.  The options are "fullscreen", "maximized", "minimized",
   *              "fullscreen" or "normal". Note: If the window's property 'canbeFullScreen' is not set to true
   *              setting "fullscreen" will have no effect.
   *
   * @example
   *  require('Common');
   *  var win = new Window();
   *  win.visible = true;
   *  // maximizes the new window, previous state is "normal"
   *  win.state = "maximized";
   *  // minimizes the window, previous state was "maximized"
   *  win.state = "minimized";
   *  // brings the window back to its normal, unmaximized state on screen.
   *  win.state = "normal"
   */
  Object.defineProperty(Window.prototype, 'state', {
    get:function() { 
      if(this.private.fullscreen) return "fullscreen";
      else if(this.native('isZoomed')) return "maximized";
      else if(this.native('isMiniaturized')) return "minimized";
      else return "normal";
    },
    set:function(e) { 
      if(e == 'maximized' || e == 'normal') {
        if(this.private.fullscreen) {
          this.native('toggleFullScreen',this.native);
          this.private.fullscreen = false;
        }
        if(this.native('isMiniaturized')) this.native('deminiaturize',this.native);
        if(e == 'maximized') this.native('performZoom',this.native);
      } else if (e == 'minimized') {
        if(this.private.fullscreen) {
          this.native('toggleFullscreen',this.native);
          this.private.fullscreen = false;
        }
        this.native('performMiniaturize',this.native);
      } else if (e == 'fullscreen') {
        if(!this.private.fullscreen) {
          this.native('toggleFullScreen',this.native);
          this.private.fullscreen = true;
        }
      }
    }
  });

  /**
   * @member title
   * @type {string}
   * @memberof Window
   * @description Gets or sets the title of the window. This is the text displayed in the capiton.
   *              The default of this is an empty string, if the property of the window's frame is
   *              set to false (not the default value) then the title does not render.
   * @example
   *  require('Common');
   *  var win = new Window();
   *  win.visible = true;
   *  // Set the title bar caption to "hello"
   *  win.title = "hello";
   */
  (utilities.makePropertyStringType.bind(Window.prototype))('title','title','setTitle');

  /**
   * @member y
   * @type {number}
   * @memberof Window
   * @description Gets or sets the position from the top of the screen where the window is at.
   *              This does not account for the work area. Setting this to a value that impeeds
   *              on system areas (such as the menu bar on OSX or the task bar on Windows) resets
   *              the value to as close as possible coordinate value. For example, setting y to
   *              0 will reset its position to 22 on OSX to prevent it from overlapping the menubar.
   * @example
   *  require('Common');
   *  var win = new Window();
   *  win.y = 0; // move the window to the top area of the screen.
   *  console.log(y); // will equal 22, not 0 (or a close value to) on OSX
   */
  Object.defineProperty(Window.prototype, 'y', {
    get:function() { 
      var height = $.NSScreen('mainScreen')('frame').size.height;
      var rect = this.native('frame');
      return  (height - rect.origin.y) - rect.size.height;
    },
    set:function(e) {
      if(e == 'center') this.native('center');
      else {
        e = utilities.parseUnits(e);
        var height = $.NSScreen('mainScreen')('frame').size.height;
        var rect = this.native('frame');
        rect.origin.y = (height - e) - rect.size.height;
        this.native('setFrame', rect, 
                    'display', $.YES, 
                    'animate', this.preferences.animateOnPositionChange ? $.YES : $.NO);
      }
    }
  });

  /**
   * @member x
   * @type {number}
   * @memberof Window
   * @description Gets or sets the value of the horizontal position (from the left of the screen)
   *              where the window is at.
   */
  Object.defineProperty(Window.prototype, 'x', {
    get:function() { return this.native('frame').origin.x; },
    set:function(e) {
      if(e == 'center') this.native('center');
      else {
        e = utilities.parseUnits(e);
        var rect = this.native('frame');
        rect.origin.x = e;
        this.native('setFrame', rect, 
                    'display', $.YES, 
                    'animate', this.preferences.animateOnPositionChange ? $.YES : $.NO);
      }
    }
  });

  /**
   * @member width
   * @type {number}
   * @memberof Window
   * @description Gets or sets the width of the window. The default is 500.
   * @default 500
   */
  Object.defineProperty(Window.prototype, 'width', {
    get:function() { return this.native('frame').size.width; },
    set:function(e) {
        e = utilities.parseUnits(e);
        var rect = this.native('frame');
        rect.size.width = e;
        this.native('setFrame', rect, 
                    'display', $.YES, 
                    'animate', this.preferences.animateOnSizeChange ? $.YES : $.NO);
    }
  });

  /**
   * @member height
   * @type {number}
   * @memberof Window
   * @description Gets or sets the height of the window. The default value is 500.
   * @default 500
   */
  Object.defineProperty(Window.prototype, 'height', {
    get:function() { return this.native('frame').size.height; },
    set:function(e) {
        e = utilities.parseUnits(e);
        var rect = this.native('frame');
        rect.size.height = e;
        this.native('setFrame', rect, 
                    'display', $.YES, 
                    'animate', this.preferences.animateOnSizeChange ? $.YES : $.NO);
    }
  });

  Object.defineProperty(Window.prototype, 'titleVisible', {
    get:function() { 
      var os = require('os');
      var version = parseInt(os.release().substring(0,os.release().indexOf('.')));
      if(version < 14)
        return true;
      return this.native('titleVisibility') == $.NSWindowTitleHidden ? false : true; 
    },
    set:function(e) { 
      var os = require('os');
      var version = parseInt(os.release().substring(0,os.release().indexOf('.')));
      if(version < 14) return;
      this.native('setTitleVisibility', e ? $.NSWindowTitleVisible : $.NSWindowTitleHidden ); 
    }
  });

  /**
   * @member visible
   * @type {boolean}
   * @memberof Window
   * @description Gets or sets whether the window is visible or hidden. Hidden windows
   *              are not minimized, but removed from the screen regardless if their
   *              minimized, maximized or fullscreen.  By default the windows visibility
   *              is set to false so windows can have specific styling set prior to being
   *              shown.
   * @example
   *  require('Common');
   *  var win = new Window();
   *  win.visible = true; // Show the window.
   *  win.vsibile = false; // Hide the window.
   */
  Object.defineProperty(Window.prototype, 'visible', {
    get:function() { return this.native('isVisible') ? true : false; },
    set:function(e) {
      if(e) this.native('makeKeyAndOrderFront',this.native);
      else this.native('orderOut',this.native);
    }
  });

  /**
   * @member maximizeButton
   * @type {boolean}
   * @memberof Window
   * @description Gets or sets whether the maximize button is shown.  If the frame is set to
   *              false on the window (e.g., do not show any window controls) this
   *              is also false. The default value for this is true, if set to false the maximize
   *              button is not shown (although the window can still be programmatically set to
   *              maximized through the state property). 
   * @example
   *  require('Common');
   *  var win = new Window();
   *  win.visible = true; // Show the window.
   *  win.maximizeButton = false; // The window will not have a maximize button, or on some OS'
   *                              // the maximize button is grayed out or disabled.
   */
  // only works on Window, not Panel derived classes (NSPanel doesnt support standardWindowButton)
  Object.defineProperty(Window.prototype, 'maximizeButton', {
    get:function() { 
      if(this.native('standardWindowButton',$.NSWindowZoomButton))
        return this.native('standardWindowButton',$.NSWindowZoomButton)('isHidden'); 
      else return true;
    },
    set:function(e) { 
      if(this.native('standardWindowButton',$.NSWindowZoomButton))
        this.native('standardWindowButton',$.NSWindowZoomButton)('setHidden',!e); 
    }
  });

  /**
   * @member minimizeButton
   * @type {boolean}
   * @memberof Window
   * @description Gets or sets whether the minimize button is shown.  If the frame is set to
   *              false on the window (e.g., do not show any window controls) then this 
   *              is also false. The default value for this is true, if set to false the minimize
   *              button is not shown (although the window can still be programmatically set to
   *              maximized through the state property). 
   * @example
   *  require('Common');
   *  var win = new Window();
   *  win.visible = true; // Show the window.
   *  win.minimizeButton = false; // The window will not have a minimize button, or on some OS'
   *                              // the minimize button is grayed out or disabled.
   */
  // only works on Window, not Panel derived classes
  Object.defineProperty(Window.prototype, 'minimizeButton', {
    get:function() {
      if(this.native('standardWindowButton',$.NSWindowMiniaturizeButton))
        return this.native('standardWindowButton',$.NSWindowMiniaturizeButton)('isHidden'); 
      else return true;
    },
    set:function(e) { 
      if(this.native('standardWindowButton',$.NSWindowMiniaturizeButton))
        this.native('standardWindowButton',$.NSWindowMiniaturizeButton)('setHidden',!e); 
    }
  });

  /**
   * @member closeButton
   * @type {boolean}
   * @memberof Window
   * @description Gets or sets whether the close button is shown.  If the frame is set to
   *              false on the window (e.g., do not show any window controls) then this 
   *              is also false. The default value for this is true, if set to false the close
   *              button is not shown (although the window can be closed through the destroy
   *              function).
   * @example
   *  require('Common');
   *  var win = new Window();
   *  win.visible = true; // Show the window.
   *  win.closeButton = false; // The window will not have a close button, or on some OS'
   *                           // the close button is grayed out or disabled.
   */
  Object.defineProperty(Window.prototype, 'closeButton', {
    get:function() { 
      if(this.native('standardWindowButton',$.NSWindowCloseButton))
        return this.native('standardWindowButton',$.NSWindowCloseButton)('isHidden'); 
    },
    set:function(e) { 
      if(this.native('standardWindowButton',$.NSWindowCloseButton))
        this.native('standardWindowButton',$.NSWindowCloseButton)('setHidden',!e); 
    }
  });

  // Deprecated, retired in Mavericks.
  //Object.defineProperty(Window.prototype, 'fullscreenButton', {
  //  get:function() { 
  //    if(this.native('standardWindowButton',$.NSWindowFullScreenButton))
  //      return this.native('standardWindowButton',$.NSWindowFullScreenButton)('isHidden'); 
  //  },
  //  set:function(e) { 
  //    if(this.native('standardWindowButton',$.NSWindowFullScreenButton))
  //      this.native('standardWindowButton',$.NSWindowFullScreenButton)('setHidden',!e);
  //  }
  //});

  /**
   * @member resizable
   * @type {boolean}
   * @memberof Window
   * @description Gets or sets whether the window is resizable.  If set to false the native
   *              UI Widget for resizing is also not shown.
   */
  Object.defineProperty(Window.prototype, 'resizable', {
    get:function() { return this.native('styleMask') & $.NSResizableWindowMask; },
    set:function(e) {
      if (e) {
        if(this.native('standardWindowButton',$.NSWindowZoomButton))
          this.native('standardWindowButton',$.NSWindowZoomButton)('setEnabled',$.YES);
        this.native('setStyleMask',this.native('styleMask') | $.NSResizableWindowMask);
      } else {
        if(this.native('standardWindowButton',$.NSWindowZoomButton))
          this.native('standardWindowButton',$.NSWindowZoomButton)('setEnabled',$.NO);
        this.native('setStyleMask',this.native('styleMask') & ~$.NSResizableWindowMask);
      }
    }
  });

  /**
   * @member backgroundColor
   * @type {Color}
   * @memberof Window
   * @description Gets or sets the background color of the window. Note that this only changes
   *              the background color of the content area for Windows, on OSX this changes the
   *              full window color (except when textured = false). The color can be a named, rgba
   *              hexadecimal value or a CSS color value.
   * @example
   *  require('Common');
   *  var win = new Window();
   *  win.visible = true; // Show the window.
   *  win.backgroundColor = 'red'; // red
   *  win.backgroundColor = 'transparent'; // transparent
   *  win.backgroundColor = 'rgba(0,255,0,0.5)'; // Green with half translucency.
   */
  Object.defineProperty(Window.prototype, 'backgroundColor', {
    get:function() { return this.private.background; },
    set:function(e) {
      if(e == 'auto') {
        this.private.background = 'auto';
        this.native('setOpaque', $.YES);
        this.native('setBackgroundColor', $.NSColor('controlBackgroundColor'));
      } else {
        this.private.backgroundObj = new Color(e);
        if(this.private.backgroundObj.alpha > 0) {
           this.native('setOpaque', $.YES);
           this.native('setHasShadow', $.YES);
        } else {
           this.native('setOpaque', $.NO);
           this.native('setHasShadow', $.NO);
        }
        this.native('setBackgroundColor', this.private.backgroundObj.native);
        this.native('setAlphaValue', this.private.backgroundObj.alpha);
      }
    }
  });

  /**
   * @member alwaysOnTop
   * @type {boolean}
   * @memberof Window
   * @description Gets or sets whether the Window when not focused remains on top of
   *              any other window.  This overrides the window managers z-index, so that
   *              if a window looses its focus it will still be visible and on top of other
   *              windows.  This is useful if you need a reference window or tool window
   *              that if not focused still stays on top of other windows. By default this is
   *              false. Note that two windows that are both set to alwaysOnTop will be swap
   *              ordering if the windows loose and gain focus.
   */
  Object.defineProperty(Window.prototype, "alwaysOnTop", {
    get:function() { return this.native('level') == $.NSFloatingWindowLevel ? true : false; },
    set:function(e) { 
      if(e) this.native('setLevel', $.NSFloatingWindowLevel); 
      else this.native('setLevel', $.NSNormalWindowLevel); 
    }
  });

  /**
   * @method destroy
   * @memberof Window
   * @description Destroys the window along with its resources.  This method will remove the
   *              window entirely and its memory.
   */
  Window.prototype.destroy = function() {
    application.windows.forEach(function(item,ndx,arr) { 
      if(item == this)
        delete arr[ndx];
    });
    this.native('close');
  }

  /**
   * @method bringToFront
   * @memberof Window
   * @description Causes the window to be placed in front of other windows, even if it is not
   *              currently focused.
   */
  Window.prototype.bringToFront = function() { this.native('makeKeyAndOrderFront',this.native); }

  return Window;
})();
