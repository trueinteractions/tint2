module.exports = (function() {
  /**
   * @class MenuItemSeparator
   * @description Creates a seperator that can be added to a Menu object to create a divider
   *			  appearance between two other menu items.
   * @see Menu
   * @see MenuItem
   */
  function MenuItemSeparator() {
    var $ = process.bridge.objc;
    var $menu = $.NSMenuItem('separatorItem');
    Object.defineProperty(this, 'native', {
        get: function() { return $menu; }
    });
  }
  return MenuItemSeparator;
})();
