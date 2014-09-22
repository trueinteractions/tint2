module.exports = (function() {
  //var Container = require('Container');
  var utilities = require('Utilities');
  //var Color = require('Color');
  require('Bridge');
  process.bridge.dotnet.import('WPF\\PresentationFramework.dll');
  process.bridge.dotnet.import('System.Windows.Forms');

  $ = process.bridge.dotnet;

  function Window(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.width = options.width || 500;
    options.height = options.height || 500;

    this.private = {previousStyle:'',previousState:'',background:'auto',menu:null,toolbar:null,fullscreen:false};

    this.native = new $.System.Windows.Window();
    //this.native.AllowsTransparency = true;
    //this.native.ShowInTaskbar = true;
    //this.native.ShowActivated = true;
    //TODO: this causes a exec violation.
    //this.native.Width = options.width;
    //this.native.Height = options.height;
    //this.native.WindowStartupLocation = $.System.Windows.WindowStartupLocation.CenterScreen;
    this.native.Show();

    application.windows.push(this);
  }
  
  //Window.prototype = Object.create(Container.prototype);
  //Window.prototype.constructor = Window;

  Window.prototype.preferences = {
    animateOnSizeChange:false,
    animateOnPositionChange:false
  }

  Object.defineProperty(Window.prototype, 'frame', {
    get:function() { return this.native.WindowStyle == $.System.Windows.WindowStyle.SingleBorderWindow; },
    set:function(e) {
      if(e) this.native.WindowStyle = $.System.Windows.WindowStyle.SingleBorderWindow;
      else if (e) this.native.WindowStyle = $.System.Windows.WindowStyle.None;
    }
  });

  Object.defineProperty(Window.prototype, 'menu', {
    get:function() { 
      //  return this.private.menu; 
    },
    set:function(e) {
      //this.private.menu = e;
      //global.application.native('setMainMenu', this.private.menu.native);
    }
  });

  Object.defineProperty(Window.prototype, 'toolbar', {
    get:function() { 
      //return this.private.toolbar; 
    },
    set:function(e) {
      /*if(this.frame == false && e) {
        if(application.warn) console.warn('Cannot add a toolbar to a window that has Window.frame = false;');
        return;
      }

      if(!e || e == null) {
        this.native('setStyleMask',this.native('styleMask') & ~$.NSUnifiedTitleAndToolbarWindowMask);
      } else {
        this.native('setStyleMask',this.native('styleMask') | $.NSUnifiedTitleAndToolbarWindowMask);
        this.private.toolbar = e;
        this.native('setToolbar', this.private.toolbar.native);
      }*/
      
    }
  });

  Object.defineProperty(Window.prototype, 'canBeFullscreen', {
    get:function() { return true; },
    set:function(e) { }
  });

  Object.defineProperty(Window.prototype, 'state', {
    get:function() { 
      if(this.private.fullscreen) return "fullscreen";
      else if(this.native.WindowState == $.System.Windows.WindowState.Maximized) return "maximized";
      else if(this.native.WindowState == $.System.Windows.WindowState.Minimized) return "minimized";
      else return "normal";
    },
    set:function(e) {
      if(e != "fullscreen" && this.private.fullscreen) {
        if(this.private.previousStyle != "") this.native.WindowStyle = this.private.previousStyle;
        else this.native.WindowStyle = $.System.Windows.WindowStyle.SingleBorderWindow;

        if(this.private.previousState != "") this.native.WindowState = this.private.previousState;
        else this.native.WindowState = $.System.Windows.WindowState.Normal;

        this.private.fullscreen = false;
      } 
      
      if(e == 'maximized')
        this.native.WindowState = $.System.Windows.WindowState.Maximized;
      else if (e == 'normal')
        this.native.WindowState = $.System.Windows.WindowState.Normal;
      else if (e == 'minimized')
        this.native.WindowState = $.System.Windows.WindowState.Minimized;
      else if (e == 'fullscreen' && !this.private.fullscreen) {
        this.native.previousStyle = this.native.WindowStyle;
        this.native.previousState = this.native.WindowState;
        this.native.WindowState = $.System.Windows.WindowState.Maximized;
        this.native.WindowStyle = $.System.Windows.WindowStyle.None;
        this.private.fullscreen = true;
      }
    }
  });

  Object.defineProperty(Window.prototype, 'title', {
    get:function() { return this.native.Title; },
    set:function(e) { this.native.Title = e.toString(); }
  });

  Object.defineProperty(Window.prototype, 'y', {
    get:function() { return this.native.Top; },
    set:function(e) {
      if(e == 'center') {
       var workingArea = $.System.Windows.Forms.Screen.PrimaryScreen.WorkingArea;
       this.native.Left = workingArea.width/2;
       this.native.Top = workingArea.height/2;
      } else {
        e = utilities.parseUnits(e);
        this.native.Top = e;
      }
    }
  });

  Object.defineProperty(Window.prototype, 'x', {
    get:function() { return this.native.Left; },
    set:function(e) {
      if(e == 'center') {
       var workingArea = $.System.Windows.Forms.Screen.PrimaryScreen.WorkingArea;
       this.native.Left = workingArea.width/2;
       this.native.Top = workingArea.height/2;
      } else {
        e = utilities.parseUnits(e);
        this.native.Left = e;
      }
    }
  });

  Object.defineProperty(Window.prototype, 'width', {
    get:function() { return this.native.Width; },
    set:function(e) {
        e = utilities.parseUnits(e);
        this.native.Width = e;
    }
  });

  Object.defineProperty(Window.prototype, 'height', {
    get:function() { return this.native.Height; },
    set:function(e) {
        e = utilities.parseUnits(e);
        this.native.Height = e;
    }
  });

  Object.defineProperty(Window.prototype, 'titleVisible', {
    get:function() { return true; },
    set:function(e) { /* TODO ? */ }
  });

  Object.defineProperty(Window.prototype, 'visible', {
    get:function() { return this.native.Visibility == $.System.Windows.Visibility.Visible; },
    set:function(e) {
      if(e) {
        this.native.Visibility = $.System.Windows.Visibility.Visible;
        this.native.Show();
      } else {
        this.native.Visibility = $.System.Windows.Visibility.Hidden;
        this.native.Hide();
      }
    }
  });

  Object.defineProperty(Window.prototype, 'maximizeButton', {
    get:function() { 
      //return this.native('standardWindowButton',$.NSWindowZoomButton)('isHidden'); 
    },
    set:function(e) { 
      //this.native('standardWindowButton',$.NSWindowZoomButton)('setHidden',!e); 
    }
  });

  Object.defineProperty(Window.prototype, 'minimizeButton', {
    get:function() { 
      //return this.native('standardWindowButton',$.NSWindowMiniaturizeButton)('isHidden'); 
    },
    set:function(e) { 
      //this.native('standardWindowButton',$.NSWindowMiniaturizeButton)('setHidden',!e); 
    }
  });

  Object.defineProperty(Window.prototype, 'closeButton', {
    get:function() { 
      //return this.native('standardWindowButton',$.NSWindowCloseButton)('isHidden'); 
    },
    set:function(e) { 
      //this.native('standardWindowButton',$.NSWindowCloseButton)('setHidden',!e); 
    }
  });

  Object.defineProperty(Window.prototype, 'fullscreenButton', {
    get:function() { 
      //return this.native('standardWindowButton',$.NSWindowFullScreenButton)('isHidden'); 
    },
    set:function(e) { 
      //this.native('standardWindowButton',$.NSWindowFullScreenButton)('setHidden',!e); 
    }
  });

  Object.defineProperty(Window.prototype, 'resizable', {
    get:function() { 
      //return this.native('styleMask') & $.NSResizableWindowMask; 
    },
    set:function(e) {
      /*if (e) {
        this.native('standardWindowButton',$.NSWindowZoomButton)('setEnabled',$.YES);
        this.native('setStyleMask',this.native('styleMask') | $.NSResizableWindowMask);
      } else {
        this.native('standardWindowButton',$.NSWindowZoomButton)('setEnabled',$.NO);
        this.native('setStyleMask',this.native('styleMask') ^ $.NSResizableWindowMask);
      }*/
    }
  });

  Object.defineProperty(Window.prototype, 'backgroundColor', {
    get:function() { 
      //return this.private.background; 
    },
    set:function(e) {
      /*if(e == 'auto') {
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
      }*/
    }
  });

  Object.defineProperty(Window.prototype, "alwaysOnTop", {
    get:function() { return this.native.Topmost; },
    set:function(e) { this.native.Topmost = e ? true : false; }
  });

  Window.prototype.close = function() {
    application.windows.forEach(function(item,ndx,arr) { 
      if(item == this)
        delete arr[ndx];
    });
    this.native.Close();
  }

  Window.prototype.bringToFront = function() { 
    this.native.Activate();
  }

  return Window;
})();
