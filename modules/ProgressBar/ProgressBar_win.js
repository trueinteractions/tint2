module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function ProgressBar(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.initViewOnly = true;
      Container.call(this, $.System.Windows.Controls.ProgressBar, $.System.Windows.Controls.ProgressBar, options);
    }

    this.native.Maximum = 1.0;
    this.native.Minimum = 0.0;
    this.native.Value = 0.0;
    this.native.IsIndeterminate = false;
    this.private.border = false;
    this.private.valueCache = 0.0;
    //TODO: Implement event for changes to value.
  }

  ProgressBar.prototype = Object.create(Container.prototype);
  ProgressBar.prototype.constructor = ProgressBar;

  Object.defineProperty(ProgressBar.prototype, 'border', {
    get:function() { return this.private.border; },
    set:function(e) { this.private.border = e ? true : false; }
  });

  Object.defineProperty(ProgressBar.prototype, 'value', {
    get:function() { return this.private.valueCache; },
    set:function(e) {
      this.private.valueCache = e;
      this.native.Value = e; 
    }
  });

  Object.defineProperty(ProgressBar.prototype, 'indeterminate', {
    get:function() { return this.native.IsIndeterminate ? true : false; },
    set:function(e) { this.native.IsIndeterminate = e ? true : false; }
  });

  Object.defineProperty(ProgressBar.prototype, 'size', {
    get:function() { 
      var s = this.native.Height;
      if (s == 5) return "small";
      else if (s == 20) return "large";
      else return "normal";
    },
    set:function(e) { 
      if (e == "small") this.native.Height = 5;
      else if (e == "large") this.native.Height = 20;
      else this.native.Height = 10;
    }
  });
/*
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
  return ProgressBar;

})();
