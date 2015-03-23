module.exports = (function() {
  if(global.__TINT.ProgressBar) {
    return global.__TINT.ProgressBar;
  }
  var Container = require('Container');
  var $ = process.bridge.objc;

  /**
   * @class ProgressBar
   * @description The progress bar utilizes the native progress bar widget to represent how far a set of 
   *              interactions are.
   * @extends Container
   */
  /**
   * @new 
   * @memberof ProgressBar
   * @description Creates a new progress bar control.
   */
  function ProgressBar(options) {
    options = options || {};
    options.delegates = options.delegates || [];
    this.nativeClass = this.nativeClass || $.NSProgressIndicator;
    this.nativeViewClass = this.nativeViewClass || $.NSProgressIndicator;
    Container.call(this, options);
    this.native('setMinValue', 0);
    this.native('setMaxValue', 1);
    this.native('setDoubleValue', 0);
    this.native('setStyle', $.NSProgressIndicatorBarStyle);
    this.native('setIndeterminate', false);
    this.native('setUsesThreadedAnimation',$.YES);
    this.native('startAnimation',this.native);
    //TODO: Implement event for changes to value.
  }

  ProgressBar.prototype = Object.create(Container.prototype);
  ProgressBar.prototype.constructor = ProgressBar;

  /**
   * @member border
   * @type {boolean}
   * @memberof ProgressBar
   * @description Gets or sets whether the progress bar has a border. The default is true.
   * @default true
   */
  Object.defineProperty(ProgressBar.prototype, 'border', {
    get:function() { return this.native('bezeled') ? true : false; },
    set:function(e) { this.native('setBezeled', e ? true : false); }
  });

  /**
   * @member value
   * @type {number}
   * @memberof ProgressBar
   * @description Gets or sets the progress, can be a value between 0 and 1 (e.g., 0.5 represents 50% full)
   * @default 0
   */
  Object.defineProperty(ProgressBar.prototype, 'value', {
    get:function() { return this.native('doubleValue'); },
    set:function(e) { this.native('setDoubleValue', e); }
  });

  /**
   * @member indeterminate
   * @type {boolean}
   * @memberof ProgressBar
   * @description Gets or sets whether the progress bar is rendered as indeterminate or determinate. If set to true
   *              the progress bar renders as an animation of progress happening with no indicator as to its finished
   *              time. If set to false (the default) the value is used to calculate how far the progerss is.
   * @default false
   */
  Object.defineProperty(ProgressBar.prototype, 'indeterminate', {
    get:function() { return this.native('isIndeterminate') ? true : false; },
    set:function(e) { 
      this.native('setIndeterminate', e ? true : false);
      this.native('setStyle', e ? $.NSProgressIndicatorSpinningStyle : $.NSProgressIndicatorBarStyle);
    }
  });

  /**
   * @member size
   * @type {string}
   * @memberof ProgressBar
   * @description Gets or sets the size of the progress bar in OS recommended values.  This can be
   *              set to either "small", "large", or "normal".
   * @default "small"
   */
  Object.defineProperty(ProgressBar.prototype, 'size', {
    get:function() { 
      var s = this.native('controlSize');
      if (s === $.NSMiniControlSize) {
        return "small";
      } else if (s === $.NSRegularControlSize) {
        return "large";
      } else {
        return "normal";
      }
    },
    set:function(e) { 
      if (e === "small") {
        this.native('setControlSize', $.NSMiniControlSize);
      } else if (e === "large") {
        this.native('setControlSize', $.NSRegularControlSize);
      } else {
        this.native('setControlSize', $.NSSmallControlSize);
      }
    }
  });
/*
  TODO: Not supported on Windows, bring back once we've added it.
  Object.defineProperty(ProgressBar.prototype, 'style', {
    get:function() { 
      var s = this.native('style');
      if (s == $.NSProgressIndicatorBarStyle) return "bar";
      else if (s == $.NSProgressIndicatorSpinningStyle) return "spinning";
    },
    set:function(e) { 
      if (e == "bar") this.native('setStyle', $.NSProgressIndicatorBarStyle | $.NSProgressIndicatorPreferredLargeThickness);
      else if (e == "spinning") this.native('setStyle', $.NSProgressIndicatorSpinningStyle | $.NSProgressIndicatorPreferredLargeThickness);
    }
  });
*/

  global.__TINT.ProgressBar = ProgressBar;
  return ProgressBar;

})();
