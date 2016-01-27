module.exports = (function() {
  if(global.__TINT.Button) {
    return global.__TINT.Button;
  }

  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function Button(properties, options, inherited) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.Button;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.Button;
    Container.call(this, properties, options, inherited);

    this.private.buttonType = "normal";
    this.private.buttonStyle = "normal";
    this.private.stack = new $.System.Windows.Controls.StackPanel();
    this.private.stack.Orientation = $.System.Windows.Controls.Orientation.Horizontal;
    this.private.label = null;
    this.private.img = null;

    this.private.remapNaturalStates = function() {
      this.native.Content = this.private.stack;

      if(this.type === "toggle") {
        this.native.Padding = new $.System.Windows.Thickness(5.75,1.75,5.75,1.75);
      } else {
        this.native.Padding = new $.System.Windows.Thickness(0,0,0,0);
      }
      // convert pxl based measure to point (18/17) * PixelSize
      // this.native.FontSize = this.native.FontSize * 1.05882352941176;
      this.private.defaultBorder = this.nativeView.BorderThickness;
      this.private.defaultBorderColor = this.nativeView.BorderBrush;
      this.private.stack.Height = this.nativeView.Height;
      this.private.stack.Width = this.nativeView.Width;
    }.bind(this);
    this.private.remapNaturalStates();
    utilities.setProperties(this, properties, inherited);
  }

  Button.prototype = Object.create(Container.prototype);
  Button.prototype.constructor = Button;

  Object.defineProperty(Button.prototype, 'border', {
    get:function() { 
      if(this.private.defaultBorder === this.nativeView.BorderThickness) {
        return true;
      } else { 
        return false;
      }
    },
    set:function(e) {
      this.private.states.border = e;
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
    get:function() {
      return typeof(this.nativeView.IsChecked) !== 'undefined' ? this.nativeView.IsChecked : false;  
    },
    set:function(e) { 
      this.private.states.state = e;
      if(typeof(this.nativeView.IsChecked) !== 'undefined') {
        this.nativeView.IsChecked = e ? true : false;
      }
    }
  });

  Object.defineProperty(Button.prototype, 'title', {
    get:function() { 
      if(this.private.label === null) {
        return ""; 
      } else {
        return this.private.label.Content.toString(); 
      }
    },
    set:function(e) { 
      this.private.states['title'] = e;
      if(this.private.label !== null)
      {
        this.private.stack.Children.Remove(this.private.label);
        this.private.label = null;
      }
      if(e && e !== null) {
        this.private.label = new $.System.Windows.Controls.Label();
        this.private.stack.Children.Add(this.private.label);
        this.private.label.Content = e.toString(); 
      }
    }
  });

  Object.defineProperty(Button.prototype, 'type', {
    get:function() { return this.private.buttonType; },
    set:function(type) {
      this.private.states.type = type;
      if(this.private.buttonType === type) {
        return;
      }
      
      this.private.buttonType = type;

      var oldNative = this.nativeView;
      var parent = this.native.Parent;
      if(parent !== null) {
        this.native.Parent.Children.Remove(this.native);
      }

      if (type === "toggle") {
        this.nativeView = this.native = new $.System.Windows.Controls.Primitives.ToggleButton();
      } else if (type === "checkbox") {
        this.nativeView = this.native = new $.System.Windows.Controls.CheckBox();
      } else if (type === "radio") {
        this.nativeView = this.native = new $.System.Windows.Controls.RadioButton();
      } else {
        this.nativeView = this.native = new $.System.Windows.Controls.Button();
      }

      if(parent !== null) {
        parent.Children.Add(this.nativeView);
      }

      this.private.remapNaturalStates();
      this.private.remapStates(oldNative);
    }
  });

  utilities.def(Button.prototype, 'default',
    function() { return this.nativeView.IsDefault; },
    function(e) {
      this.nativeView.IsDefault = e ? true : false;
    }    
  );

  Object.defineProperty(Button.prototype, 'style', {
    get:function() { return this.private.states.style; },
    set:function(type) {
      this.private.states.style = type;
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

  //TODO: IMPLEMENT ME
  Object.defineProperty(Button.prototype, 'showBorderOnHover', {
    get:function() { return this.private.states.showBorderOnHover; },
    set:function(e) { 
      this.private.statesshowBorderOnHover = e ? true : false;
    }
  });

  Object.defineProperty(Button.prototype, 'enabled', {
    get:function() { return this.IsEnabled ? true : false; },
    set:function(e) {
      this.private.states.enabled = e;
      this.native.IsEnabled = e ? true : false; 
    }
  });

  Object.defineProperty(Button.prototype, 'image', {
    get:function() { return this.private.states.image; },
    set:function(e) { 
      this.private.states.image = e;
      if(this.private.img !== null) {
        this.private.stack.Children.Remove(this.private.img);
      }
      if(e) {
        this.private.img = utilities.makeImage(e);
      }

      var ratio = this.private.img.Source.Width / this.private.img.Source.Height;
      var height = this.private.user.height ? 
                    this.private.user.height : 
                    ( ( this.private.user.bottom && this.private.user.top ) ? 
                      ( this.private.user.top - this.private.user.bottom ) : 
                      16 );
      height = height || 16;
      if(this.private.ignorePadding) {
        height = height - 7.5; // Used by toolbaritem.
      }
      this.private.img.Height = height;
      this.private.img.Width = ratio*height;
      this.private.stack.Children.Insert(0, this.private.img);
    }
  });

  global.__TINT.Button = Button;
  return Button;

})();
