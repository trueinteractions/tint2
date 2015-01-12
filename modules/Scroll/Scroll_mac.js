module.exports = (function() {
  var Container = require('Container');
  var Color = require('Color');
  var $ = process.bridge.objc;

  /**
   * @class Scroll
   * @description Creates a Container that allows its child controls to overflow out of its height
   *              and width where the user can scroll left, right, up or down to specific controls.
   * @extends Container
   */
  /**
   * @new 
   * @memberof Scroll
   * @description Creates a new scroll container.
   */
  function Scroll(options) {
    options = options || {};
    options.delegates = options.delegates || [];
    this.nativeClass = this.nativeClass || $.NSScrollView;
    this.nativeViewClass = this.nativeViewClass || $.NSScrollView;
    Container.call(this, options);
    this.native('setFrame', $.NSMakeRect(0,0,500,500));
    this.native('setDrawsBackground',$.NO);
    this.native('setHasVerticalScroller',$.YES);
    this.native('setHasHorizontalScroller',$.YES);
    this.appendChild = null;
    this.removeChild = null;

    this.private.background = null;
  }

  Scroll.prototype = Object.create(Container.prototype);
  Scroll.prototype.constructor = Scroll;

  /**
   * @method setChild
   * @memberof Scroll
   * @param {Control} control The control to set as the child
   * @description Sets the child control that will be scrollable, if multiple children are needed create
   *              a generic Box or Container control to append multiple children.
   */
  Scroll.prototype.setChild = function(control) { 
    this.native('setDocumentView', control.nativeView);
    control.fireEvent('parent-attached', [this]);
    this.fireEvent('child-attached', [control]);
  }

  /**
   * @member border
   * @type {string}
   * @memberof Scroll
   * @description Gets or sets the border type for the scroll window. This can be one of the following values
   *              "none", "line", "normal" or "concave".  The default is "normal".
   * @default "normal"
   */
  Object.defineProperty(Scroll.prototype, 'border', {
    get:function() {
      var s = this.nativeView('borderType');
      if(s === $.NSNoBorder) {
        return "none";
      } else if (s === $.NSLineBorder) {
        return "line";
      } else if (s === $.NSBezelBorder) {
       return "normal";
      } else if (s === $.NSGrooveBorder) {
        return "concave";
      } else {
        return "unknown";
      }
    },
    set:function(e) { 
      if(e === "none") {
        this.nativeView('setBorderType', $.NSNoBorder);
      } else if (e === "line") {
        this.nativeView('setBorderType', $.NSLineBorder);
      } else if (e === "normal") {
        this.nativeView('setBorderType', $.NSBezelBorder);
      } else if (e === "concave") {
        this.nativeView('setBorderType', $.NSGrooveBorder);
      }
    }
  });

  /**
   * @member vertical
   * @type {boolean}
   * @memberof Scroll
   * @description Gets or sets whether the scroll has a vertical scrollbar (and can scroll vertically).
   *              The default is true. Note a scrollbar may not appear if the content does not push outside
   *              the bounds of the scroll view.
   * @default true
   */
  Object.defineProperty(Scroll.prototype, 'vertical', {
    get:function() { return this.native('hasVerticalScroller') === $.YES ? true : false; },
    set:function(e) { this.native('setHasVerticalScroller', e ? $.YES : $.NO); }
  });

  /**
   * @member horizontal
   * @type {boolean}
   * @memberof Scroll
   * @description Gets or sets whether the scroll has a horizontal scrollbar (and can scroll horizontally).
   *              The default is true.
   * @default true
   */
  Object.defineProperty(Scroll.prototype, 'horizontal', {
    get:function() { return this.native('hasHorizontalScroller') === $.YES ? true : false; },
    set:function(e) { this.native('setHasHorizontalScroller', e ? $.YES : $.NO); }
  });

  /**
   * @member speed
   * @type {number}
   * @memberof Scroll
   * @description Gets or sets the speed of the scrolling by unit of lines.
   * @default 1
   */
  Object.defineProperty(Scroll.prototype, 'speed', {
    get:function() { return this.native('lineScroll'); },
    set:function(e) { this.native('setLineScroll', e); }
  });

  /**
   * @member backgroundColor
   * @type {Color}
   * @memberof Scroll
   * @description Gets or sets the background color of the container. See the Color class for more information.
   * @see Color
   */
  Object.defineProperty(Scroll.prototype, 'backgroundColor', {
    get:function() { return this.private.background; },
    set:function(e) {
      if(!e || e === "auto") {
        this.private.background = null;
        this.native('setDrawsBackground', $.NO);
      } else {
        this.private.background = new Color(e);
        this.native('setDrawsBackground', $.YES);
        this.native('setBackgroundColor', this.private.background.native);
      }
    }
  });

  return Scroll;

})();
