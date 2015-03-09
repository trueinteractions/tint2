module.exports = (function() {
  var Panel = require('Panel');
  var Font = require('Font');
  var $ = process.bridge.objc;

  /**
   * @class FontPanel
   * @description Creates a new system Font Panel that the user can select a font with.
   */
  /**
   * @new 
   * @memberof FontPanel
   * @description Creates a new font panel window that is initially hidden.
   */
  function FontPanel(options) {
    var fontManager = $.NSFontManager('sharedFontManager');
    options = options || {};
    this.nativeClass = this.nativeClass || $.TintFontPanel;
    this.nativeViewClass = this.nativeViewClass || $.NSView;
    options.nativeObject = options.nativeObject || fontManager('fontPanel', $.YES);
    Panel.call(this, options);
    fontManager('setDelegate',this.native);
    fontManager('setTarget', this.native);
    $.TintFontPanel.panel.fireEvent = this.fireEvent.bind(this);

    this.private.multiple = false;
    this.private.fontManager = fontManager;
  }

  FontPanel.prototype = Object.create(Panel.prototype);
  FontPanel.prototype.constructor = FontPanel;

  //TODO: These are not supported on windows.
  FontPanel.prototype.setChild = function(e) { this.native('setAccessoryView',e.nativeView); }
  FontPanel.prototype.scanForNewFonts = function() { this.native('reloadDefaultFontFamilies'); }

  /**
   * @member selected
   * @type {Font}
   * @memberof FontPanel
   * @description Gets or sets the selected font.
   */
  Object.defineProperty(FontPanel.prototype, 'selected', {
    get:function() {
      var font = this.private.fontManager('convertFont',this.native('font'));
      if(font === null) {
        return null;
      }
      return new Font(font);
    },
    set:function(fontObj) { 
      this.native('setFont', fontObj.native);
      this.native('setPanelFont', fontObj.native, 'isMultiple', this.private.multiple ? $.YES : $.NO);
      /**
       * @event fontchange
       * @memberof FontPanel
       * @description Fires when the user selects a new font from the font panel.
       */
      this.fireEvent('fontchange');
    }
  });

  /**
   * @member multiple
   * @type {Font}
   * @memberof FontPanel
   * @description Gets or sets whether multiple fonts can be selected.
   * @default false
   */
  Object.defineProperty(FontPanel.prototype, 'multiple', {
    get:function() { return this.private.multiple; },
    set:function(e) { this.private.multiple = (e ? true : false); }
  });

  // TODO: Remove once we have a standard color panel that derives/inherits
  /**
   * @method addEventListener
   * @param {string} eventName The name of the event to start listening to.
   * @param {function} callback The function that will be called when it occurs.
   * @memberof FontPanel
   * @description Adds an event listener for various control level events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              to call when the event happens (e.g., a callback).
   */
  /**
   * @method removeEventListener
   * @param {string} eventName The name of the event to stop listening to.
   * @param {function} callback The function that would have been called.
   * @memberof FontPanel
   * @description Removes an event listener for various application level events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              that was originally given as the callback for addEventListener.
   */
  /**
   * @member visible
   * @type {boolean}
   * @memberof FontPanel
   * @description Gets or sets whether the color panel is visible or hidden.
   */
  return FontPanel;
})();
