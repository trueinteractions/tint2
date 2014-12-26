module.exports = (function() {
  var Container = require('Container');
  var Color = require('Color');
  var $ = process.bridge.dotnet;

  function ColorWell(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass) {
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    }
    else {
      options.initViewOnly = true;
      Container.call(this, $.System.Windows.Controls.Border, $.System.Windows.Controls.Border, options);
      this.native.Width = 30;
      this.native.Height = 20;
    }
  }

  ColorWell.prototype = Object.create(Container.prototype);
  ColorWell.prototype.constructor = ColorWell;

  Object.defineProperty(ColorWell.prototype, 'color', {
    get:function() { return new Color(this.nativeView.Background.Color); },
    set:function(e) { this.nativeView.Background = new $.System.Windows.Media.SolidColorBrush((new Color(e)).native); }
  });

  return ColorWell;
})();