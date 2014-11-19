module.exports = (function() {
  var Container = require('Container');
  var Color = require('Color');
  var $ = process.bridge.objc;

  /**
   * @class ColorWell
   * @description Creates a simple color selector "well" or "view" to show the
   *              current color. This control is useful when an application needs
   *              to represent a current selected color.
   * @extends Container
   */
  function ColorWell(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.delegates = options.delegates || [];

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSColorWell, $.NSColorWell, options);

    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
  }

  ColorWell.prototype = Object.create(Container.prototype);
  ColorWell.prototype.constructor = ColorWell;

  /**
   * @member color
   * @type {Color}
   * @memberof ColorWell
   * @description Gets or sets the color represented by the ColorWell.
   * @see Color
   */
  Object.defineProperty(ColorWell.prototype, 'color', {
    get:function() { return new Color(this.nativeView('color')); },
    set:function(e) { this.nativeView('setColor',(new Color(e)).native); }
  });

  return ColorWell;
})();