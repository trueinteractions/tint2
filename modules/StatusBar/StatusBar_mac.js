module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');

  function StatusBar() {
    var $statusbar = $.NSStatusBar('systemStatusBar')('statusItemWithLength',-1), img = null, altimg = null, events = {};
    // This is collected immediately if its not retained explicitly.
    $statusbar('retain');

    //TODO: Inherit event listeners..?
    function fireEvent(event, args) {
      if(events[event]) 
        (events[event]).forEach(function(item,index,arr) { 
          if(Array.isArray(args))
            item.apply(null,args);
          else
            item.apply(null,[args]);
        });
    }
    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }

    var StatusBarDelegate = $.NSObject.extend('StatusBar'+Math.round(Math.random()*10000));
    StatusBarDelegate.addMethod('init:', '@@:', function(self) { return self; });
    StatusBarDelegate.addMethod('click:','v@:@', function(self,_cmd,sender) { 
      try {
        fireEvent('click');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    StatusBarDelegate.register();
    var StatusBarDelegateInstance = StatusBarDelegate('alloc')('init');

    $statusbar('setTarget',StatusBarDelegateInstance);
    $statusbar('setAction','click:');

    Object.defineProperty(this, 'title', {
      get:function() { return $statusbar('title'); },
      set:function(e) { $statusbar('setTitle', $(e)); }
    });

    this.setChild = function(e) { $statusbar('setView',e.native); }

    Object.defineProperty(this, 'menu', {
      set:function(e) { $statusbar('setMenu', e.native); }
    });

    Object.defineProperty(this, 'enabled', {
      get:function() { return $statusbar('isEnabled') ? true : false; },
      set:function(e) { $statusbar('setEnabled', e ? true : false); }
    });

    Object.defineProperty(this, 'tooltip', {
      get:function() { return $statusbar('toolTip'); },
      set:function(e) { $statusbar('setToolTip', $(e)); }
    });

    Object.defineProperty(this, 'native', {
      get:function() { return $statusbar; }
    });

    Object.defineProperty(this, 'nativeView', {
      get:function() { return $statusbar; }
    });

    Object.defineProperty(this, 'imageClicked', {
      get:function() { return altimg; },
      set:function(e) { 
        altimg = e; 
        e = utilities.makeNSImage(e);
        if(e) this.native('setAlternativeImage', e);
      }
    });

    Object.defineProperty(this, 'image', {
      get:function() { return img; },
      set:function(e) { 
        img = e;
        e = utilities.makeNSImage(e);
        if(e) this.native('setImage', e);
      }
    });

    this.close = function() { 
      $statusbar('release');
    }
  }
  return StatusBar;
})();