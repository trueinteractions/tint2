module.exports = (function() {
  if(global.__TINT.WebView) {
    return global.__TINT.WebView;
  }
  var $ = process.bridge.objc;
  var util = require('Utilities');
  var Container = require('Container');
  var core = require('core');

  function createWebViewPolicyHandler() {
    var result = function(self, cmd, webview, action, request, frame, listener) {
      try {
        var presult = this.fireEvent('policy',[request('URL')('absoluteURL')('description')('UTF8String')]);
        if(typeof(presult) === 'undefined') {
          presult = true;
        }
        listener(presult ? 'use' : 'ignore');
      } catch (e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }
    return result;
  }

  function createWKWebViewPolicyHandler(pass,fail) {
    var result = function(self, cmd, webview, navigation, decisionHandler) {
      try {
        var presult = this.fireEvent('policy', [navigation('request')('URL')('absoluteURL')('description')('UTF8String')]);
        if(typeof(presult) === 'undefined') {
          presult = true;
        }
        var d = decisionHandler.reinterpret(32);
        var block = new core.__block_literal_1(d);
        var bfunc = core.createUnwrapperFunction(block.invoke,['v',['?','I']]);
        bfunc(block.ref(), presult ?  pass : fail);
      } catch (e) {
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }
    return result;
  }

  function createWebViewBridge() {
    if(!$.tintWebKitResponseDelegate) {
      if(!process.bridge.objc.delegates) {
        process.bridge.objc.delegates = {};
      }
      // This class implements a set of javascript -> objective-c functions on the object window.TintMessages
      // within each webview. This allows communication to-from webkit and our hosting JS instance. Only serializable
      // strings can be passed back-forth. For now, only post message is used.
      var tintWebKitResponseDelegate = $.NSObject.extend('tintWebKitResponseDelegate');
      tintWebKitResponseDelegate.addMethod('initWithJavascriptObject:', ['@',[tintWebKitResponseDelegate, $.selector, '@']], 
        util.errorwrap(function(self, cmd, id) {
          self.callback = process.bridge.objc.delegates[id.toString()];
          process.bridge.objc.delegates[id.toString()] = null;
          return self;
      }));
      tintWebKitResponseDelegate.addClassMethod('webScriptNameForSelector:','@@::', 
        util.errorwrap(function(self,_cmd,sel) { 
          return $("postMessage");
      }));
      tintWebKitResponseDelegate.addClassMethod('isSelectorExcludedFromWebScript:','B@::', 
        util.errorwrap(function(self,_cmd,sel) { 
          return sel === "postMessage" ? $.NO : $.YES;
      }));
      /**
       * @event message
       * @memberof WebView
       * @description Fires when the top frame HTML document has executed window.postMessageToHost().  The message is a string
       *              passed into the callback provided as the first argument.
       */
      tintWebKitResponseDelegate.addMethod('postMessage','v@:@',
          util.errorwrap(function(self, cmd, message) { self.callback.fireEvent('message', [message.toString()]); }));
      tintWebKitResponseDelegate.register();
    }
    return $.tintWebKitResponseDelegate;
  }

  function fireError(self, cmd, webview, navigationOrError, error) {
    try {
      if(this.useWKWebView) {
        this.fireEvent('error',[error('localizedDescription')('UTF8String')]);
      } else {
        this.fireEvent('error',[navigationOrError('localizedDescription')('UTF8String')]);
      }
    } catch (e) {
      console.log(e.message);
      console.log(e.stack);
      process.exit(1);
    }
  }
  function fireLoad(self, _cmd, frameOrWebview, navigation) { 
    try {
      if(!this.useWKWebView) {
        // Create the comm delegate and assign it to window.TintMessages, then override window.postMessageToHost.
        var frameWinObj = this.nativeView('windowScriptObject');
        if(frameWinObj) {
          frameWinObj('setValue',this.private.commDelegate,'forKey',$('TintMessages'));
          this.execute("window.postMessageToHost = function(e) { window.TintMessages.postMessage(e); }");
        }
      } else {
        this.execute("window.postMessageToHost = function(e) { window.webkit.messageHandlers.TintMessages.postMessage(e); }");
      }
      var loc = this.location;
      if(this.private.previousUrl !== loc) {
        this.fireEvent('location-change', [this.private.previousUrl,loc]);
        this.private.previousUrl = loc;
      }
      this.fireEvent('load');
    } catch(e) {
      console.error(e.message);
      console.error(e.stack);
      process.exit(1);
    }
  }
  function fireNewWindow(s,c,webview,config,navAction,features) {
    try {
      var webview = new WebView(this.useWKWebView ? {configuration:config} : {});
      return (this.fireEvent('new-window', [webview])) === false ? null : webview.nativeView;
    } catch (e) {
      console.log(e.message);
      console.log(e.stack);
      process.exit(1);
    }
  }
  /**
   * @class WebView
   * @description The WebView allows HTML content to be embedded in an application as a normal control. It uses WebKit on OSX
   *              and the latest version of IE installed when on Windows (forcing IE9 or above).  
   * @extends Container
   */
  /**
   * @new 
   * @memberof WebView
   * @description Creates a new webview control.
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var webView = new WebView();
   * win.appendChild(webView);
   * webView.left=webView.top=webView.right=webView.bottom=0;
   * webView.location = "https://www.google.com";
   * @screenshot-window {win}
   */
   // TODO: Add progress event
  function WebView(options) {
    var firstLoad = true;
    this.useWKWebView = ((process.bridge.objc.WKWebView && WebView.useNewWKWebView) ? true : false);
    options = options || {};
    options.delegates = options.delegates || [];
    options.nonStandardEvents = true;
    options.doNotInitialize = true;

    if(!this.useWKWebView) {
      options.delegates = options.delegates.concat([
        // DEPRECATED IN OSX YOSEMITE, NOT AVAILABLE ON WINDOWS
        // @event cancel
        // @memberof WebView
        // @description Fires when a navigation or resource load request was cancelled programmatically or for security reasons.
        ['webView:didCancelClientRedirectForFrame:','v@:@@', function(self,_cmd,frame) { this.fireEvent('cancel'); }.bind(this)],
        /**
         * @event unload
         * @memberof WebView
         * @description Fires when a page in the top frame is unloaded.
         */
        ['webView:didClearWindowObject:forFrame:','v@:@@@', function(self,_cmd,win,frame) { this.fireEvent('unload'); }.bind(this)],
        ['webView:didFailLoadWithError:forFrame:','v@:@@', fireError.bind(this)],
        ['webView:didFailProvisionalLoadWithError:forFrame:','v@:@@', fireError.bind(this)],
        ['webView:didReceiveServerRedirectForProvisionalLoadForFrame:','v@:@@', function(self, _cmd, title, frame) { this.fireEvent('redirect'); }.bind(this)],
        // DEPRECATED IN OSX YOSEMITE, NOT AVAILABLE ON WINDOWS
        // @event title
        // @memberof WebView
        // @description Fires when the title of the HTML document loaded is available.
        ['webView:didReceiveTitle:forFrame:', 'v@:@@@', function(self, _cmd, title, frame) { this.fireEvent('title'); }.bind(this)],
        // DEPRECATED IN OSX YOSEMITE, NOT AVAILABLE ON WINDOWS
        // @event icon
        // @memberof WebView
        // @description Fires when the icon of the HTML document loaded is available.
        //
        ['webView:didReceiveIcon:forFrame:', 'v@:@@@', function(self, _cmd, icon, frame) { this.fireEvent('icon'); }.bind(this)],
        ['webView:didStartProvisionalLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { this.fireEvent('loading'); }.bind(this)],
        ['webView:didFinishLoadForFrame:', 'v@:@@', fireLoad.bind(this)],
        ['webView:didCommitLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { this.fireEvent('request'); }.bind(this)],
        // DEPRECATED IN OSX YOSEMITE, Not entirely sure how useful this is anyways. Most window.close events are ignored
        // by browsers anyways.
        // @event close
        // @memberof WebView
        // @description Fires when a request to close the frame has occured (e.g., window.close in HTML javascript)
        ['webView:willCloseFrame:', 'v@:@@', function(self, _cmd, frame) { this.fireEvent('close'); }.bind(this)],
        //['webView:didChangeLocationWithinPageForFrame:', 'v@:@@', function(self, _cmd, notif) { }.bind(this)],
        ['webView:willPerformClientRedirectToURL:delay:fireDate:forFrame:', 'v@:@@d@@', function() { this.fireEvent('redirect'); }.bind(this)],
        ['webView:createWebViewWithRequest:', '@@:@@', fireNewWindow.bind(this)],
        ['webView:decidePolicyForNavigationAction:request:frame:decisionListener:','v@:@@@@@', createWebViewPolicyHandler().bind(this)]
      ]);
    } else {
      // WKWebView actions
      options.delegates = options.delegates.concat([
        /**
         * @event loading
         * @memberof WebView
         * @description Fires when a new request for a HTML document at the top frame is committed, this means the
         *              new URL has passed security requirement checks, but has yet to begin making a network request
         *              or render any parts of the page.
         */
        ['webView:didCommitNavigation:', 'v@:@@', function(self, cmd, webview, navigation) {
          if(firstLoad) {
            firstLoad = false;
          } else {
            this.fireEvent('unload');
          }
          this.fireEvent('loading'); 
        }.bind(this)],
        /**
         * @event error
         * @memberof WebView
         * @description Fires when an unrecoverable error occurs, such as being unable to retrieve the requested page for the top frame,
         *              or when a security error has occured.  The callback function is passed the translated description of 
         *              the error message that occured.
         */
        ['webView:didFailNavigation:withError:', 'v@:@@@', fireError.bind(this)],
        ['webView:didFailProvisionalNavigation:withError:', 'v@:@@@', fireError.bind(this)],
        /**
         * @event location-change
         * @memberof WebView
         * @description Fires when a change in location occurs (E.g., a new URL has been requested). This differs from a 
         *              load (or loading) event in-that it does not fire if the current page is reloaded and the URL or
         *              location has not changed.  The event handler is passed two arguments, the first is the old URL,
         *              and the second is the new URL.
         */
        /**
         * @event load
         * @memberof WebView
         * @description Fires when a new request for a HTML document at the top frame has loaded and the document object
         *              model is ready.
         */
        ['webView:didFinishNavigation:', 'v@:@@', fireLoad.bind(this)],
        /*
        ['webView:didReceiveAuthenticationChallenge:completionHandler:', ['v',['@',':','@','@','?']], function(self, cmd, webview, challenge, completionHandler) {
          try {
            var credentials = this.fireEvent('auth');
            if(credentials && credentials.username && credentials.password) {
              var creds = $.NSURLCredential('credentialWithUser',$(credentials.username),'password',$(credentials.password),'persistence', $.NSURLCredentialPersistenceForSession);
              var d = completionHandler.reinterpret(32);
              var block = new core.__block_literal_1(d);
              var bfunc = core.createUnwrapperFunction(block.invoke,['v',['?','I','@']]);
              bfunc(block.ref(), $.NSURLSessionAuthChallengeUseCredential, creds);
            }
          } catch (e) {
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
          }
        }.bind(this)],
        */
        /**
         * @event redirect
         * @memberof WebView
         * @description Fires when a redirect from a server request occurs.
         */
        ['webView:didReceiveServerRedirectForProvisionalNavigation:', 'v@:@@', function(self, cmd, webview, navigation) { this.fireEvent('redirect'); }.bind(this)],
        /**
         * @event request
         * @memberof WebView
         * @description Fires when a new request for a HTML document at the top frame has occured, but before loaded or load has occured.
         */
        ['webView:didStartProvisionalNavigation:', 'v@:@@', function(self, cmd, webview, navigation) { this.fireEvent('request'); }.bind(this)],
        /**
         * @event policy
         * @memberof WebView
         * @description Fires the callback for the event to ask if the page about to be loaded should be blocked.  
         *              The URL for the target resource or navigation is passed in to the event callback.  If false (and only strictly false) 
         *              is returned by the event handler the request is blocked.  If any other value is returned (including undefined or null)
         *              the resource is allowed to load and continue.  This event is useful if you want to screen URL's being loaded and
         *              deny navigation and resource requests based on the URL (e.g., such as a net nanny or for security reasons).
         * @noscreenshot
         * @example
         * require('Common');
         * var win = new Window();
         * var webView = new WebView();
         * win.appendChild(webView);
         * webView.left=webView.right=webView.top=webView.bottom=0;
         * win.visible = true;
         * webView.addEventListener('policy', function(url) {
         *    if(url === "https://www.google.com") {
         *      console.log('blocking requests to google!');
         *      return false;
         *    }
         * });
         * webView.location = "https://www.google.com";
         */
        ['webView:decidePolicyForNavigationAction:decisionHandler:', ['v',['@',':','@','@','?']], 
          createWKWebViewPolicyHandler($.WKNavigationActionPolicyAllow, $.WKNavigationActionPolicyCancel).bind(this)],
        //['webView:decidePolicyForNavigationResponse:decisionHandler:', ['v',['@',':','@','@','?']], 
        //  createWKWebViewPolicyHandler($.WKNavigationResponsePolicyAllow, $.WKNavigationResponsePolicyCancel).bind(this)],

        /**
         * @event new-window
         * @memberof WebView
         * @description When a new window is requested, this event is fired. The event handler 
         *              is passed a new WebView that can be used for a new window (or alternatively)
         *              a new tab. It is the responsibility of the event handler to attach the
         *              web view to a window, tab (or other GUI item). If the event handler chooses
         *              not to open the web site in a new window, the webview can simply be discarded.
         * @note        The WebView is the TARGET in which the new window request will load the
         *              page, no further action is taken on the web view (e.g., loading content) until
         *              the event handler successfully returns. 
         * @noscreenshot
         * @example
         * require('Common');
         * var win = new Window();
         * var webView = new WebView();
         * win.appendChild(webView);
         * webView.left=webView.right=webView.top=webView.bottom=0;
         * win.visible = true;
         * webView.location = "https://www.google.com";
         * webView.addEventListener('new-window', function(newWebView) {
         *   // Create a new window for the "new-window" event. Alternatively we could
         *   // create a new tab or simply add another webview to the current window.
         *   // the webview does not necessarily need to be onscreen. The webview can be
         *   // held offscreen until the load event occurs to check its url and then dispose
         *   // or attach it to a visible UI window/panel/etc.
         *   var newWin = new Window();
         *   newWin.appendChild(newWebView);
         *   newWebView.left=newWebView.right=newWebView.top=newWebView.bottom=0;
         *   newWin.visible = true;
         *   // Note we could alternatively do nothing with the web view preventing any
         *   // and all new web views from loading.
         * });
         */
         // TODO: TEST ME.
        ['webView:createWebViewWithConfiguration:forNavigationAction:windowFeatures:', ['@',['@',':','@','@','@','@']], fireNewWindow.bind(this)],
        ['userContentController:didReceiveScriptMessage:', 'v@:@@', function(self, cmd, control, message) {
            this.fireEvent('message',[message('body')('description')('UTF8String')]);
        }.bind(this)]
        /* TODO
        ['webView:runJavaScriptAlertPanelWithMessage:initiatedByFrame:completionHandler:',['v',['@',':','@','@','@','@']], function() {
          var result = this.fireEvent('alert');
        }.bind(this)],
        // TODO
        ['webView:runJavaScriptConfirmPanelWithMessage:initiatedByFrame:completionHandler:',['v',['@',':','@','@','@','@']], function() {
          var result = this.fireEvent('confirm');
        }.bind(this)],
        // TODO
        ['webView:runJavaScriptTextInputPanelWithPrompt:defaultText:initiatedByFrame:completionHandler:',['v',['@',':','@','@','@','@']], function() {
          var result = this.fireEvent('text-input');
        }.bind(this)] */
      ]);
    }
    // TODO: auth
    // TODO: alert
    // TODO: confirm
    // TODO: input 
    // TODO: download
    // TODO: resize
    // TOOD: close (new?)

    this.nativeViewClass = this.nativeClass = this.nativeClass || this.useWKWebView ? $.WKWebView : $.WebView;
    Container.call(this, options);

    if(this.useWKWebView) {
      if(options.configuration) {
        this.native = this.nativeView = this.nativeViewClass('alloc')('initWithFrame',$.NSMakeRect(0,0,500,480), 'configuration', options.configuration);
      } else {
        this.native = this.nativeView = this.nativeViewClass('alloc')('initWithFrame',$.NSMakeRect(0,0,500,480));
      }
      this.native('setNavigationDelegate', this.native);
      this.nativeView('configuration')('userContentController')('removeScriptMessageHandlerForName',$('TintMessages'));
      this.nativeView('configuration')('userContentController')('addScriptMessageHandler',this.nativeView,'name',$('TintMessages'));
    } else {
      this.native = this.nativeView = this.nativeViewClass('alloc')('initWithFrame',$.NSMakeRect(0,0,500,480),'frameName',$('main'),'groupName',$('main'));
      var tintWebKitResponseDelegate = createWebViewBridge();
      var id = (Math.random()*100000).toString();
      process.bridge.objc.delegates[id] = this;
      this.private.commDelegate = tintWebKitResponseDelegate('alloc')('initWithJavascriptObject',$(id));
      this.private.commDelegate.fireEvent = this.fireEvent;
      this.nativeView('setShouldUpdateWhileOffscreen',$.YES);
      this.nativeView('setFrameLoadDelegate', this.nativeView);
      this.nativeView('setPolicyDelegate', this.nativeView);
      this.nativeView('setShouldCloseWithWindow',$.YES);
    }
    this.nativeView('setUIDelegate', this.nativeView);
    this.nativeView('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
  }

  WebView.useNewWKWebView = true;

  WebView.prototype = Object.create(Container.prototype);
  WebView.prototype.constructor = Container;

  /**
   * @method back
   * @memberof WebView
   * @description Moves to the previously rendered page.  If no previously rendered page is available this takes no action.
   * @noscreenshot
   * var win = new Window();
   * win.visible = true;
   * var webView = new WebView();
   * win.appendChild(webView);
   * webView.left=webView.top=webView.right=webView.bottom=0;
   * webView.location = "https://www.google.com";
   * setTimeout(function() { webView.location = "https://www.bing.com"; }, 1000);
   * setTimeout(function() { webView.back() }, 2000);
   */
  WebView.prototype.back = function() { this.nativeView('goBack',this.nativeView); };

  /**
   * @method forward
   * @memberof WebView
   * @description Moves to the history forward to the next rendered page.  If no "next" rendered page is available this takes no action.
   * @noscreenshot
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var webView = new WebView();
   * win.appendChild(webView);
   * webView.left=webView.top=webView.right=webView.bottom=0;
   * webView.location = "https://www.google.com";
   * setTimeout(function() { webView.location = "https://www.bing.com"; }, 1000);
   * setTimeout(function() { webView.location = "https://www.reddit.com"; }, 2000);
   * setTimeout(function() { webView.location = "https://www.slashdot.org"; }, 3000);
   * setTimeout(function() { webView.back(); }, 4000);
   * setTimeout(function() { webView.back(); }, 5000);
   * setTimeout(function() { console.log(webView.location); }, 6000);
   */
  WebView.prototype.forward = function() { this.nativeView('goForward',this.nativeView); };

  /**
   * @method reload
   * @memberof WebView
   * @description Reloads the current page.
   * @noscreenshot
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var webView = new WebView();
   * win.appendChild(webView);
   * webView.left=webView.top=webView.right=webView.bottom=0;
   * webView.location = "https://www.google.com";
   * setTimeout(function() { webView.reload(); }, 1000);
   */
  WebView.prototype.reload = function() { this.nativeView('reload',this.nativeView); };

  /**
   * @method stop
   * @memberof WebView
   * @description Stops loading the current page, if nothing is currently loading this takes no action.
   * @noscreenshot
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var webView = new WebView();
   * win.appendChild(webView);
   * webView.left=webView.top=webView.right=webView.bottom=0;
   * webView.location = "https://www.google.com";
   * setTimeout(function() { webView.stop(); }, 1000);
   */
  WebView.prototype.stop = function() { this.loading = false; };

  WebView.prototype.boundsOnWindowOfElement = function(e, cb) {
    this.execute("var rect = document.querySelector('"+e+"').getBoundingClientRect();\n" +
                  "'{\"width\":'+rect.width+',\"height\":'+rect.height+',\"y\":'+rect.top+',\"x\":'+rect.bottom+'}';", function(r) { cb(JSON.parse(r)); });
  }

  /**
   * @method postMessage
   * @param {string} message The string or message to pass.
   * @memberof WebView
   * @description Posts an HTML "Message" event to the top frame (and window) of the HTML page. The HTML page can listen to window message events
   *              to receive these messages.  Strings are only allowed to be passed, complex objects may be serialized via JSON to transfer them back and forth.
   *              See the event 'message' to listen for messages sent from the HTML page back to Tint.
   */
  WebView.prototype.postMessage = function(e) {
    var msg = "var msg=document.createEvent('MessageEvent');\n";
    msg += "msg.initMessageEvent('message',true,true,'"+e.toString().replace(/'/g,"\\'")+"');\n";
    msg += "window.dispatchEvent(msg);\n";
    if(this.useWKWebView) {
      this.execute(msg);
    } else {
      this.nativeView('stringByEvaluatingJavaScriptFromString',$(msg));
    }
  };

  /**
   * @method execute
   * @param {string} javascript Executes the javascript (passed in as a string) in the window context of the top frame of the page.
   * @param {function} callback The function which is called when the execution finishes.  The result is passed as the first argument.
   * @memberof WebView
   * @description This will execute the passed in javascript in the window context of the top frame of the currently loaded page.  The result is
   *              passed back when the callback is ran. 
   */
  WebView.prototype.execute = function(jscode, cb) {
    if(this.useWKWebView) {
      var callback = $(function(obj, result) { if(cb) { cb(result('description')('UTF8String').toString()); } }.bind(this), ['v',['@','@']]);
      this.nativeView('evaluateJavaScript', $(jscode.toString()), 'completionHandler', callback);
    } else {
      var result = this.nativeView('stringByEvaluatingJavaScriptFromString',$(jscode.toString()))('UTF8String').toString();
      if(cb) {
        cb(result);
      }
    }
  };


  // DEPRECATED IN OSX YOSEMITE, UNSUPPORTED ON WINDOWS
  //
  // @member icon
  // @type {string}
  // @memberof WebView
  // @description Gets the URL of the icon resource for the HTML page.  Note if this is not available an error will occur.
  //              Listen to the 'icon' event to know when an icon is available and its safe to access.
  //
  util.def(WebView.prototype, 'icon', 
    function() {
      if(!this.useWKWebView) {
        var ico = this.nativeView('mainFrameIcon');
        if(ico) {
          return util.makeURIFromNSImage(ico);
        } else {
          return null;
        }
      }
    }
  );

  /**
   * @member progress
   * @type {number}
   * @memberof WebView
   * @description Gets the progress of loading all resources (if the page is currently loading).  Note this will return
   *              -1 when the progress is indeterminate (e.g., the page is not loading or the progress could not be determined).
   *              The number returned is between 0 and 1, e.g., 0.5 represents 50% loaded.
   * @noscreenshot
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var webView = new WebView();
   * win.appendChild(webView);
   * webView.left=webView.top=webView.right=webView.bottom=0;
   * webView.location = "https://www.google.com";
   * setInterval(function() { console.log(webView.progress); }, 10);
   */
  util.def(WebView.prototype, 'progress', 
    function() { return this.nativeView('estimatedProgress'); }
  );
  /**
   * @member location
   * @type {string}
   * @memberof WebView
   * @description Gets or sets the URL location of the HTML document rendered in the WebView.
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var webView = new WebView();
   * win.appendChild(webView);
   * webView.left=webView.top=webView.right=webView.bottom=0;
   * webView.location = "https://www.google.com";
   * @screenshot-window {win}
   */
  util.def(WebView.prototype, 'location',
    function() { 
      if(this.useWKWebView) {
        var url = this.nativeView('URL');
        return url === null ? null : url('absoluteURL')('description')('UTF8String');
      } else {
        var url = this.nativeView('mainFrameURL');
        return url === null ? null : url('UTF8String'); 
      }
    },
    function(url) {
      if(this.useWKWebView) {
        if(url.indexOf("app:") > -1) {
          url = url.replace("app:/","http://127.0.0.1:"+application.private.appSchemaPort+"/");
        }
        this.nativeView('loadRequest', $.NSURLRequest('requestWithURL',$.NSURL('URLWithString',$(url))));
      } else {
        this.nativeView('setMainFrameURL',$(url)); 
      }
    }
  );

  /**
   * @member useragent
   * @type {string}
   * @memberof WebView
   * @description Gets or sets the user agent string used.
   * @noscreenshot
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var webView = new WebView();
   * win.appendChild(webView);
   * webView.left=webView.top=webView.right=webView.bottom=0;
   * webView.location = "https://www.google.com";
   * setTimeout(function() { console.log(webView.useragent); }, 2000);
   */
  util.def(WebView.prototype, "useragent",
    function() { 
      if(this.useWKWebView) {
        var userAgent = this.nativeView('_customUserAgent');
        return userAgent.toString();
      } else {
        var userAgent = this.nativeView('customUserAgent');
        if(!userAgent)
          userAgent = this.nativeView('userAgentForURL', this.nativeView('mainFrameURL'))
        return userAgent.toString();
      }
    },
    function(e) {
      if(this.useWKWebView) {
        this.nativeView('_setCustomUserAgent', $(e));
      } else {
        this.nativeView('setCustomUserAgent',$(e)); 
      }
      
    }
  );

  /**
   * @member loading
   * @type {boolean}
   * @memberof WebView
   * @description Gets or sets whether the page is loading. If set to true (when false) it reloads the current page, when
   *              set to false (when true) it stops loading the current page.
   */
  util.def(WebView.prototype, 'loading', 
    function() { 
      if(this.useWKWebView) {
        return this.nativeView('loading');
      } else {
        return this.nativeView('isLoading');
      } 
    },
    function(e) { 
      if(!e && this.useWKWebView) {
        this.nativeView('stopLoading'); 
      } else if (!e) {
        this.nativeView('stopLoading',$.YES); 
      }
    }
  );

  //TODO: Unsupported on Windows.
  util.def(WebView.prototype, 'transparent',
    function() { 
      if(this.useWKWebView) {
        return this.nativeView('_drawsTransparentBackground') ? true : false; 
      } else {
        return this.nativeView('drawsBackground') ? false : true; 
      }
      
    },
    function(e) {
      if(this.useWKWebView) {
        this.nativeView('_setDrawsTransparentBackground', e ? $.YES : $.NO );
      } else {
        this.nativeView('setDrawsBackground', !e ? $.YES : $.NO );
      } 
    }
  );

  /**
   * @member title
   * @type {string}
   * @memberof WebView
   * @description Gets the title of the HTML document loaded in the webview.  If nothing is loaded or is in the process of loading
   *              this will throw an error.  LIsten to the 'title' event to know when the title of the HTML docuemnt is available.
   * @noscreenshot
   * @example
   * require('Common');
   * var win = new Window();
   * win.visible = true;
   * var webView = new WebView();
   * win.appendChild(webView);
   * webView.left=webView.top=webView.right=webView.bottom=0;
   * webView.location = "https://www.google.com";
   * setTimeout(function() { console.log(webView.title); }, 4000);
   */
  util.def(WebView.prototype, 'title', 
    function() {  
      if(this.useWKWebView) {
        return this.nativeView('title')('UTF8String');
      } else {
        return this.nativeView('mainFrameTitle')('UTF8String');
      }
    }
  );

  global.__TINT.WebView = WebView;
  return WebView;
})();
