module.exports = (function() {
  if(global.__TINT.Window) {
    return global.__TINT.Window;
  }
  var Container = require('Container');
  var util = require('Utilities');
  var Color = require('Color');
  var $ = process.bridge.dotnet;
  var $$ = process.bridge;

  function ensureHandle(win) {
    // We need to force a HWND creatio otherwise setting any
    // properties on the WPF Windows object will fail. 
    win.private.hwnd = (new $.System.Windows.Interop.WindowInteropHelper(win.native)).EnsureHandle();
  }

  function Window(options) {
    options = options || {};
    options.width = options.width || 500;
    options.height = options.height || 500;
    global.application.private.windowCount++;
    this.nativeClass = this.nativeClass || $.System.Windows.Window;
    this.nativeViewClass = this.nativeViewClass || $.AutoLayout.AutoLayoutPanel;
    Container.call(this, options);
    this.native.Content = new $.System.Windows.Controls.DockPanel();
    this.native.Content.LastChildFill = true;
    this.native.Content.Children.Add(this.nativeView);
    this.nativeView.SetValue($.System.Windows.Controls.DockPanel.DockProperty, $.System.Windows.Controls.Dock.Bottom);

    var closing = function() { this.fireEvent('close'); }.bind(this);
    var closed = function() {
      global.application.private.windowCount--;
      this.fireEvent('closed'); 
      if(global.application.exitAfterWindowsClose && global.application.private.windowCount === 0) {
        process.exit(0);
      }
    }.bind(this);
    var sizeChanged = function() { this.fireEvent('resize'); }.bind(this);
    var deactivated = function() { this.fireEvent('blur'); }.bind(this);
    var activated = function() { this.fireEvent('focus'); }.bind(this);
    var stateChanged = function() {
      if(this.native.WindowState === $.System.Windows.WindowState.Maximized && 
          this.native.WindowStyle === $.System.Windows.WindowStyle.None && 
          this.private.fullscreen === false) 
      {
        this.private.fullscreen = true;
         this.fireEvent('enter-fullscreen');
      } else if(this.private.fullscreen === true && 
                (this.native.WindowState !== $.System.Windows.WindowState.Maximized || 
                  this.native.WindowStyle !== $.System.Windows.WindowStyle.None)) 
      {
        this.fireEvent('exit-fullscreen');
        this.private.fullscreen = false;
      }
      if(this.native.WindowState === $.System.Windows.WindowState.Maximized) {
        this.fireEvent('maximize');
      } else if(this.native.WindowState === $.System.Windows.WindowState.Minimized) {
        this.fireEvent('minimize');
      } else {
        this.fireEvent('restore');
      }
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

    if(!process.background) {
      this.native.ShowInTaskbar = true;
    }
    this.native.ShowActivated = true;
    this.native.Width = options.width;
    this.native.Height = options.height;
    this.native.WindowStartupLocation = $.System.Windows.WindowStartupLocation.CenterScreen;
  }

  Window.prototype = Object.create(Container.prototype);
  Window.prototype.constructor = Window;


  util.makePropertyBoolType(Window.prototype, 'frame', 'WindowStyle', 
    $.System.Windows.WindowStyle.SingleBorderWindow, $.System.Windows.WindowStyle.None);

  //TODO: Implement me
  //Object.defineProperty(Window.prototype, 'textured', {
  //  get:function() { },
  //  set:function(e) { }
  //});

  //TODO: Implement me
  //Object.defineProperty(Window.prototype, 'shadow', {
  //  get:function() { },
  //  set:function(e) { }
  //});

  util.def(Window.prototype, 'menu', 
    function() { return this.private.menu; },
    function(e) {
      if(e) {
        this.private.menu = e;
        this.private.menu.parent = this.nativeView;
        this.private.menuNative = new $.System.Windows.Controls.Menu();
        for(var i=0; i < e.children.length; i++) {
          this.private.menuNative.Items.Add(e.children[i].native);
        }
        this.native.Content.Children.Insert(0,this.private.menuNative);
        this.private.menuNative.SetValue($.System.Windows.Controls.DockPanel.DockProperty, $.System.Windows.Controls.Dock.Top);
      } else if (this.private.menu) {
        this.native.Content.Children.Remove(this.private.menuNative);
        this.private.menuNative = null;
        this.private.menu = null;
      }
    });

  util.def(Window.prototype, 'toolbar',
    function() { return this.private.toolbar; },
    function(e) {
      if(e && this.frame) {
        this.private.toolbar = e;
        this.native.Content.Children.Insert(this.native.Content.Children.Count - 1, this.private.toolbar.native);
        this.private.toolbar.native.SetValue($.System.Windows.Controls.DockPanel.DockProperty, $.System.Windows.Controls.Dock.Top);
      } else if(this.private.toolbar) {
        this.native.Content.Children.Remove(this.private.toolbar.native);
        this.private.toolbar = null;
      }
    });

  util.def(Window.prototype, 'canBeFullscreen',
    function() { return this.private.canBeFullscreen; },
    function(e) { this.private.canBeFullscreen = e ? true : false; }
  );

  util.def(Window.prototype, 'state',
    function() { 
      if(this.private.fullscreen) {
        return "fullscreen";
      } else if(this.native.WindowState === $.System.Windows.WindowState.Maximized) {
        return "maximized";
      } else if(this.native.WindowState === $.System.Windows.WindowState.Minimized) {
        return "minimized";
      } else {
        return "normal";
      }
    },
    function(e) {
      if(e !== "fullscreen" && this.private.fullscreen) {
        if(this.private.previousStyle !== "") {
          this.native.WindowStyle = this.private.previousStyle;
        } else {
          this.native.WindowStyle = $.System.Windows.WindowStyle.SingleBorderWindow;
        }

        if(this.private.previousState !== "") {
          this.native.WindowState = this.private.previousState;
        } else {
          this.native.WindowState = $.System.Windows.WindowState.Normal;
        }

        if(this.private.previousResize !== "") {
          this.native.ResizeMode = this.private.previousResize;
        } else {
          this.native.ResizeMode = $.System.Windows.ResizeMode.CanResizeWithGrip;
        }
        this.private.fullscreen = false;
      } 
      
      if(e === 'maximized') {
        this.native.WindowState = $.System.Windows.WindowState.Maximized;
      } else if (e === 'normal') {
        this.native.WindowState = $.System.Windows.WindowState.Normal;
      } else if (e === 'minimized') {
        this.native.WindowState = $.System.Windows.WindowState.Minimized;
      } else if (e === 'fullscreen' && !this.private.fullscreen) {
        this.native.previousStyle = this.native.WindowStyle;
        this.native.previousState = this.native.WindowState;
        this.native.previousResize = this.native.ResizeMode;
        this.native.WindowState = $.System.Windows.WindowState.Maximized;
        this.native.WindowStyle = $.System.Windows.WindowStyle.None;
        this.native.ResizeMode = $.System.Windows.ResizeMode.NoResize;
        this.private.fullscreen = true;
      }
    });

  util.makePropertyStringType(Window.prototype, 'title', 'Title');


  function setWindowCoordinates(type, winObj, value) {
    var workingArea = $.System.Windows.SystemParameters.WorkArea;
    if(value === 'center') {
      if(this.animateOnPositionChange) {
        util.animateWPFProperty(winObj, $.System.Windows.Window.LeftProperty, 225, winObj.Left, workingArea.width/2 - winObj.Width/2);
        util.animateWPFProperty(winObj, $.System.Windows.Window.TopProperty, 225, winObj.Top, workingArea.height/2 - winObj.Height/2);
      } else {
        winObj.Left = workingArea.width/2 - winObj.Width/2;
        winObj.Top = workingArea.height/2 - winObj.Height/2;
      }
    } else {
      value = util.parseUnits(value);
      if(this.animateOnPositionChange) {
        util.animateWPFProperty(
          winObj, 
          (type === "top" ? $.System.Windows.Window.TopProperty : $.System.Windows.Window.LeftProperty), 
          225, 
          (type === "top" ? winObj.Top : winObj.Left) , 
          value + (type === "top" ? workingArea.Y : workingArea.X));
      } else if (type === "top") {
        winObj.Top = value + workingArea.Y;
      } else if (type === "left") {
        winObj.Left = value + workingArea.X;
      }
    }
  }

  util.def(Window.prototype, 'y',
    function() { return Math.round(this.native.Top); },
    function(e) { setWindowCoordinates('top', this.native, e); }
  );

  util.def(Window.prototype, 'x',
    function() { return Math.round(this.native.Left); },
    function(e) { setWindowCoordinates('left', this.native, e); }
  );

  util.def(Window.prototype, 'width',
    function() { return Math.round(this.native.ActualWidth); },
    function(e) { 
      e = util.parseUnits(e);
      if(this.animateOnSizeChange) {
        util.animateWPFProperty(this.native, $.System.Windows.FrameworkElement.WidthProperty, 225, this.native.Width, e);
      } else {
        this.native.Width = e; 
      }
    }
  );

  util.def(Window.prototype, 'height',
    function() { return Math.round(this.native.ActualHeight); },
    function(e) { this.native.Height = util.parseUnits(e); }
  );

  //TODO: Implement me
  //Object.defineProperty(Window.prototype, 'titleVisible', {
  //  get:function() { return true; },
  //  set:function(e) { /* TODO ? */ }
  //});

  util.def(Window.prototype, 'transparent',
    function() { return this.native.AllowTransparency; },
    function(e) { 
      if(e) {
        this.frame = false;
        this.native.AllowsTransparency = true;
      } else {
        this.frame = true;
        this.native.AllowsTransparency = false;
      }
    });

  // Override Control's definition of visible to a window context.
  util.def(Window.prototype, 'visible',
    function() { return this.native.Visibility === $.System.Windows.Visibility.Visible; },
    function(e) {
      if(e) {
        this.native.Show();
        this.native.Visibility = $.System.Windows.Visibility.Visible;
      } else {
        this.native.Hide();
        this.native.Visibility = $.System.Windows.Visibility.Hidden;
        
      }
    }
  );

  util.def(Window.prototype, 'maximizeButton',
    function() {
      ensureHandle(this);
      var hwnd = this.private.hwnd;
      return $$.win32.user32.GetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE) & $$.win32.user32.WS_MAXIMIZEBOX;
    },
    function(e) {
      ensureHandle(this);
      var hwnd = this.private.hwnd;
      var value = $$.win32.user32.GetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE);
      var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer.rawpointer, false);

      if(e) {
        $$.win32.user32.SetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE, (value | $$.win32.user32.WS_MAXIMIZEBOX));
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_MAXIMIZE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_ENABLED);
      } else {
        $$.win32.user32.SetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE, (value & (~$$.win32.user32.WS_MAXIMIZEBOX)));
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_MAXIMIZE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_GRAYED);
      }
    }
  );

  util.def(Window.prototype, 'minimizeButton',
    function() {
      ensureHandle(this);
      var hwnd = this.private.hwnd;
      return $$.win32.user32.GetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE) & $$.win32.user32.WS_MINIMIZEBOX;
    },
    function(e) {
      ensureHandle(this);
      var hwnd = this.private.hwnd;
      var value = $$.win32.user32.GetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE);
      var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer.rawpointer, false);

      if(e) {
        $$.win32.user32.SetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE, (value | $$.win32.user32.WS_MINIMIZEBOX));
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_MAXIMIZE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_ENABLED);
      } else {
        $$.win32.user32.SetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE, (value & (~$$.win32.user32.WS_MINIMIZEBOX)));
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_MINIMIZE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_GRAYED);
      }
    }
  );

  util.def(Window.prototype, 'closeButton',
    function() { return this.private.closeButton; },
    function(e) {
      ensureHandle(this);
      this.private.closeButton = e;
      var hwnd = this.private.hwnd;
      var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer.rawpointer, false);
      if(e) {
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_CLOSE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_ENABLED);
      } else {
        $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_CLOSE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_GRAYED);
      }
    }
  );

  util.def(Window.prototype, 'resizable',
    function() { 
      return this.native.ResizeMode !== $.System.Windows.ResizeMode.NoResize && 
        this.native.ResizeMode !== $.System.Windows.ResizeMode.CanMinimize;
    },
    function(e) {
      if(e) {
        this.native.ResizeMode = $.System.Windows.ResizeMode.CanResizeWithGrip;
      } else { 
        this.native.ResizeMode = $.System.Windows.ResizeMode.CanMinimize;
      }
    }
  );

  util.def(Window.prototype, 'backgroundColor',
    function() { return this.private.background; },
    function(e) {
      if(e === 'auto') {
        this.private.background = 'auto';
        this.nativeView.Background = new $.System.Windows.Media.SolidColorBrush($.System.Windows.SystemColors.WindowFrame);
        this.native.Background = new $.System.Windows.Media.SolidColorBrush($.System.Windows.SystemColors.WindowFrame);
      } else if (e === 'transparent' || (e.indexOf('rgba') > -1 && e.indexOf('0)') > -1)) {
        this.transparent = true;
        this.private.background = e;
        this.private.backgroundObj = {native:$.System.Windows.Media.Colors.Transparent};
        this.nativeView.Background = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.Transparent);
        this.native.Background = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.Transparent);
      } else {
        this.private.background = e;
        this.private.backgroundObj = new Color(e);
        this.nativeView.Background = new $.System.Windows.Media.SolidColorBrush(this.private.backgroundObj.native);
        this.native.Background = new $.System.Windows.Media.SolidColorBrush(this.private.backgroundObj.native);

        ensureHandle(this);
        var mainWindowSrc = $.System.Windows.Interop.HwndSource.FromHwnd(this.private.hwnd);
        mainWindowSrc.CompositionTarget.BackgroundColor = this.private.backgroundObj.native;
      }
    }
  );

  util.makePropertyBoolType(Window.prototype, 'alwaysOnTop', 'TopMost', true, false);

  Window.prototype.destroy = function() { this.native.Close(); };

  Window.prototype.bringToFront = function() { 
    this.native.Activate();
    this.native.Topmost = true;
    this.native.Topmost = false;
    this.native.Focus();
  };

  global.__TINT.Window = Window;
  return Window;
})();
