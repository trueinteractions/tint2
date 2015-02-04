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

  function Application() {
    var name = "", 
        badgeText = "", 
        dockmenu = null, 
        icon = "";

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
        var reader = new $.System.IO.StreamReader(stream);
        var data = reader.ReadToEnd();
        reader.Close();
        stream.Close();
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
