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
    
  // Load the http module to create an http server.
  var http = require('http');
  var mimetype = {};
  mimetype.gz = 'application/gzip';
  mimetype.zip = 'application/zip';
  mimetype.pdf = 'application/pdf';
  mimetype.json = 'application/json';
  mimetype.js = 'application/javascript';
  mimetype.mp3 = 'audio/mp3';
  mimetype.gif = 'image/gif';
  mimetype.jpg = mimetype.jpeg = 'image/jpeg';
  mimetype.png = 'image/png';
  mimetype.svg = 'image/svg+xml';
  mimetype.txt = 'text/plain';
  mimetype.html = mimetype.htm = 'text/html';
  mimetype.css = 'text/css';
  mimetype.xml = 'text/xml';
  mimetype.avi = 'video/avi';
  mimetype.mpeg = mimetype.mpg = 'video/mpeg';
  mimetype.mp4 = 'video/mp4';
  mimetype.ogg = 'video/ogg';
  mimetype.webm = 'video/webm';
  mimetype.flv = 'video/x-flv';
  mimetype.mkv = 'video/x-matroska';
  // Part of the application schema (app://)
  var server = http.createServer(function (request, response) {
    var path = request.url;
    var data = "";
    var ext = path.substring(path.lastIndexOf('.')+1);
    // We need to serve a blank page to IE when it loads (not about:blank)
    // 
    if(path === "//this-is-a-blank-page-for-ie-fix.html") {
      data = new Buffer("<!doctype html>\n<html>\n<body>\n</body>\n</html>\n","utf8");
    } else {
      try {
        var url = new $.System.Uri("app:/"+path);
        var stream = $.System.Net.WebRequest.Create(url).GetResponse().GetResponseStream();
        var reader = new $.System.IO.StreamReader(stream);
        data = reader.ReadToEnd();
      } catch (e) {
      }
    }
    var mimeTypeFromExt = mimetype[ext];
    if(!mimeTypeFromExt) {
      mimeTypeFromExt = 'text/plain';
    }
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
    var name = "", 
        badgeText = "", 
        dockmenu = null, 
        icon = "";

    this.private = {};
    this.private.appSchemaPort = port;
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
      if(path === "app:///this-is-a-blank-page-for-ie-fix.html") {
        return new Buffer("<!doctype html>\n<html>\n<body></body></html>","utf8");
      }
      try {
        var url = new $.System.Uri(path);
        var stream = $.System.Net.WebRequest.Create(url).GetResponse().GetResponseStream();
        var reader = new $.System.IO.StreamReader(stream);
        var data = reader.ReadToEnd();
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
})();
