module.exports = (function() {
  var Panel = require('Panel');
  var Color = require('Color');
  var $ = process.bridge.objc;

  function ColorPanel(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.delegates = options.delegates || [];
    options.delegates = options.delegates.concat([['changeColor:', 'v@:@', function(self, cmd, notif) { this.fireEvent('colorchange'); }.bind(this)]]);

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Panel.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.nativeObject = options.nativeObject || $.NSColorPanel('sharedColorPanel');
      Panel.call(this, $.NSColorPanel, $.NSView, options);
    }
  }

  ColorPanel.prototype = Object.create(Panel.prototype);
  ColorPanel.prototype.constructor = ColorPanel;

  //TODO: This is not supported on Windows, but is on OSX, add to win?.
  //ColorPanel.prototype.setChild = function(e) { this.native('setAccessoryView',e.nativeView); }
  //ColorPanel.prototype.appendChild = ColorPanel.prototype.removeChild = null;

  Object.defineProperty(ColorPanel.prototype, 'allowAlpha', {
    get:function() { return this.native('showsAlpha'); },
    set:function(e) { this.native('setShowsAlpha', e ? true : false); }
  });

  Object.defineProperty(ColorPanel.prototype, 'selected', {
    get:function() { return new Color(this.native('color')); },
    set:function(colorObj) { this.native('setColor', colorObj.native); }
  });

  return ColorPanel;
})();
