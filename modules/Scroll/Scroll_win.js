module.exports = (function() {
  if(global.__TINT.Scroll) {
    return global.__TINT.Scroll;
  }
  var Container = require('Container');
  var Color = require('Color');
  var $ = process.bridge.dotnet;

  function Scroll(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.ScrollViewer;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.ScrollViewer;
    Container.call(this, options);

    this.native.HorizontalContentAlignment = $.System.Windows.HorizontalAlignment.Left;
    this.native.VerticalAlignment = $.System.Windows.HorizontalAlignment.Top;
    this.private.border = null;
    this.appendChild = null;
    this.removeChild = null;
    this.private.background = null;
  }

  Scroll.prototype = Object.create(Container.prototype);
  Scroll.prototype.constructor = Scroll;

  //Content
  Scroll.prototype.setChild = function(control) {
    control.private.parent = this;
    this.native.Content = control.native; 
  }

  //BorderBrush
  Object.defineProperty(Scroll.prototype, 'border', {
    get:function() { return this.private.border; },
    set:function(e) {
      this.private.border = e;
      this.nativeView.BorderThickness = new $.System.Windows.Thickness( e ? 1 : 0 );
    }
  });

  //VerticalScrollBarVisibility
  Object.defineProperty(Scroll.prototype, 'vertical', {
    get:function() { return this.nativeView.VerticalScrollBarVisibility === $.System.Windows.Controls.ScrollBarVisibility.Auto; },
    set:function(e) {
      if(e) {
        this.nativeView.VerticalScrollBarVisibility = $.System.Windows.Controls.ScrollBarVisibility.Auto;
      } else {
        this.nativeView.VerticalScrollBarVisibility = $.System.Windows.Controls.ScrollBarVisibility.Hidden;
      }
    }
  });

  //HorizontalScrollBarVisibility
  Object.defineProperty(Scroll.prototype, 'horizontal', {
    get:function() { return this.nativeView.HorizontalScrollBarVisibility === $.System.Windows.Controls.ScrollBarVisibility.Auto; },
    set:function(e) {
      if(e) {
        this.nativeView.HorizontalScrollBarVisibility = $.System.Windows.Controls.ScrollBarVisibility.Auto;
      } else {
        this.nativeView.HorizontalScrollBarVisibility = $.System.Windows.Controls.ScrollBarVisibility.Hidden;
      }
    }
  });

  //PanningDeceleration, TODO: shore this up with OSX.
  Object.defineProperty(Scroll.prototype, 'speed', {
    get:function() { return this.nativeView.PanningDeceleration; },
    set:function(e) { this.nativeView.PanningDeceleration = e; }
  });

  //Background  
  Object.defineProperty(Scroll.prototype, 'backgroundColor', {
    get:function() { return this.private.background; },
    set:function(e) {
      this.private.background = e;
      this.private.backgroundObj = new Color(e);
      this.nativeView.Background = new $.System.Windows.Media.SolidColorBrush(this.private.backgroundObj.native);
    }
  });

  global.__TINT.Scroll = Scroll;
  return Scroll;

})();
