module.exports = (function() {
  var Container = require('Container');
  var utilities = require('Utilities');
  var Color = require('Color');
  var $ = process.bridge.dotnet;
  var $$ = process.bridge;

  function Window(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.width = options.width || 500;
    options.height = options.height || 500;
    
    application.private.windowCount++;

    if(NativeObjectClass)
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.System.Windows.Window, $.AutoLayout.AutoLayoutPanel, options);

    this.native.Content = this.nativeView;

    var closing = function() { this.fireEvent('close'); }.bind(this);
    var closed = function() {
      application.private.windowCount--;
      this.fireEvent('closed'); 
      if(application.exitAfterWindowsClose && application.private.windowCount === 0) {
        process.exit(0);
      }
    }.bind(this);
    var sizeChanged = function() { this.fireEvent('resize'); }.bind(this);
    var deactivated = function() { this.fireEvent('blur'); }.bind(this);
    var activated = function() { this.fireEvent('focus'); }.bind(this);
    var stateChanged = function() {
      if(this.native.WindowState == $.System.Windows.WindowState.Maximized
          && this.native.WindowStyle == $.System.Windows.WindowStyle.None && 
          this.private.fullscreen == false) 
      {
        this.private.fullscreen = true;
         this.fireEvent('enter-fullscreen');
      } else if(this.private.fullscreen == true 
          && (this.native.WindowState != $.System.Windows.WindowState.Maximized
              || this.native.WindowStyle != $.System.Windows.WindowStyle.None)) 
      {
         this.fireEvent('exit-fullscreen');
        this.private.fullscreen = false;
      }
      if(this.native.WindowState == $.System.Windows.WindowState.Maximized) this.fireEvent('maximize');
      else if(this.native.WindowState == $.System.Windows.WindowState.Minimized) this.fireEvent('minimize');
      else this.fireEvent('restore');
    }.bind(this);

    this.native.addEventListener('Closing', closing);
    this.native.addEventListener('Closed', closed);
    this.native.addEventListener('SizeChanged', sizeChanged);
    this.native.addEventListener('Deactivated', deactivated);
    this.native.addEventListener('Activated', activated);
    this.native.addEventListener('StateChanged', stateChanged);

    this.private.callbacks.push(closing);
    this.private.callbacks.push(closed);
    this.private.callbacks.push(sizeChanged);
    this.private.callbacks.push(deactivated);
    this.private.callbacks.push(activated);
    this.private.callbacks.push(stateChanged);

    this.private.previousStyle='';
    this.private.previousState='';
    this.private.previousResize = '';
    this.private.background='auto';
    this.private.menu=null;
    this.private.toolbar=null;
    this.private.fullscreen=false;
    this.private.closeButton = true;
    this.private.titleTextColor = "auto";
    this.private.type = "Window";
    this.private.canBeFullscreen = true;

    //We cannot allow transparency unless there is no window style.
    this.native.ShowInTaskbar = true;
    this.native.ShowActivated = true;
    this.native.Width = options.width;
    this.native.Height = options.height;
    this.native.WindowStartupLocation = $.System.Windows.WindowStartupLocation.CenterScreen;

    // We need to force a HWND creatio otherwise setting any
    // properties on the WPF Windows object will fail. 
    this.private.hwnd = (new $.System.Windows.Interop.WindowInteropHelper(this.native)).EnsureHandle();
    // Force directx to not re-draw the background, we already do it anyway.
    var mainWindowSrc = $.System.Windows.Interop.HwndSource.FromHwnd(this.private.hwnd);
    mainWindowSrc.CompositionTarget.BackgroundColor = $.System.Windows.Media.Colors.White;
    // Just as above, tell WPF not to redraw the background, The Desktop Window Manager (DWM) will do it 
    // anyway as long as the style isn't set to "None"
    this.native.Background = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.White);

    // Lets just set our background to white 
    this.backgroundColor = "rgba(255,255,255,1)";
  }

  Window.prototype = Object.create(Container.prototype);
  Window.prototype.constructor = Window;

  Window.prototype.preferences = {
    animateOnSizeChange:false,
    animateOnPositionChange:false
  }

  Object.defineProperty(Window.prototype, 'frame', {
    get:function() { return this.native.WindowStyle == $.System.Windows.WindowStyle.SingleBorderWindow; },
    set:function(e) {
      if(e) this.native.WindowStyle = $.System.Windows.WindowStyle.SingleBorderWindow;
      else this.native.WindowStyle = $.System.Windows.WindowStyle.None;
    }
  });

  //TODO: Implement me
  Object.defineProperty(Window.prototype, 'textured', {
    get:function() { },
    set:function(e) { }
  });

  //TODO: Implement me
  Object.defineProperty(Window.prototype, 'shadow', {
    get:function() { },
    set:function(e) { }
  });

  Object.defineProperty(Window.prototype, 'menu', {
    get:function() { 
      return this.private.menu; 
    },
    set:function(e) {
      if(this.private.menu != null) {
        this.nativeView.RemoveLayoutConstraint(this.private.menuConst1);
        this.nativeView.RemoveLayoutConstraint(this.private.menuConst2);
        this.nativeView.RemoveLayoutConstraint(this.private.menuConst3);
        this.nativeView.Internalchildren.Remove(this.private.menuNative);
        this.private.menuConst1 = null;
        this.private.menuConst2 = null;
        this.private.menuConst3 = null;
        this.private.menuNative = null;
      }
      this.private.menu = e;
      this.private.menu.parent = this.nativeView;
      if(e) {
        this.private.menuNative = new $.System.Windows.Controls.Menu();
        for(var i=0; i < e.children.length; i++) {
          this.private.menuNative.Items.Add(e.children[i].native);
        }
        this.nativeView.InternalChildren.Add(this.private.menuNative);
        this.private.menuConst1 = this.nativeView.AddLayoutConstraint(this.nativeView,'Left','=',this.private.menuNative,'Left',0,0);
        this.private.menuConst2 = this.nativeView.AddLayoutConstraint(this.nativeView,'Top','=',this.private.menuNative,'Top',0,0);
        this.private.menuConst3 = this.nativeView.AddLayoutConstraint(this.nativeView,'Width','=',this.private.menuNative,'Width',1,0);
      }
    }
  });

  Object.defineProperty(Window.prototype, 'toolbar', {
    get:function() { return this.private.toolbar; },
    set:function(e) {
      if(this.frame == false && e) {
        if(application.warn) console.warn('Cannot add a toolbar to a window that has Window.frame = false;');
        return;
      }
      if(e) {
        this.private.toolbar = e;
        this.native.Content = new $.System.Windows.Controls.Grid();
        this.native.Content.HorizontalAlignment = $.System.Windows.HorizontalAlignment.Stretch;
        this.native.Content.VerticalAlignment = $.System.Windows.VerticalAlignment.Stretch;
        var r1 = new $.System.Windows.Controls.RowDefinition();
        r1.Height = new $.System.Windows.GridLength(1, $.System.Windows.GridUnitType.Auto);
        var r2 = new $.System.Windows.Controls.RowDefinition();
        r2.Height = new $.System.Windows.GridLength(1, $.System.Windows.GridUnitType.Star);
        this.native.Content.RowDefinitions.Add(r1);
        this.native.Content.RowDefinitions.Add(r2);
        this.private.toolbar.native.SetValue($.System.Windows.Controls.Grid.RowProperty, 0);
        this.nativeView.SetValue($.System.Windows.Controls.Grid.RowProperty, 1);
        this.native.Content.InternalChildren.Add(this.private.toolbar.native);
        this.native.Content.InternalChildren.Add(this.nativeView);
      } else if(this.private.toolbar) {
        this.private.toolbar = null;
        this.native.Content.InternalChildren.Remove(this.private.toolbar.native);
        this.native.Content.InternalChildren.Remove(this.nativeView);
        this.native.Content = this.nativeView;
      }
    }
  });

  Object.defineProperty(Window.prototype, 'canBeFullscreen', {
    get:function() { return this.private.canBeFullscreen; },
    set:function(e) { this.private.canBeFullscreen = e ? true : false; }
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

        if(this.private.previousResize != "") this.native.ResizeMode = this.private.previousResize;
        else this.native.ResizeMode = $.System.Windows.ResizeMode.CanResizeWithGrip;

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
        this.native.previousResize = this.native.ResizeMode;
        this.native.WindowState = $.System.Windows.WindowState.Maximized;
        this.native.WindowStyle = $.System.Windows.WindowStyle.None;
        this.native.ResizeMode = $.System.Windows.ResizeMode.NoResize;
        this.private.fullscreen = true;
      }
    }
  });

  Object.defineProperty(Window.prototype, 'title', {
    get:function() { return this.native.Title; },
    set:function(e) { this.native.Title = e.toString(); }
  });

  Object.defineProperty(Window.prototype, 'y', {
    get:function() { return Math.round(this.native.Top); },
    set:function(e) {
      var workingArea = $.System.Windows.SystemParameters.WorkArea;
      if(e == 'center') {
        this.native.Left = workingArea.width/2 - this.native.Width/2;
        this.native.Top = workingArea.height/2 - this.native.Height/2;
      } else {
        e = utilities.parseUnits(e);
        this.native.Top = e + workingArea.Y;
      }
    }
  });

  Object.defineProperty(Window.prototype, 'x', {
    get:function() { return Math.round(this.native.Left); },
    set:function(e) {
      var workingArea = $.System.Windows.SystemParameters.WorkArea;
      if(e == 'center') {
        this.native.Left = workingArea.width/2 - this.native.Width/2;
        this.native.Top = workingArea.height/2 - this.native.Height/2;
      } else {
        e = utilities.parseUnits(e);
        this.native.Left = e + workingArea.X;
      }
    }
  });

  Object.defineProperty(Window.prototype, 'width', {
    get:function() { return Math.round(this.native.ActualWidth); },
    set:function(e) {
        e = utilities.parseUnits(e);
        this.native.Width = e;
    }
  });

  Object.defineProperty(Window.prototype, 'height', {
    get:function() { return Math.round(this.native.ActualHeight); },
    set:function(e) {
        e = utilities.parseUnits(e);
        this.native.Height = e;
    }
  });

  //TODO: Implement me
  Object.defineProperty(Window.prototype, 'titleVisible', {
    get:function() { return true; },
    set:function(e) { /* TODO ? */ }
  });

  // Override Control's definition of visible to a window context.
  Object.defineProperty(Window.prototype, 'visible', {
    get:function() { return this.native.Visibility == $.System.Windows.Visibility.Visible; },
    set:function(e) {
      if(e) {
        this.native.Show();
        this.native.Visibility = $.System.Windows.Visibility.Visible;
      } else {
        this.native.Hide();
        this.native.Visibility = $.System.Windows.Visibility.Hidden;
        
      }
    }
  });

  Object.defineProperty(Window.prototype, 'maximizeButton', {
    get:function() {
      var hwnd = this.private.hwnd;
      return $$.win32.user32.GetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE) & $$.win32.user32.WS_MAXIMIZEBOX;
    },
    set:function(e) {
      if(e) {
        var hwnd = this.private.hwnd;
        var value = $$.win32.user32.GetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE);
        var result = $$.win32.user32.SetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE, (value | $$.win32.user32.WS_MAXIMIZEBOX));
        var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer.rawpointer, false);
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_MAXIMIZE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_ENABLED);
      } else {
        var hwnd = this.private.hwnd;
        var value = $$.win32.user32.GetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE);
        var result = $$.win32.user32.SetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE, (value & ~$$.win32.user32.WS_MAXIMIZEBOX));
        var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer.rawpointer, false);
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_MAXIMIZE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_GRAYED);
      }
    }
  });

  Object.defineProperty(Window.prototype, 'minimizeButton', {
    get:function() {
      var hwnd = this.private.hwnd;
      return $$.win32.user32.GetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE) & $$.win32.user32.WS_MINIMIZEBOX;
    },
    set:function(e) {
      var hwnd = this.private.hwnd;
      var value = $$.win32.user32.GetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE);
      var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer.rawpointer, false);

      if(e) {
        var result = $$.win32.user32.SetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE, (value | $$.win32.user32.WS_MINIMIZEBOX));
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_MAXIMIZE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_ENABLED);
      } else {
        var result = $$.win32.user32.SetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE, (value & ~$$.win32.user32.WS_MINIMIZEBOX));
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_MINIMIZE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_GRAYED);
      }
    }
  });

  Object.defineProperty(Window.prototype, 'closeButton', {
    get:function() { return this.private.closeButton; },
    set:function(e) {
      this.private.closeButton = e;
      var hwnd = this.private.hwnd;
      var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer.rawpointer, false);
      if(e) {
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_CLOSE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_ENABLED);
      } else {
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_CLOSE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_GRAYED);
      }
    }
  });

  Object.defineProperty(Window.prototype, 'resizable', {
    get:function() { 
      return this.native.ResizeMode != $.System.Windows.ResizeMode.NoResize && 
        this.native.ResizeMode != $.System.Windows.ResizeMode.CanMinimize;
    },
    set:function(e) {
      if(e) this.native.ResizeMode = $.System.Windows.ResizeMode.CanResizeWithGrip;
      else this.native.ResizeMode = $.System.Windows.ResizeMode.CanMinimize;
    }
  });

  Object.defineProperty(Window.prototype, 'backgroundColor', {
    get:function() { return this.private.background; },
    set:function(e) {
      if(e == 'auto') {
        this.private.background = 'auto';
        this.nativeView.Background = new $.System.Windows.Media.SolidColorBrush($.System.Windows.SystemColors.WindowFrame);
      } else {
        this.private.background = e;
        this.private.backgroundObj = new Color(e);
        this.nativeView.Background = new $.System.Windows.Media.SolidColorBrush(this.private.backgroundObj.native);
      }
    }
  });

  Object.defineProperty(Window.prototype, "alwaysOnTop", {
    get:function() { return this.native.Topmost; },
    set:function(e) { this.native.Topmost = e ? true : false; }
  });

  Window.prototype.destroy = function() {
    this.native.Close();
  }

  Window.prototype.bringToFront = function() { 
    this.native.Activate();
    this.native.Topmost = true;
    this.native.Topmost = false;
    this.native.Focus();
  }

  return Window;
})();
