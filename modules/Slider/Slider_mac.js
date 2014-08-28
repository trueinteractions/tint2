module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.objc;

  function Slider(options) {
    Container.call(this, $.NSSlider, $.NSSlider, {});
    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setMinValue', 0);
    this.native('setMaxValue', 1);
    this.native('setDoubleValue', 0);

    Object.defineProperty(this, 'value', {
      get:function() { return this.native('doubleValue'); },
      set:function(e) { this.native('setDoubleValue', e); }
    });
  }
  Slider.prototype = Object.create(Container.prototype);
  Slider.prototype.constructor = Slider;

  return Slider;
})();