module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.objc;

  /**
   * @class Box
   * @description Creates a generic control that conatins other controls thats stylized. 
   *              The box control can group elements, set background colors, borders, radius, etc.
   * @extends Container
   */
   /**
    * @new
    * @memberof Box
    * @description Creates a new Box generic control.
    */
  function Box(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.delegates = options.delegates || [];

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSBox, $.NSBox, options);

    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setTitlePosition', $.NSAtTop);
  }

  Box.prototype = Object.create(Container.prototype);
  Box.prototype.constructor = Box;

  /**
   * @member title
   * @type {string}
   * @memberof Box
   * @description Gets or sets the title displayed at the top of the box. 
   * @default ""
   */
  Object.defineProperty(Box.prototype, 'title', {
    get:function() { return this.nativeView('title').toString(); },
    set:function(e) { this.nativeView('setTitle', $(e.toString())); }
  });

  // TODO: removed on windows, supported on OSX?
  Object.defineProperty(Box.prototype, 'transparent', {
    get:function() { return this.nativeView('transparent') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setTransparent', e ? $.YES : $.NO ); }
  });

  // TODO: removed on windows, supported on OSX?
  Object.defineProperty(Box.prototype, 'titlePosition', {
    get:function() { 
      var position = this.nativeView('titlePosition');
      if(position == $.NSAboveTop) return "above-top";
      else if (position == $.NSAtTop) return "top";
      else if (position == $.NSBelowTop) return "below-top";
      else if (position == $.NSAboveBottom) return "above-bottom";
      else if (position == $.NSAtBottom) return "bottom";
      else return "below-bottom";
    },
    set:function(e) {
      if(e == "above-top") this.nativeView('setTitlePosition', $.NSAboveTop);
      else if(e == "top") this.nativeView('setTitlePosition', $.NSAtTop);
      else if(e == "below-top") this.nativeView('setTitlePosition', $.NSBelowTop);
      else if(e == "above-bottom") this.nativeView('setTitlePosition', $.NSAboveBottom);
      else if(e == "bottom") this.nativeView('setTitlePosition', $.NSAtBottom);
      else if(e == "below-bottom") this.nativeView('setTitlePosition', $.NSBelowBottom);
    }
  });

  /**
   * @member borderType
   * @type {string}
   * @memberof Box
   * @description Gets or sets the type of border, the values for this can be
   *              "none" or "line". 
   * @default "none"
   */
  Object.defineProperty(Box.prototype, 'borderType', {
    get:function() { 
      var type = this.nativeView('borderType');
      if(type == $.NSNoBorder) return "none";
      else if (type == $.NSLineBorder) return "line";
      else if (type == $.NSBezelBorder) return "bezel";
      else if (type == $.NSGrooveBorder) return "groove";
    },
    set:function(e) {
      if(e == "none") this.nativeView('setBorderType', $.NSNoBorder);
      else if(e == "line") this.nativeView('setBorderType', $.NSLineBorder);
      else if(e == "bezel") this.nativeView('setBorderType', $.NSBezelBorder);
      else if(e == "groove") this.nativeView('setBorderType', $.NSGrooveBorder);
    }
  });

  /**
   * @member borderColor
   * @type {Color}
   * @memberof Box
   * @description Gets or sets the color of the border, this should be a CSS-style
   *              color attribute, such as rgba(0-255,0-255,0-255,0-1) or named color
   *              such as "red" or a Color object.
   * @see Color
   */
  Object.defineProperty(Box.prototype, 'borderColor', {
    get:function() { return new Color(this.nativeView('borderColor')); },
    set:function(e) { this.nativeView('setBorderColor',e.native); }
  });

  /**
   * @member borderWidth
   * @type {number}
   * @memberof Box
   * @description Gets or sets the width of the border in logical pixels
   * @default 0
   */
  Object.defineProperty(Box.prototype, 'borderWidth', {
    get:function() { return this.nativeView('borderWidth'); },
    set:function(e) { this.nativeView('setBorderWidth',e); }
  });

  /**
   * @member borderRadius
   * @type {string}
   * @memberof Box
   * @description Gets or sets the radius of the corners of the border.
   * @default 0
   */
  Object.defineProperty(Box.prototype, 'borderRadius', {
    get:function() { return this.nativeView('cornerRadius'); },
    set:function(e) { this.nativeView('setCornerRadius',e); }
  });

  /**
   * @member backgroundColor
   * @type {Color}
   * @memberof Box
   * @description Gets or sets the background color of the box. This should be a CSS-style
   *              color attribute, such as rgba(0-255,0-255,0-255,0-1) or named color
   *              such as "red" or a Color object.
   * @see Color
   */
  Object.defineProperty(Box.prototype, 'backgroundColor', {
    get:function() { return new Color(this.nativeView('fillColor')); },
    set:function(e) { this.nativeView('setFillColor',e.native); }
  });

  // TODO: Unsupported on Windows, what do we do?
  Object.defineProperty(Box.prototype, 'style', {
    get:function() {
      var type = this.nativeView('boxType');
      if(type == $.NSBoxPrimary) return "primary";
      else if (type == $.NSBoxSecondary) return "secondary";
      else if (type == $.NSBoxSeparator) return "separator";
      else if (type == $.NSBoxOldStyle) return "old";
      else return "custom";
    },
    set:function(e) {
      if(e == "primary") this.nativeView('setBoxType', $.NSBoxPrimary);
      else if(e == "secondary") this.nativeView('setBoxType', $.NSBoxSecondary);
      else if(e == "old") this.nativeView('setBoxType', $.NSBoxOldStyle);
      else if(e == "separator") this.nativeView('setBoxType', $.NSBoxSeparator);
      else if(e == "custom") this.nativeView('setBoxType', $.NSBoxCustom);
    }
  });

  return Box;
})();
