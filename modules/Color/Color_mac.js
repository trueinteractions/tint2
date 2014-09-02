module.exports = (function() {
  $ = process.bridge.objc;
  function Color(type, c1, c2, c3, c4, c5) {
    if(type instanceof Color) return type;
    if(type.type == '@') this.native = type;
    else if(type == "black") this.native = $.NSColor('blackColor');
    else if(type == "black") this.native = $.NSColor('blueColor');
    else if(type == "brown") this.native = $.NSColor('brownColor');
    else if(type == "clear") this.native = $.NSColor('clearColor');
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
    else if(type == "catalog") this.native = $.NSColor('colorWithCatalogName', $(c1), 'colorName', $(c2));
    else if(type == "cmyk" || type == "cmyka") this.native = $.NSColor('colorWithDeviceCyan', c1, 'magenta', c2 ,'yellow', c3, 'black', c4, 'alpha', c5 ? c5 : 1);
    else if(type == "hsb" || type == "hsba") this.native = $.NSColor('colorWithCalibratedHue', c1, 'saturation', c2, 'brightness', c3, 'alpha', c4 ? c4 : 1);
    else if(type == "rgb" || type == "rgba") this.native = $.NSColor('colorWithCalibratedRed', c1, 'green', c2, 'blue', c3, 'alpha', c4 ? c4 : 1);
    else if(type == "image") this.native = $.NSColor('colorWithPatternImage', c1);
  }
  Object.defineProperty(Color.prototype, 'colorspace', { get:function() { 
    var name = this.native('colorSpaceName').toString();
    if(name.indexOf('RGB') > -1) return "rgb";
    else if (name.indexOf('CMYK') > -1) return "cmyk";
    else if (name.indexOf('Pattern') > -1) return "image";
    else if (name.indexOf('Named') > -1) return "named";
    else return "custom";
  } });
  Object.defineProperty(Color.prototype, 'components', { get:function() { return this.native('numberOfComponents'); }});
  Object.defineProperty(Color.prototype, 'cyan', { get:function() { return this.native('cyanComponent'); }});
  Object.defineProperty(Color.prototype, 'magenta', { get:function() { return this.native('magentaComponent'); }});
  Object.defineProperty(Color.prototype, 'yellow', { get:function() { return this.native('yellowComponent'); }});
  Object.defineProperty(Color.prototype, 'black', { get:function() { return this.native('blackComponent'); }});
  Object.defineProperty(Color.prototype, 'white', { get:function() { return this.native('whiteComponent'); }});
  Object.defineProperty(Color.prototype, 'red', { get:function() { return this.native('redComponent'); }});
  Object.defineProperty(Color.prototype, 'blue', { get:function() { return this.native('blueComponent'); }});
  Object.defineProperty(Color.prototype, 'green', { get:function() { return this.native('greenComponent'); }});
  Object.defineProperty(Color.prototype, 'alpha', { get:function() { return this.native('alphaComponent'); }});
  Object.defineProperty(Color.prototype, 'hue', { get:function() { return this.native('hueComponent'); }});
  Object.defineProperty(Color.prototype, 'saturation', { get:function() { return this.native('saturationComponent'); }});
  Object.defineProperty(Color.prototype, 'brightness', { get:function() { return this.native('brightnessComponent'); }});
  Object.defineProperty(Color.prototype, 'image', {get:function() { return this.native('pattenrImage'); }});

  return Color;
})();