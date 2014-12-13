(function() {
  if(global.application) return global.application;
  require('Bridge');
  var utilities = require('Utilities');
  process.bridge.dotnet.import('mscorlib');
  process.bridge.dotnet.import('System.dll'); 
  process.bridge.dotnet.import('WPF\\WindowsBase.dll');
  process.bridge.dotnet.import('WPF\\PresentationCore.dll');
  process.bridge.dotnet.import('WPF\\PresentationFramework.dll');
  process.bridge.dotnet.import('System.Drawing'); 
    
  // Load the http module to create an http server.
  var http = require('http');
  var mimetype = {};
  mimetype['gz'] = 'application/gzip';
  mimetype['zip'] = 'application/zip';
  mimetype['pdf'] = 'application/pdf';
  mimetype['json'] = 'application/json';
  mimetype['js'] = 'application/javascript';
  mimetype['mp3'] = 'audio/mp3';
  mimetype['gif'] = 'image/gif';
  mimetype['jpg'] = mimetype['jpeg'] = 'image/jpeg';
  mimetype['png'] = 'image/png';
  mimetype['svg'] = 'image/svg+xml';
  mimetype['txt'] = 'text/plain';
  mimetype['html'] = mimetype['htm'] = 'text/html';
  mimetype['css'] = 'text/css';
  mimetype['xml'] = 'text/xml';
  mimetype['avi'] = 'video/avi';
  mimetype['mpeg'] = mimetype['mpg'] = 'video/mpeg';
  mimetype['mp4'] = 'video/mp4';
  mimetype['ogg'] = 'video/ogg';
  mimetype['webm'] = 'video/webm';
  mimetype['flv'] = 'video/x-flv';
  mimetype['mkv'] = 'video/x-matroska';
  // Part of the application schema (app://)
  var server = http.createServer(function (request, response) {
    var path = request.url;
    var data = "";
    var ext = path.substring(path.lastIndexOf('.')+1);
    try {
      var url = new $.System.Uri("app:/"+path);
      var stream = $.System.Net.WebRequest.Create(url).GetResponse().GetResponseStream();
      var reader = new $.System.IO.StreamReader(stream);
      data = reader.ReadToEnd();
    } catch (e) {
    }
    var mimeTypeFromExt = mimetype[ext];
    if(!mimeTypeFromExt) mimeTypeFromExt = 'text/plain';
    response.writeHead(200, {"Content-Type": mimeTypeFromExt});
    response.write(data);
    response.end("");
  });

  // Listen on port 8000, IP defaults to 127.0.0.1
  var port = Math.round(10000 + Math.random()*999);
  server.listen(port);

  // Include the app schema. app:// registers on NSURL and for node require().
  require('AppSchema');

  var $ = process.bridge.dotnet;

  function Application() {
    var events = {}, mainMenu = null, 
        name = "", badgeText = "", 
        dockmenu = null, icon = "";//, 
        //_windows = [];

    this.native = $.System.Windows.Application.Current;
    if(this.native == null)
      this.native = new $.System.Windows.Application();

    function fireEvent(event, args) {
      if(events[event])
        (events[event]).forEach(function(item,index,arr) {
          item.apply(null,args);
        });
    }

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }
    this.launch = function() { fireEvent('launch'); }.bind(this);
    this.uninstall = function() { console.warn('unimplemented'); }

    this.private = {};
    this.private.appSchemaPort = port;
    this.private.windowCount = 0;
    //TODO: implement this.
    Object.defineProperty(this, 'packaged', {
      get:function() { return process.packaged; }
    });

    this.resource = function(path) {
      if(path.indexOf('app:///') == -1) path = 'app:///' + path.replace("app://","");
      try {
        var url = new $.System.Uri(path);
        var stream = $.System.Net.WebRequest.Create(url).GetResponse().GetResponseStream();
        var reader = new $.System.IO.StreamReader(stream);
        var data = reader.ReadToEnd();
        return data;
      } catch (e) { 
        if(application.warn) console.warn('Cannot find resource at: ', path);
        return null;
      }
    }

//    Object.defineProperty(this, 'windows', {
//      get:function() { return _windows; }
//    });

    Object.defineProperty(this, 'name', {
      get:function() { return name || process.cwd(); },
      set:function(e) { name = e; }
    });

    //TODO: IMPLEMENT THIS: There is no complement in windows to this.  Custom?
    Object.defineProperty(this, 'badge', {
      get:function() { return badgeText; },
      set:function(e) {  badgeText = e; }
    });

    //TODO: IMPLEMENT THIS: There are jump lists in Windows however they do not
    // behave to dock menu's behavior in OSX, figure out a way of mapping these.
    Object.defineProperty(this, 'dockmenu', {
      get:function() { return dockmenu; },
      set:function(e) { dockmenu = e; }
    });

    Object.defineProperty(this, 'icon', {
      get:function() { return icon; },
      set:function(e) {
        icon = e;
        e = utilities.makeImage(e);
        if(e) {
          var coll = this.native.Windows.GetEnumerator();
          while(coll.MoveNext()) {
            var _win = coll.Current;
            _win.Icon = e.Source;
          }
        }
      }
    });

    Object.defineProperty(this, 'exitAfterWindowsClose', {
      get:function() { return this.native.ShutdownMode == $.System.Windows.ShutdownMode.OnLastWindowClose; },
      set:function(e) { 
        if(e)
          this.native.ShutdownMode = $.System.Windows.ShutdownMode.OnLastWindowClose;
        else
          this.native.ShutdownMode = $.System.Windows.ShutdownMode.OnExplicitShutdown;
      }
    });

    //TODO: No mapping for Windows!
    this.hideAllOtherApplications = function() { }
    this.unhideAllOtherApplications = function() { }

    Object.defineProperty(this, 'visible', {
      get:function() {
        var visible = false;
        var coll = this.native.Windows.GetEnumerator();
        while (coll.MoveNext()) {
          var _win = coll.Current;
          if(_win.Visibility == $.System.Windows.Visibility.Visible)
            visible = true;
        }
        return visible;
      },
      set:function(e) { 
        var coll = this.native.Windows.GetEnumerator();
        while (coll.MoveNext()) {
          var _win = coll.Current;
          if(e) _win.Visibility = $.System.Windows.Visibility.Visible;
          else _win.Visibility = $.System.Windows.Visibility.Hidden;
        }
      }
    })

    this.attention = function(critical) {
      var coll = this.native.Windows.GetEnumerator();
      while (coll.MoveNext()) {
        var _win = coll.Current;
        if(!_win.TaskbarItemInfo) _win.TaskbarItemInfo = new $.System.Windows.Shell.TaskbarItemInfo();
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
    }

    function GetActiveWindow() {
      var coll = this.native.Windows.GetEnumerator();
      while (coll.MoveNext()) {
        var _win = coll.Current;
        if(_win.IsActive) return _win;
        $.FlashWPFWindow.WindowExtensions.FlashWindow(_win,20);
      }
      return null;
    }

    this.paste = function() {
      var _win = GetActiveWindow();
      if(_win != null)
        $.System.Windows.Input.ApplicationCommands.Paste.Execute(null,_win);
    }
    this.copy = function() {
      var _win = GetActiveWindow();
      if(_win != null)
        $.System.Windows.Input.ApplicationCommands.Copy.Execute(null,_win);
    }
    this.cut = function() {
      var _win = GetActiveWindow();
      if(_win != null)
        $.System.Windows.Input.ApplicationCommands.Cut.Execute(null,_win);
    }
    this.undo = function() {
      var _win = GetActiveWindow();
      if(_win != null)
        $.System.Windows.Input.ApplicationCommands.Undo.Execute(null,_win);
    }
    this.redo = function() {
      var _win = GetActiveWindow();
      if(_win != null)
        $.System.Windows.Input.ApplicationCommands.Redo.Execute(null,_win);
    }
    this.delete = function() {
      var _win = GetActiveWindow();
      if(_win != null)
        $.System.Windows.Input.ApplicationCommands.Delete.Execute(null,_win);
    }
    this.selectAll = function() {
      var _win = GetActiveWindow();
      if(_win != null)
        $.System.Windows.Input.ApplicationCommands.SelectAll.Execute(null,_win);
    }
  }

  global.application = new Application();
})();
