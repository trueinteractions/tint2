module.exports = (function() {
  var Panel = require('Panel');
  var Color = require('Color');
  var $ = process.bridge.objc;

  /**
   * @class ColorPanel
   * @description Creates a new color panel that allows the user to select a color. 
   *              This opens the native OS window that handles color selection.
   */
   /**
    * @new
    * @memberof ColorPanel
    * @description Creates a new ColorPanel window that's hidden by default.
    */
  function ColorPanel(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.delegates = options.delegates || [];
    /**
     * @event colorchange
     * @memberof ColorPanel
     * @description Fires when the user selects a new color in the panel.
     */
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

  /**
   * @member allowAlpha
   * @type {boolean}
   * @memberof ColorPanel
   * @description Gets or sets whether the user may select a color with an alpha component in it 
   *              (e.g., a semi-translucent color).
   * @default true
   */
  Object.defineProperty(ColorPanel.prototype, 'allowAlpha', {
    get:function() { return this.native('showsAlpha'); },
    set:function(e) { this.native('setShowsAlpha', e ? true : false); }
  });

  /**
   * @member selected
   * @type {boolean}
   * @memberof ColorPanel
   * @description Gets or sets the selected color in the color panel.
   * @default true
   */
  Object.defineProperty(ColorPanel.prototype, 'selected', {
    get:function() { return new Color(this.native('color')); },
    set:function(colorObj) { this.native('setColor', colorObj.native); }
  });
  
  // TODO: Remove once we have a standard color panel that derives/inherits
  /**
   * @method addEventListener
   * @param {string} eventName The name of the application event to start listening to.
   * @param {function} callback The function that will be called when it occurs.
   * @memberof ColorPanel
   * @description Adds an event listener for various control level events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              to call when the event happens (e.g., a callback).
   */
  /**
   * @method removeEventListener
   * @param {string} eventName The name of the application event to stop listening to.
   * @param {function} callback The function that would have been called.
   * @memberof ColorPanel
   * @description Removes an event listener for various application level events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              that was originally given as the callback for addEventListener.
   */
  /**
   * @member visible
   * @type {boolean}
   * @memberof ColorPanel
   * @description Gets or sets whether the window is visible or hidden. Hidden windows
   *              are not minimized, but removed from the screen regardless if their
   *              minimized, maximized or fullscreen.  By default the windows visibility
   *              is set to false so windows can have specific styling set prior to being
   *              shown.
   */
  return ColorPanel;
})();
