module.exports = (function() {
  var Panel = require('Panel');
  var utilities = require('Utilities');
  var Font = require('Font');
  var $ = process.bridge.objc;

  function FontPanel(NativeObjectClass, NativeViewClass, options) {
    var fontManager = $.NSFontManager('sharedFontManager');
    options = options || {};

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Panel.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.nativeObject = options.nativeObject || fontManager('fontPanel', $.YES);
      Panel.call(this, $.TintFontPanel, $.NSView, options);
    }

    fontManager('setDelegate',this.native);
    fontManager('setTarget', this.native);
    $.TintFontPanel.panel.fireEvent = this.fireEvent.bind(this);

    this.private.multiple = false;
    this.private.fontManager = fontManager;
  }

  FontPanel.prototype = Object.create(Panel.prototype);
  FontPanel.prototype.constructor = FontPanel;

  FontPanel.prototype.setChild = function(e) { this.native('setAccessoryView',e.nativeView); }
  FontPanel.prototype.scanForNewFonts = function() { this.native('reloadDefaultFontFamilies'); }

  Object.defineProperty(FontPanel.prototype, 'selected', {
    get:function() {
      var font = this.private.fontManager('convertFont',this.native('font'));
      if(font == null) return null;
      return new Font(font);
    },
    set:function(fontObj) { 
      this.native('setFont', fontObj.native);
      this.native('setPanelFont', fontObj.native, 'isMultiple', this.private.multiple ? $.YES : $.NO);
      this.fireEvent('fontchange');
    }
  });

  Object.defineProperty(FontPanel.prototype, 'multiple', {
    get:function() { return this.private.multiple; },
    set:function(e) { this.private.multiple = (e ? true : false); }
  });

  return FontPanel;
})();
