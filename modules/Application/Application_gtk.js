(function() {
  if(typeof(global.__TINT) === 'undefined') {
    global.__TINT = {};
  }
  if(global.application) {
    return global.application;
  }
  require('Bridge');
  var util = require('Utilities');
  process.bridge.gobj.load('Gtk', '3.0');

  var $ = process.bridge.gobj;
  var $$ = process.bridge;
  var assert = require('assert');

  function Application() {
    var name = "", 
        badgeText = "", 
        dockmenu = null, 
        icon = "",
        hotKeys = [];
  
    this.registerHotKey = function(key, modifiers, func) {
      
    }.bind(this);

    this.unregisterAllHotKeys = function() {
       
    }.bind(this);
  
    Object.defineProperty(this, 'private', {value:{}, configurable:false, enumerable:false});
    this.private.windowCount = 0;
    this.native = null;

    util.defEvents(this);
    
    this.launch = function() {   };
    this.uninstall = function() { console.warn('unimplemented'); };

    util.def(this, 'packaged', function() {   } );

    this.resource = function(path) {
      if(path.indexOf('app:///') === -1) {
        path = 'app:///' + path.replace("app://","");
      }
      if(path === "app:///blank-page-appschema.html") {
        return new Buffer("<!doctype html>\n<html>\n<body></body></html>","utf8");
      }
      try {
        var data = "";
        data = new Buffer(data.toString(),'base64');
        return data;
      } catch (e) { 
        if(this.warn) {
          console.warn('Cannot find resource at: ', path);
        }
        return null;
      }
    };

    util.def(this, 'name',
      function() {  },
      function(e) {  }
    );

    //TODO: IMPLEMENT THIS: There is no complement in windows to this.  Custom?
    util.def(this, 'badge',
      function() {   },
      function(e) {  }
    );

    //TODO: IMPLEMENT THIS: There are jump lists in Windows however they do not
    // behave to dock menu's behavior in OSX, figure out a way of mapping these.
    util.def(this, 'dockmenu',
      function() {  },
      function(e) {  }
    );

    util.def(this, 'icon',
      function() {  },
      function(e) {
         
      }
    );

    util.def(this, 'exitAfterWindowsClose',
      function() {  },
      function(e) { 
         
      }
    );

    //TODO: No mapping for Windows!
    this.hideAllOtherApplications = function() { };
    this.unhideAllOtherApplications = function() { };

    util.def(this, 'visible',
      function() {
         
      },
      function(e) { 
         
      }
    );

    this.attention = function() {
       
      return {
        cancel:function() {
           
        }.bind(this)
      };
    };

    this.paste = function() { };
    this.copy = function() { };
    this.cut = function() {  };
    this.undo = function() {  };
    this.redo = function() { };
    this.delete = function() {   };
    this.selectAll = function() {   };
  }

  global.application = new Application();

  // Include the app schema. app:// registers on NSURL and for node require().
  require('AppSchema');

})();