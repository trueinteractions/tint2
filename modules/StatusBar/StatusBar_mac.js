module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  var Menu = require('Menu');

  /**
   * @class StatusBar
   * @description The status bar acts as a consistant element in the UI that can be accessed even if all other windows
   *              are closed.  It can also have status indicators as icons or text to represent the state.  On OSX this
   *              creates a new icon or text label in the Status Bar area.  In Windows this creates a new task tray icon.
   */
  /**
   * @new 
   * @memberof StatusBar
   * @description Creates a new status bar.
   * @example
   *  require('Common');
   *  application.exitAfterWindowsClose = false;
   *  var webview = new WebView();
   *  var popOver = new PopOver();
   *  webview.left = webview.right = webview.top = webview.bottom = 0;
   *  popOver.appendChild(webview);
   *  var statusBar = new StatusBar();
   *  statusBar.image = "./tools/tint.png"
   *  statusBar.on('click', function() {
   *    popOver.open(statusBar, 'top');
   *  });
   */
  function StatusBar(properties) {
    this.private = {events:{},submenu:null,imgOn:null,img:null,custom:null,custommenu:null};
    this.private.delegateClass = $.NSObject.extend('StatusBar'+Math.round(Math.random()*10000000).toString());
    /**
     * @event click
     * @memberof StatusBar
     * @description Fires when the user clicks on the statusbar icon, this will not fire if a menu
     *              is placed on the status bar or if a custom view is set. To overcome this see the
     *              'opened' and 'closed' event on the Menu object (if a menu is set), if a custom view
     *              is set add the click handler to that view.
     */
    this.private.clickCallback = function() {
      try {
        this.fireEvent('click');
      } catch (e) {
        console.error(e.message);
        console.error(e.stack);
        process.exit(1);
      }
    }.bind(this);
    this.private.delegateClass.addMethod('click:', 'v@:@', this.private.clickCallback);
    this.private.delegateRef = this.private.delegateClass.register();
    this.private.delegate = this.private.delegateClass('alloc')('init');
    this.native = $.NSStatusBar('systemStatusBar')('statusItemWithLength',-1);
    this.native('retain'); // required else we'll find it GC'd 
    this.native('setTarget', this.private.delegate);
    this.native('setAction','click:');
    utilities.setProperties(this, properties, false);
  }

  /**
   * @method addEventListener
   * @param {string} eventName The name of the event to start listening to.
   * @param {function} callback The function that will be called when it occurs.
   * @memberof StatusBar
   * @description Adds an event listener for events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              to call when the event happens (e.g., a callback).
   */
  /**
   * @method removeEventListener
   * @param {string} eventName The name of the event to stop listening to.
   * @param {function} callback The function that would have been called.
   * @memberof StatusBar
   * @description Removes an event listener for events. The first
   *              parameter is the name of the event, the second parameter is the function
   *              that was originally given as the callback for addEventListener.
   */
   utilities.defEvents(StatusBar.prototype);

  /**
   * @method close
   * @memberof StatusBar
   * @description Closes the status bar and removes it from operating system UI.
   */
  StatusBar.prototype.close = function() { 
    this.native('release');
  };

  StatusBar.prototype.makeImageTemplate = function() {
    var e = utilities.makeNSImage(this.private.img);
    e('setTemplate', $.YES);
    var rep = e('representations')('objectAtIndex', 0);
    rep('setSize', $.NSMakeSize(18,18));
    if(e) {
      this.native('setImage', e);
    }
  };

  /**
   * @member image
   * @type {string}
   * @memberof StatusBar
   * @description Gets or sets the image used in the status bar.  The image is automatically
   *              resized to fit the OS requirements.  An image can be a url including the app:// schema,
   *              or can be named system icon.
   */
  Object.defineProperty(StatusBar.prototype, 'image', {
    get:function() { return this.private.img; },
    set:function(e) { 
      this.private.img = e;
      e = utilities.makeNSImage(e);
      var rep = e('representations')('objectAtIndex', 0);
      rep('setSize', $.NSMakeSize(18,18));
      if(e) {
        this.native('setImage', e);
      }
    }
  });

  // TODO: Remove this, its deprecated in OSX and unsupported in Windows.
  Object.defineProperty(StatusBar.prototype, 'length', {
    get:function() { return this.native('length'); },
    set:function(e) { this.native('setLength', e); }
  });

  /**
   * @member menu
   * @type {Menu}
   * @memberof StatusBar
   * @description Gets or sets the menu to display when the user clicks on the status bar. 
   *              NOTE: When a menu is set the click event is ignored and the menu is opened.
   */
  Object.defineProperty(StatusBar.prototype, 'menu', {
    get:function() { return this.private.submenu; },
    set:function(e) {
      if(e.__proto__.constructor.name === "Menu") {
        this.private.submenu = e;
        this.native('setMenu',e.native);
        e.addEventListener('opened', function() {
          this.fireEvent('click');
        }.bind(this));
        e.addEventListener('closed', function() {
          this.fireEvent('click');
        }.bind(this));
      } else {
        throw new Error("The passed in object was not a valid menu object.");
      }
    }
  });

  // TODO: Remove this, its depcreated in OSX and unsupported on Windows.
  Object.defineProperty(StatusBar.prototype, 'highlight', {
    get:function() { return this.native('highlightMode') === $.YES ? true : false; },
    set:function(e) { this.native('setHighlightMode', e ? $.YES : $.NO); }
  });

  /**
   * @member title
   * @type {string}
   * @memberof StatusBar
   * @description Gets or sets the title of the status bar. Most status bar's do not have 
   *              titles and only icons. The title should be limited to no more than 3 words
   *              as the space available is limited.
   */
  Object.defineProperty(StatusBar.prototype, 'title', {
    get:function() { return this.native('title')('UTF8String'); },
    set:function(e) { return this.native('setTitle',$(e)); }
  });

  /**
   * @member enabled
   * @type {boolean}
   * @memberof StatusBar
   * @description Gets or sets whether the status bar displays as "active" or "disabled". The
   *              disabled state grays out the icon and title, in addition it does not respond
   *              to mouse or keyboard actions.
   */
  Object.defineProperty(StatusBar.prototype, 'enabled', {
    get:function() { return this.native('isEnabled'); },
    set:function(e) { return this.native('setEnabled',e); }
  });

  /**
   * @member tooltip
   * @type {string}
   * @memberof StatusBar
   * @description Gets or sets the text displayed when the user keeps the mouse cursor over the
   *              icon without taking any action. This can be thought of as a description as to
   *              what the status bar does.
   */
  Object.defineProperty(StatusBar.prototype, 'tooltip', {
    get:function() { return this.native('toolTip')('UTF8String'); },
    set:function(e) { return this.native('setToolTip',$(e)); }
  });

  // TODO: Remove this, its depcreated in OSX and unsupported on Windows.
  // Note: setting a custom view overrides title, tooltip, enabled, highlight, menu
  // and events such as mousedown, mouseup, etc.
  Object.defineProperty(StatusBar.prototype, 'custom', {
    get:function() { return this.private.custom; },
    set:function(e) {
      this.private.custom = e;
      this.nativeView = e.nativeView;
      if(this.length === -1) {
        this.length = 22; // set a default.
      }
      return this.native('setView',e.nativeView);
    }
  });

  // TODO: Remove this, its depcreated in OSX and unsupported on Windows.
  Object.defineProperty(StatusBar.prototype, 'custommenu', {
    get:function() { return this.private.custommenu; },
    set:function(e) {
      if(e instanceof Menu) {
        this.private.custommenu = e;
        return this.native('popUpStatusItemMenu',e.native);
      } else {
        throw new Error("The passed in object was not a valid menu object.");
      }
    }
  });
  return StatusBar;

})();
