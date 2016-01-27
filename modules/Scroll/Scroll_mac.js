module.exports = (function() {
  if(global.__TINT.Scroll) {
    return global.__TINT.Scroll;
  }

  var Container = require('Container');
  var Color = require('Color');
  var util = require('Utilities');
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
  function Scroll(properties, options, inherited) {
    options = options || {};
    options.delegates = options.delegates || [];
    this.nativeClass = this.nativeClass || $.NSScrollView;
    this.nativeViewClass = this.nativeViewClass || $.NSScrollView;
    Container.call(this, properties, options, inherited || true);
    this.native('setFrame', $.NSMakeRect(0,0,500,500));
    this.native('setDrawsBackground',$.NO);
    this.native('setHasVerticalScroller',$.YES);
    this.native('setHasHorizontalScroller',$.YES);
    this.native('setWantsLayer', $.YES);
    this.appendChild = null;
    this.removeChild = null;

    this.private.background = null;
    util.setProperties(this, properties, inherited);
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
    if(control.__proto__.constructor.name === "Table") {
      // Must be YES otherwise table's with scroll containers have black edges and rendering glitches.
      this.native('setDrawsBackground',$.YES);
      // The child should not be positioned by anything other than the scroll view.
      this.private.ignoreConstraints = true;
      control.nativeView('setFrame', this.native('frame'));
      control.nativeView('setTranslatesAutoresizingMaskIntoConstraints',$.YES);
    }
    this.native('setDocumentView', control.nativeView);
    control.fireEvent('parent-attached', [this]);
    this.fireEvent('child-attached', [control]);
  };

  /**
   * @member border
   * @type {string}
   * @memberof Scroll
   * @description Gets or sets the border type for the scroll window. This can be one of the following values
   *              "none", "line", "normal" or "concave".  The default is "normal".
   * @default "normal"
   */
  util.makePropertyMapType(Scroll.prototype, 'border', 'borderType', 'setBorderType', {
    none:$.NSNoBorder,
    line:$.NSLineBorder,
    normal:$.NSBezelBorder,
    concave:$.NSGrooveBorder
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
  util.makePropertyBoolType(Scroll.prototype, 'vertical', 'hasVerticalScroller', 'setHasVerticalScroller');

  /**
   * @member horizontal
   * @type {boolean}
   * @memberof Scroll
   * @description Gets or sets whether the scroll has a horizontal scrollbar (and can scroll horizontally).
   *              The default is true.
   * @default true
   */
  util.makePropertyBoolType(Scroll.prototype, 'horizontal', 'hasHorizontalScroller', 'setHasHorizontalScroller');

  /**
   * @member speed
   * @type {number}
   * @memberof Scroll
   * @description Gets or sets the speed of the scrolling by unit of lines.
   * @default 1
   */
  util.makePropertyNumberType(Scroll.prototype, 'speed', 'lineScroll', 'setLineScroll');

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

  global.__TINT.Scroll = Scroll;
  return Scroll;

})();
