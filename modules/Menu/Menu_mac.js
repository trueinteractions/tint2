module.exports = (function() {
  function Menu(title) {
    var $ = process.bridge.objc;
    if(typeof(title) == 'undefined') title = "";

    var $menu = $.NSMenu('alloc')('initWithTitle',$(title));
    var children = [];

    this.appendChild = function(menuitem) {
      children.push(menuitem);
      $menu('addItem',menuitem.native);
    }
    this.removeChild = function(menuitem) {
      if(children.indexOf(menuitem) != -1) children.splice(children.indexOf(menuitem),1);
        $menu('removeItem',menuitem.native);
    }
    Object.defineProperty(this, 'native', {
        get:function() { return $menu; }
      });
  }
  Menu.getMacOSXDefaultMenu = function(name) {
    var MenuItem = require('MenuItem');
    var MenuItemSeperator = require('MenuItemSeperator');

    var appleMenu = new Menu();
    appleMenu.appendChild(new MenuItem('About '+name, null);
    appleMenu.appendChild(new MenuItemSeperator());
    appleMenu.appendChild(new MenuItem('Hide '+name, 'h'));
    appleMenu.appendChild(new MenuItem('Hide Others', null);
    appleMenu.appendChild(new MenuItem('Show All', null));
    appleMenu.appendChild(new MenuItemSeperator());
    appleMenu.appendChild(new MenuItem('Quit '+name, null));

    return appleMenu;
  }
  return Menu;
})();