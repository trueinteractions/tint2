module.exports = (function() {
  function MenuItemSeparator() {
    var $ = process.bridge.dotnet;
    var $menu = new $.System.Windows.Controls.Separator();
    Object.defineProperty(this, 'native', {
        get: function() { return $menu; }
    });
  }
  return MenuItemSeparator;
})();
