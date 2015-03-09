module.exports = (function() {
  if(global.__TINT.Split) {
    return global.__TINT.Split;
  }
  var Container = require('Container');
  var $ = process.bridge.objc;
  /**
   * @class Split
   * @description The Split class can be used to store multiple views horizontally or vertically with a seperator
   *              that can be moved between the two to resize one view or another.  This class is useful for having
   *              a "tools" view on one side and a "content" view on the other allowing the user the option to collapse
   *              or resize one view as needed.
   * @extends Container
   */
  /**
   * @new 
   * @memberof Split
   * @description Creates a new split view
   */
  function Split(options) {
    options = options || {};
    options.delegates = options.delegates || [];
    options.delegates = options.delegates.concat([
      ['splitView:canCollapseSubview:','B@:@@', function(self, selector, splitview, subview) { return $.NO; }.bind(this)],
      ['splitView:constrainMaxCoordinate:ofSubviewAt:','d@:@dl', function(self, selector, splitview, proposedMax, index) { return proposedMax; }.bind(this)],
      ['splitView:constrainMinCoordinate:ofSubviewAt:','d@:@dl', function(self, selector, splitview, proposedMin, index) { return proposedMin; }.bind(this)],
      ['splitView:constrainSplitPosition:ofSubviewAt:','d@:@dl', function(self, selector, splitview, proposedPosition, index) { return proposedPosition; }.bind(this)],
      ['splitView:shouldAdjustSizeOfSubview:','B@:@@', function(self, selector, splitview, subview) { return $.YES; }.bind(this)],
      ['splitView:shouldHideDividerAtIndex:','B@:@l', function(self, selector, splitview, index) { return $.YES; }.bind(this)],
      ['splitViewDidResizeSubviews:','v@:@', function(self, selector, notif) { this.fireEvent('resized'); }.bind(this)],
      ['splitViewWillResizeSubviews:','v@:@', function(self, selector, notif) { this.fireEvent('resize'); }.bind(this)]
    ]);
    this.nativeClass = this.nativeClass || $.NSSplitView;
    this.nativeViewClass = this.nativeViewClass || $.NSSplitView;
    Container.call(this, options);
    this.private.backupAppend = Container.prototype.appendChild;
    this.private.backupRemove = Container.prototype.removeChild;
    this.private.lockedSubviewIndexes = [];

    this.native('setDelegate', this.nativeView);
    this.nativeView('setVertical',$.YES);
    this.nativeView('setDividerStyle', $.NSSplitViewDividerStyleThin);
  }

  Split.prototype = Object.create(Container.prototype);
  Split.prototype.constructor = Split;

  /**
   * @method appendChild
   * @param {control} The control to append to the split control.
   * @memberof Split
   * @description appendChild adds a new control to the split control with a seperator between the previous and appended control.
   */
  Split.prototype.appendChild = function() { 
    this.private.backupAppend.apply(this,arguments);
    this.nativeView('adjustSubviews');
  }

  /**
   * @method removeChild
   * @param {control} The control to remove from the split control.
   * @memberof Split
   * @description Removes a control from the split control.
   */
  Split.prototype.removeChild = function() { 
    this.private.backupRemove.apply(this,arguments);
    this.nativeView('adjustSubviews'); 
  }

  /**
   * @method setPosition
   * @param {number} position The position of the seperator, a value of 0 to 1 representing the percentage of 
   *                  available area it should be at, for example two views are sharing 50% of the possible
   *                  area if the position is set to 0.5.
   * @param {number} index The index identifying the seperator to position.
   * @memberof Split
   * @description Sets the position (a value of 0 to 1) of a seperator identified by the index.
   */
  Split.prototype.setPosition = function(position, index) {
    position = position > 1 ? 1 : position;
    position = position < 0 ? 0 : position;

    // Give this a small timeout, if the view has not gone through a event
    // loop pass it will not be properly set.
    setTimeout(function() {
      var div;
      if(this.nativeView('isVertical')) {
        div = this.bounds.width;
      }  else {
        div = this.bounds.height;
      }
      position = position * div;
      this.nativeView('setPosition', position, 'ofDividerAtIndex', index);
    }.bind(this),100);
  }

  /**
   * @member orientation
   * @type {string}
   * @memberof Split
   * @description Gets or sets the orientation of all the seperators in the view, the values can be
   *              either "vertical" or "horizontal".  The default is "horizontal".
   * @default "horizontal"
   */
  Object.defineProperty(Split.prototype, 'orientation', {
    get:function() { return this.nativeView('isVertical') ? "vertical" : "horizontal"; },
    set:function(e) { this.nativeView('setVertical', e === "vertical" ? $.YES : $.NO); }
  });

  /**
   * @member style
   * @type {string}
   * @memberof Split
   * @description Gets or sets the style or size of the seperators, the values can be "thick", "thin"
   *              or "pane". The actual size is determined by the native widget styles and recommended
   *              operating system standards. The default is "thin".
   * @default "thin"
   */
  Object.defineProperty(Split.prototype, 'style', {
    get:function() {
      var s = this.nativeView('dividerStyle');
      if(s === $.NSSplitViewDividerStyleThick) {
        return "thick";
      } else if (s === $.NSSplitViewDividerStyleThin) {
        return "thin";
      } else if (s === $.NSSplitViewDividerStylePaneSplitter) {
        return "pane";
      } else {
        return "unknown";
      }
    },
    set:function(e) { 
      if(e === "thick") {
        this.nativeView('setDividerStyle', $.NSSplitViewDividerStyleThick);
      } else if (e === "thin") {
        this.nativeView('setDividerStyle', $.NSSplitViewDividerStyleThin);
      } else if (e === "pane") {
        this.nativeView('setDividerStyle', $.NSSplitViewDividerStylePaneSplitter);
      }
    }
  });

  global.__TINT.Split = Split;
  return Split;

})();
