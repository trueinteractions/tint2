module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.dotnet;
  var utilities = require('Utilities');

  function ImageWell(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    this.animates = false;
    this.alignment = "center";

    if(NativeObjectClass)
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.initViewOnly = true;
      Container.call(this, $.System.Windows.Controls.Image, $.System.Windows.Controls.Image, options);
    }
    this.scale = "constrain";
  }

  ImageWell.prototype = Object.create(Container.prototype);
  ImageWell.prototype.constructor = ImageWell;

  Object.defineProperty(ImageWell.prototype, 'image', {
    get:function() { return this.private.currentImage; },
    set:function(e) {
      this.private.currentImage = e;
      var img = utilities.makeImage(e);
      if(!img) console.log('Error, image was invalud: ', e);
      this.nativeView.Source = img.Source;
    }
  });
/*
  TODO: Support on Windows 
  Object.defineProperty(ImageWell.prototype, 'alignment', {
    get:function() { 
      var align = this.nativeView('imageAlignment');
      if(align == $.NSImageAlignCenter) return "center";
      else if (align == $.NSImageAlignTop) return "top";
      else if (align == $.NSImageAlignTopLeft) return "top-left";
      else if (align == $.NSImageAlignTopRight) return "top-right";
      else if (align == $.NSImageAlignLeft) return "left";
      else if (align == $.NSImageAlignBottom) return "bottom";
      else if (align == $.NSImageAlignBottomLeft) return "bottom-left";
      else if (align == $.NSImageAlignBottomRight) return "bottom-right";
      else return "right";
    },
    set:function(e) {
      if(e == "center") this.nativeView('setImageAlignment', $.NSImageAlignCenter);
      else if(e == "top") this.nativeView('setImageAlignment', $.NSImageAlignTop);
      else if(e == "top-left") this.nativeView('setImageAlignment', $.NSImageAlignTopLeft);
      else if(e == "top-right") this.nativeView('setImageAlignment', $.NSImageAlignTopRight);
      else if(e == "left") this.nativeView('setImageAlignment', $.NSImageAlignLeft);
      else if(e == "bottom") this.nativeView('setImageAlignment', $.NSImageAlignBottom);
      else if(e == "bottom-left") this.nativeView('setImageAlignment', $.NSImageAlignBottomLeft);
      else if(e == "bottom-right") this.nativeView('setImageAlignment', $.NSImageAlignBottomRight);
      else if(e == "right") this.nativeView('setImageAlignment', $.NSImageAlignRight);
    }
  });*/

  Object.defineProperty(ImageWell.prototype, 'scale', {
    get:function() { return this.private.scaling; },
    set:function(e) {
      this.private.scaling = e;
      if(e == "constrain") this.nativeView.Stretch = $.System.Windows.Media.UniformToFill;
      else if(e == "fit") this.nativeView.Stretch = $.System.Windows.Media.Fill;
      else if(e == "contain") this.nativeView.Stretch = $.System.Windows.Media.Uniform;
      else if(e == "none") this.nativeView.Stretch = $.System.Windows.Media.None;
    }
  });
  
  return ImageWell;
})();

