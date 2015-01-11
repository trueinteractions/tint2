module.exports = (function() {
  if(global.__TINT.WebView) {
    return global.__TINT.WebView;
  }

  var util = require('Utilities');
  var Container = require('Container');
  var $ = process.bridge.dotnet;
  var $$ = process.bridge.win32;

  function WebView(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.WebBrowser;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.WebBrowser;
    Container.call(this, options);

    var firstLoad = true;
    this.private.previousTitle = "";
    this.private.loading = false;
    this.private.useragent = "";

    this.private.checkForNewTitle = function() {
      var currentTitle = this.nativeView.InvokeScript("eval",['document.title']);
      if(this.private.previousTitle !== currentTitle) {
        this.private.previousTitle = currentTitle;
        this.fireEvent('title');
      }
    }.bind(this);

    this.nativeView.addEventListener('LoadCompleted', function() { 
      this.private.loading = false;
      setTimeout(function() {
        if(!this.nativeView.Source) {
          this.fireEvent('error');
        } else {
          this.nativeView.InvokeScript("eval",['window.postMessageToHost = function(e) { window.external.postMessageBack(e); };']);
          this.fireEvent('title');
          this.fireEvent('load');
        }
      }.bind(this),105);
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

    this.private.comObject.addEventListener('NewWindow', function(url, flags, targetFrame, postData, headers, processed) {
      console.log('** new window **');
      console.log('url: ', url);
      console.log('flags: ', flags);
      console.log('targetFrame: ', targetFrame);
      console.log('postData: ', postData);
      console.log('headers: ', headers);
      console.log('processed: ', processed);
    }.bind(this));

    this.private.comObject.addEventListener('ProgressChange', function(progress, progress_max) {
      console.log('** progress **');
      console.log('progress: ', progress);
      console.log('progress_max: ', progress_max);
    }.bind(this));

    this.private.comObject.addEventListener('DownloadBegin', function() {
      console.log('** download **');
      console.log(arguments);
    }.bind(this));

    this.private.comObject.addEventListener('FileDownLoad', function(pvbCancel) {
      console.log('** file download **');
      console.log(pvbCancel);
    }.bind(this));

    this.private.comObject.addEventListener('TitleChange', function(bstrTitleText) {
      console.log('** title change **');
      console.log(bstrTitleText);
    }.bind(this));


    // TODO: Support events
    // redirect
    // icon

    // TODO: Support new-window event.
    
    // If we don't have a document loaded IE will throw an error if anything
    // other than a location is set, so we'll set an intiial location to prevent this.
    this.nativeView.Navigate(new $.System.Uri("http://127.0.0.1:" + application.private.appSchemaPort + "/this-is-a-blank-page-for-ie-fix.html"));
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
    msg += "msg.initMessageEvent('message',true,true,'" + 
      e.toString().replace(/'/g,"\\'") + 
      "','*',0,window);\n";
    msg += "window.dispatchEvent(msg);\n";
    this.execute(msg);
    this.private.checkForNewTitle();
  }

  WebView.prototype.execute = function(e) { 
    return this.nativeView.InvokeScript("eval",[e]);
  }

  util.def(WebView.prototype, 'icon',
    function() {
      // TODO: Support icon.
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
  );

  // Indeterminate on windows.
  // TODO: Support progress
  util.def(WebView.prototype, 'progress',
    function() { return -1; }
  );

  util.def(WebView.prototype, 'location',
    function() { return this.private.url; },
    function(url) { 
      this.private.url = url;
      // Win8 adds (or seemingly adds) new support for URI schemas, investigate url monikers
      // as well, asyncronous pluggable protocols wont work since they're system wide and
      // not app dependent. Eventually we'll find a way to not use this side-ways hack.
      if(url.indexOf("app:") > -1)// && !application.packaged)
        url = url.replace("app:/","http://127.0.0.1:"+application.private.appSchemaPort+"/");
      this.nativeView.Navigate(new $.System.Uri(url));
    }
  );

  util.def(WebView.prototype, "useragent",
    function() {
      var userAgent = this.private.useragent;
      if(!userAgent)
        userAgent = this.nativeView.InvokeScript("eval",['navigator.userAgent']);
      return userAgent; 
    },
    function(e) {
      this.private.useragent = e;
      $$.urlmon.UrlMkSetSessionOption($$.urlmon.URLMON_OPTION_USERAGENT, e, e.length, 0);
    }
  );

  util.def(WebView.prototype, 'loading', 
    function() { return this.private.loading; },
    function(e) { if(e == false) this.stop(); }
  );


  util.def(WebView.prototype, 'title', 
    function() { return this.execute("document.title"); }
  );

  global.__TINT.WebView = WebView;
  return WebView;
})();