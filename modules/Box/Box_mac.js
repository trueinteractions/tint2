module.exports = (function() {
  var Container = require('Container');
  if(!Color) var Color = require('Color');
  var $ = process.bridge.objc;

  /**
   * @class Box
   * @description Creates a generic control that conatins other controls thats stylized. 
   *              The box control can group elements, set background colors, borders, radius, etc.
   *              This control is useful if a group of elements needs a styled wrapper around it.
   *              The default style is determined by the OS, setting any property resets all the
   *              properties from the default OS style to a custom style (e.g., the border radius
   *              resets to 0, background color sets to transparent, border width to 0, border
   *              color to transparent).
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
    this.nativeView('setBorderType', $.NSLineBorder);
    this.nativeView('setTitle', $(""));
  }

  Box.prototype = Object.create(Container.prototype);
  Box.prototype.constructor = Box;

  /**
   * @member borderColor
   * @type {Color}
   * @memberof Box
   * @description Gets or sets the color of the border, this should be a CSS-style
   *              color attribute, such as rgba(0-255,0-255,0-255,0-1) or named color
   *              such as "red" or a Color object.
   * @example
   * require('Common'); // include common controls and application context.
   * var win = new Window();
   * win.visible = true;
   * var box = new Box();
   * box.borderWidth = 2;
   * box.borderColor = 'red';  // Make the border red, this can also be a rgba() color.
   * box.backgroundColor = 'rgba(0,255,0,1)';
   * box.borderRadius = 13;
   * win.appendChild(box);
   * box.left = box.right = box.top = box.bottom = 50;
   * @see Color
   */
  Object.defineProperty(Box.prototype, 'borderColor', {
    get:function() { return new Color(this.nativeView('borderColor')); },
    set:function(e) {
      this.nativeView('setBoxType', $.NSBoxCustom);
      this.nativeView('setBorderColor', (new Color(e)).native); 
    }
  });

  /**
   * @member borderWidth
   * @type {number}
   * @memberof Box
   * @description Gets or sets the width of the border in logical pixels
   * @default 0
   * @example
   * require('Common'); // include common controls and application context.
   * var win = new Window();
   * win.visible = true;
   * var box = new Box();
   * box.borderWidth = 5; // 5 Logical pixels wide.
   * box.borderColor = 'rgba(0,0,0,0.8)'; // 80% opacity, black border color.
   * @see Color
   */
  Object.defineProperty(Box.prototype, 'borderWidth', {
    get:function() { return this.nativeView('borderWidth'); },
    set:function(e) { 
      this.nativeView('setBoxType', $.NSBoxCustom);
      this.nativeView('setBorderWidth',e);
    }
  });

  /**
   * @member borderRadius
   * @type {string}
   * @memberof Box
   * @description Gets or sets the radius of the corners of the border.
   * @default 0
   * @example
   * require('Common'); // include common controls and application context.
   * var win = new Window();
   * win.visible = true;
   * var box = new Box();
   * box.borderWidth = 1; 
   * box.borderColor = 'blue';
   * box.borderRadius = 10; // the curve on all corners is set to 10
   *                        // pixel radius.
   * @see Color
   */
  Object.defineProperty(Box.prototype, 'borderRadius', {
    get:function() { return this.nativeView('cornerRadius'); },
    set:function(e) {    
      this.nativeView('setBoxType', $.NSBoxCustom);
      this.nativeView('setCornerRadius',e); 
    }
  });

  /**
   * @member backgroundColor
   * @type {Color}
   * @memberof Box
   * @description Gets or sets the background color of the box. This should be a CSS-style
   *              color attribute, such as rgba(0-255,0-255,0-255,0-1) or named color
   *              such as "red" or a Color object.
   * @see Color
   * @example
   * require('Common'); // include common controls and application context.
   * var win = new Window();
   * win.visible = true;
   * var box = new Box();
   * box.backgroundColor = 'blue';
   */
  Object.defineProperty(Box.prototype, 'backgroundColor', {
    get:function() { return new Color(this.nativeView('fillColor')); },
    set:function(e) {
      this.nativeView('setBoxType', $.NSBoxCustom);
      this.nativeView('setFillColor',(new Color(e)).native);
    }
  });

  return Box;
})();
