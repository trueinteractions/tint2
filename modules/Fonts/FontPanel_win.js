module.exports = (function() {
  var Panel = require('Panel');
  var utilities = require('Utilities');
  var Font = require('Font');
  var $ = process.bridge.objc;

  function FontPanel(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass)
      Panel.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      //Panel.call(this, $.TintFontPanel, $.NSView, options);
    }

    this.private.multiple = false;
    this.private.fontManager = fontManager;
  }

  FontPanel.prototype = Object.create(Panel.prototype);
  FontPanel.prototype.constructor = FontPanel;

  FontPanel.prototype.setChild = function(e) { }
  FontPanel.prototype.scanForNewFonts = function() { }

  Object.defineProperty(FontPanel.prototype, 'selected', {
    get:function() { },
    set:function(fontObj) { }
  });

  Object.defineProperty(FontPanel.prototype, 'multiple', {
    get:function() { },
    set:function(e) { }
  });

  return FontPanel;
})();
