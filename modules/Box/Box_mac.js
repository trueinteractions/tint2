module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.objc;

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

  Object.defineProperty(Box.prototype, 'title', {
    get:function() { return this.nativeView('title').toString(); },
    set:function(e) { this.nativeView('setTitle', $(e.toString())); }
  });

  Object.defineProperty(Box.prototype, 'transparent', {
    get:function() { return this.nativeView('transparent') == $.YES ? true : false; },
    set:function(e) { this.nativeView('setTransparent', e ? $.YES : $.NO ); }
  });

  Object.defineProperty(Box.prototype, 'titlePosition', {
    get:function() { 
      var position = this.nativeView('titlePosition');
      if(position == $.NSAboveTop) return "above-top";
      else if (position == $.NSAtTop) return "top";
      else if (position == $.NSBelowTop) return "below-top";
      else if (position == $.NSAboveBottom) return "above-bottom";
      else if (position == $.NSAtBottom) return "bottom";
      else if (position == $.NSBelowBottom) return "below-bottom";
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

  Object.defineProperty(Box.prototype, 'borderColor', {
    get:function() { return new Color(this.nativeView('borderColor')); },
    set:function(e) { this.nativeView('setBorderColor',e.native); }
  });

  Object.defineProperty(Box.prototype, 'borderWidth', {
    get:function() { return this.nativeView('borderWidth'); },
    set:function(e) { this.nativeView('setBorderWidth',e); }
  });

  Object.defineProperty(Box.prototype, 'borderRadius', {
    get:function() { return this.nativeView('cornerRadius'); },
    set:function(e) { this.nativeView('setCornerRadius',e); }
  });

  Object.defineProperty(Box.prototype, 'fillColor', {
    get:function() { return new Color(this.nativeView('fillColor')); },
    set:function(e) { this.nativeView('setFillColor',e.native); }
  });

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
