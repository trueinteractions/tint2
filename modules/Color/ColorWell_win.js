module.exports = (function() {
  var Container = require('Container');
  var Color = require('Color');
  var $ = process.bridge.dotnet;
  var util = require('Utilities');

  function ColorWell(properties, options, inherited) {
    options = options || {};
    options.initViewOnly = true;
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.Border;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.Border;
    Container.call(this, properties, options, inherited || true);
    this.native.Width = 30;
    this.native.Height = 20;
    util.setProperties(this, properties, inherited);
  }

  ColorWell.prototype = Object.create(Container.prototype);
  ColorWell.prototype.constructor = ColorWell;

  Object.defineProperty(ColorWell.prototype, 'color', {
    get:function() { return new Color(this.nativeView.Background.Color); },
    set:function(e) { this.nativeView.Background = new $.System.Windows.Media.SolidColorBrush((new Color(e)).native); }
  });

  return ColorWell;
})();