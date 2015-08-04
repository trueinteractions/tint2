module.exports = (function() {
  var $ = process.bridge.objc;
  var MenuItem = require('MenuItem');
  var assert = require('assert');
  var utilities = require('Utilities');

  if(!$.TintMenuDelegate) {
    if(!process.bridge.objc.delegates) {
      process.bridge.objc.delegates = {};
    }
    var tintMenuDelegate = $.NSObject.extend('TintMenuDelegate');
    tintMenuDelegate.addMethod('initWithJavascriptObject:', ['@',[tintMenuDelegate,$.selector,'@']], 
      utilities.errorwrap(function(self, cmd, id) {
        self.callback = process.bridge.objc.delegates[id.toString()];
        process.bridge.objc.delegates[id.toString()] = null;
        return self;
    }));
    tintMenuDelegate.addMethod('menuWillOpen:','v@:@', 
      utilities.errorwrap(function(self,_cmd,frame) {
        /**
         * @event opened
         * @memberof StatusBar
         * @description This event fires when the menu has been opened. Due to the nature of
         *              menu's this event may fire after or before click events on the object
         *              that caused the menu to open fires.  Do not rely on the event order.
         */
        if(self.callback && self.callback.fireEvent) {
          self.callback.fireEvent('opened');
        } else {
          console.warn('no fire event existed for ', self, self.callback);
        }
    }));

    tintMenuDelegate.addMethod('menuDidClose:','v@:@', 
      utilities.errorwrap(function(self,_cmd,frame) {
        /**
         * @event closed
         * @memberof StatusBar
         * @description This event fires when the menu has been closed. Due to the nature of
         *              menu's this event may fire after or before click, blur or focus events on the object
         *              that caused the menu to close fires.  Do not rely on the event order.
         */
        if(self.callback && self.callback.fireEvent) {
          self.callback.fireEvent('closed');
        } else {
          console.warn('no fire event existed for ', self, self.callback);
        }
    }));
    tintMenuDelegate.register();
  }

  /**
   * @class Menu
   * @description The menu class allows you to create system menus and can be used with a variety of other controls.
   *              To use the menu as the system menu, see Window.menu.
   * @see Window
   * @see DropDown
   */
  /**
   * @new 
   * @memberof Menu
   * @param {string} title The text title or label of the menu.
   * @description Creates a new menu object.
   * @example
   * require('Common');
   * var win = new Window(); // Create a new window.
   * win.visible = true; // make sure the window is shown.
   * // Create a menu in OSX
   * var mainMenu = new Menu();
   * var appleMenu = new MenuItem(application.name, '');
   * var fileMenu = new MenuItem('File', '');
   * var editMenu = new MenuItem('Edit', '');
   * var windowMenu = new MenuItem('Window', '');
   * var helpMenu = new MenuItem('Help', '');
   * mainMenu.appendChild(appleMenu);
   * mainMenu.appendChild(fileMenu);
   * mainMenu.appendChild(editMenu);
   * mainMenu.appendChild(windowMenu);
   * mainMenu.appendChild(helpMenu);
   * 
   * var appleSubmenu = new Menu(application.name);
   * appleSubmenu.appendChild(new MenuItem('About '+application.name, ''));
   * appleSubmenu.appendChild(new MenuItemSeparator());
   * appleSubmenu.appendChild(new MenuItem('Hide '+application.name, 'h'))
   *    .addEventListener('click', function() { application.visible = false; });
   * appleSubmenu.appendChild(new MenuItem('Hide Others', ''))
   *    .addEventListener('click', function() { application.hideAllOtherApplications(); });
   * appleSubmenu.appendChild(new MenuItem('Show All', ''))
   *    .addEventListener('click', function() { application.unhideAllOtherApplications(); });
   * appleSubmenu.appendChild(new MenuItemSeparator());
   * appleSubmenu.appendChild(new MenuItem('Quit '+application.name, 'q'))
   *    .addEventListener('click', function() { process.exit(0); });
   * appleMenu.submenu = appleSubmenu;
   * 
   * var fileSubmenu = new Menu('File');
   * fileSubmenu.appendChild(new MenuItem('New File', 'f'));
   * fileSubmenu.appendChild(new MenuItem('Open...', 'o'));
   * fileSubmenu.appendChild(new MenuItem('Save', 's'));
   * fileSubmenu.appendChild(new MenuItem('Save As...', 'S', 'shift'));
   * fileSubmenu.appendChild(new MenuItemSeparator());
   * fileSubmenu.appendChild(new MenuItem('Close', 'c', 'cmd'));
   * fileMenu.submenu = fileSubmenu;
   * 
   * var editSubmenu = new Menu('Edit');
   * var undo = new MenuItem('Undo', 'u');
   * undo.addEventListener('click', function() { application.undo(); });
   * editSubmenu.appendChild(undo);
   * editSubmenu.appendChild(new MenuItem('Redo', 'r'))
   *    .addEventListener('click', function() { application.redo(); });
   * editSubmenu.appendChild(new MenuItemSeparator());
   * editSubmenu.appendChild(new MenuItem('Copy', 'c'))
   *    .addEventListener('click', function() { application.copy(); });
   * editSubmenu.appendChild(new MenuItem('Cut', 'x'))
   *     .addEventListener('click', function() { application.cut(); });
   * editSubmenu.appendChild(new MenuItem('Paste', 'p'))
   *    .addEventListener('click', function() { application.paste(); });
   * editMenu.submenu = editSubmenu;
   * 
   * var windowSubmenu = new Menu('Window');
   * windowSubmenu.appendChild(new MenuItem('Minimize', 'm'))
   *     .addEventListener('click', function() { win.state = "minimized"; });
   * windowSubmenu.appendChild(new MenuItem('Zoom', ''))
   *     .addEventListener('click', function() { win.state = "maximized"; });
   * windowSubmenu.appendChild(new MenuItemSeparator());
   * windowSubmenu.appendChild(new MenuItem('Bring All to Front', ''))
   *     .addEventListener('click', function() { win.bringToFront(); });
   * windowSubmenu.appendChild(new MenuItemSeparator());
   * windowMenu.submenu = windowSubmenu;
   * 
   * var helpSubmenu = new Menu('Help');
   * helpSubmenu.appendChild(new MenuItem('Website', ''));
   * helpSubmenu.appendChild(new MenuItem('Online Documentation', ''));
   * helpSubmenu.appendChild(new MenuItem('License', ''));
   * helpMenu.submenu = helpSubmenu;
   *
   * win.menu = mainMenu;
   */
  function Menu(title) {
    var $ = process.bridge.objc;
    if(typeof(title) === 'undefined') {
      title = "";
    }
    var id = (Math.random()*100000).toString();
    process.bridge.objc.delegates[id] = this;
    this.menuDelegate = tintMenuDelegate('alloc')('initWithJavascriptObject', $(id));
    var $menu = $.NSMenu('alloc')('initWithTitle',$(title));
    $menu('setDelegate', this.menuDelegate);
    var children = [];
    utilities.defEvents(this);

    /**
     * @method appendChild
     * @memberof Menu
     * @description Appends a menu item to this menu.
     * @param {MenuItem} menuitem The submenu item to add to the menu object.
     * @example
     * require('Common');
     * var win = new Window(); // Create a new window.
     * win.visible = true; // make sure the window is shown.
     * // Create a menu in OSX
     * var mainMenu = new Menu();
     * var appleMenu = new MenuItem(application.name, '');
     * var fileMenu = new MenuItem('File', '');
     * var editMenu = new MenuItem('Edit', '');
     * var windowMenu = new MenuItem('Window', '');
     * var helpMenu = new MenuItem('Help', '');
     * mainMenu.appendChild(appleMenu);
     * mainMenu.appendChild(fileMenu);
     * mainMenu.appendChild(editMenu);
     * mainMenu.appendChild(windowMenu);
     * mainMenu.appendChild(helpMenu);
     * 
     * var appleSubmenu = new Menu(application.name);
     * appleSubmenu.appendChild(new MenuItem('About '+application.name, ''));
     * appleSubmenu.appendChild(new MenuItemSeparator());
     * appleSubmenu.appendChild(new MenuItem('Hide '+application.name, 'h'))
     *    .addEventListener('click', function() { application.visible = false; });
     * appleSubmenu.appendChild(new MenuItem('Hide Others', ''))
     *    .addEventListener('click', function() { application.hideAllOtherApplications(); });
     * appleSubmenu.appendChild(new MenuItem('Show All', ''))
     *    .addEventListener('click', function() { application.unhideAllOtherApplications(); });
     * appleSubmenu.appendChild(new MenuItemSeparator());
     * appleSubmenu.appendChild(new MenuItem('Quit '+application.name, 'q'))
     *    .addEventListener('click', function() { process.exit(0); });
     * appleMenu.submenu = appleSubmenu;
     * win.menu = mainMenu;
     */
    this.appendChild = function(menuitem) {
      assert(menuitem.__proto__.constructor.name === "MenuItem" || 
        menuitem.__proto__.constructor.name === "MenuItemSeparator", 'Only MenuItem classes can be appended to a menu.');
      children.push(menuitem);
      $menu('addItem',menuitem.native);
      return menuitem;
    }

    /**
     * @method removeChild
     * @memberof Menu
     * @description Removes a menu item that is on this menu.
     * @param {MenuItem} menuitem The submenu item to remove from the menu object.
     */
    this.removeChild = function(menuitem) {
      if(children.indexOf(menuitem) !== -1) {
        children.splice(children.indexOf(menuitem),1);
        $menu('removeItem',menuitem.native);
      }
    }
    Object.defineProperty(this, 'native', {
        get:function() { return $menu; }
      });
  }
  Menu.getMacOSXDefaultMenu = function(name) {
    var MenuItem = require('MenuItem');
    var MenuItemSeparator = require('MenuItemSeparator');


    var mainMenu = new Menu();
    var appleMenu = new MenuItem(application.name, '');
    var fileMenu = new MenuItem('File', '');
    var editMenu = new MenuItem('Edit', '');
    var windowMenu = new MenuItem('Window', '');
    var helpMenu = new MenuItem('Help', '');
    mainMenu.appendChild(appleMenu);
    mainMenu.appendChild(fileMenu);
    mainMenu.appendChild(editMenu);
    mainMenu.appendChild(windowMenu);
    mainMenu.appendChild(helpMenu);

    var appleSubmenu = new Menu(application.name);
    appleSubmenu.appendChild(new MenuItem('About '+application.name, ''));
    appleSubmenu.appendChild(new MenuItemSeparator());
    appleSubmenu.appendChild(new MenuItem('Hide '+application.name, 'h'))
        .addEventListener('click', function() { application.visible = false; });
    appleSubmenu.appendChild(new MenuItem('Hide Others', ''))
        .addEventListener('click', function() { application.hideAllOtherApplications(); });
    appleSubmenu.appendChild(new MenuItem('Show All', ''))
        .addEventListener('click', function() { application.unhideAllOtherApplications(); });
    appleSubmenu.appendChild(new MenuItemSeparator());
    appleSubmenu.appendChild(new MenuItem('Quit '+application.name, 'q'))
        .addEventListener('click', function() { process.exit(0); });
    appleMenu.submenu = appleSubmenu;

    var fileSubmenu = new Menu('File');
    fileSubmenu.appendChild(new MenuItem('New File', 'f'));
    fileSubmenu.appendChild(new MenuItem('Open...', 'o'));
    fileSubmenu.appendChild(new MenuItem('Save', 's'));
    fileSubmenu.appendChild(new MenuItem('Save As...', 'S', 'shift'));
    fileSubmenu.appendChild(new MenuItemSeparator());
    fileSubmenu.appendChild(new MenuItem('Close', 'c', 'cmd'));
    fileMenu.submenu = fileSubmenu;

    var editSubmenu = new Menu('Edit');
    var undo = new MenuItem('Undo', 'z');
    undo.addEventListener('click', function() { application.undo(); });
    editSubmenu.appendChild(undo);
    editSubmenu.appendChild(new MenuItem('Redo', 'Z', 'shift'))
        .addEventListener('click', function() { application.redo(); });
    editSubmenu.appendChild(new MenuItemSeparator());
    editSubmenu.appendChild(new MenuItem('Copy', 'c'))
        .addEventListener('click', function() { application.copy(); });
    editSubmenu.appendChild(new MenuItem('Cut', 'x'))
        .addEventListener('click', function() { application.cut(); });
    editSubmenu.appendChild(new MenuItem('Paste', 'v'))
        .addEventListener('click', function() { application.paste(); });
    editSubmenu.appendChild(new MenuItem('Select All', 'a'))
        .addEventListener('click', function() { application.selectAll(); });
    editMenu.submenu = editSubmenu;

    var windowSubmenu = new Menu('Window');
    windowSubmenu.appendChild(new MenuItem('Minimize', 'm'))
        .addEventListener('click', function() { win.state = "minimized"; });
    windowSubmenu.appendChild(new MenuItem('Zoom', ''))
        .addEventListener('click', function() { win.state = "maximized"; });
    windowSubmenu.appendChild(new MenuItemSeparator());
    windowSubmenu.appendChild(new MenuItem('Bring All to Front', ''))
        .addEventListener('click', function() { win.bringToFront(); });
    windowSubmenu.appendChild(new MenuItemSeparator());
    windowMenu.submenu = windowSubmenu;
    
    var helpSubmenu = new Menu('Help');
    helpSubmenu.appendChild(new MenuItem('Website', ''));
    helpSubmenu.appendChild(new MenuItem('Online Documentation', ''));
    helpSubmenu.appendChild(new MenuItem('License', ''));
    helpMenu.submenu = helpSubmenu;


    return mainMenu;
  }
  return Menu;
})();