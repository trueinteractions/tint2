module.exports = (function() {
  var $ = process.bridge.dotnet;
  var utilities = require('Utilities');
  var Container = require('Container');

  function MenuItem(titlestring,keystring,keymodifiers) {
    if(typeof(keystring)=='undefined') keystring = "";
    if(typeof(keymodifiers)=='undefined') keymodifiers = "";

    this.private = {events:{},submenu:null,key:"",modifiers:"",imgOn:null,imgOff:null,img:null,custom:null,state:false};
    this.native = new $.System.Windows.Controls.MenuItem();
    this.native.addEventListener('Click', function() {
      this.fireEvent('click');
    }.bind(this));

    if(titlestring) this.title = titlestring;
    if(keystring) this.key = keystring;
    if(keymodifiers) this.modifiers = keymodifiers;
  }

  MenuItem.prototype.fireEvent = function(event, args) {
    if(this.private.events[event]) 
      (this.private.events[event]).forEach(function(item,index,arr) { item.apply(null,args); });
  }

  MenuItem.prototype.addEventListener = function(event, func) { 
    if(!this.private.events[event]) 
      this.private.events[event] = []; 
    this.private.events[event].push(func); 
  }

  MenuItem.prototype.removeEventListener = function(event, func) { 
    if(this.private.events[event] && this.private.events[event].indexOf(func) != -1) 
      this.private.events[event].splice(this.private.events[event].indexOf(func), 1); 
  }
/*
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
  Object.defineProperty(MenuItem.prototype, 'image', {
    get:function() { return this.private.img; },
    set:function(e) { 
      this.private.img = e;
      e = utilities.makeImage(e);
      if(e) this.native.Icon = e;
    }
  });

  Object.defineProperty(MenuItem.prototype, 'submenu', {
    get:function() { return this.private.submenu; },
    set:function(e) { 
      
      if(this.private.submenu != null) {
        var c = this.private.submenu.children;
        for(var i=0; i < c.length; i++) {
          this.native.Items.Remove(c[i].native);
          this.private.submenu.Items.Add(c[i].native);
        }
      }

      this.private.submenu = e;
      var c = this.private.submenu.children;
      this.native.Items.Clear();
      for(var i=0; i < c.length; i++) {
        this.private.submenu.native.Items.Remove(c[i].native);
        this.native.Items.Add(c[i].native);
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
    get:function() { return this.native('isEnabled'); },
    set:function(e) { return this.native('setEnabled',e); }
  });

  Object.defineProperty(MenuItem.prototype, 'hidden', {
    get:function() { return this.native('isHidden'); },
    set:function(e) { return this.native('setHidden',e); }
  });

  Object.defineProperty(MenuItem.prototype, 'key', {
    get:function() { return this.private.key; },
    set:function(e) {
      this.private.key = e;
      var mods = this.modifiers;
      if(e == "" || e == null || mods == "" || mods == null) {
        this.native.InputGestureText = "";
        return;
      }
      mods = this.modifiers.split(',');
      for(var i=0; i < mods.length; i++)
        mods[i] = utilities.capitalize(mods[i]);
      mods = mods.join('+');
      this.native.InputGestureText = mods + '+' + e.toString().toUpperCase();
    }
  });

  Object.defineProperty(MenuItem.prototype, 'modifiers', {
    get:function() { return this.private.modifiers; },
    set:function(e) { 
      this.private.modifiers = e;
      var key = this.key;
      if(e == "" || e == null || key == null || key == "") {
        this.native.InputGestureText = "";
        return;
      }
      e = e.split(',');
      for(var i=0; i < e.length; i++)
        e[i] = utilities.capitalize(e[i]);
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
      if(this.private.custom != null)
        this.native.Items.Remove(this.private.custom.native);
      this.private.custom = e;
      this.native.Items.Add(e.native);
    }
  });
  return MenuItem;

})();