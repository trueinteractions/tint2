module.exports = (function() {
  var $ = process.bridge.dotnet;
  var utilities = require('Utilities');
  var $color = $.System.Windows.Media.Color;

  function Color(type, c1, c2, c3, c4, c5) {
    if(type instanceof Color) this = type;
    else if(type.pointer) this.native = type;
    else if(type == "black") this.native = $color.Black;
    else if(type == "blue") this.native = $color.Blue;
    else if(type == "brown") this.native = $color.Brown;
    else if(type == "clear") this.native = $color.Transparent;
    else if(type == "transparent") this.native = $color.Transparent;
    else if(type == "cyan") this.native = $color.Cyan;
    else if(type == "darkgray") this.native = $color.DarkGray;
    else if(type == "gray") this.native = $color.Gray;
    else if(type == "green") this.native = $color.Green;
    else if(type == "lightgray") this.native = $color.LightGray;
    else if(type == "magenta") this.native = $color.Magenta;
    else if(type == "orange") this.native = $color.Orange;
    else if(type == "purple") this.native = $color.Purple;
    else if(type == "red") this.native = $color.Red;
    else if(type == "white") this.native = $color.White;
    else if(type == "yellow") this.native = $color.Yellow;
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
      this.native = $color.FromArgb($.System.Convert.ToByte(rgba.a*255),$.System.Convert.ToByte(rgba.r),$.System.Convert.ToByte(rgba.g),$.System.Convert.ToByte(rgba.b));
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

