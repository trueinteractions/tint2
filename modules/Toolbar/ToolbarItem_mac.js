module.exports = (function() {
  var util = require('Utilities');

  /**
   * @class ToolbarItem
   * @description The toolbar item is similar to a button control in its functionality but has an adaptive layout
   *              suited for toolbar controls which may dictate the layout of its child elements.  It's recommended
   *              using a toolbar item for toolbar buttons rather than a button class.
   * @see Toolbar
   */
  /**
   * @new 
   * @memberof ToolbarItem
   * @description Creates a new toolbar item.
   */
  function ToolbarItem(properties) {
    var $ = process.bridge.objc;
    this.private = {identifier:Math.round(Math.random()*1000000).toString()};
    this.native = this.nativeView = $.NSToolbarItem('alloc')('initWithItemIdentifier', $(this.private.identifier));
    var delegateClass = $.NSObject.extend('ToolbarItemDelegate'+Math.round(Math.random()*10000));
    delegateClass.addMethod('init:','@@:', function(self) { return self; });
    delegateClass.addMethod('click:', 'v@:@', function(self, command, sender) { this.fireEvent('click'); }.bind(this));
    delegateClass.register();
    this.private.delegate = delegateClass('alloc')('init');
    this.nativeView('setTarget', this.private.delegate);
    this.nativeView('setAction', 'click:');
    util.setProperties(this, properties, false);
  }

  /**
   * @member title
   * @type {string}
   * @memberof ToolbarItem
   * @description Gets or sets the text label on the toolbar item.
   */
  util.makePropertyStringType(ToolbarItem.prototype, 'title', 'label', 'setLabel');

  /**
   * @member tooltip
   * @type {string}
   * @memberof ToolbarItem
   * @description Gets or sets the tool tip on the toolbar item.
   */
  util.makePropertyStringType(ToolbarItem.prototype, 'tooltip', 'toolTip', 'setToolTip');

  /**
   * @member image
   * @type {Image}
   * @memberof ToolbarItem
   * @description Gets or sets the image to use on the toolbar item.
   */
  util.makePropertyImageType(ToolbarItem.prototype, 'image', 'image', 'setImage');
  /**
   * @member enabled
   * @type {bool}
   * @memberof ToolbarItem
   * @description Gets or sets whether the toolbar item is enabled or not. Note if set to false, the
   *              toolbar item may still be shown but dimmed to represent a disabled state.
   */
  util.makePropertyBoolType(ToolbarItem.prototype, 'enabled', 'enabled', 'setEnabled');

  /**
   * @method addEventListener
   * @param {string} eventName The name of the control event to start listening to.
   * @param {function} callback The function that will be called when it occurs.
   * @memberof ToolbarItem
   * @description Adds an event listener for various control level events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              to call when the event happens (e.g., a callback).
   */
  /**
   * @method removeEventListener
   * @param {string} eventName The name of the control event to stop listening to.
   * @param {function} callback The function that would have been called.
   * @memberof ToolbarItem
   * @description Removes an event listener for various control level events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              that was originally given as the callback for addEventListener.
   */
  util.defEvents(ToolbarItem.prototype);

  return ToolbarItem;
})();