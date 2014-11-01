module.exports = (function() {
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function Box(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass)
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.initViewOnly = true;
      Container.call(this, $.System.Windows.Controls.GroupBox, $.System.Windows.Controls.GroupBox, options);
    }
    this.nativeView.Content = new $.AutoLayout.AutoLayoutPanel();
  }

  Box.prototype = Object.create(Container.prototype);
  Box.prototype.constructor = Box;

  Object.defineProperty(Box.prototype, 'title', {
    get:function() { return this.nativeView.Header.toString(); },
    set:function(e) { this.nativeView.Header = e.toString(); }
  });

  //TODO: Should this just be a backgorund transparen tproperty?
  //Object.defineProperty(Box.prototype, 'transparent', {
  //  get:function() { return this.nativeView('transparent') == $.YES ? true : false; },
  //  set:function(e) { this.nativeView('setTransparent', e ? $.YES : $.NO ); }
  //});

  //STUB
  Object.defineProperty(Box.prototype, 'titlePosition', {
  	get: function() { return "top"; }
  });
/* 
  TODO: HOW DO WE IMPLEMENT
  Object.defineProperty(Box.prototype, 'titlePosition', {
    get:function() { 
      var position = this.nativeView('titlePosition');
      if(position == $.NSAboveTop) return "above-top";
      else if (position == $.NSAtTop) return "top";
      else if (position == $.NSBelowTop) return "below-top";
      else if (position == $.NSAboveBottom) return "above-bottom";
      else if (position == $.NSAtBottom) return "bottom";
      else return "below-bottom";
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
*/

  Object.defineProperty(Box.prototype, 'borderType', {
    get:function() { 
      var type = this.nativeView.BorderThickness;
      if(type.Top == 0) return "none";
      else return "line";
    },
    set:function(e) {
      if(e == "none") this.nativeView.BorderThickness = new $.System.Windows.Thickness(0);
      else if (e == "line") this.nativeView.BorderThickness = new $.System.Windows.Thickness(1);
    }
  });

  Object.defineProperty(Box.prototype, 'borderColor', {
    get:function() { return new Color(this.nativeView.BorderBrush.Color); },
    set:function(e) { this.nativeView.BorderBrush = new $.System.Windows.Media.SolidColorBrush((new Color(e)).native); }
  });

  Object.defineProperty(Box.prototype, 'borderWidth', {
    get:function() { return this.nativeView.BorderThickness.Top; },
    set:function(e) { this.nativeView.BorderThickness = new $.System.Windows.Thickness(e); }
  });

  // TODO: Figure out how we may be able to replicate this.
  Object.defineProperty(Box.prototype, 'borderRadius', {
    get:function() { return this.private.radius; },
    set:function(e) {  this.private.radius = e;}
  });

  Object.defineProperty(Box.prototype, 'backgroundColor', {
    get:function() { return new Color(this.nativeView.Background); },
    set:function(e) { this.nativeView.Background = (new Color(e)).native; }
  });

  //Object.defineProperty(Box.prototype, 'style', {
  //  get:function() {
  //    var type = this.nativeView('boxType');
  //    if(type == $.NSBoxPrimary) return "primary";
  //    else if (type == $.NSBoxSecondary) return "secondary";
  //    else if (type == $.NSBoxSeparator) return "separator";
  //    else if (type == $.NSBoxOldStyle) return "old";
  //    else return "custom";
  //  },
  //  set:function(e) {
  //    if(e == "primary") this.nativeView('setBoxType', $.NSBoxPrimary);
  //    else if(e == "secondary") this.nativeView('setBoxType', $.NSBoxSecondary);
  //    else if(e == "old") this.nativeView('setBoxType', $.NSBoxOldStyle);
  //    else if(e == "separator") this.nativeView('setBoxType', $.NSBoxSeparator);
  //    else if(e == "custom") this.nativeView('setBoxType', $.NSBoxCustom);
  //  }
  //});

  return Box;
})();
