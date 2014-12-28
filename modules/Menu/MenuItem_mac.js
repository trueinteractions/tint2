module.exports = (function() {
  if(global.__TINT.MenuItem) {
    return global.__TINT.MenuItem;
  }
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  var Container = require('Container');
  /**
   * @class MenuItem
   * @description A menu item object is an individual item within a menu. It allows you to stylize and
   *              control the click behavior of the menu item.  In addition its capabilities give access
   *              to providing application wide "hot keys" such as copy, and paste. MenuItem objects can
   *              only be appended to a Menu object.
   * @see Menu
   */
  /**
   * @new 
   * @memberof MenuItem
   * @param {string} title The text title or label of the menuitem.
   * @param {string} key The character for the hot-key that activates this menu item (optional)
   * @param {string} modifier The modifiers for the hot-key (optional).
   * @description Creates a new menuitem object.
   */
  function MenuItem(titlestring,keystring,keymodifiers) {
    keystring = keystring || "";
    keymodifiers = keymodifiers || "";
    this.private = {events:{},submenu:null,modifiers:"",imgOn:null,imgOff:null,img:null,custom:null,state:false};
    
    var TintMenuItemDelegate = $.NSObject.extend('TintMenuItemDelegate'+Math.round(Math.random()*100000));
    /**
     * @event click
     * @memberof MenuItem
     * @description Fires when the user clicks on the menu item or activates it with the keyboard shortcuts/arrows.
     */
    TintMenuItemDelegate.addMethod('click:','v@:@', function(self,_cmd,frame) { 
        this.fireEvent('click');
    }.bind(this));
    TintMenuItemDelegate.register();

    var menuDelegate = TintMenuItemDelegate('alloc')('init');
  	this.native = $.NSMenuItem('alloc')('initWithTitle',$(titlestring),'action','click:','keyEquivalent',$(keystring));
    this.native('setTarget',menuDelegate);
    this.native('setAction','click:');
    if(titlestring) {
      this.title = titlestring;
    }
    if(keystring) {
      this.key = keystring;
    }
    if(keymodifiers) {
      this.modifiers = keymodifiers;
    }
  }

  MenuItem.prototype.fireEvent = function(event, args) {
    if(this.private.events[event]) {
      (this.private.events[event]).forEach(function(item) { 
        item.apply(null,args);
      });
    }
  }
  /**
   * @method addEventListener
   * @param {string} eventName The name of the event to start listening to.
   * @param {function} callback The function that will be called when it occurs.
   * @memberof MenuItem
   * @description Adds an event listener for various control level events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              to call when the event happens (e.g., a callback).
   */
  MenuItem.prototype.addEventListener = function(event, func) { 
    if(!this.private.events[event]) {
      this.private.events[event] = [];
    }
    this.private.events[event].push(func); 
  }
  /**
   * @method removeEventListener
   * @param {string} eventName The name of the event to stop listening to.
   * @param {function} callback The function that would have been called.
   * @memberof MenuItem
   * @description Removes an event listener for various application level events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              that was originally given as the callback for addEventListener.
   */
  MenuItem.prototype.removeEventListener = function(event, func) { 
    if(this.private.events[event] && this.private.events[event].indexOf(func) !== -1) 
      this.private.events[event].splice(this.private.events[event].indexOf(func), 1); 
  }
/*
  TODO: See if we can support a hover state rather
  than these properties, do not transfer to other OS'
  Object.defineProperty(MenuItem.prototype, 'imageOn', {
    get:function() { return this.private.imgOn; },
    set:function(e) { 
      this.private.imgOn = e; 
      e = utilities.makeNSImage(e);
      if(e) this.native('setOnStateImage', e);
    }
  });

  Object.defineProperty(MenuItem.prototype, 'imageOff', {
    get:function() { return this.private.imgOff; },
    set:function(e) { 
      this.private.imgOff = e; 
      e = utilities.makeNSImage(e);
      if(e) this.native('setOffStateImage', e);
    }
  });
*/

  /**
   * @member image
   * @type {string}
   * @memberof MenuItem
   * @description Gets or sets the image that will be used for the menu item.
   *              This is placed as an icon next to menu items label. This can
   *              be any URL, including the app:// schema for referencing packaged
   *              resources, or it can be a named system icon resource.
   */
  Object.defineProperty(MenuItem.prototype, 'image', {
    get:function() { return this.private.img; },
    set:function(e) { 
      this.private.img = e;
      e = utilities.makeNSImage(e);
      if(e) {
        this.native('setImage', e);
      }
    }
  });

  /**
   * @member submenu
   * @type {Menu}
   * @memberof MenuItem
   * @description Gets or sets the submenu associated with this menu item.  If the
   *              menu item has sub items or a sub-menu of its own it can be set here.
   *              This by default is not set and null.
   * @default null
   */
  Object.defineProperty(MenuItem.prototype, 'submenu', {
    get:function() { return this.private.submenu; },
    set:function(e) { 
      this.private.submenu = e;
      this.native('setSubmenu',e.native);
    }
  });

  /**
   * @member checked
   * @type {boolean}
   * @memberof MenuItem
   * @description Gets or sets whether this menu item is "activated" or "highlighted" or
   *              "checked".  This is expressed differently depending on the native OS, on
   *              most operating systems it shows a checkbox next to the menu item, on some
   *              operating systems it affects the background color and highlight. By default
   *              this is false.
   * @default false
   */
  Object.defineProperty(MenuItem.prototype, 'checked', {
    get:function() { return this.private.state; },
    set:function(e) { 
      this.private.state = e ? true : false;
      this.native('setState', e ? 1 : 0);
    }
  });

  /**
   * @member title
   * @type {string}
   * @memberof MenuItem
   * @description Gets or sets the text label used for this menu item.
   */
  Object.defineProperty(MenuItem.prototype, 'title', {
    get:function() { return this.native('title')('UTF8String'); },
    set:function(e) { this.native('setTitle',$(e)); }
  });

  /**
   * @member enabled
   * @type {boolean}
   * @memberof MenuItem
   * @description Gets or sets whether the menu item is enabled or greyed out (disabled)
   *              Note that the item is still visible but does not respond to clicks and
   *              is visually denoted as inactive to the user.  This is useful when you want
   *              to express that the choice or selection in the menu item is not available
   *              at the moment.
   */
  Object.defineProperty(MenuItem.prototype, 'enabled', {
    get:function() { return this.native('isEnabled'); },
    set:function(e) { this.native('setEnabled',e); }
  });

  /**
   * @member visible
   * @type {boolean}
   * @memberof MenuItem
   * @description Gets or sets whether the menu item is shown or hidden. The default is true.
   * @default true
   */
  Object.defineProperty(MenuItem.prototype, 'visible', {
    get:function() { return this.native('isHidden'); },
    set:function(e) { this.native('setHidden',e); }
  });

  /**
   * @member key
   * @type {boolean}
   * @memberof MenuItem
   * @description Gets or sets what key (in combination with modifiers), when pressed,
   *              activates this menu.  This is useful when you want to provide a
   *              keyboard shortcut to a menu item so the user doesn't need to navigate
   *              or use their mouse (for instance, copy, or cmd/cntl+c would have 'c' for
   *              a key).  Each menu item must have a unique key and modifier combination
   *              (if one in set).  This is optional.
   */
  Object.defineProperty(MenuItem.prototype, 'key', {
    get:function() { return this.native('keyEquivalent')('UTF8String'); },
    set:function(e) { this.native('setKeyEquivalent',$(e)); }
  });

  /**
   * @member modifiers
   * @type {boolean}
   * @memberof MenuItem
   * @description Gets or sets what modifiers (in combination with key), when pressed,
   *              activates this menu.  This is useful when you want to provide a
   *              keyboard shortcut to a menu item so the user doesn't need to navigate
   *              or use their mouse (for instance, copy, or cmd/cntl+c would have 'c' for
   *              a key and 'cmd' for a modifier).  Each menu item must have a unique key 
   *              and modifier combination (if one in set).  This is optional.
   */
  Object.defineProperty(MenuItem.prototype, 'modifiers', {
    get:function() {
      var modifiersFlags = this.native('keyEquivalentModifierMask');
      var modifiersString = "";
      if(modifierFlags & $.NSShiftKeyMask) {
        modifiersString += ",shift";
      }
      if(modifierFlags & $.NSAlternateKeyMask) {
        modifiersString += ",alt";
      }
      if(modifiersFlags & $.NSCommandKeyMask) {
        modifiersString += ",cmd";
      }
      if(modifiersFlags & $.NSControlKeyMask) {
        modifiersString += ",ctrl";
      }
      return modifiersString.length > 0 ? modifiersString.substring(1) : "";
    },
    set:function(e) { 
      var modifiers = e.split(',');
      var modifierFlags = 0;
      modifiers.forEach(function(item) {
        if(item==='shift') {
          modifierFlags = modifierFlags | $.NSShiftKeyMask;
        }
        if(item==='alt') {
          modifierFlags = modifierFlags | $.NSAlternateKeyMask;
        }
        if(item==='cmd') {
          modifierFlags = modifierFlags | $.NSCommandKeyMask;
        }
        if(item==='ctrl') {
          modifierFlags = modifierFlags | $.NSControlKeyMask;
        }
      });
      this.native('setKeyEquivalentModifierMask',modifierFlags);
    }
  });

  /**
   * @member tooltip
   * @type {string}
   * @memberof MenuItem
   * @description Gets or sets the tooltip that is shown to the user if they
   *              hover over the menu item for more than a few seconds. This can be thought
   *              of as a description of what the menu item does. It shows as a fading in
   *              off-mouse window that lets the user know more about what the menu item
   *              does.
   */
  Object.defineProperty(MenuItem.prototype, 'tooltip', {
    get:function() { return this.native('toolTip')('UTF8String'); },
    set:function(e) { this.native('setToolTip',$(e)); }
  });

  /**
   * @member custom
   * @type {Control}
   * @memberof MenuItem
   * @description Gets or sets a custom control you'd like to place in the menu item.
   *              This is useful if you need to render more than just an icon or text in the
   *              menu item.  It provides a way for users to enhance menu functionality. Any
   *              Control can be added and will have its width and height constrained to the
   *              system defined area, the layout will also be dictated by the operating system.
   */
  Object.defineProperty(MenuItem.prototype, 'custom', {
    get:function() { return this.private.custom; },
    set:function(e) {
      if(e instanceof Container) {
        this.private.custom = e;
        this.nativeView = e.nativeView;
        return this.native('setView',e.nativeView);
      } else {
        throw new Error("The passed in object was not a valid container or control.");
      }
    }
  });

  global.__TINT.MenuItem = MenuItem;
  return MenuItem;

})();