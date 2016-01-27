module.exports = (function() {
  if(global.__TINT.Slider) {
    return global.__TINT.Slider;
  }
  var Container = require('Container');
  var $ = process.bridge.dotnet;
  var util = require('Utilities');

  function Slider(properties, options, inherited) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.Slider;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.Slider;
    Container.call(this, properties, options, inherited || true);

    this.native.Minimum = 0;
    this.native.Maximum = 1;
    this.native.Value = 0;
    this.native.SmallChange = 0.05;
    this.native.LargeChange = 0.10;
    this.native.IsMoveToPointEnabled = true;

    util.setProperties(this, properties, inherited);
  }

  Slider.prototype = Object.create(Container.prototype);
  Slider.prototype.constructor = Slider;

  Object.defineProperty(Slider.prototype, 'value', {
    get:function() { return this.native.Value; },
    set:function(e) {
      if (e > 1) {
        e = 1;
      } else if (e < 0) {
        e = 0;
      }
      this.native.Value = e; 
    }
  });

  global.__TINT.Slider = Slider;
  return Slider;

})();
