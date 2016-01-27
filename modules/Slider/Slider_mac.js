module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.objc;
  var util = require('Utilities');

  /**
   * @class Slider
   * @description The slider control can be used to give the user an optional range to select.
   *              This has the visual appearance of a "scrubber". Changes to the value can be
   *              tracked with the 'click' event.
   * @extends Control
   */
  /**
   * @new 
   * @memberof Slider
   * @description Creates a new slider control.
   */
  function Slider(properties, options, inherited) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.NSSlider;
    this.nativeViewClass = this.nativeViewClass || $.NSSlider;
    Container.call(this, properties, options, inherited || true);
    this.native('setMinValue', 0);
    this.native('setMaxValue', 1);
    this.native('setDoubleValue', 0);
    util.setProperties(this, properties, inherited);
  }

  Slider.prototype = Object.create(Container.prototype);
  Slider.prototype.constructor = Slider;

  /**
   * @member value
   * @type {number}
   * @memberof Slider
   * @description Gets or sets the value of the slider. The value is in a range from 0 to 1.
   * @default 0
   */
  Object.defineProperty(Slider.prototype, 'value', {
    get:function() { return this.native('doubleValue'); },
    set:function(e) { 
      if (e > 1) {
        e = 1;
      } else if (e < 0) {
        e = 0;
      }
      this.native('setDoubleValue', e); 
    }
  });

  return Slider;

})();
