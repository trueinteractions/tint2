module.exports = (function() {
  var Container = require('Container');
  var Color = require('Color');
  var $ = process.bridge.objc;

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

  Object.defineProperty(ColorWell.prototype, 'color', {
    get:function() { return new Color(this.nativeView('color')); },
    set:function(e) { this.nativeView('setColor',e.native); }
  });

  return ColorWell;
})();