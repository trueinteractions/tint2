module.exports = (function() {
  if(global.__TINT.Scroll) {
    return global.__TINT.Scroll;
  }
  var Container = require('Container');
  var Color = require('Color');
  var util = require('Utilities');
  var $ = process.bridge.dotnet;

  function Scroll(properties, options, inherited) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.ScrollViewer;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.ScrollViewer;
    Container.call(this, properties, options, inherited || true);

    this.native.HorizontalContentAlignment = $.System.Windows.HorizontalAlignment.Left;
    this.native.VerticalAlignment = $.System.Windows.HorizontalAlignment.Top;
    this.private.border = null;
    this.appendChild = null;
    this.removeChild = null;
    this.private.background = null;
    util.setProperties(this, properties, inherited);
  }

  Scroll.prototype = Object.create(Container.prototype);
  Scroll.prototype.constructor = Scroll;

  Scroll.prototype.setChild = function(control) {
    control.private.parent = this;
    this.native.Content = control.native; 
  }

  Object.defineProperty(Scroll.prototype, 'border', {
    get:function() { return this.private.border; },
    set:function(e) {
      this.private.border = e;
      this.nativeView.BorderThickness = new $.System.Windows.Thickness( e ? 1 : 0 );
    }
  });

  util.makePropertyBoolType(Scroll.prototype, 'vertical', 'VerticalScrollBarVisibility', 
    $.System.Windows.Controls.ScrollBarVisibility.Auto,
    $.System.Windows.Controls.ScrollBarVisibility.Hidden);


  util.makePropertyBoolType(Scroll.prototype, 'vertical', 'HorizontalScrollBarVisibility', 
    $.System.Windows.Controls.ScrollBarVisibility.Auto,
    $.System.Windows.Controls.ScrollBarVisibility.Hidden);

  util.makePropertyNumberType(Scroll.prototype, 'speed', 'PanningDeceleration');

  Object.defineProperty(Scroll.prototype, 'backgroundColor', {
    get:function() { return this.private.background; },
    set:function(e) {
      this.private.background = e;
      this.private.backgroundObj = new Color(e);
      this.nativeView.Background = new $.System.Windows.Media.SolidColorBrush(this.private.backgroundObj.native);
    }
  });

  global.__TINT.Scroll = Scroll;
  return Scroll;

})();
