module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.objc;
  var utilities = require('Utilities');

  function ImageWell(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.delegates = options.delegates || [];

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSImageView, $.NSImageView, options);

    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setImageAlignment',$.NSImageAlignCenter);
  }

  ImageWell.prototype = Object.create(Container.prototype);
  ImageWell.prototype.constructor = ImageWell;

  Object.defineProperty(ImageWell.prototype, 'image', {
    get:function() { return this.private.currentImage; },
    set:function(e) {
      this.private.currentImage = e;
      var img = utilities.makeNSImage(e);
      if(!img) console.log('Error, image was invalud: ', e);
      this.nativeView('setImage',img);
      img('release');
    }
  });

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
  });

  Object.defineProperty(ImageWell.prototype, 'scale', {
    get:function() { 
      var scaling = this.nativeView('imageScaling');
      if(scaling == $.NSImageScaleProportionallyDown) return "constrain";
      else if (scaling == $.NSImageScaleAxesIndependently) return "fit";
      else if (scaling == $.NSImageScaleProportionallyUpOrDown) return "contain";
      else return "none";
    },
    set:function(e) {
      if(e == "constrain") this.nativeView('setImageScaling', $.NSImageScaleProportionallyDown);
      else if(e == "fit") this.nativeView('setImageScaling', $.NSImageScaleAxesIndependently);
      else if(e == "contain") this.nativeView('setImageScaling', $.NSImageScaleProportionallyUpOrDown);
      else if(e == "none") this.nativeView('setImageScaling', $.NSImageScaleNone);
    }
  });
  
  Object.defineProperty(ImageWell.prototype, 'animates', {
    get:function() { return this.nativeView('animates') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setAnimates', e ? $.YES : $.NO); }
  });

  return ImageWell;
})();

