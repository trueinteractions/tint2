module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.objc;

  function ProgressBar(options) {
    Container.call(this, $.NSProgressIndicator, $.NSProgressIndicator, {});
    this.native = this.nativeView = this.nativeViewClass('alloc')('init');
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setUsesThreadedAnimation',$.YES);
    this.native('startAnimation',this.native);
    this.native('setMinValue', 0);
    this.native('setMaxValue', 1);
    this.native('setDoubleValue', 0);
    this.native('setStyle', $.NSProgressIndicatorBarStyle);
    this.native('setIndeterminate', false);


    Object.defineProperty(this, 'border', {
      get:function() { return this.native('bezeled') ? true : false; },
      set:function(e) { this.native('setBezeled', e ? true : false); }
    });

    Object.defineProperty(this, 'value', {
      get:function() { return this.native('doubleValue'); },
      set:function(e) { this.native('setDoubleValue', e); }
    });

    Object.defineProperty(this, 'indeterminate', {
      get:function() { return this.native('isIndeterminate') ? true : false; },
      set:function(e) { 
        this.native('setIndeterminate', e ? true : false);
        //this.native( e ? 'startAnimation' : 'stopAnimation', this.native);
        this.native('setStyle', e ? $.NSProgressIndicatorSpinningStyle : $.NSProgressIndicatorBarStyle);
      }
    });

    Object.defineProperty(this, 'size', {
      get:function() { 
        var s = this.native('controlSize');
        if (s == $.NSMiniControlSize) return "small";
        else if (s == $.NSRegularControlSize) return "large";
        else return "normal";
      },
      set:function(e) { 
        if (e == "small") this.native('setControlSize', $.NSMiniControlSize);
        else if (e == "large") this.native('setControlSize', $.NSRegularControlSize);
        else this.native('setControlSize', $.NSSmallControlSize);
      }
    });

     Object.defineProperty(this, 'style', {
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
  }
  ProgressBar.prototype = Object.create(Container.prototype);
  ProgressBar.prototype.constructor = ProgressBar;

  return ProgressBar;
})();