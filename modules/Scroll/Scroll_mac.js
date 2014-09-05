module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var Color = require('Color');
  var $ = process.bridge.objc;

  function Scroll(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.NSScrollView, $.NSScrollView, options);

    this.native = this.nativeView = this.nativeViewClass('alloc')('initWithFrame',$.NSMakeRect(0,0,500,500));
    this.native('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.native('setDrawsBackground',$.NO);
    this.native('setHasVerticalScroller',$.YES);
    this.native('setHasHorizontalScroller',$.YES);
    this.appendChild = null;
    this.removeChild = null;

    this.private.background = null;
  }

  Scroll.prototype = Object.create(Container.prototype);
  Scroll.prototype.constructor = Scroll;

  Scroll.prototype.setChild = function(control) { 
    this.native('setDocumentView', control.nativeView);
    control.fireEvent('parent-attached', [this]);
    this.fireEvent('child-attached', [control]);
  }

  Object.defineProperty(Scroll.prototype, 'border', {
    get:function() {
      var s = this.nativeView('borderType');
      if(s == $.NSNoBorder) return "none";
      else if (s == $.NSLineBorder) return "line";
      else if (s == $.NSBezelBorder) return "normal";
      else if (s == $.NSGrooveBorder) return "concave";
      else return "unknown";
    },
    set:function(e) { 
      if(e == "none") this.nativeView('setBorderType', $.NSNoBorder);
      else if (e == "line") this.nativeView('setBorderType', $.NSLineBorder);
      else if (e == "normal") this.nativeView('setBorderType', $.NSBezelBorder);
      else if (e == "concave") this.nativeView('setBorderType', $.NSGrooveBorder);
    }
  });

  Object.defineProperty(Scroll.prototype, 'vertical', {
    get:function() { return this.native('hasVerticalScroller') == $.YES ? true : false; },
    set:function(e) { this.native('setHasVerticalScroller', e ? $.YES : $.NO); }
  });

  Object.defineProperty(Scroll.prototype, 'horizontal', {
    get:function() { return this.native('hasHorizontalScroller') == $.YES ? true : false; },
    set:function(e) { this.native('setHasHorizontalScroller', e ? $.YES : $.NO); }
  });

  Object.defineProperty(Scroll.prototype, 'speed', {
    get:function() { return this.native('lineScroll'); },
    set:function(e) { this.native('setLineScroll', e); }
  });

  Object.defineProperty(Scroll.prototype, 'backgroundColor', {
    get:function() { return this.private.background; },
    set:function(e) {
      if(!e || e == "auto") {
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
