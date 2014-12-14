module.exports = (function() {
  var utilities = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.dotnet;

  function WebView(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.initViewOnly = true;
      Container.call(this, $.System.Windows.Controls.WebBrowser, $.System.Windows.Controls.WebBrowser, options);
    }

    var firstLoad = true;
    this.private.previousTitle = "";
    this.private.loading = false;
    this.private.useragent = "";

    this.nativeView.Navigate(new $.System.Uri("about:blank"));

    this.private.checkForNewTitle = function() {
      var currentTitle = this.nativeView.InvokeScript("eval",['document.title']);
      if(this.private.previousTitle != currentTitle) {
        this.private.previousTitle = currentTitle;
        this.fireEvent('title');
      }
    }.bind(this);

    this.nativeView.addEventListener('LoadCompleted', function() { 
      this.private.loading = false;
      setTimeout(function() {
        if(!this.nativeView.Source)
          this.fireEvent('error');
        else
        {
          this.nativeView.InvokeScript("eval",['window.postMessageToHost = function(e) { window.external.postMessageBack(e); };']);
          this.fireEvent('title');
          this.fireEvent('load');
        }
      }.bind(this),5);
    }.bind(this));
    this.nativeView.addEventListener('Navigated', function() { this.fireEvent('loading'); }.bind(this));
    this.nativeView.addEventListener('Navigating', function() {
      if(firstLoad) {
        // establish the activex instance, store a ref for later.
        this.private.comObject = this.native._axIWebBrowser2;

        // Use the activeX object to silent error messages.
        this.private.comObject.GetType().InvokeMember("Silent", $.System.Reflection.BindingFlags.SetProperty, null, this.private.comObject, [ true ], null, null, null);
        
        firstLoad = false;
      } else {
        this.fireEvent('unload');
        this.fireEvent('request');
      }
      this.private.loading = true;
      this.fireEvent('locationchange');
    }.bind(this));
  
    // Callback class for IE to call postMessage;
    function callbackHandle(str) {
      this.fireEvent('message',[str]);
    }
    var scriptInterface = process.bridge.createScriptInterface(callbackHandle.bind(this));
    this.nativeView.ObjectForScripting = scriptInterface;
    
    // TODO: Support events
    // redirect
    // icon
  }

  WebView.prototype = Object.create(Container.prototype);
  WebView.prototype.constructor = Container;

  WebView.prototype.back = function() { this.nativeView.GoBack(); }
  WebView.prototype.forward = function() { this.nativeView.GoForward(); }
  WebView.prototype.reload = function() { this.nativeView.Refresh(); }
  WebView.prototype.stop = function() { 
    this.private.loading = false;
    this.private.comObject.GetType().InvokeMember("Stop", $.System.Reflection.BindingFlags.InvokeMember, null, this.private.comObject, null, null, null, null);
    this.fireEvent('cancel');
  }

  WebView.prototype.postMessage = function(e) {
    var msg = "var msg=document.createEvent('MessageEvent');\n";
    msg += "msg.initMessageEvent('message',true,true,'"+e.toString().replace(/'/g,"\\'")+"','*',0,window);\n";
    msg += "window.dispatchEvent(msg);\n";
    this.execute(msg);
    this.private.checkForNewTitle();
  }

  WebView.prototype.execute = function(e) { 
    return this.nativeView.InvokeScript("eval",[e]);
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
    }
  });

  // TODO: Support
  Object.defineProperty(WebView.prototype, 'allowAnimatedImages', {
    get:function() { },
    set:function(e) { }
  });

  // TODO: Support
  Object.defineProperty(WebView.prototype, 'allowAnimatedImagesToLoop', {
    get:function() { },
    set:function(e) { }
  });

  // TODO: Support
  Object.defineProperty(WebView.prototype, 'allowJava', {
    get:function() { },
    set:function(e) { }
  });

  // TODO: Support
  Object.defineProperty(WebView.prototype, 'allowJavascript', {
    get:function() { },
    set:function(e) { }
  });

  // TODO: Support
  Object.defineProperty(WebView.prototype, 'allowPlugins', {
    get:function() { },
    set:function(e) { }
  });

  // Doesnt work on OSX, no path to support on IE.
  //Object.defineProperty(WebView.prototype, 'privateBrowsing', {
  //  get:function() {  },
  //  set:function(e) {  }
  //});

  // Indeterminate on windows.
  Object.defineProperty(WebView.prototype, 'progress', {
    get:function() { return -1; }
  });

  Object.defineProperty(WebView.prototype, 'location', {
    get:function() { return this.private.url; },
    set:function(url) { 
      this.private.url = url;
      // Win8 adds (or seemingly adds) new support for URI schemas, investigate url monikers
      // as well, asyncronous pluggable protocols wont work since they're system wide and
      // not app dependent.
      if(url.indexOf("app:") > -1)// && !application.packaged)
        url = url.replace("app:/","http://127.0.0.1:"+application.private.appSchemaPort+"/");
      this.nativeView.Navigate(new $.System.Uri(url));
    }
  });

  Object.defineProperty(WebView.prototype, "useragent", {
    get:function() {
      var userAgent = this.private.useragent;
      if(!userAgent)
        userAgent = this.nativeView.InvokeScript("eval",['navigator.userAgent']);
      return userAgent; 
    },
    set:function(e) { 
      if(application.warn)
        console.error('User agent is not yet supported on IE/Windows.');
      this.private.useragent = e;
    }
  });

  Object.defineProperty(WebView.prototype, 'loading', { 
    get:function() { return this.private.loading; },
    set:function(e) { if(e == false) this.stop(); }
  });

  //TODO: Enable support for this?  This requires bouncing IE's HWND
  // to a directX surface and potentially cleaning out the 'transparent'
  // color base then presenting it to a D3Dimage, more work required.
  Object.defineProperty(WebView.prototype, 'transparent', {
    get:function() { },
    set:function(e) { }
  });

  // Broken on OSX, not working on Windows.
  //Object.defineProperty(WebView.prototype, 'textScale', {
  //  get:function() {  },
  //  set:function(e) {  }
  //});

  Object.defineProperty(WebView.prototype, 'title', { 
    get:function() { return this.execute("document.title"); }
  });

  return WebView;
})();
