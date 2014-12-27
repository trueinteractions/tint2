module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  /**
   * @class ImageWell
   * @description The image well class creates a way to display photos, icons or other imagery.
   * @extends Container
   */
  /**
   * @new 
   * @memberof ImageWell
   * @description Creates a new imagewell object.
   */
  function ImageWell(options) {
    options = options || {};
    options.delegates = options.delegates || [];
    this.nativeClass = this.nativeClass || $.NSImageView;
    this.nativeViewClass = this.nativeViewClass || $.NSImageView;
    Container.call(this, options);
    this.native('setImageAlignment',$.NSImageAlignCenter);
    this.animates = false;
    this.alignment = "center";
  }

  ImageWell.prototype = Object.create(Container.prototype);
  ImageWell.prototype.constructor = ImageWell;

  /**
   * @member image
   * @type {string}
   * @memberof ImageWell
   * @description Gets or sets the image to use, this can be any URL including the app:// schema,
   *              or a named system image.
   */
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
  /*
  TODO: Support this on Windows
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
  }); */

  /**
   * @member scale
   * @type {string}
   * @memberof ImageWell
   * @description Gets or sets the scaling of the image, this can be "constrain", "fit", "contain" or "none"
   * @default "constrain"
   */
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
  /*
  TODO: Support this on Windows
  Object.defineProperty(ImageWell.prototype, 'animates', {
    get:function() { return this.nativeView('animates') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setAnimates', e ? $.YES : $.NO); }
  });*/

  return ImageWell;
})();

