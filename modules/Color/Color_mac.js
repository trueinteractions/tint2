module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');

  /**
   * @class Color
   * @description Creates a new color, this is mainly a convenience class used to convert back to RGBA, most
   *              color properties in Tint accept css-type values such as "rgba(red,blue,green,alpha)" or 
   *              named colors such as "red" or "blue".
   * @see ColorPanel
   * @see ColorWell
   */
  /**
   * @new
   * @memberof Color
   * @description Creates a color object with the specified type and components.
   * @params {string} type A string represent the type of the color, either "cmyk", "hsb", or "rgb" or a named color such as "red"
   * @params {value} componentA The first component, optional depend on the specified type.
   * @params {value} componentB The second component, optional depend on the specified type.
   * @params {value} componentC The third component, optional depend on the specified type.
   * @params {value} componentD The forth component, optional depend on the specified type.
   * @params {value} componentE The fifth component, optional depend on the specified type.
   */
  function Color(type, c1, c2, c3, c4, c5) {

    if(type == "cmyk" || type == "cmyka" || type == "hsb" || 
        type == "hsv" || type == "hsva" ||
        type == "hsba" || type == "rgb" || type == "rgba")
    {
      if(c1 > 1) c1 = c1 / 255;
      if(c2 > 1) c2 = c2 / 255;
      if(c3 > 1) c3 = c3 / 255;
      if(c4 && c4 > 1) c4 = c4 / 255;
      if(c5 && c5 > 1) c5 = c5 / 255;
    }
    //TODO: Maybe just move this over to our parser?
    if(type instanceof Color) this.native = type.native;
    else if(type.type == '@') this.native = type;
    else if(type == "black") this.native = $.NSColor('blackColor');
    else if(type == "blue") this.native = $.NSColor('blueColor');
    else if(type == "brown") this.native = $.NSColor('brownColor');
    else if(type == "clear") this.native = $.NSColor('clearColor');
    else if(type == "transparent") this.native = $.NSColor('clearColor');
    else if(type == "cyan") this.native = $.NSColor('cyanColor');
    else if(type == "darkgray") this.native = $.NSColor('darkGrayColor');
    else if(type == "gray") this.native = $.NSColor('grayColor');
    else if(type == "green") this.native = $.NSColor('greenColor');
    else if(type == "lightgray") this.native = $.NSColor('lightGrayColor');
    else if(type == "magenta") this.native = $.NSColor('magentaColor');
    else if(type == "orange") this.native = $.NSColor('orangeColor');
    else if(type == "purple") this.native = $.NSColor('purpleColor');
    else if(type == "red") this.native = $.NSColor('redColor');
    else if(type == "white") this.native = $.NSColor('whiteColor');
    else if(type == "yellow") this.native = $.NSColor('yellowColor');
    else if(type == "cmyk" || type == "cmyka") this.native = $.NSColor('colorWithDeviceCyan', c1, 'magenta', c2 ,'yellow', c3, 'black', c4, 'alpha', c5 ? c5 : 1);
    else if(type == "hsb" || type == "hsba" || type == "hsv" || type == "hsva") this.native = $.NSColor('colorWithCalibratedHue', c1, 'saturation', c2, 'brightness', c3, 'alpha', c4 ? c4 : 1);
    else if(type == "rgb" || type == "rgba") this.native = $.NSColor('colorWithRed', c1, 'green', c2, 'blue', c3, 'alpha', c4 ? c4 : 1);
    //else if(type == "image") this.native = $.NSColor('colorWithPatternImage', c1);
    else {
      var rgba = utilities.parseColor(type);
      if(rgba.r > 1) rgba.r = rgba.r / 255;
      if(rgba.g > 1) rgba.g = rgba.g / 255;
      if(rgba.b > 1) rgba.b = rgba.b / 255;
      if(rgba.a > 1) rgba.a = rgba.a / 255;
      this.native = $.NSColor('colorWithRed',rgba.r,'green',rgba.g,'blue',rgba.b,'alpha',rgba.a);
    }
  }
  Object.defineProperty(Color.prototype, 'colorspace', { get:function() { return "rgb"; }});
  Object.defineProperty(Color.prototype, 'components', { get:function() { return 4; }});
  Object.defineProperty(Color.prototype, 'cyan', { get:function() { return this.native('cyanComponent'); }});
  Object.defineProperty(Color.prototype, 'magenta', { get:function() { return this.native('magentaComponent'); }});
  Object.defineProperty(Color.prototype, 'yellow', { get:function() { return this.native('yellowComponent'); }});
  Object.defineProperty(Color.prototype, 'black', { get:function() { return this.native('blackComponent'); }});
  //Object.defineProperty(Color.prototype, 'white', { get:function() { return this.native('whiteComponent'); }});

  /**
   * @member red
   * @type {number}
   * @memberof Color
   * @description Gets the amount of red in the color.
   */
  Object.defineProperty(Color.prototype, 'red', { get:function() { return this.native('redComponent'); }});
  /**
   * @member blue
   * @type {number}
   * @memberof Color
   * @description Gets the amount of blue in the color.
   */
  Object.defineProperty(Color.prototype, 'blue', { get:function() { return this.native('blueComponent'); }});
  /**
   * @member green
   * @type {number}
   * @memberof Color
   * @description Gets the amount of green in the color.
   */
  Object.defineProperty(Color.prototype, 'green', { get:function() { return this.native('greenComponent'); }});
  /**
   * @member alpha
   * @type {number}
   * @memberof Color
   * @description Gets the amount of translucency in the color.
   */
  Object.defineProperty(Color.prototype, 'alpha', { get:function() { return this.native('alphaComponent'); }});
  Object.defineProperty(Color.prototype, 'hue', { get:function() { return this.native('hueComponent'); }});
  Object.defineProperty(Color.prototype, 'saturation', { get:function() { return this.native('saturationComponent'); }});
  Object.defineProperty(Color.prototype, 'brightness', { get:function() { return this.native('brightnessComponent'); }});
  //Object.defineProperty(Color.prototype, 'image', {get:function() { return this.native('patternImage'); }});

  return Color;
})();

//System.Drawing::SystemColors
//https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ApplicationKit/Classes/NSColor_Class/Reference/Reference.html#//apple_ref/occ/clm/NSColor/controlBackgroundColor
