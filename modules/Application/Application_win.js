(function() {
  if(typeof(global.__TINT) === 'undefined') {
    global.__TINT = {};
  }
  if(global.application) {
    return global.application;
  }
  require('Bridge');
  var util = require('Utilities');
  process.bridge.dotnet.import('mscorlib');
  process.bridge.dotnet.import('System.dll');
  process.bridge.dotnet.import('WPF\\WindowsBase.dll');
  process.bridge.dotnet.import('WPF\\PresentationCore.dll');
  process.bridge.dotnet.import('WPF\\PresentationFramework.dll');
  process.bridge.dotnet.import('System.Drawing'); 

  var $ = process.bridge.dotnet;
  var $$ = process.bridge;
  var assert = require('assert');

  function Application() {
    var name = "", 
        badgeText = "", 
        dockmenu = null, 
        icon = "",
        hotKeys = [];

    process._win32_message = function(keyCode, modifiers) {
      var alt = $$.win32.user32.MOD_ALT = 0x0001 & modifiers ? true : false,
        ctrl = $$.win32.user32.MOD_CONTROL = 0x0002 & modifiers ? true : false,
        shift = $$.win32.user32.MOD_SHIFT = 0x0004 & modifiers ? true : false,
        cmd = $$.win32.user32.MOD_WIN = 0x0008 & modifiers ? true : false,
        key = String.fromCharCode(keyCode).toLowerCase();

      hotKeys.forEach(function(item) {
        if( ((item.modifiers.indexOf('alt') > -1 && alt) || (item.modifiers.indexOf('alt') === -1 && !alt)) &&
          ((item.modifiers.indexOf('ctrl') > -1 && ctrl) || (item.modifiers.indexOf('ctrl') === -1 && !ctrl)) &&
          ((item.modifiers.indexOf('cmd') > -1 && cmd) || (item.modifiers.indexOf('cmd') === -1 && !cmd)) &&
          ((item.modifiers.indexOf('shift') > -1 && shift) || (item.modifiers.indexOf('shift') === -1 && !shift)) && 
          key === item.key) 
        {
          item.func();
        }
      });
    }.bind(this);
  
    this.registerHotKey = function(key, modifiers, func) {
      assert(key.length === 1, 'A global hot key may only have one character.');
      key = key[0].toLowerCase();
      var mods = (modifiers.indexOf('alt') > -1 ? $$.win32.user32.MOD_ALT : 0) |
                 (modifiers.indexOf('ctrl') > -1 ? $$.win32.user32.MOD_CONTROL : 0) |
                 (modifiers.indexOf('cmd') > -1 ? $$.win32.user32.MOD_WIN : 0) |
                 (modifiers.indexOf('shift') > -1 ? $$.win32.user32.MOD_SHIFT : 0);
      var hotKeyData = {key:key, modifiers:modifiers, func:func, id:hotKeys.length+1};
      hotKeys.push(hotKeyData);
      var result = $$.win32.user32.RegisterHotKey(null, hotKeyData.id, mods, $$.win32.user32.VkKeyScanExW(key, $$.win32.user32.GetKeyboardLayout(0)));
      return { global:true, successful:result, unregister:function() { 
        $$.win32.user32.UnregisterHotKey(null, hotKeyData.id);
        hotKeys.splice(hotKeys.indexOf(hotKeyData),1);
      }};
    }.bind(this);

    this.unregisterAllHotKeys = function() {
      hotKeys.forEach(function(hotKeyData) {
        $$.win32.user32.UnregisterHotKey(null, hotKeyData.id);
        hotKeys.splice(hotKeys.indexOf(hotKeyData),1);
      });
    }.bind(this);
  
    Object.defineProperty(this, 'private', {value:{}, configurable:false, enumerable:false});
    this.private.windowCount = 0;
    this.native = $.System.Windows.Application.Current;
    if(this.native === null) {
      this.native = new $.System.Windows.Application();
    }

    util.defEvents(this);
    this.launch = function() { this.fireEvent('launch'); };
    this.uninstall = function() { console.warn('unimplemented'); };

    util.def(this, 'packaged', function() { return process.packaged; } );

    this.resource = function(path) {
      if(path.indexOf('app:///') === -1) {
        path = 'app:///' + path.replace("app://","");
      }
      if(path === "app:///blank-page-appschema.html") {
        return new Buffer("<!doctype html>\n<html>\n<body></body></html>","utf8");
      }
      try {
        var url = new $.System.Uri(path);
        var stream = $.System.Net.WebRequest.Create(url).GetResponse().GetResponseStream();
        // Windows CLR does not automatically translate byte[] objects to buffers, in addition
        // it fails when you need to pass an object by reference (arrays and buffers are just copied),
        // this makes dealing with buffers difficult as many of these systems use pass-by-reference.
        // One option is convert it to a string and be done with it, this fails at binary data, another
        // is to convert the enitre stream to base64 and then back into a buffer. This is a hack.
        // TODO: Fix this so that the CLR understands pass-by-reference (or other equiv fix).
        var b64stream = new $.System.Security.Cryptography.CryptoStream(stream, new $.System.Security.Cryptography.ToBase64Transform(), $.System.Security.Cryptography.CryptoStreamMode.Read);
        b64stream.Flush();
        var reader = new $.System.IO.StreamReader(b64stream);
        var data = reader.ReadToEnd();
        reader.Close();
        stream.Close();
        b64stream.Close();
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
      function() { return name || process.cwd(); },
      function(e) { name = e; }
    );

    //TODO: IMPLEMENT THIS: There is no complement in windows to this.  Custom?
    util.def(this, 'badge',
      function() { return badgeText; },
      function(e) {  badgeText = e; }
    );

    //TODO: IMPLEMENT THIS: There are jump lists in Windows however they do not
    // behave to dock menu's behavior in OSX, figure out a way of mapping these.
    util.def(this, 'dockmenu',
      function() { return dockmenu; },
      function(e) { dockmenu = e; }
    );

    util.def(this, 'icon',
      function() { return icon; },
      function(e) {
        icon = e;
        e = util.makeImage(e);
        if(e) {
          var coll = this.native.Windows.GetEnumerator();
          while(coll.MoveNext()) {
            var _win = coll.Current;
            _win.Icon = e.Source;
          }
        }
      }
    );

    util.def(this, 'exitAfterWindowsClose',
      function() { return this.native.ShutdownMode === $.System.Windows.ShutdownMode.OnLastWindowClose; },
      function(e) { 
        if(e) {
          this.native.ShutdownMode = $.System.Windows.ShutdownMode.OnLastWindowClose;
        } else {
          this.native.ShutdownMode = $.System.Windows.ShutdownMode.OnExplicitShutdown;
        }
      }
    );

    //TODO: No mapping for Windows!
    this.hideAllOtherApplications = function() { };
    this.unhideAllOtherApplications = function() { };

    util.def(this, 'visible',
      function() {
        var visible = false;
        var coll = this.native.Windows.GetEnumerator();
        while (coll.MoveNext()) {
          var _win = coll.Current;
          if(_win.Visibility === $.System.Windows.Visibility.Visible) {
            visible = true;
          }
        }
        return visible;
      },
      function(e) { 
        var coll = this.native.Windows.GetEnumerator();
        while (coll.MoveNext()) {
          var _win = coll.Current;
          if(e) { 
            _win.Visibility = $.System.Windows.Visibility.Visible;
          } else {
            _win.Visibility = $.System.Windows.Visibility.Hidden;
          }
        }
      }
    );

    this.attention = function() {
      var coll = this.native.Windows.GetEnumerator();
      while (coll.MoveNext()) {
        var _win = coll.Current;
        if(!_win.TaskbarItemInfo) {
          _win.TaskbarItemInfo = new $.System.Windows.Shell.TaskbarItemInfo();
        }
        _win.TaskbarItemInfo.ProgressState = $.System.Windows.Shell.TaskbarItemProgressState.Indeterminate;
      }
      return {
        cancel:function() {
          while (coll.MoveNext()) {
            var _win = coll.Current;
            _win.TaskbarItemInfo.ProgressState = $.System.Windows.Shell.TaskbarItemProgressState.None;
          }
        }.bind(this)
      };
    };

    // $.FlashWPFWindow.WindowExtensions.FlashWindow(_win,20);
    function execAppCommand(command) {
      var _win = null;
      var coll = this.native.Windows.GetEnumerator();
      while (coll.MoveNext()) {
        var tmp = coll.Current;
        if(_win.IsActive) {
          _win = tmp;
        }
      }
      if(_win !== null) {
        $.System.Windows.Input.ApplicationCommands[command].Execute(null,_win);
      }
    }

    this.paste = function() { execAppCommand('Paste'); };
    this.copy = function() { execAppCommand('Copy'); };
    this.cut = function() { execAppCommand('Cut'); };
    this.undo = function() { execAppCommand('Undo'); };
    this.redo = function() { execAppCommand('Redo'); };
    this.delete = function() { execAppCommand('Delete'); };
    this.selectAll = function() { execAppCommand('SelectAll'); };
  }

  global.application = new Application();

  // Include the app schema. app:// registers on NSURL and for node require().
  require('AppSchema');

})();
