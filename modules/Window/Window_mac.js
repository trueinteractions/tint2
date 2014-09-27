module.exports = (function() {
  var Container = require('Container');
  var utilities = require('Utilities');
  var Delegate = require('Bridge');
  var Color = require('Color');
  var $ = process.bridge.objc;

  function Window(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.width = options.width || 500;
    options.height = options.height || 500;
    options.styleMask = options.styleMask || ($.NSTitledWindowMask | $.NSClosableWindowMask | $.NSMiniaturizableWindowMask | 
                                              $.NSResizableWindowMask | $.NSTexturedBackgroundWindowMask);
    options.delegates = options.delegates || [];
    options.delegates = options.delegates.concat([
      ['windowWillClose:', 'v@:@@', function(self, cmd, window) { this.fireEvent('close'); return $.YES; }.bind(this)],
      ['windowWillEnterFullScreen:', 'v@:@@', function(self, cmd, notif) { this.fireEvent('enter-fullscreen'); }.bind(this)],
      ['windowWillExitFullScreen:', 'v@:@@', function(self, cmd, notif) { this.fireEvent('leave-fullscreen'); }.bind(this)],
      ['windowDidBecomeKey:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('focus'); }.bind(this)],
      ['windowDidResignKey:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('blur'); }.bind(this)],
      //TODO: Maximize?
      ['windowDidMiniaturize:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('minimize'); }.bind(this)],
      ['windowDidDeminiaturize:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('restore'); }.bind(this)],
      ['windowDidMove:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('move'); }.bind(this)],
      ['windowDidResize:', 'v@:@@', function(self, cmd, notification) { this.fireEvent('resize'); }.bind(this)],
      ['windowDidClose:', 'v@:@@', function(self,cmd,notification) { this.fireEvent('closed'); }.bind(this)]
    ]);

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSWindow, $.NSView, options);

    if(!options.nativeObject) {
      this.native = this.nativeClass('alloc')('initWithContentRect', $.NSMakeRect(0,0,options.width,options.height), 
                          'styleMask', options.styleMask,
                          'backing', $.NSBackingStoreBuffered, 
                          'defer', $.NO);
      this.nativeView = this.nativeViewClass('alloc')('init');
      this.native('setContentView',this.nativeView);
    } else {
      this.native = options.nativeObject;
      var contentView = this.native('contentView');
      this.nativeView = this.nativeViewClass('alloc')('init');
      this.native('setContentView',this.nativeView);
      this.native('contentView')('addSubview',contentView);      
    }

    this.native('setDelegate',this.nativeView);
    this.native('contentView')('setAutoresizingMask', $.NSViewWidthSizable | $.NSViewHeightSizable | $.NSViewMinXMargin | 
                                                      $.NSViewMaxXMargin | $.NSViewMinYMargin | $.NSViewMaxYMargin );
    this.native('setFrame', $.NSMakeRect(0,0,options.width,options.height), 'display', $.YES, 'animate', $.YES);
    this.native('cascadeTopLeftFromPoint', $.NSMakePoint(20,20));

    this.private.fullscreen = false;
    this.private.background = "auto";
    this.private.menu = null;
    this.private.toolbar = null;
    this.private.titleTextColor = "auto";
    this.private.titleTextField = null;

    this.native('makeKeyAndOrderFront', this.native);
    this.native('setReleasedWhenClosed', $.YES);
    this.native('setExcludedFromWindowsMenu', $.NO);
    this.native('center');

    application.windows.push(this);

    setTimeout(function() {
      var titlebarView = this.native('contentView')('superview')('titlebarViewController')('view');
      var viewEnum = titlebarView('subviews')('objectEnumerator');
      while(viewObject = viewEnum('nextObject')) {
        var className = viewObject('className');
        if(className == "NSTextField")
          this.private.titleTextField = viewObject;
      }
    }.bind(this),10);

    function updateTitleTextColor() {
      if(this.private.titleTextColor != null && this.private.titleTextColor != "auto" && this.private.titleTextField != null) {
        this.titleTextColor = this.private.titleTextColor;
      }
    }

    this.addEventListener('remove', function(control) { this.native('contentsView')('willRemoveSubview',control.nativeView); });
    this.addEventListener('focus', updateTitleTextColor.bind(this));
    this.addEventListener('restore', updateTitleTextColor.bind(this));
  }
  
  Window.prototype = Object.create(Container.prototype);
  Window.prototype.constructor = Window;

  Window.prototype.preferences = {
    animateOnSizeChange:false,
    animateOnPositionChange:false
  }

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
        if(e) this.native('setStyleMask', defaultStyleMask);
        else this.native('setStyleMask', 0);
      }
    }
  });

  Object.defineProperty(Window.prototype, 'menu', {
    get:function() { return this.private.menu; },
    set:function(e) {
      this.private.menu = e;
      global.application.native('setMainMenu', this.private.menu.native);
    }
  });

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

  Object.defineProperty(Window.prototype, 'canBeFullscreen', {
    get:function() { return this.native('collectionBehavior') && $.NSWindowCollectionBehaviorFullScreenPrimary ? true : false; },
    set:function(e) { 
      if(e) this.native('setCollectionBehavior', this.native('collectionBehavior') | $.NSWindowCollectionBehaviorFullScreenPrimary);
      else this.native('setCollectionBehavior', this.native('collectionBehavior') ^ $.NSWindowCollectionBehaviorFullScreenPrimary);
    }
  });

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

  (utilities.makePropertyStringType.bind(Window.prototype))('title','title','setTitle');

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

  Object.defineProperty(Window.prototype, 'visible', {
    get:function() { return this.native('isVisible') ? true : false; },
    set:function(e) {
      if(e) this.native('makeKeyAndOrderFront',this.native);
      else this.native('orderOut',this.native);
    }
  });

  Object.defineProperty(Window.prototype, 'maximizeButton', {
    get:function() { return this.native('standardWindowButton',$.NSWindowZoomButton)('isHidden'); },
    set:function(e) { this.native('standardWindowButton',$.NSWindowZoomButton)('setHidden',!e); }
  });

  Object.defineProperty(Window.prototype, 'minimizeButton', {
    get:function() { return this.native('standardWindowButton',$.NSWindowMiniaturizeButton)('isHidden'); },
    set:function(e) { this.native('standardWindowButton',$.NSWindowMiniaturizeButton)('setHidden',!e); }
  });

  Object.defineProperty(Window.prototype, 'closeButton', {
    get:function() { return this.native('standardWindowButton',$.NSWindowCloseButton)('isHidden'); },
    set:function(e) { this.native('standardWindowButton',$.NSWindowCloseButton)('setHidden',!e); }
  });

  Object.defineProperty(Window.prototype, 'fullscreenButton', {
    get:function() { return this.native('standardWindowButton',$.NSWindowFullScreenButton)('isHidden'); },
    set:function(e) { this.native('standardWindowButton',$.NSWindowFullScreenButton)('setHidden',!e); }
  });

  Object.defineProperty(Window.prototype, 'resizable', {
    get:function() { return this.native('styleMask') & $.NSResizableWindowMask; },
    set:function(e) {
      if (e) {
        this.native('standardWindowButton',$.NSWindowZoomButton)('setEnabled',$.YES);
        this.native('setStyleMask',this.native('styleMask') | $.NSResizableWindowMask);
      } else {
        this.native('standardWindowButton',$.NSWindowZoomButton)('setEnabled',$.NO);
        this.native('setStyleMask',this.native('styleMask') ^ $.NSResizableWindowMask);
      }
    }
  });

  Object.defineProperty(Window.prototype, 'titleTextColor', {
    get:function() { return this.private.titleTextColor; },
    set:function(e) {
      this.private.titleTextColor = e;
      // most of the time when we update this its initially after a
      // window creation, our title text field won't be around for
      // another few ms, update the field with a pause to allow the
      // window to fully display first.
      setTimeout(function() {
        var color = new Color(e);
        // Simple hueristic to use for letting the window know if we
        // need blurred emphasis or shadows on titles.
        var b = this.private.background;
        if((b.red + b.green + b.blue)/3 > 0.5)
          this.private.titleTextField('cell')('setBackgroundStyle',1);
        else
          this.private.titleTextField('cell')('setBackgroundStyle',0);
        this.private.titleTextField('cell')('setTextColor',color.native);
      }.bind(this),20);
    }
  });

  Object.defineProperty(Window.prototype, 'backgroundColor', {
    get:function() { return this.private.background; },
    set:function(e) {
      if(e == 'auto') {
        this.private.background = 'auto';
        this.native('setOpaque', $.YES);
        this.native('setBackgroundColor', $.NSColor('controlBackgroundColor'));
      } else {
        this.private.background = new Color(e);
        if(this.private.background.alpha > 0) {
           this.native('setOpaque', $.YES);
           this.native('setHasShadow', $.YES);
        } else {
           this.native('setOpaque', $.NO);
           this.native('setHasShadow', $.NO);
        }
        this.native('setBackgroundColor', this.private.background.native);
        this.native('setAlphaValue', this.private.background.alpha);
      }
    }
  });

  Object.defineProperty(Window.prototype, "alwaysOnTop", {
    get:function() { return this.native('level') == $.NSFloatingWindowLevel ? true : false; },
    set:function(e) { 
      if(e) this.native('setLevel', $.NSFloatingWindowLevel); 
      else this.native('setLevel', $.NSNormalWindowLevel); 
    }
  });

  Window.prototype.close = function() {
    application.windows.forEach(function(item,ndx,arr) { 
      if(item == this)
        delete arr[ndx];
    });
    this.native('close');
  }
  Window.prototype.bringToFront = function() { this.native('makeKeyAndOrderFront',this.native); }

  return Window;
})();
