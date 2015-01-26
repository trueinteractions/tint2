module.exports = (function() {
  if(global.__TINT.WebView) {
    return global.__TINT.WebView;
  }
  var $ = process.bridge.objc;
  var util = require('Utilities');
  var Container = require('Container');
  var useWKWebView = false; // disabled for now.
  var core = null;

  if(useWKWebView) {
    core = require('core');
  }
  
  if(!$.TintWebKitResponseDelegate && !useWKWebView) {
    if(!process.bridge.objc.delegates) process.bridge.objc.delegates = {};

    // This class implements a set of javascript -> objective-c functions on the object window.TintMessages
    // within each webview. This allows communication to-from webkit and our hosting JS instance. Only serializable
    // strings can be passed back-forth. For now, only post message is used.
    var TintWebKitResponseDelegate = $.NSObject.extend('TintWebKitResponseDelegate');
    TintWebKitResponseDelegate.addMethod('initWithJavascriptObject:', ['@',[TintWebKitResponseDelegate,$.selector,'@']], 
      util.errorwrap(function(self, cmd, id) {
        self.callback = process.bridge.objc.delegates[id.toString()];
        process.bridge.objc.delegates[id.toString()] = null;
        return self;
    }));
    TintWebKitResponseDelegate.addClassMethod('webScriptNameForSelector:','@@::', 
      util.errorwrap(function(self,_cmd,sel) { 
        return $("postMessage");
    }));
    TintWebKitResponseDelegate.addClassMethod('isSelectorExcludedFromWebScript:','B@::', 
      util.errorwrap(function(self,_cmd,sel) { 
        if(sel === "postMessage") return $.NO;
        else return $.YES
    }));
    /**
     * @event message
     * @memberof WebView
     * @description Fires when the top frame HTML document has executed window.postMessageToHost().  The message is a string
     *              passed into the callback provided as the first argument.
     */
    TintWebKitResponseDelegate.addMethod('postMessage','v@:@',
        util.errorwrap(function(self, cmd, message) { self.callback.fireEvent('message', [message.toString()]); }));
    TintWebKitResponseDelegate.register();

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
  function WebView(options) {
    var previousUrl = null;
    options = options || {};
    options.delegates = options.delegates || [];
    options.nonStandardEvents = true;
    options.doNotInitialize = true;
    if(!useWKWebView) {
      options.delegates = options.delegates.concat([
        /**
         * @event cancel
         * @memberof WebView
         * @description Fires when a navigation or resource load request was cancelled programmatically or for security reasons.
         */
        ['webView:didCancelClientRedirectForFrame:','v@:@@', function(self,_cmd,frame) { this.fireEvent('cancel'); }.bind(this)],
        /**
         * @event unload
         * @memberof WebView
         * @description Fires when a page in the top frame is unloaded.
         */
        ['webView:didClearWindowObject:forFrame:','v@:@@@', function(self,_cmd,win,frame) { this.fireEvent('unload'); }.bind(this)],
        /**
         * @event error
         * @memberof WebView
         * @description Fires when an unrecoverable error occurs, such as being unable to get the page for the top frame.
         */
        ['webView:didFailLoadWithError:forFrame:','v@:@@', function(self, _cmd, error, frame) { this.fireEvent('error'); }.bind(this)],
        ['webView:didFailProvisionalLoadWithError:forFrame:','v@:@@', function(self, _cmd, error, frame) { this.fireEvent('error'); }.bind(this)],
        /**
         * @event redirect
         * @memberof WebView
         * @description Fires when a redirect from a server request occurs.
         */
        ['webView:didReceiveServerRedirectForProvisionalLoadForFrame:','v@:@@', function(self, _cmd, title, frame) { this.fireEvent('redirect'); }.bind(this)],
        /**
         * @event title
         * @memberof WebView
         * @description Fires when the title of the HTML document loaded is available.
         */
        ['webView:didReceiveTitle:forFrame:', 'v@:@@@', function(self, _cmd, title, frame) { this.fireEvent('title'); }.bind(this)],
        /**
         * @event icon
         * @memberof WebView
         * @description Fires when the icon of the HTML document loaded is available.
         */
        ['webView:didReceiveIcon:forFrame:', 'v@:@@@', function(self, _cmd, icon, frame) { this.fireEvent('icon'); }.bind(this)],
        /**
         * @event loading
         * @memberof WebView
         * @description Fires when a new request for a HTML document at the top frame is requested and has started to load.
         */
        ['webView:didStartProvisionalLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { this.fireEvent('loading'); }.bind(this)],
        /**
         * @event load
         * @memberof WebView
         * @description Fires when a new request for a HTML document at the top frame has loaded and rendering will begin.
         */
        ['webView:didFinishLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { 
          try {
            // Create the comm delegate and assign it to window.TintMessages, then override window.postMessageToHost.
            var frameWinObj = this.nativeView('windowScriptObject');
            if(frameWinObj) {
              frameWinObj('setValue',this.private.commDelegate,'forKey',$('TintMessages'));
              this.nativeView('stringByEvaluatingJavaScriptFromString', $("window.postMessageToHost = function(e) { window.TintMessages.postMessage(e); }"));
            }
            if(previousUrl != this.location) {
              this.fireEvent('locationchange');
              previousUrl = this.location;
            }
            this.fireEvent('load');
          } catch(e) {
            console.error(e.message);
            console.error(e.stack);
            process.exit(1);
          }
        }.bind(this)],
        /**
         * @event request
         * @memberof WebView
         * @description Fires when a new request for a HTML document at the top frame has occured, but before loaded or load has occured.
         */
        ['webView:didCommitLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { this.fireEvent('request'); }.bind(this)],
        /**
         * @event close
         * @memberof WebView
         * @description Fires when a request to close the frame has occured (e.g., window.close in HTML javascript)
         */
        ['webView:willCloseFrame:', 'v@:@@', function(self, _cmd, frame) { this.fireEvent('close'); }.bind(this)],
        /**
         * @event locationchange
         * @memberof WebView
         * @description Fires when a change in location occurs (E.g., a new URL has been requested)
         */
        //['webView:didChangeLocationWithinPageForFrame:', 'v@:@@', function(self, _cmd, notif) { }.bind(this)],
        ['webView:willPerformClientRedirectToURL:delay:fireDate:forFrame:', 'v@:@@d@@', 
          function(self, _cmd, sender,url,seconds,date,frame) { this.fireEvent('redirect'); }.bind(this)],

         /**
          * @event new-window
          * @memberof WebView
          * @description When a new window is requested, this event is fired. The callback function
          *              must return either a new WebView to use for rendering the content or can
          *              return the current WebView to simply re-use the context. Note that these 
          *              requests are not requests called from non-event-based javascript, meaning
          *              this only fires when a user clicks or interacts with elements causing a new
          *              window to be created. Note that the callback must either return null (or undefined)
          *              or a WebView object.  Anything else is ignored.
          * @noscreenshot
          * @example
          * require('Common');
          * var win = new Window();
          * var webView = new WebView();
          * win.appendChild(webView);
          * webView.left=webView.right=webView.top=webView.bottom=0;
          * win.visible = true;
          * webView.location = "https://www.google.com";
          * webView.addEventListener('new-window', function() {
          *   // Create a new window for the "new-window" event. Alternatively we could
          *   // create a new tab or simply add another webview to the current window.
          *   // the webview does not necessarily need to be onscreen. The webview can be
          *   // held offscreen until the load event occurs to check its url and then dispose
          *   // or attach it to a visible UI window/panel/etc.
          *   var newWin = new Window();
          *   var newWebView = new WebView();
          *   newWin.appendChild(newWebView);
          *   newWebView.left=newWebView.right=newWebView.top=newWebView.bottom=0;
          *   newWin.visible = true;
          *   return newWebView; // This is important, the request is then routed to the new 
          *                      // webview control. Without this, the page will not be loaded.
          * });
          */
         ['webView:createWebViewWithRequest:', '@@:@@', function(self, _cmd, webview, request) {
            try {
              var target = this.fireEvent('new-window');
              if(target && target instanceof WebView && target.nativeView) {
                return target.nativeView;
              } else {
                return null;
              }
            } catch (e) {
              console.error(e.message);
              console.error(e.stack);
              process.exit(1);
            }
         }.bind(this)]
      ]);
    } else {
      // WKWebView actions
      options.delegates = options.delegates.concat([
        ['webView:didCommitNavigation:', 'v@:@@', function(self, cmd, webview, navigation) {
          this.fireEvent('loading');
        }.bind(this)],
        ['webView:didFailNavigation:withError:', 'v@:@@@', function(self, cmd, webview, navigation, error) {
          try {
            this.fireEvent('error',[error('localizedDescription')('UTF8String')]);
          } catch (e) {
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
          }
        }.bind(this)],
        ['webView:didFailProvisionalNavigation:withError:', 'v@:@@@', function(self, cmd, webview, navigation, error) {
          try {
            this.fireEvent('error',[error('localizedDescription')('UTF8String')]);
          } catch (e) {
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
          }
        }.bind(this)],
        ['webView:didFinishNavigation:', 'v@:@@', function(self, cmd, webview, navigation) {
          try {
            if(previousUrl != this.location) {
              this.fireEvent('locationchange');
              previousUrl = this.location;
            }
            this.fireEvent('load');
          } catch (e) {
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
          } 
        }.bind(this)],
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
        ['webView:didReceiveServerRedirectForProvisionalNavigation:', 'v@:@@', function(self, cmd, webview, navigation) {
          this.fireEvent('redirect');
        }.bind(this)],
        ['webView:didStartProvisionalNavigation:', 'v@:@@', function(self, cmd, webview, navigation) {
          this.fireEvent('request');
        }.bind(this)],
        ['webView:decidePolicyForNavigationAction:decisionHandler:', ['v',['@',':','@','@','?']], function(self, cmd, webview, navigationAction, decisionHandler) {
          try {
            var result = this.fireEvent('navigation-action');
            if(typeof(result) === 'undefined') {
              result = true;
            }
            var d = decisionHandler.reinterpret(32);
            var block = new core.__block_literal_1(d);
            var bfunc = core.createUnwrapperFunction(block.invoke,['v',['?','I']]);
            bfunc(block.ref(), result ? $.WKNavigationActionPolicyAllow : $.WKNavigationActionPolicyCancel);
          } catch(e) {
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
          }
        }.bind(this)],
        ['webView:decidePolicyForNavigationResponse:decisionHandler:', ['v',['@',':','@','@','?']], function(self, cmd, webview, navigationResponse, decisionHandler) {
          try {
            var result = this.fireEvent('navigation-response');
            if(typeof(result) === 'undefined') {
              result = true;
            }
            var d = decisionHandler.reinterpret(32);
            var block = new core.__block_literal_1(d);
            var bfunc = core.createUnwrapperFunction(block.invoke,['v',['?','I']]);
            bfunc(block.ref(), result ? $.WKNavigationResponsePolicyAllow : $.WKNavigationResponsePolicyCancel);
          } catch (e) {
            console.log(e.message);
            console.log(e.stack);
          }
        }.bind(this)],
        ['webView:createWebViewWithConfiguration:forNavigationAction:windowFeatures:', ['@',['@',':','@','@','@','@']], function(s,c,webview,config,navAction,features) {
          try {
            var target = this.fireEvent('new-window');
            if(target && target instanceof WebView && target.nativeView) {
              return target.nativeView;
            } else {
              return null;
            }
          } catch (e) {
            console.log(e.message);
            console.log(e.stack);
          }
        }],
        ['webView:runJavaScriptAlertPanelWithMessage:initiatedByFrame:completionHandler:',['v',['@',':','@','@','@','@']], function() {
          var result = this.fireEvent('alert');
        }.bind(this)],
        ['webView:runJavaScriptConfirmPanelWithMessage:initiatedByFrame:completionHandler:',['v',['@',':','@','@','@','@']], function() {
          var result = this.fireEvent('confirm');
        }.bind(this)],
        ['webView:runJavaScriptTextInputPanelWithPrompt:defaultText:initiatedByFrame:completionHandler:',['v',['@',':','@','@','@','@']], function() {
          var result = this.fireEvent('text-input');
        }.bind(this)]
      ]);
    }
    this.nativeClass = this.nativeClass || useWKWebView ? $.WKWebView : $.WebView;
    this.nativeViewClass = this.nativeViewClass || useWKWebView ? $.WKWebView : $.WebView;
    Container.call(this, options);
    if(useWKWebView) {
      this.native = this.nativeView = this.nativeViewClass('alloc')('initWithFrame',$.NSMakeRect(0,0,500,480));
      this.native('setNavigationDelegate', this.native);
      this.native('setUIDelegate', this.native);
    } else {
      this.native = this.nativeView = this.nativeViewClass('alloc')('initWithFrame',$.NSMakeRect(0,0,500,480),'frameName',$('main'),'groupName',$('main'));
      var id = (Math.random()*100000).toString();
      process.bridge.objc.delegates[id] = this;
      this.private.commDelegate = TintWebKitResponseDelegate('alloc')('initWithJavascriptObject',$(id));
      this.private.commDelegate.fireEvent = this.fireEvent;

      this.nativeView('setShouldUpdateWhileOffscreen',$.YES);
      this.nativeView('setFrameLoadDelegate', this.nativeView);
      this.nativeView('setUIDelegate', this.nativeView);
      this.nativeView('setShouldCloseWithWindow',$.YES);
    }
    this.nativeView('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
  }

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
  WebView.prototype.back = function() { this.nativeView('goBack',this.nativeView); }

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
  WebView.prototype.forward = function() { this.nativeView('goForward',this.nativeView); }

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
  WebView.prototype.reload = function() { this.nativeView('reload',this.nativeView); }

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
  WebView.prototype.stop = function() { this.loading = false; }

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
    if(useWKWebView) {
      this.nativeView('evaluateJavaScript', $(msg), 'completionHandler', null);
    } else {
      this.nativeView('stringByEvaluatingJavaScriptFromString',$(msg));
    }
  }

  /**
   * @method execute
   * @param {string} javascript Executes the javascript (passed in as a string) in the window context of the top frame of the page.
   * @memberof WebView
   * @description This will execute the passed in javascript in the window context of the top frame of the currently loaded page.  The result is
   *              passed back.  Note that if the execution creates an error the exception will bubble up into this context.  Becareful running 
   *              arbitrary code without properly using try/catch blocks to prevent errors from bubbling up into Tint's context.
   */
  WebView.prototype.execute = function(e, cb) {
    if(useWKWebView) {
      this.nativeView('evaluateJavaScript', $(msg), 'completionHandler', 
        $(function(self, obj) { cb(obj('UTF8String').toString()); }, ['@',['@','@']]));
    } else {
      return this.nativeView('stringByEvaluatingJavaScriptFromString',$(e.toString()))('UTF8String').toString();
    }
  }

  /**
   * @member icon
   * @type {string}
   * @memberof WebView
   * @description Gets the URL of the icon resource for the HTML page.  Note if this is not available an error will occur.
   *              Listen to the 'icon' event to know when an icon is available and its safe to access.
   */
  util.def(WebView.prototype, 'icon', 
    function() {
      if(useWKWebView) {
        // TODO ...
      } else {
        var ico = this.nativeView('mainFrameIcon');
        if(ico) return util.makeURIFromNSImage(ico);
        return null;
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
      if(useWKWebView) {
        return this.nativeView('URL')('UTF8String');
      } else {
        return this.nativeView('mainFrameURL')('UTF8String'); 
      }
    },
    function(url) {
      if(useWKWebView) {
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
      if(useWKWebView) {
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
      if(useWKWebView) {
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
      if(useWKWebView) {
        return this.nativeView('loading');
      } else {
        return this.nativeView('isLoading');
      } 
    },
    function(e) { 
      if(!e && useWKWebView) {
        this.nativeView('stopLoading'); 
      } else if (!e) {
        this.nativeView('stopLoading',$.YES); 
      }
    }
  );

  //TODO: Unsupported on Windows.
  util.def(WebView.prototype, 'transparent',
    function() { 
      if(useWKWebView) {
        return this.nativeView('_drawsTransparentBackground') ? true : false; 
      } else {
        return this.nativeView('drawsBackground') ? false : true; 
      }
      
    },
    function(e) {
      if(useWKWebView) {
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
      if(useWKWebView) {
        return this.nativeView('title')('UTF8String');
      } else {
        return this.nativeView('mainFrameTitle')('UTF8String');
      }
    }
  );

  global.__TINT.WebView = WebView;
  return WebView;
})();
