module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.objc;

  function Slider(options) {
    Container.call(this, $.NSSlider, $.NSSlider, {});
    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setMinValue', 0);
    this.native('setMaxValue', 1);
    this.native('setDoubleValue', 0);
  }

  Slider.prototype = Object.create(Container.prototype);
  Slider.prototype.constructor = Slider;

  Object.defineProperty(Slider.prototype, 'value', {
    get:function() { return this.native('doubleValue'); },
    set:function(e) { 
      if (e > 1) e = 1;
      else if (e < 0) e = 0;
      this.native('setDoubleValue', e); 
    }
  });

  return Slider;

})();
