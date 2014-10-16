module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function Button(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.initViewOnly = true;
      Container.call(this, $.System.Windows.Controls.Button, $.System.Windows.Controls.Button, options);
    }

    this.private.img = null;
    this.private.buttonType = "normal";
    this.private.buttonStyle = "normal";
    this.private.label = new $.System.Windows.Controls.Label();
    this.native.Content = this.private.label;
    this.native.Padding = new $.System.Windows.Thickness(5.75,1.75,5.75,1.75);
    // convert pxl based measure to point (18/17) * PixelSize
    this.native.FontSize = this.native.FontSize * 1.05882352941176;
    this.private.defaultBorder = this.nativeView.BorderThickness;
    this.private.defaultBorderColor = this.nativeView.BorderBrush;
  }

  Button.prototype = Object.create(Container.prototype);
  Button.prototype.constructor = Button;

  Object.defineProperty(Button.prototype, 'border', {
    get:function() { 
      if(this.private.defaultBorder == this.nativeView.BorderThickness) return true;
      else return false;
    },
    set:function(e) {
      if(e) {
        this.nativeView.BorderThickness = this.private.defaultBorder;
        this.nativeView.BorderBrush = this.private.defaultBorderColor;
      } else {
        this.nativeView.BorderThickness = new $.System.Windows.Thickness(0);
        this.nativeView.BorderBrush = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.Transparent);
      }
    }
  });

  Object.defineProperty(Button.prototype, 'state', {
    get:function() { return typeof(this.nativeView.IsChecked) != undefined ? this.nativeView.IsChecked : false;  },
    set:function(e) { 
      if(typeof(this.nativeView.IsChecked) != undefined) {
        this.nativeView.IsChecked = e;
      }
    }
  });

  Object.defineProperty(Button.prototype, 'title', {
    get:function() { return this.nativeView.Content.ToString(); },
    set:function(e) { this.nativeView.Content = e.toString(); }
  });

  Object.defineProperty(Button.prototype, 'type', {
    get:function() { },
    set:function(type) {
      /*
      this.private.buttonType = type;
      if(type == "normal") this.nativeView('setButtonType',$.NSMomentaryLightButton);
      else if (type == "toggle") this.nativeView('setButtonType',$.NSPushOnPushOffButton);
      else if (type == "checkbox") this.nativeView('setButtonType', $.NSSwitchButton);
      else if (type == "radio") this.nativeView('setButtonType', $.NSRadioButton);
      else if (type == "none") this.nativeView('setButtonType', $.NSMomentaryPushInButton);*/
    }
  });

  Object.defineProperty(Button.prototype, 'style', {
    get:function() {  },
    set:function(type) {
      /*this.private.buttonStyle = type;
      if(type == "normal") this.nativeView('setBezelStyle',$.NSTexturedRoundedBezelStyle);
      else if (type == "rounded") this.nativeView('setBezelStyle',$.NSRoundedBezelStyle);
      else if (type == "square") this.nativeView('setBezelStyle',$.NSThickSquareBezelStyle);
      else if (type == "disclosure") this.nativeView('setBezelStyle', $.NSDisclosureBezelStyle);
      else if (type == "shadowless") this.nativeView('setBezelStyle', $.NSShadowlessSquareBezelStyle);
      else if (type == "circular") this.nativeView('setBezelStyle', $.NSCircularBezelStyle);
      else if (type == "recessed") this.nativeView('setBezelStyle', $.NSRecessedBezelStyle);
      else if (type == "help") this.nativeView('setBezelStyle', $.NSHelpButtonBezelStyle);*/
    }
  });

  Object.defineProperty(Button.prototype, 'showBorderOnHover', {
    get:function() {  },
    set:function(e) {  }
  });

  Object.defineProperty(Button.prototype, 'enabled', {
    get:function() { return this.IsEnabled ? true : false; },
    set:function(e) { this.native.IsEnabled = e ? true : false; }
  });

  Object.defineProperty(Button.prototype, 'image', {
    get:function() {  },
    set:function(e) {  }
  });

  return Button;

})();
