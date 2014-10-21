module.exports = (function() {
  var $ = process.bridge.dotnet;
  var utilities = require('Utilities');
  var $color = $.System.Windows.Media.Color;
  var $colors = $.System.Windows.Media.Colors;

  function Color(type, c1, c2, c3, c4, c5) {
    if(type instanceof Color) this.native = type.native;
    else if(type.pointer) this.native = type;
    else if(type == "black") this.native = $colors.Black;
    else if(type == "blue") this.native = $colors.Blue;
    else if(type == "brown") this.native = $colors.Brown;
    else if(type == "clear") this.native = $colors.Transparent;
    else if(type == "transparent") this.native = $colors.Transparent;
    else if(type == "cyan") this.native = $colors.Cyan;
    else if(type == "darkgray") this.native = $colors.DarkGray;
    else if(type == "gray") this.native = $colors.Gray;
    else if(type == "green") this.native = $colors.Green;
    else if(type == "lightgray") this.native = $colors.LightGray;
    else if(type == "magenta") this.native = $colors.Magenta;
    else if(type == "orange") this.native = $colors.Orange;
    else if(type == "purple") this.native = $colors.Purple;
    else if(type == "red") this.native = $colors.Red;
    else if(type == "white") this.native = $colors.White;
    else if(type == "yellow") this.native = $colors.Yellow;
    else if(type == "cmyk" || type == "cmyka") {
      var rgb = utilities.cmyk2rgb([c1,c2,c3,c4]);
      this.native = $color.FromArgb($.System.Convert.ToByte(c4 ? c4*255 : 255), $.System.Convert.ToByte(rgb[0]),$.System.Convert.ToByte(rgb[1]),$.System.Convert.ToByte(rgb[2]));
    }
    else if(type == "hsb" || type == "hsba") {
      var rgb = utilities.hsl2rgb([c1,c2,c3]);
      this.native = $color.FromArgb($.System.Convert.ToByte(c4 ? c4*255 : 255), $.System.Convert.ToByte(rgb[0]),$.System.Convert.ToByte(rgb[1]),$.System.Convert.ToByte(rgb[2]));
    }
    else if(type == "rgb" || type == "rgba") {
      this.native = $color.FromArgb($.System.Convert.ToByte(c4 ? c4*255 : 255), $.System.Convert.ToByte(c1),$.System.Convert.ToByte(c2),$.System.Convert.ToByte(c3));
    } else {
      var rgba = utilities.parseColor(type);
      this.native = $color.FromArgb($.System.Convert.ToByte(Math.round(rgba.a*255)),$.System.Convert.ToByte(Math.round(rgba.r)),$.System.Convert.ToByte(Math.round(rgba.g)),$.System.Convert.ToByte(Math.round(rgba.b)));
    }
  }
  Object.defineProperty(Color.prototype, 'colorspace', { get:function() { 
    return "rgb";
  }});
  Object.defineProperty(Color.prototype, 'components', { get:function() { return 4; }});
  Object.defineProperty(Color.prototype, 'cyan', { get:function() { var cmyk = utilities.rgb2cmyk([this.native.R,this.native.G,this.native.B]); return cmyk[0]; }});
  Object.defineProperty(Color.prototype, 'magenta', { get:function() { var cmyk = utilities.rgb2cmyk([this.native.R,this.native.G,this.native.B]); return cmyk[1]; }});
  Object.defineProperty(Color.prototype, 'yellow', { get:function() { var cmyk = utilities.rgb2cmyk([this.native.R,this.native.G,this.native.B]); return cmyk[2]; }});
  Object.defineProperty(Color.prototype, 'black', { get:function() { var cmyk = utilities.rgb2cmyk([this.native.R,this.native.G,this.native.B]); return cmyk[3]; }});
  Object.defineProperty(Color.prototype, 'red', { get:function() { return this.native.R; }});
  Object.defineProperty(Color.prototype, 'blue', { get:function() { return this.native.B; }});
  Object.defineProperty(Color.prototype, 'green', { get:function() { return this.native.G; }});
  Object.defineProperty(Color.prototype, 'alpha', { get:function() { return this.native.A; }});
  Object.defineProperty(Color.prototype, 'hue', { get:function() { var hsb = utilities.rgb2hsl([this.native.R,this.native.G,this.native.B]); return hsb[0]; }});
  Object.defineProperty(Color.prototype, 'saturation', { get:function() { var hsb = utilities.rgb2hsl([this.native.R,this.native.G,this.native.B]); return hsb[1]; }});
  Object.defineProperty(Color.prototype, 'brightness', { get:function() { var hsb = utilities.rgb2hsl([this.native.R,this.native.G,this.native.B]); return hsb[2]; }});

  return Color;
})();

//System.Drawing::SystemColors

