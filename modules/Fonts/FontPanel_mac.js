module.exports = (function() {
  var Control = require('Control');
  var utilities = require('Utilities');
  var Font = require('Font');

  function FontPanel() {
    var $ = process.bridge.objc;
    Control.call(this, $.TintFontPanel, $.NSView, {isPanel:true});

    var fontManager = $.NSFontManager('sharedFontManager');
    this.native = fontManager('fontPanel', $.YES);
    fontManager('setDelegate',this.native);
    fontManager('setTarget', this.native);
    $.TintFontPanel.panel.fireEvent = this.fireEvent;
    this.native('makeKeyAndOrderFront',this.native);

    this.preferences = {
      animateOnSizeChange:false,
      animateOnPositionChange:false
    }

    var WindowDelegate = $.NSObject.extend('WindowDelegate'+Math.round(Math.random()*10000));
    WindowDelegate.addMethod('init', '@@:', function(self) { return self; }.bind(this));
    WindowDelegate.addMethod('windowWillClose:', 'v@:@@', function(self, cmd, window) {
      try {
        this.fireEvent('close'); 
        return $.YES;
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    WindowDelegate.addMethod('windowWillEnterFullScreen:', 'v@:@@', function(self, cmd, notification) { 
      try {
        this.fireEvent('enter-fullscreen');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    WindowDelegate.addMethod('windowWillExitFullScreen:', 'v@:@@', function(self, cmd, notification) { 
      try {
        this.fireEvent('leave-fullscreen');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      };  
    }.bind(this));
    WindowDelegate.addMethod('windowDidBecomeKey:', 'v@:@@', function(self, cmd, notification) { 
      try {
        this.fireEvent('focus');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    WindowDelegate.addMethod('windowDidResignKey:', 'v@:@@', function(self, cmd, notification) { 
      try {
        this.fireEvent('blur');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    WindowDelegate.addMethod('windowDidMiniaturize:', 'v@:@@', function(self, cmd, notification) { 
      try {
        this.fireEvent('minimize');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    WindowDelegate.addMethod('windowDidDeminiaturize:', 'v@:@@', function(self, cmd, notification) { 
      try {
        this.fireEvent('restore');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    WindowDelegate.addMethod('windowDidMove:', 'v@:@@', function(self, cmd, notification) { 
      try {
        this.fireEvent('move');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    WindowDelegate.addMethod('windowDidResize:', 'v@:@@', function(self, cmd, notification) { 
      try {
        this.fireEvent('resize');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    WindowDelegate.addMethod('windowDidClose:', 'v@:@@', function(self,cmd,notification) { 
      try {
        this.fireEvent('closed');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }; 
    }.bind(this));
    WindowDelegate.register();
    var windowDelegateInstance = WindowDelegate('alloc')('init');
    this.native('setDelegate', windowDelegateInstance);

    this.setChild = function(e) { this.native('setAccessoryView',e.nativeView); }

    this.scanForNewFonts = function() {
      this.native('reloadDefaultFontFamilies');
    }

    var isMultiple = false;
    Object.defineProperty(this, 'multiple', {
      get:function() { return isMultiple; },
      set:function(e) { isMultiple = e ? true : false; }
    });

    Object.defineProperty(this, 'selected', {
      get:function() {
        var font = fontManager('convertFont',this.native('font'));
        if(font == null) return null;
        return new Font(font);
      },
      set:function(fontObj) { 
        this.native('setFont', fontObj.native);
        this.native('setPanelFont', fontObj.native, 'isMultiple', isMultiple ? $.YES : $.NO);
        this.fireEvent('fontchange');
      }
    });

    Object.defineProperty(this, 'floating', {
      get:function() { return this.nativeView('isFloatingPanel'); },
      set:function(e) { this.nativeView('setFloatingPanel',e); }
    });

    Object.defineProperty(this, 'enabled', {
      get:function() { return this.nativeView('isEnabled'); },
      set:function(e) { this.nativeView('setEnabled',e); }
    });

    Object.defineProperty(this, 'state', {
      get:function() { 
        if(fullscreen) return "fullscreen";
        else if(this.native('isZoomed')) return "maximized";
        else if(this.native('isMiniaturized')) return "minimized";
        else return "normal";
      },
      set:function(e) { 
        if(e == 'maximized' || e == 'normal') {
          if(fullscreen) {
            this.native('toggleFullScreen',this.native);
            fullscreen = false;
          }
          if(this.native('isMiniaturized')) this.native('deminiaturize',this.native);
          if(e == 'maximized') this.native('performZoom',this.native);
        } else if (e == 'minimized') {
          if(fullscreen) {
            this.native('toggleFullscreen',this.native);
            fullscreen = false;
          }
          this.native('performMiniaturize',this.native);
        } else if (e == 'fullscreen') {
          if(!fullscreen) {
            this.native('toggleFullScreen',this.native);
            fullscreen = true;
          }
        }
      }
    });

    Object.defineProperty(this, 'title', {
      get:function() { return this.native('title'); },
      set:function(e) { 
        if(e == null || typeof(e) == 'undefined') e = "";
        else this.native('setTitle', $(e));
      }
    });

    Object.defineProperty(this, 'y', {
      get:function() { return this.native('frame').origin.y; },
      set:function(e) {
        if(e == 'center') this.native('center');
        else {
          var height = $.NSScreen('mainScreen')('frame').size.height;
          var rect = this.native('frame');
          rect.origin.y = height - e;
          this.native('setFrame', rect, 
                      'display', $.YES, 
                      'animate', this.preferences.animateOnPositionChange ? $.YES : $.NO);
        }
      }
    });

    Object.defineProperty(this, 'x', {
      get:function() { return this.native('frame').origin.x; },
      set:function(e) { 
        if(e == 'center') this.native('center');
        else {
          var rect = this.native('frame');
          rect.origin.x = e;
          this.native('setFrame', rect, 
                      'display', $.YES, 
                      'animate', this.preferences.animateOnPositionChange ? $.YES : $.NO);
        }
      }
    });

    Object.defineProperty(this, 'width', {
      get:function() { return this.native('frame').size.width; },
      set:function(e) {
          var rect = this.native('frame');
          rect.size.width = e;
          this.native('setFrame', rect, 
                      'display', $.YES, 
                      'animate', this.preferences.animateOnSizeChange ? $.YES : $.NO);
      }
    });

    Object.defineProperty(this, 'height', {
      get:function() { return this.native('frame').size.height; },
      set:function(e) {
          var rect = this.native('frame');
          rect.size.height = e;
          this.native('setFrame', rect, 
                      'display', $.YES, 
                      'animate', this.preferences.animateOnSizeChange ? $.YES : $.NO);
      }
    });

    Object.defineProperty(this, 'visible', {
      get:function() { return this.native('isVisible') ? true : false; },
      set:function(e) {
        if(e) this.native('makeKeyAndOrderFront',this.native);
        else this.native('orderOut',this.native);
      }
    });

    Object.defineProperty(this, 'maximizeButton', {
      get:function() { return this.native('standardWindowButton',$.NSWindowZoomButton)('isHidden'); },
      set:function(e) { this.native('standardWindowButton',$.NSWindowZoomButton)('setHidden',!e); }
    });

    Object.defineProperty(this, 'minimizeButton', {
      get:function() { return this.native('standardWindowButton',$.NSWindowMiniaturizeButton)('isHidden'); },
      set:function(e) { this.native('standardWindowButton',$.NSWindowMiniaturizeButton)('setHidden',!e); }
    });

    Object.defineProperty(this, 'closeButton', {
      get:function() { return this.native('standardWindowButton',$.NSWindowCloseButton)('isHidden'); },
      set:function(e) { this.native('standardWindowButton',$.NSWindowCloseButton)('setHidden',!e); }
    });

    Object.defineProperty(this, 'fullscreenButton', {
      get:function() { return this.native('standardWindowButton',$.NSWindowFullScreenButton)('isHidden'); },
      set:function(e) { this.native('standardWindowButton',$.NSWindowFullScreenButton)('setHidden',!e); }
    });

    Object.defineProperty(this, 'resizable', {
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

    Object.defineProperty(this, 'backgroundColor', {
      get:function() { return background; },
      set:function(e) {
        if(e == 'auto') {
          this.native('setOpaque', $.YES);
          this.native('setBackgroundColor', $.NSColor('controlBackgroundColor'));
        } else {
          var rgba = utilities.parseColor(e);
          if(rgba.a) {
             this.native('setOpaque', $.YES);
             this.native('setHasShadow', $.YES);
          } else {
             this.native('setOpaque', $.NO);
             this.native('setHasShadow', $.NO);
          }
          this.native('setBackgroundColor', 
            $.NSColor('colorWithCalibratedRed',rgba.r,'green',rgba.g,'blue',rgba.b,'alpha',rgba.a));
          this.native('setAlphaValue', rgba.a);
        }
        background = e;
      }
    });

    Object.defineProperty(this, "alwaysOnTop", {
      get:function() { return this.native('level') == $.NSFloatingWindowLevel ? true : false; },
      set:function(e) { 
        if(e) this.native('setLevel', $.NSFloatingWindowLevel); 
        else this.native('setLevel', $.NSNormalWindowLevel); 
      }
    });
  }
  
  FontPanel.prototype = Object.create(Control.prototype);
  FontPanel.prototype.constructor = FontPanel;

  /** Functions **/
  FontPanel.prototype.close = function() { this.native('close'); }
  FontPanel.prototype.bringToFront = function() { this.native('makeKeyAndOrderFront',this.native); }

  return FontPanel;
})();
