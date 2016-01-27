module.exports = (function() {
  if(global.__TINT.ImageWell) {
    return global.__TINT.ImageWell;
  }

  var Container = require('Container');
  var util = require('Utilities');
  var $ = process.bridge.dotnet;

  function ImageWell(properties, options, inherited) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.Image;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.Image;
    Container.call(this, properties, options, inherited || true);
    this.scale = "constrain";
    this.readonly = false;
    util.setProperties(this, properties, inherited);
  }

  ImageWell.prototype = Object.create(Container.prototype);
  ImageWell.prototype.constructor = ImageWell;

  Object.defineProperty(ImageWell.prototype, 'readonly', {
    get:function() { return this.nativeView.AllowDrop === true ? false : true; },
    set:function(e) { this.nativeView.AllowDrop = e ? false : true; }
  });

  util.makePropertyImageType(ImageWell.prototype, 'image', 'Source');
  util.makePropertyMapType(ImageWell.prototype, 'scale', 'Stretch', {
    'contain':$.System.Windows.Media.Stretch.UniformToFill,
    'fit':$.System.Windows.Media.Stretch.Fill,
    'constrain':$.System.Windows.Media.Stretch.Uniform,
    'none':$.System.Windows.Media.Stretch.None
  });

  global.__TINT.ImageWell = ImageWell;
  return ImageWell;
})();
