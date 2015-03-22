module.exports = (function() {
  if(global.__TINT.WebView) {
    return global.__TINT.WebView;
  }

  var util = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.dotnet;
  var $$ = process.bridge.win32;

  function WebView(options) {
    $.import('System.Windows.Forms'); 
    $.import('WPF\\WindowsFormsIntegration.dll');
    $.System.Windows.Forms.Application.EnableVisualStyles();

    options = options || {};
    var firstLoad = true;
    var previousUrl = "";
    this.nativeClass =  this.nativeClass || $.System.Windows.Controls.DockPanel;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.DockPanel;
    Container.call(this, options);
    this.private.interop = new $.System.Windows.Forms.Integration.WindowsFormsHost();
    this.private.browser = new $.System.Windows.Forms.WebBrowser();
    this.private.interop.Child = this.private.browser;
    this.nativeView.LastChildFill = true;
    this.nativeView.Children.Add(this.private.interop);
    this.private.interop.SetValue($.System.Windows.Controls.DockPanel.DockProperty, $.System.Windows.Controls.Dock.Bottom);
    this.private.browser.ScriptErrorsSuppressed = true;
    this.private.browser.AllowNavigation = true;

    // TODO: Support for 'auth', 'error', 'redirect' and proper support for 'location-change'
    //       e.g., only if the url changed.
    // TODO: Support on OSX.
    //this.private.browser.addEventListener('EncryptionLevelChanged', function(sender, eventObj) {
    //  eventObj = $.fromPointer(eventObj);
    //  console.log('got encryption level change: ',eventObj);
    //}.bind(this));
    //this.private.browser.addEventListener('FileDownload', function(sender, eventObj) {
    //  eventObj = $.fromPointer(eventObj);
    //  console.log('got file download: ',eventObj);
    //}.bind(this));

    this.private.documentLoadedHandler = function() {
      try {
        this.private.browser.Document.InvokeScript("eval",['window.postMessageToHost = function(e) { window.external.postMessageBack(e); };']);
        this.fireEvent('load');
      } catch(e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this);
    this.private.newWindowHandler = function(sender, eventObj) {
      try {
        sender = $.fromPointer(sender);
        eventObj = $.fromPointer(eventObj);
        var targetUrl = sender.StatusText;
        // This is awkward, but its mostly because of the need for the user to have
        // near complete control over the creation and disposition of the web view,
        // However there are a lot of settings that are pre-assigned (on OSX), so
        // we must create the webview to keep this consistent with OSX model.
        var newWebView = new WebView();
        var result = this.fireEvent('new-window', [newWebView, targetUrl]);
       
        if(result === false) {
          delete newWebView;
        } else {
          newWebView.location = targetUrl;
        }
        // Never allow the url to jump open in a new browser window.
        eventObj.Cancel = true;
      } catch (e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this);
    this.private.progressHandler = function(sender, eventObj) {
      try {
        eventObj = $.fromPointer(eventObj);
        var prog = eventObj.CurrentProgress / eventObj.MaximumProgress;
        if(prog < 0) {
          prog = 0;
        } else if (prog > 1) {
          prog = 1;
        } else if (isNaN(prog)) {
          prog = -1;
        }
        this.private.progress = prog;
      } catch (e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this);

    this.private.navigatedHandler = function() { 
      try {
        this.fireEvent('loading');
      } catch (e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this);
    this.private.navigatingHandler = function(sender, eventObj) {      
      try {
        eventObj = $.fromPointer(eventObj);
        var targetUrl = eventObj.Url.AbsoluteUri; 
        var result = this.fireEvent('policy', [targetUrl]);
        if(result === false) {
          eventObj.Cancel = true;
          return;
        }
        if(firstLoad) {
          firstLoad = false;
        } else {
          this.fireEvent('unload');
        }
        this.fireEvent('request');
        if(previousUrl !== targetUrl) {
          this.fireEvent('location-change',[previousUrl, targetUrl]);
          previousUrl = targetUrl;
        }
      } catch (e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this);

    this.private.browser.addEventListener('NewWindow', this.private.newWindowHandler);
    this.private.browser.addEventListener('ProgressChanged', this.private.progressHandler);
    this.private.browser.addEventListener('DocumentCompleted', this.private.documentLoadedHandler);
    this.private.browser.addEventListener('Navigated', this.private.navigatedHandler);
    this.private.browser.addEventListener('Navigating', this.private.navigatingHandler);
    
    // Callback class for IE to call postMessage;
    function callbackHandle(str) { this.fireEvent('message',[str]); }
    var scriptInterface = process.bridge.createScriptInterface(callbackHandle.bind(this));
    this.private.browser.ObjectForScripting = scriptInterface;

    // If we don't have a document loaded IE will throw an error if anything
    // other than a location is set, so we'll set an intiial location to prevent this.
    this.private.browser.Navigate(new $.System.Uri("http://127.0.0.1:" + application.private.appSchemaPort + "/blank-page-appschema.html"));
  }

  WebView.prototype = Object.create(Container.prototype);
  WebView.prototype.constructor = Container;

  WebView.prototype.back = function() {
    if(this.private.browser.CanGoBack) {
      this.private.browser.GoBack();
    } 
  }
  WebView.prototype.forward = function() {
    if(this.private.browser.CanGoForward) {
      this.private.browser.GoForward();
    }
  }
  WebView.prototype.reload = function() { this.private.browser.Refresh(); }
  WebView.prototype.stop = function() {
    this.private.browser.Stop();
    this.fireEvent('cancel');
  }

  WebView.prototype.boundsOnWindowOfElement = function(e, cb) {
    this.execute("var rect = document.querySelector('"+e+"').getBoundingClientRect();\n" +
                  "'{\"width\":'+rect.width+',\"height\":'+rect.height+',\"y\":'+rect.top+',\"x\":'+rect.bottom+'}';", 
                  function(r) { cb(JSON.parse(r)); });
  }

  WebView.prototype.postMessage = function(e) {
    var msg = "var msg=document.createEvent('MessageEvent');\n";
        msg += "msg.initMessageEvent('message',true,true,'" + 
                  e.toString().replace(/'/g,"\\'") +  "','*',0,window);\n";
        msg += "window.dispatchEvent(msg);\n";
    this.private.browser.Document.InvokeScript("eval",[msg]);
  }

  WebView.prototype.execute = function(e, cb) {
    var result = this.private.browser.Document.InvokeScript("eval",[e]);
    if(cb) {
      cb(result);
    }
    return result;
  }

  /*util.def(WebView.prototype, 'icon',
    function() {
      var exeCmd = "(function(){\n" +
        "var favicon = undefined, nodeList = document.getElementsByTagName('link');\n" +
        "for (var i = 0; nodeList && (i < nodeList.length); i++)\n" +
        "  if((nodeList[i].getAttribute('rel') == 'icon')||(nodeList[i].getAttribute('rel') == 'shortcut icon'))\n" +
        "      favicon = nodeList[i].getAttribute('href');\n" +
        "if(favicon && favicon[0]==='/') favicon = location.protocol + favicon;\n" +
        "return favicon; })();";
      return this.private.browser.InvokeScript("eval",[exeCmd]);
    }
  );*/

  util.def(WebView.prototype, 'progress',
    function() { return this.private.progress; }
  );

  util.def(WebView.prototype, 'location',
    function() {
      var url = this.private.browser.Url;
      return url === null ? null : url.AbsoluteUri; 
    },
    function(url) {
      // Win8 adds (or seemingly adds) new support for URI schemas, investigate url monikers
      // as well, asyncronous pluggable protocols wont work since they're system wide and
      // not app dependent. Eventually we'll find a way to not use this side-ways hack.
      if(url.indexOf("app:") > -1) {
        url = url.replace("app:/","http://127.0.0.1:"+application.private.appSchemaPort+"/");
      }
      this.private.browser.Url = new $.System.Uri(url);
    }
  );

  util.def(WebView.prototype, "useragent",
    function() { return this.private.browser.Document.InvokeScript("eval",['navigator.userAgent']); },
    function(e) { $$.urlmon.UrlMkSetSessionOption($$.urlmon.URLMON_OPTION_USERAGENT, e, e.length, $$.NULL); }
  );

  util.def(WebView.prototype, 'loading', 
    function() { return this.private.browser.IsBusy; },
    function(e) {
      if(e === false) {
        this.stop();
      }
    }
  );

  util.def(WebView.prototype, 'title', 
    function() { return this.private.browser.Document.InvokeScript("eval",["document.title"]); }
  );

  global.__TINT.WebView = WebView;
  return WebView;
})();
