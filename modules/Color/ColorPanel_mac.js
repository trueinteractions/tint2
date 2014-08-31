module.exports = (function() {
  var Panel = require('Panel');
  var utilities = require('Utilities');
  var Color = require('Color');
  var $ = process.bridge.objc;

  if(!$.ColorPanelDelegate) {
    var ColorPanelDelegate = $.WindowDelegate.extend('ColorPanelDelegate');
    ColorPanelDelegate.addMethod('changeColor:', 'v@:@', function(self,cmd,notification) {
        try {
          self.callback.fireEvent('colorchange');
        } catch(e) { 
          console.log(e.message);
          console.log(e.stack);
          process.exit(1);
        };
    }.bind(this));
    ColorPanelDelegate.register();
  }

  function ColorPanel(NativeObjectClass, NativeViewClass, options) {
    if(!NativeObjectClass || NativeObjectClass.type != '#') {
      Panel.call(this, $.NSColorPanel, $.NSView, {isPanel:true});
      this.native = this.native = $.NSColorPanel('sharedColorPanel');
      this.nativeView = this.native('contentView');
      this.native('setExcludedFromWindowsMenu', $.NO);
      this.native('makeKeyAndOrderFront', this.native);
      this.native('setReleasedWhenClosed', $.YES);
      this.native('cascadeTopLeftFromPoint', $.NSMakePoint(20,20));

      var id = Math.random().toString();
      application.private.delegateMap[id] = this;
      var colorPanelDelegate = $.ColorPanelDelegate('alloc')('initWithJavascriptObject', $(id));
      this.native('setDelegate', colorPanelDelegate);
    } else
      Panel.call(this, NativeObjectClass, NativeViewClass, options);
  }

  ColorPanel.prototype = Object.create(Panel.prototype);
  ColorPanel.prototype.constructor = ColorPanel;

  ColorPanel.prototype.setChild = function(e) { this.native('setAccessoryView',e.nativeView); }
  ColorPanel.prototype.appendChild = ColorPanel.prototype.removeChild = null;

  Object.defineProperty(ColorPanel.prototype, 'alpha', {
    get:function() { return this.native('showsAlpha'); },
    set:function(e) { this.native('setShowsAlpha', e ? true : false); }
  });

  Object.defineProperty(ColorPanel.prototype, 'selected', {
    get:function() { return new Color(this.native('color')); },
    set:function(colorObj) { this.native('setColor', colorObj.native); }
  });

  return ColorPanel;
})();
