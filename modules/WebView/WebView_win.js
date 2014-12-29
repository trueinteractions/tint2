module.exports = (function() {

  if(global.__TINT.WebView) {
    return global.__TINT.WebView;
  }

  var Container = require('Container');
  var $ = process.bridge.dotnet;
  $.import('System.Windows.Forms.dll');
  $.import('WPF\\WindowsFormsIntegration.dll');

  function WebView(options) {
    options = options || {};
    options.nonStandardEvents = true;
    this.nativeClass = this.nativeClass || $.System.Windows.Forms.WebBrowser;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Forms.WebBrowser;

    Container.call(this, options);

    this.private.webview = this.nativeView;
    this.native = this.nativeView = new $.System.Windows.Forms.Integration.WindowsFormsHost();
    this.native.Child = this.private.webview;
    this.private.progress = -1;
    this.private.previousTitle = "";
    this.private.loading = false;
    this.private.useragent = "";

    this.private.checkForNewTitle = function() {
      var currentTitle = this.private.webview.Document.InvokeScript("eval",['document.title']);
      if(this.private.previousTitle !== currentTitle) {
        this.private.previousTitle = currentTitle;
        this.fireEvent('title');
      }
    }.bind(this);

    this.private.webview.addEventListener('ProgressChanged', function(E, a) {
      var z = process.bridge.dotnet.fromPointer(a);
      if(e.CurrentProgress < 0 || z.MaximumProgress !== 0) {
        this.private.progress = -1;
      } else {
        this.private.progress = z.CurrentProgress / z.MaximumProgress;
      }
    });

    this.private.webview.ScriptErrorsSuppressed = true;

    this.private.webview.addEventListener('DocumentCompleted', function() {
      this.private.loading = false;
      setTimeout(function() {
        if(!this.private.webview.Url) {
          this.fireEvent('error');
        } else {
          this.private.webview.Document.InvokeScript("eval",['window.postMessageToHost = function(e) { window.external.postMessageBack(e); };']);
          this.fireEvent('title');
          this.fireEvent('load');
        }
      }.bind(this),105);
    }.bind(this));

    this.private.webview.addEventListener('Navigated', function() {
      this.fireEvent('loading'); 
    }.bind(this));

    this.private.webview.addEventListener('Navigating', function() {
      this.fireEvent('unload');
      this.fireEvent('request');
      this.private.loading = true;
      this.fireEvent('locationchange');
    }.bind(this));

    this.private.webview.addEventListener('DocumentTitleChanged', function() {
      this.fireEvent('title');
    });

    this.private.webview.addEventListener('NewWindow', function(a, b) {
      var y = process.bridge.dotnet.fromPointer(a);
      var z = process.bridge.dotnet.fromPointer(b);
      this.fireEvent('new-window');
      // TODO: determine url, and decide how this should be handled...
    });

    // Callback class for IE to call postMessage;
    function callbackHandle(str) {
      this.fireEvent('message',[str]);
    }
    var scriptInterface = process.bridge.createScriptInterface(callbackHandle.bind(this));
    this.private.webview.ObjectForScripting = scriptInterface;

    // TODO: Support events
    // redirect
    // icon

    // If we don't have a document loaded IE will throw an error if anything
    // other than a location is set, so we'll set an intiial location to prevent this.
    this.private.webview.Navigate(new $.System.Uri("http://127.0.0.1:" + application.private.appSchemaPort + "/this-is-a-blank-page-for-ie-fix.html"));
  }

  WebView.prototype = Object.create(Container.prototype);
  WebView.prototype.constructor = Container;

  WebView.prototype.back = function() { this.private.webview.GoBack(); }
  WebView.prototype.forward = function() { this.private.webview.GoForward(); }
  WebView.prototype.reload = function() { this.private.webview.Refresh(); }
  WebView.prototype.stop = function() { 
    this.private.loading = false;
    this.private.webview.Stop();
    this.fireEvent('cancel');
  }

  WebView.prototype.postMessage = function(e) {
    var msg = "var msg=document.createEvent('MessageEvent');\n";
    msg += "msg.initMessageEvent('message',true,true,'" + e.toString().replace(/'/g,"\\'") + "','*',0,window);\n";
    msg += "window.dispatchEvent(msg);\n";
    this.execute(msg);
    this.private.checkForNewTitle();
  }

  WebView.prototype.execute = function(e) { 
    return this.private.webview.Document.InvokeScript("eval",[e]);
  }

  Object.defineProperty(WebView.prototype, 'icon', {
    get:function() {
      /**var exeCmd = "function(){\n"+
        "var favicon = undefined;\n"+
        "var nodeList = document.getElementsByTagName('link');\n"+
        "for (var i = 0; nodeList && (i < nodeList.length); i++)\n"+
        "  if((nodeList[i].getAttribute('rel') == 'icon')||(nodeList[i].getAttribute('rel') == 'shortcut icon'))\n"+
        "      favicon = nodeList[i].getAttribute('href');\n"+
        "return favicon; }()";
      return this.execute(exeCmd);**/
      return null;
    }
  });

  // Indeterminate on windows.
  Object.defineProperty(WebView.prototype, 'progress', {
    get:function() { return this.private.progress; }
  });

  Object.defineProperty(WebView.prototype, 'location', {
    get:function() { return this.private.url; },
    set:function(url) { 
      this.private.url = url;
      // Win8 adds (or seemingly adds) new support for URI schemas, investigate url monikers
      // as well, asyncronous pluggable protocols wont work since they're system wide and
      // not app dependent.
      if(url.indexOf("app:") > -1) {
        url = url.replace("app:/","http://127.0.0.1:"+application.private.appSchemaPort+"/");
      }
      this.private.webview.Navigate(new $.System.Uri(url));
    }
  });

  Object.defineProperty(WebView.prototype, "useragent", {
    get:function() {
      var userAgent = this.private.useragent;
      if(!userAgent) {
        userAgent = this.private.webview.Document.InvokeScript("eval",['navigator.userAgent']);
      }
      return userAgent; 
    },
    set:function(e) { 
      if(global.application.warn) {
        console.error('User agent is not yet supported on IE/Windows.');
      }
      this.private.useragent = e;
    }
  });

  Object.defineProperty(WebView.prototype, 'loading', { 
    get:function() { return this.private.loading; },
    set:function(e) { if(e == false) this.stop(); }
  });


  Object.defineProperty(WebView.prototype, 'title', { 
    get:function() { return this.execute("document.title"); }
  });

  global.__TINT.WebView = WebView;
  return WebView;
})();
