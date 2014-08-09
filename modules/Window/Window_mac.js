module.exports = (function() {
  var utilities = require('../Utilities/Utilities_mac.js');

  function Window() {
    var $defaultStyleMask = $.NSTitledWindowMask | $.NSClosableWindowMask | $.NSMiniaturizableWindowMask | $.NSResizableWindowMask | $.NSTexturedBackgroundWindowMask;
    var events = {}, children = [], fullscreen = false, background = "auto";
    var $menu = null, 
        $toolbar = null,
        $window = $.NSWindow('alloc')(
          'initWithContentRect', $.NSMakeRect(0,0,500,500), 
          'styleMask', $defaultStyleMask, 
          'backing', $.NSBackingStoreBuffered,
          'defer', $.NO);
    
    $window('setExcludedFromWindowsMenu', $.NO);
    $window('contentView')('setAutoresizesSubviews',$.YES);
    $window('contentView')('setAutoresizingMask',$.NSViewWidthSizable | $.NSViewHeightSizable | $.NSViewMinXMargin | $.NSViewMaxXMargin | $.NSViewMinYMargin | $.NSViewMaxYMargin);
    $window('setFrame',$.NSMakeRect(0,0,500,500),'display',$.YES,'animate',$.YES);
    $window('cascadeTopLeftFromPoint', $.NSMakePoint(20,20));
    $window('makeKeyAndOrderFront', $window);
    $window('center');

    function fireEvent(event, args) {
      var returnvalue = undefined;
      if(events[event]) {
        var tmp = (events[event]).forEach(function(item,index,arr) { item.apply(args); });
        if(typeof(tmp) != 'undefined') returnvalue = tmp;
      }
      return returnvalue;
    }

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }

    Object.defineProperty(this, 'title', {
      get:function() { return title; },
      set:function(e) { 
        title = e;
        if(title == null || typeof(title) == 'undefined') title = "";
        else $window('setTitle', $(title));
      }
    });
    
    Object.defineProperty(this, 'titleVisible', {
      get:function() { return $window('titleVisibility') == $.NSWindowTitleHidden ? false : true; },
      set:function(e) { $window('setTitleVisibility', e ? $.NSWindowTitleVisible : $.NSWindowTitleHidden ); }
    });

    Object.defineProperty(this, 'frame', {
      get:function() { return $window('styleMask') | $.NSTitledWindowMask; },
      set:function(e) { 
        if(e) $window('setStyleMask', $defaultStyleMask);
        else $window('setStyleMask', $.NSBorderlessWindowMask); 
      }
    });

    utilities.attachSizeProperties($window, this, fireEvent, {
      type:'window',
      hasmaxmin:true,
      nolayout:true,
      width:500,
      height:500,
      maxWidth:2000,
      maxHeight:2000,
      minWidth:100,
      minHeight:100
    });

    Object.defineProperty(this, 'x', {
      get:function() { return $window('frame').origin.x; },
      set:function(e) { 
        if(e == 'center') 
          $window('center');
        else {
          var rect = $window('frame');
          rect.origin.x = e;
          $window('setFrame', rect, 'display', $.YES, 'animate', $.NO);
        }
      }
    });

    Object.defineProperty(this, 'y', {
      get:function() { return $window('frame').origin.y; },
      set:function(e) { 
        if(e == 'center') 
          $window('center');
        else {
          var rect = $window('frame');
          rect.origin.y = e;
          $window('setFrame', rect, 'display', $.YES, 'animate', $.NO);
        }
      }
    });

    Object.defineProperty(this, 'visible', {
      get:function() { return $window('isVisible') ? true : false; },
      set:function(e) {
        if(e) $window('makeKeyAndOrderFront',$window);
        else $window('orderOut',$window);
      }
    });

    Object.defineProperty(this, 'menu', {
      get:function() { return $menu; },
      set:function(e) {
        $menu = e;
        global.application.internal('setMainMenu', $menu.internal);
      }
    });

    Object.defineProperty(this, 'toolbar', {
      get:function() { return $toolbar; },
      set:function(e) {
        if(this.frame == false && e) {
          console.warn('Cannot add a toolbar to a window that has Window.frame = false;');
          return;
        } 
        $toolbar = e;
        $window('setToolbar', $toolbar.internal);
      }
    });

    Object.defineProperty(this, 'state', {
      get:function() { 
        if(fullscreen) return "fullscreen";
        else if($window('isZoomed')) return "maximized";
        else if($window('isMiniaturized')) return "minimized";
        else return "normal";
        return $window('frame').origin.y; 
      },
      set:function(e) { 
        if(e == 'maximized' || e == 'normal') {
          if(fullscreen) {
            $window('toggleFullscreen',$window);
            fullscreen = false;
          }
          if($window('isMiniaturized')) $window('deminiaturize',$window);
          if(e == 'maximized') $window('performZoom',$window);
        } else if (e == 'minimized') {
          if(fullscreen) {
            $window('toggleFullscreen',$window);
            fullscreen = false;
          }
          $window('performMiniaturize',$window);
        } else if (e == 'fullscreen') {
          if(!fullscreen) {
            $window('toggleFullscreen',$window);
            fullscreen = true;
          }
        }
      }
    });

    Object.defineProperty(this, 'maximizeButton', {
      get:function() { return $window('standardWindowButton',$.NSWindowZoomButton)('isHidden'); },
      set:function(e) { $window('standardWindowButton',$.NSWindowZoomButton)('setHidden',!e); }
    });

    Object.defineProperty(this, 'minimizeButton', {
      get:function() { return $window('standardWindowButton',$.NSWindowMiniaturizeButton)('isHidden'); },
      set:function(e) { $window('standardWindowButton',$.NSWindowMiniaturizeButton)('setHidden',!e); }
    });

    Object.defineProperty(this, 'closeButton', {
      get:function() { return $window('standardWindowButton',$.NSWindowCloseButton)('isHidden'); },
      set:function(e) { $window('standardWindowButton',$.NSWindowCloseButton)('setHidden',!e); }
    });

    Object.defineProperty(this, 'fullscreenButton', {
      get:function() { return $window('standardWindowButton',$.NSWindowFullScreenButton)('isHidden'); },
      set:function(e) { $window('standardWindowButton',$.NSWindowFullScreenButton)('setHidden',!e); }
    });

    Object.defineProperty(this, 'resizable', {
      get:function() { return $window('styleMask') | $.NSResizableWindowMask; },
      set:function(e) {
        if (e) {
          $window('standardWindowButton',$.NSWindowZoomButton)('setEnabled',$.YES);
          $window('setStyleMask',$window('styleMask') | $.NSResizableWindowMask);
        } else {
          $window('standardWindowButton',$.NSWindowZoomButton)('setEnabled',$.NO);
          $window('setStyleMask',$window('styleMask') ^ $.NSResizableWindowMask);
        }
      }
    });

    this.close = function() { $window('close'); }

    this.appendChild = function(control) {
      children.push(control);
      $window('contentView')('addSubview',control.internal);
    }

    this.removeChild = function(control) {
      if(children.indexOf(control) != -1) children.splice(children.indexOf(control),1);
      $window('contentsView')('willRemoveSubview',control.internal);
      control.internal('removeFromSuperview');
    }

    Object.defineProperty(this, 'backgroundColor', {
      get:function() { return background; },
      set:function(e) {
        if(e == 'auto') {
          $window('setOpaque', $.YES);
          $window('setBackgroundColor', $.NSColor('controlBackgroundColor'));
        } else {
          var rgba = utilities.parseColor(e);
          if(rgba.a) {
             $window('setOpaque', $.YES);
             $window('setHasShadow', $.YES);
          } else {
             $window('setOpaque', $.NO);
             $window('setHasShadow', $.NO);
          }
          $window('setBackgroundColor', $.NSColor('colorWithCalibratedRed',rgba.r,'green',rgba.g,'blue',rgba.b,'alpha',rgba.a));
        }
        background = e;
      }
    });

    Object.defineProperty(this, 'alpha', {
      get:function() { return $window('alphaValue'); },
      set:function(e) { $window('setAlphaValue', e); }
    });

    Object.defineProperty(this, "alwaysOnTop", {
      get:function() { return $window('level') == $.NSFloatingWindowLevel ? true : false; },
      set:function(e) { 
        if(e) $window('setLevel', $.NSFloatingWindowLevel); 
        else $window('setLevel', $.NSNormalWindowLevel); 
      }
    });

    var WindowDelegate = $.NSObject.extend('WindowDelegate'+Math.round(Math.random()*10000));
    WindowDelegate.addInstanceMethod('init', '@@:', function(self) { return self; });
    WindowDelegate.addInstanceMethod('windowWillClose:', 'v@:@@', function(self, cmd, window) { fireEvent('close'); return $.YES; });
    WindowDelegate.addInstanceMethod('windowWillEnterFullScreen:', 'v@:@@', function(self, cmd, notification) { fireEvent('enter-fullscreen'); });
    WindowDelegate.addInstanceMethod('windowWillExitFullScreen:', 'v@:@@', function(self, cmd, notification) { fireEvent('leave-fullscreen'); });
    WindowDelegate.addInstanceMethod('windowDidBecomeKey:', 'v@:@@', function(self, cmd, notification) { fireEvent('focus'); });
    WindowDelegate.addInstanceMethod('windowDidResignKey:', 'v@:@@', function(self, cmd, notification) { fireEvent('blur'); });
    WindowDelegate.addInstanceMethod('windowDidMiniaturize:', 'v@:@@', function(self, cmd, notification) { fireEvent('minimize'); });
    WindowDelegate.addInstanceMethod('windowDidDeminiaturize:', 'v@:@@', function(self, cmd, notification) { fireEvent('restore'); });
    WindowDelegate.addInstanceMethod('windowDidMove:', 'v@:@@', function(self, cmd, notification) { fireEvent('move'); });
    WindowDelegate.addInstanceMethod('windowDidResize:', 'v@:@@', function(self, cmd, notification) { fireEvent('resize'); });
    /* // seg faults?!
    WindowDelegate.addMethod('windowShouldZoom:toFrame:', 'B@:@@@', function(self, cmd, window, newFrame) {
      var value = fireEvent('state');
      if(typeof(value) == 'undefined') value = true;
      return value ? $.YES : $.NO;
    });*/

    var windowDelegateInstance = WindowDelegate('alloc')('init');
    $window('setDelegate', windowDelegateInstance);

    // causes:
    //(node) warning: possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit.
    //process.on('exit', function() {
    //  windowDelegateInstance;
    //  WindowDelegate;
    //});
  }

  return Window;
})();
