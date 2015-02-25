module.exports = (function() {
  if(global.__TINT.StatusBar) {
    return global.__TINT.StatusBar;
  }
  var $ = process.bridge.dotnet;
  var utilities = require('Utilities');
  var Menu = require('Menu');

  function StatusBar() {
    this.private = {
      events:{},
      submenu:null,
      imgOn:null,
      img:null,
      custom:null,
      custommenu:null,
      highlight:false,
      title:""
    };
    this.native = new $.System.Windows.Forms.NotifyIcon();
    this.native.addEventListener('Click', function() {
      this.fireEvent('click');
    }.bind(this));

    this.private.showContextMenu = function() {
      this.private.contextMenu.IsOpen = true;
    };
  }

  utilities.defEvents(StatusBar.prototype);

  StatusBar.prototype.close = function() { 
    this.native.Dispose();
  };

  // TODO: Remove this, its deprecated in OSX and unsupported in Windows.
  Object.defineProperty(StatusBar.prototype, 'imageHighlighted', {
    get:function() { return this.private.imgOn; },
    set:function(e) { this.private.imgOn = e; }
  });

  Object.defineProperty(StatusBar.prototype, 'image', {
    get:function() { return this.private.img; },
    set:function(e) {
      this.private.img = e;
      var icon = utilities.makeWinFormsIcon(e);
      this.native.Icon = icon;
      this.native.Visible = true;
    }
  });

  // TODO: Remove this, its deprecated in OSX and unsupported in Windows.
  Object.defineProperty(StatusBar.prototype, 'length', {
    get:function() { return 22; },
    set:function() { }
  });

  // TODO: Better more native way of handling this then converting to context menu
  // doesn't support overriding the menu once.
  Object.defineProperty(StatusBar.prototype, 'menu', {
    get:function() {
      return this.private.submenu;
    },
    set:function(e) {
      if(e instanceof Menu) {
        this.private.submenu = e;
        this.private.contextMenu = new $.System.Windows.Controls.ContextMenu();

        for(var i=0; i < e.children.length ; i++) {
          this.private.contextMenu.Items.Add(e.children[i].native);
        }

        this.native.addEventListener('MouseDown',this.private.showContextMenu.bind(this));
      } else {
        throw new Error("The passed in object was not a valid menu object.");
      }
    }
  });

  // TODO: Remove this, its depcreated in OSX and unsupported on Windows.
  Object.defineProperty(StatusBar.prototype, 'highlight', {
    get:function() { return this.private.highlight; },
    set:function(e) { this.private.highlight = e ? true : false; }
  });

  Object.defineProperty(StatusBar.prototype, 'title', {
    get:function() { return this.private.title; },
    set:function(e) { this.private.title = e; }
  });

  Object.defineProperty(StatusBar.prototype, 'enabled', {
    get:function() { return this.native.Visible ? true : false; },
    set:function(e) { this.native.Visible = e ? true : false; }
  });

  // TODO: Remove this, its not supported (effectively) in ODX.
  Object.defineProperty(StatusBar.prototype, 'tooltip', {
    get:function() { return this.native.Text.toString(); },
    set:function(e) { this.native.Text = e.toString(); }
  });

  // TODO: Remove this, its unsupported in Windows, and deprecated in OSX.
  Object.defineProperty(StatusBar.prototype, 'custom', {
    get:function() { return this.private.custom; },
    set:function(e) { this.private.custom = e; }
  });

  // TODO: Remove this, its depcreated in OSX and unsupported on Windows.
  //Object.defineProperty(StatusBar.prototype, 'custommenu', {
  //  get:function() { },
  //  set:function(e) { }
  //});

  global.__TINT.StatusBar = StatusBar;
  return StatusBar;

})();
