module.exports = (function() {
  var $ = process.bridge.dotnet;
  var utilities = require('Utilities');

  function MenuItem(titlestring,keystring,keymodifiers) {
    keystring = keystring || "";
    keymodifiers = keymodifiers || "";

    this.private = {events:{},submenu:null,key:"",modifiers:"",imgOn:null,imgOff:null,img:null,custom:null,state:false};
    this.native = new $.System.Windows.Controls.MenuItem();
    this.private.mouseDownHandler = function() {
      this.fireEvent('mousedown');
      this.fireEvent('click');
    }.bind(this);
    this.native.addEventListener('PreviewMouseDown', this.private.mouseDownHandler);

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

  utilities.defEvents(MenuItem.prototype);
/*
  Object.defineProperty(MenuItem.prototype, 'imageOn', {
    get:function() { return this.private.imgOn; },
    set:function(e) { 
      this.private.imgOn = e; 
      e = utilities.makeNSImage(e);
      if(e) {
        this.native('setOnStateImage', e);
      }
    }
  });

  Object.defineProperty(MenuItem.prototype, 'imageOff', {
    get:function() { return this.private.imgOff; },
    set:function(e) { 
      this.private.imgOff = e; 
      e = utilities.makeNSImage(e);
      if(e) { 
        this.native('setOffStateImage', e);
      }
    }
  });
*/
  Object.defineProperty(MenuItem.prototype, 'image', {
    get:function() { return this.private.img; },
    set:function(e) { 
      this.private.img = e;
      e = utilities.makeImage(e);
      if(e) {
        this.native.Icon = e;
      }
    }
  });

  Object.defineProperty(MenuItem.prototype, 'submenu', {
    get:function() { return this.private.submenu; },
    set:function(e) { 
      this.private.submenu = e;
      this.private.submenu.parent = this.native;
      for(var i=0; i < e.children.length ; i++) {
        this.native.Items.Add(e.children[i].native);
      }
    }
  });

  Object.defineProperty(MenuItem.prototype, 'checked', {
    get:function() { return this.private.state; },
    set:function(e) { 
      this.private.state = e ? true : false;
      this.native.IsChecked = this.private.state;
    }
  });

  Object.defineProperty(MenuItem.prototype, 'title', {
    get:function() { return this.native.Header.toString(); },
    set:function(e) { this.native.Header = e.toString(); }
  });

  Object.defineProperty(MenuItem.prototype, 'enabled', {
    get:function() { return this.native.IsEnabled; },
    set:function(e) { this.native.IsEnabled = (e ? true : false); }
  });

  Object.defineProperty(MenuItem.prototype, 'visible', {
    get:function() { return !this.native.IsVisible; },
    set:function(e) { this.native.IsVisible = (e ? false : true); }
  });

  Object.defineProperty(MenuItem.prototype, 'key', {
    get:function() { return this.private.key; },
    set:function(e) {
      this.private.key = e;
      var mods = this.modifiers;
      if(e === "" || e === null || mods === "" || mods === null) {
        this.native.InputGestureText = "";
        return;
      }
      mods = this.modifiers.split(',');
      for(var i=0; i < mods.length; i++) {
        mods[i] = utilities.capitalize(mods[i]);
      }
      mods = mods.join('+');
      this.native.InputGestureText = mods + '+' + e.toString().toUpperCase();
    }
  });

  Object.defineProperty(MenuItem.prototype, 'modifiers', {
    get:function() { return this.private.modifiers; },
    set:function(e) { 
      this.private.modifiers = e;
      var key = this.key;
      if(e === "" || e === null || key === null || key === "") {
        this.native.InputGestureText = "";
        return;
      }
      e = e.split(',');
      for(var i=0; i < e.length; i++) {
        e[i] = utilities.capitalize(e[i]);
      }
      e=e.join('+');
      e = e + "+" + key.toUpperCase();
      this.native.InputGestureText = e;
    }
  });

  Object.defineProperty(MenuItem.prototype, 'tooltip', {
    get:function() { return this.native.ToolTip; },
    set:function(e) { this.native.ToolTip = e.toString(); }
  });

  Object.defineProperty(MenuItem.prototype, 'custom', {
    get:function() { return this.private.custom; },
    set:function(e) {
      if(this.private.custom !== null) {
        this.native.Header = null;
        return;
      }
      var control = e.fireEvent('before-child-attached', [this.private.custom]) || e;
      control.native.Margin = new $.System.Windows.Thickness(0);
      this.private.custom = control;
      this.native.Header = control.native;
    }
  });
  return MenuItem;

})();