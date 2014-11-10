module.exports = (function() {
  var $ = process.bridge.dotnet;
  var $$ = process.bridge;
  var utilities = require('Utilities');
  var Control = require('Control');
  var utils = require('Utilities');
  var Color = require('Color');

  function Dialog() {
    var img = null, 
      buttonsSet = false, 
      mainButton = null, 
      auxButton = null,
      suppression = null,
      suppressionChecked = false;
      events = {},
      type = "information",
      title = "",
      message = "";

    function fireEvent(event, args) {
      if(events[event]) (events[event]).forEach(function(item,index,arr) { item.apply(null,args); });
    }

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }

    Object.defineProperty(this, "title", {
      get:function() { return title; },
      set:function(e) { title = e }
    });

    Object.defineProperty(this, "message", {
      get:function() { return message },
      set:function(e) { message = e; }
    });

    Object.defineProperty(this, "mainbutton", {
      get:function() { return mainButton; },
      set:function(e) { mainButton = e; }
    });

    Object.defineProperty(this, "auxbutton", {
      get:function() { return auxButton; },
      set:function(e) { auxButton = e; }
    });

    Object.defineProperty(this, "suppression", {
      get:function() { return suppression; },
      set:function(e) { suppression = e; }
    });

    Object.defineProperty(this, "suppressionChecked", {
      get:function() { return suppressionChecked; },
      set:function(e) { suppressionChecked = e ? true : false; }
    });

    Object.defineProperty(this, 'icon', {
      get:function() { return img; },
      set:function(e) { img = e; }
    });

    Object.defineProperty(this, "type", {
      get:function() { return type; },
      set:function(e) {
        if(e == "warning") type = "warning";
        else if(e == "critical") type = "critical";
        else type = "alert";
      }
    });

    // TODO: Does not work on Mac OSX, wont implement until thats resolved.
    //this.setChild = function(e) {  }

    this.open = function(z) {
      var bgcolor = new Color('#f7f7f7');

      this.native = {};

      var w = new $.System.Windows.Window();
      this.native.window = w;
      w.Width = 420;
      w.MinWidth = 420;
      w.MaxWidth = 420;
      w.Height = 160;
      w.MinHeight = 160;
      w.MaxHeight = 160;
      w.ShowInTaskbar = false;
      w.ResizeMode = $.System.Windows.ResizeMode.CanResize;
      w.Content = new $.AutoLayout.AutoLayoutPanel();
      w.TopMost = true;

      var hwnd = new $.System.Windows.Interop.WindowInteropHelper(w).EnsureHandle();
      var margin = new $$.win32.structs.MARGINS;
      margin.cxLeftWidth = -1;
      margin.cxRightWidth = -1;
      margin.cyTopHeight = -1;
      margin.cyBottomHeight = -1;
      //$$.win32.dwmapi.DwmExtendFrameIntoClientArea(hwnd.pointer.rawpointer,margin);
      var mainWindowSrc = $.System.Windows.Interop.HwndSource.FromHwnd(hwnd);
      mainWindowSrc.CompositionTarget.BackgroundColor = bgcolor.native;
      w.Background = new $.System.Windows.Media.SolidColorBrush(bgcolor.native);
      w.Content.Background = new $.System.Windows.Media.SolidColorBrush(bgcolor.native);
      w.WindowStartupLocation = $.System.Windows.WindowStartupLocation.CenterScreen;

      var value = $$.win32.user32.GetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE);
      var result = $$.win32.user32.SetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE, (value & ~$$.win32.user32.WS_MAXIMIZEBOX));
      var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer.rawpointer, false);
      $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_MAXIMIZE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_GRAYED);

      var value = $$.win32.user32.GetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE);
      var result = $$.win32.user32.SetWindowLongA(hwnd.pointer.rawpointer, $$.win32.user32.GWL_STYLE, (value & ~$$.win32.user32.WS_MINIMIZEBOX));
      var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer.rawpointer, false);
      $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_MINIMIZE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_GRAYED);

      var hMenu = $$.win32.user32.GetSystemMenu(hwnd.pointer.rawpointer, false);
      $$.win32.user32.EnableMenuItem(hMenu, $$.win32.user32.SC_CLOSE, $$.win32.user32.MF_BYCOMMAND | $$.win32.user32.MF_GRAYED);


      var nimg;
      if(!img && application.icon) nimg = utils.makeImage(application.icon);
      else if(!img) nimg = utils.makeImage('info');
      else nimg = utils.makeImage(img);
      this.native.image = nimg;
      nimg.Stretch = $.System.Windows.Media.Stretch.UniformToFill;
      nimg.Width = 50;
      nimg.Height = 50;
      w.Content.InternalChildren.Add(nimg);
      w.Content.AddLayoutConstraint(w.Content, 'Top', '=', nimg, 'Top', 1.0, -20);
      w.Content.AddLayoutConstraint(nimg, 'Height', '=', nimg, null, null, 70);
      w.Content.AddLayoutConstraint(w.Content, 'Left', '=', nimg, 'Left', 1.0, -20);
      w.Content.AddLayoutConstraint(nimg, 'Right', '=', nimg, 'Left', 1.0, 70);

      var text = new $.System.Windows.Controls.TextBlock();
      text.Text = title.toString();
      text.FontSize = text.FontSize * 1.1;
      text.FontWeight = $.System.Windows.FontWeight.FromOpenTypeWeight(600);
      w.Content.AddLayoutConstraint(nimg, 'Right', '=', text, 'Left', 1.0, -10);
      w.Content.AddLayoutConstraint(w.Content, 'Right', '=', text, 'Right', 1.0, 0);
      w.Content.AddLayoutConstraint(w.Content, 'Top', '=', text, 'Top', 1.0, -20);
      w.Content.InternalChildren.Add(text);

      var text2 = new $.System.Windows.Controls.TextBlock();
      text2.TextWrapping = $.System.Windows.TextWrapping.Wrap;
      text2.Text = message.toString();
      text2.Width = 325;
      w.Content.AddLayoutConstraint(nimg, 'Right', '=', text2, 'Left', 1.0, -10);
      w.Content.AddLayoutConstraint(w.Content, 'Right', '=', text2, 'Right', 1.0, 0);
      w.Content.AddLayoutConstraint(text2, 'Top', '=', text, 'Bottom', 1.0, 10);
      w.Content.InternalChildren.Add(text2);

      if(suppression) {
        var cbox = new $.System.Windows.Controls.CheckBox();
        this.native.supression = cbox;
        cbox.Content = suppression.toString();
        cbox.IsChecked = suppressionChecked ? true : false;
        cbox.addEventListener('PreviewMouseDown', function() {
          suppressionChecked = !suppressionChecked;
        });
        w.Content.AddLayoutConstraint(nimg, 'Right', '=', cbox, 'Left', 1.0, -10);
        w.Content.AddLayoutConstraint(w.Content, 'Right', '=', cbox, 'Right', 1.0, 0);
        w.Content.AddLayoutConstraint(cbox, 'Top', '=', text2, 'Bottom', 1.0, 10);
        w.Content.InternalChildren.Add(cbox);
      }

      var btn = new $.System.Windows.Controls.Button();
      this.native.mainbutton = btn;
      btn.addEventListener('PreviewMouseDown', function() {
        fireEvent('click',['main']);
        w.Close();
      }.bind(this));
      btn.Content = new $.System.Windows.Controls.StackPanel();
      var label = new $.System.Windows.Controls.Label();
      label.Content = mainButton.toString();
      label.Padding = new $.System.Windows.Thickness(0);
      btn.Content.InternalChildren.Add(label);
      btn.IsDefault = true;
      btn.Height = 25;
      btn.Padding = new $.System.Windows.Thickness(0);
      w.Content.InternalChildren.Add(btn);
      w.Content.AddLayoutConstraint(w.Content, 'Bottom', '=', btn, 'Bottom', 1.0, 10);
      w.Content.AddLayoutConstraint(w.Content, 'Right', '=', btn, 'Right', 1.0, 10);
      w.Content.AddLayoutConstraint(btn, 'Left', '=', btn, 'Right', 1.0, -75);

      if(auxButton) {
        var btn2 = new $.System.Windows.Controls.Button();
        this.native.auxbutton = btn2;
        btn2.addEventListener('PreviewMouseDown', function() {
          fireEvent('click',['aux']);
          w.Close();
        }.bind(this));
        btn2.Height = 25;
        btn2.Padding = new $.System.Windows.Thickness(0);
        btn2.Content = new $.System.Windows.Controls.StackPanel();
        var label2 = new $.System.Windows.Controls.Label();
        label2.Padding = new $.System.Windows.Thickness(0);
        label2.Content = auxButton.toString();
        btn2.Content.InternalChildren.Add(label2);
        w.Content.InternalChildren.Add(btn2);
        w.Content.AddLayoutConstraint(w.Content, 'Bottom', '=', btn2, 'Bottom', 1.0, 10);
        w.Content.AddLayoutConstraint(btn2, 'Right', '=', btn, 'Left', 1.0, -10);
        w.Content.AddLayoutConstraint(btn2, 'Left', '=', btn2, 'Right', 1.0, -75);
      }

      w.Show();
    }.bind(this);
  }
  //Dialog.prototype = Object.create(Control.prototype);
  //Dialog.prototype.constructor = Dialog;


  return Dialog;
})();