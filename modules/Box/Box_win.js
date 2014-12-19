module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function Box(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass)
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.initViewOnly = true;
      Container.call(this, $.System.Windows.Controls.Border, $.System.Windows.Controls.Border, options);
    }
    this.native.CornerRadius = new $.System.Windows.CornerRadius(5);
    var targetColor = $.System.Windows.SystemColors.ControlLightBrush.Clone();
    targetColor.Opacity = 0.4;
    this.native.Background = targetColor;
    this.native.Padding = new $.System.Windows.Thickness(0);
    this.native.Margin = new $.System.Windows.Thickness(0);
    this.native.Child = new $.AutoLayout.AutoLayoutPanel();
    this.native.InternalChildren = this.native.Child.InternalChildren;
  }

  Box.prototype = Object.create(Container.prototype);
  Box.prototype.constructor = Box;

  Object.defineProperty(Box.prototype, 'titlePosition', {
  	get: function() { return "top"; }
  });

  Object.defineProperty(Box.prototype, 'borderType', {
    get:function() { 
      var type = this.nativeView.BorderThickness;
      if(type.Top == 0) return "none";
      else return "line";
    },
    set:function(e) {
      if(e == "none") this.nativeView.BorderThickness = new $.System.Windows.Thickness(0);
      else if (e == "line") this.nativeView.BorderThickness = new $.System.Windows.Thickness(1);
    }
  });

  Object.defineProperty(Box.prototype, 'borderColor', {
    get:function() { return new Color(this.nativeView.BorderBrush.Color); },
    set:function(e) { this.nativeView.BorderBrush = new $.System.Windows.Media.SolidColorBrush((new Color(e)).native); }
  });

  Object.defineProperty(Box.prototype, 'borderWidth', {
    get:function() { return this.nativeView.BorderThickness.Top; },
    set:function(e) { this.nativeView.BorderThickness = new $.System.Windows.Thickness(e); }
  });

  Object.defineProperty(Box.prototype, 'borderRadius', {
    get:function() { return this.nativeView.CornerRadius.TopLeft; },
    set:function(e) {
      if(typeof(e) != 'number') e = 0;
      this.nativeView.CornerRadius = new $.System.Windows.CornerRadius(e); 
    }
  });

  Object.defineProperty(Box.prototype, 'backgroundColor', {
    get:function() { return new Color(this.nativeView.Background.Color); },
    set:function(e) { this.nativeView.Background = new $.System.Windows.Media.SolidColorBrush((new Color(e)).native); }
  });

  return Box;
})();
