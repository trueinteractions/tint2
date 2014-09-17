module.exports = (function() {
  function MenuItemSeparator() {
    var $ = process.bridge.objc;
    var $menu = $.NSMenuItem('separatorItem');
    Object.defineProperty(this, 'native', {
        get: function() { return $menu; }
    });
  }
  return MenuItemSeparator;
})();
