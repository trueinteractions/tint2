module.exports = (function() {
  if(global.__TINT.TextInput) {
    return global.__TINT.TextInput;
  }
  var $ = process.bridge.dotnet;
  var Container = require('Container');
  var Color = require('Color');

  function TextInput(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.TextBox;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.TextBox;
    Container.call(this, options);

    var first = true;
    this.addEventListener('keyup',function() { 
      if(first) {
        this.fireEvent('inputstart');
        first = false;
      }
    }.bind(this));
    var keyUp = function() {
      if(first) {
        this.fireEvent('inputstart');
        first = false;
      }
    }.bind(this);
    var focus = function() { first = true; }.bind(this);
    var lostFocus = function() { 
      this.fireEvent('inputend');
      first = false;
    }.bind(this);
    var textChanged = function() { 
      setTimeout(function() { this.fireEvent('input'); }.bind(this),0);
    }.bind(this);

    this.native.addEventListener('GotFocus', focus);
    this.native.addEventListener('LostFocus', lostFocus);
    if(this.nativeClass === $.System.Windows.Controls.TextBox) {
      this.native.addEventListener('TextChanged', textChanged);
    } else {
      this.native.addEventListener('TextInput', textChanged);
    }
    this.native.addEventListener('KeyUp', keyUp);

    this.private.callbacks.push(focus);
    this.private.callbacks.push(lostFocus);
    this.private.callbacks.push(textChanged);
    this.private.callbacks.push(keyUp);
    this.private.readyonly = false;
    this.private.previousBackground = this.native.Background;
    this.private.previousBorder = this.native.BorderBrush;
    this.private.previousBorderThickness = this.native.BorderThickness;
    this.private.previousPadding = this.native.Padding;
  }

  TextInput.prototype = Object.create(Container.prototype);
  TextInput.prototype.constructor = TextInput;

  Object.defineProperty(TextInput.prototype, 'value', {
    get:function() { return this.native.Text; },
    set:function(e) { this.native.Text = e.toString(); }
  });

  Object.defineProperty(TextInput.prototype, 'enabled', {
    get:function() { return this.native.IsReadOnly; },
    set:function(e) { this.native.IsReadOnly = e ? true : false; }
  });

  Object.defineProperty(TextInput.prototype, 'textcolor', {
    get:function() { return new Color(this.nativeView.Foreground.Color); },
    set:function(e) {
      var c = new Color(e);
      this.nativeView.Foreground = new $.System.Windows.Media.SolidColorBrush(c.native);
    }
  });

  Object.defineProperty(TextInput.prototype, 'readonly', {
    get:function() { return this.private.readonly; },
    set:function(e) {
      this.private.readonly = e ? true : false;
      if(this.private.readonly) {
        this.private.previousBackground = this.native.Background;
        this.private.previousBorder = this.native.BorderBrush;
        this.private.previousBorderThickness = this.native.BorderThickness;
        this.private.previousPadding = this.native.Padding;

        this.native.Background = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.Transparent);
        this.native.BorderBrush = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.Transparent);
        this.native.BorderThickness = new $.System.Windows.Thickness(0,0,0,0);
        this.native.Padding = new $.System.Windows.Thickness(0,0,0,0);
        this.native.IsReadOnly = true;
        this.native.AcceptsTab = false;
        this.native.Focusable = false;
      } else if(this.private.readonly) {
        
        this.native.Background = this.private.previousBackground;
        this.native.BorderBrush = this.private.previousBorder;
        this.native.BorderThickness = this.private.previousBorderThickness;
        this.native.Padding = this.private.previousPadding;

        this.native.IsReadOnly = false;
        this.native.AcceptsTab = true;
        this.native.Focusable = true;

      }

    }
  });

  Object.defineProperty(TextInput.prototype, 'placeholder', {
    get:function() { /* TODO */ },
    set:function(e) { /* TODO */ }
  });

  Object.defineProperty(TextInput.prototype, 'alignment', {
    get:function() {
      if (this.native.TextAlignment == $.System.Windows.TextAlignment.Left) return "left";
      else if (this.native.TextAlignment == $.System.Windows.TextAlignment.Right) return "right";
      else if (this.native.TextAlignment == $.System.Windows.TextAlignment.Center) return "center";
      else return "unknown";
    },
    set:function(e) {
      if (e == 'right') this.native.TextAlignment = $.System.Windows.TextAlignment.Right;
      else if (e == 'center') this.native.TextAlignment = $.System.Windows.TextAlignment.Center;
      else this.native.TextAlignment = $.System.Windows.TextAlignment.Left;
    }
  });

  Object.defineProperty(TextInput.prototype, 'visible', {
    get:function() { return this.native.Visibility; },
    set:function(e) { this.native.Visibility = e ? true : false; }
  });

  Object.defineProperty(TextInput.prototype, 'linewrap', {
    get:function() { return this.native.AcceptsReturn; },
    set:function(e) { this.native.AcceptsReturn = e ? true : false; }
  });

  //TODO: Is this 1:1 functionality? Can users still scroll with no visible scrollbar?
  Object.defineProperty(TextInput.prototype, 'scrollable', {
    get:function() { return this.nativeView.VerticalScrollBarVisibility == $.System.Windows.Controls.ScrollBarVisibility.Auto; },
    set:function(e) { this.nativeView.VerticalScrollBarVisibility = e ?  $.System.Windows.Controls.ScrollBarVisibility.Auto :  $.System.Windows.Controls.ScrollBarVisibility.Hidden; }
  });

  global.__TINT.TextInput = TextInput;
  return TextInput;
})();
