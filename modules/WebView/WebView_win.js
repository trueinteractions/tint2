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

    this.private.loading = false;

    this.nativeView.addEventListener('LoadCompleted', function() { 
      this.private.loading = false;
      this.fireEvent('load');
      this.fireEvent('title');
    }.bind(this));
    this.nativeView.addEventListener('Navigated', function() { this.fireEvent('loading') }.bind(this));
    this.nativeView.addEventListener('Navigating', function() {
      this.private.loading = true;
      this.fireEvent('locationchange');
    }.bind(this));
    
    // cancel
    // unload
    // error
    // redirect
    // icon
    // request
    // close
  }

  WebView.prototype = Object.create(Container.prototype);
  WebView.prototype.constructor = Container;

  WebView.prototype.back = function() { this.nativeView.GoBack(); }
  WebView.prototype.forward = function() { this.nativeView.GoFroward(); }
  WebView.prototype.reload = function() { this.nativeView.Refresh(); }
  WebView.prototype.stop = function() { }

  WebView.prototype.postMessage = function(e) {
    var msg = "var msg=document.createEvent('MessageEvent');\n";
    msg += "msg.initMessageEvent('message',true,true,'"+e.toString().replace(/'/g,"\\'")+"');\n";
    msg += "window.dispatchEvent(msg);\n";
    this.execute(msg);
  }

  WebView.prototype.execute = function(e) { 
    return this.nativeView.InvokeScript("eval",[e]);  
  }

  Object.defineProperty(WebView.prototype, 'icon', {
    get:function() { }
  })

  // no
  Object.defineProperty(WebView.prototype, 'allowAnimatedImages', {
    get:function() { },
    set:function(e) { }
  });

  // no
  Object.defineProperty(WebView.prototype, 'allowAnimatedImagesToLoop', {
    get:function() { },
    set:function(e) { }
  });

  // no
  Object.defineProperty(WebView.prototype, 'allowJava', {
    get:function() { },
    set:function(e) { }
  });

  // no
  Object.defineProperty(WebView.prototype, 'allowJavascript', {
    get:function() { },
    set:function(e) { }
  });

  // no
  Object.defineProperty(WebView.prototype, 'allowPlugins', {
    get:function() { },
    set:function(e) { }
  });

  // no
  Object.defineProperty(WebView.prototype, 'privateBrowsing', {
    get:function() {  },
    set:function(e) {  }
  });

  // no
  Object.defineProperty(WebView.prototype, 'progress', {
    get:function() { }
  });

  // yes
  Object.defineProperty(WebView.prototype, 'location', {
    get:function() { return this.nativeView.Source.AbsoluteUri; },
    set:function(url) { this.nativeView.Source = new $.System.Uri(url); }
  });

  // no
  Object.defineProperty(WebView.prototype, "useragent", {
    get:function() {  },
    set:function(e) {  }
  });

  Object.defineProperty(WebView.prototype, 'loading', { 
    get:function() { return this.private.loading; },
    set:function(e) {  }
  });

  Object.defineProperty(WebView.prototype, 'transparent', {
    get:function() { },
    set:function(e) { }
  });

  Object.defineProperty(WebView.prototype, 'textScale', {
    get:function() {  },
    set:function(e) {  }
  });

  Object.defineProperty(WebView.prototype, 'title', { 
    get:function() { return this.execute("document.title"); }
  });

  return WebView;
})();
