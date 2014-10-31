module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function Slider(options) {
    options = options || {};
    options.initViewOnly = true;
    Container.call(this, $.System.Windows.Controls.Slider, $.System.Windows.Controls.Slider, options);
    this.native.Minimum = 0;
    this.native.Maximum = 1;
    this.native.Value = 0;
    this.native.SmallChange = 0.05;
    this.native.LargeChange = 0.10;
    this.native.IsMoveToPointEnabled = true;
  }

  Slider.prototype = Object.create(Container.prototype);
  Slider.prototype.constructor = Slider;

  Object.defineProperty(Slider.prototype, 'value', {
    get:function() { return this.native.Value; },
    set:function(e) {
      if (e > 1) e = 1;
      else if (e < 0) e = 0;
      this.native.Value = e; 
    }
  });

  return Slider;

})();
