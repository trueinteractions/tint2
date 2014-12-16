module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  var Container = require('Container');
  
  if(!$.TintWebKitResponseDelegate) {
    if(!process.bridge.objc.delegates) process.bridge.objc.delegates = {};

    // This class implements a set of javascript -> objective-c functions on the object window.TintMessages
    // within each webview. This allows communication to-from webkit and our hosting JS instance. Only serializable
    // strings can be passed back-forth. For now, only post message is used.
    var TintWebKitResponseDelegate = $.NSObject.extend('TintWebKitResponseDelegate');
    TintWebKitResponseDelegate.addMethod('initWithJavascriptObject:', ['@',[TintWebKitResponseDelegate,$.selector,'@']], 
      utilities.errorwrap(function(self, cmd, id) {
        self.callback = process.bridge.objc.delegates[id.toString()];
        process.bridge.objc.delegates[id.toString()] = null;
        return self;
    }));
    TintWebKitResponseDelegate.addClassMethod('webScriptNameForSelector:','@@::', 
      utilities.errorwrap(function(self,_cmd,sel) { 
        return $("postMessage");
    }));
    TintWebKitResponseDelegate.addClassMethod('isSelectorExcludedFromWebScript:','B@::', 
      utilities.errorwrap(function(self,_cmd,sel) { 
        if(sel == "postMessage") return $.NO;
        else return $.YES
    }));
    /**
     * @event message
     * @memberof WebView
     * @description Fires when the top frame HTML document has executed window.postMessageToHost().  The message is a string
     *              passed into the callback provided as the first argument.
     */
    TintWebKitResponseDelegate.addMethod('postMessage','v@:@',
        utilities.errorwrap(function(self, cmd, message) { self.callback.fireEvent('message', [message.toString()]); }));
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
     */
  function WebView(NativeObjectClass, NativeViewClass, options) {
    var previousUrl = null;
    options = options || {};
    options.delegates = options.delegates || [];
    options.nonStandardEvents = true;
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
        function(self, _cmd, sender,url,seconds,date,frame) { this.fireEvent('redirect'); }.bind(this)]
    ]);

    if(NativeObjectClass && NativeObjectClass.type == '#')
      Container.call(this, NativeObjectClass, NativeViewClass, options);
    else
      Container.call(this, $.WebView, $.WebView, options);

    this.native = this.nativeView = this.nativeViewClass('alloc')('initWithFrame',$.NSMakeRect(0,0,500,480),'frameName',$('main'),'groupName',$('main'));
    
    this.private.preferences = $.WebPreferences('alloc')('initWithIdentifier', $(application.name));

    var id = (Math.random()*100000).toString();
    process.bridge.objc.delegates[id] = this;
    this.private.commDelegate = TintWebKitResponseDelegate('alloc')('initWithJavascriptObject',$(id));
    this.private.commDelegate.fireEvent = this.fireEvent;

    this.nativeView('setPreferences',this.private.preferences);
    this.nativeView('setShouldCloseWithWindow',$.YES);
    this.nativeView('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.nativeView('setShouldUpdateWhileOffscreen',$.YES);
    this.nativeView('setFrameLoadDelegate', this.nativeView);
  }

  WebView.prototype = Object.create(Container.prototype);
  WebView.prototype.constructor = Container;

  /**
   * @method back
   * @memberof WebView
   * @description Moves to the previously rendered page.  If no previously rendered page is available this takes no action.
   */
  WebView.prototype.back = function() { this.nativeView('goBack',this.nativeView); }

  /**
   * @method forward
   * @memberof WebView
   * @description Moves to the history forward to the next rendered page.  If no "next" rendered page is available this takes no action.
   */
  WebView.prototype.forward = function() { this.nativeView('goForward',this.nativeView); }

  /**
   * @method reload
   * @memberof WebView
   * @description Reloads the current page.
   */
  WebView.prototype.reload = function() { this.nativeView('reload',this.nativeView); }

  /**
   * @method stop
   * @memberof WebView
   * @description Stops loading the current page, if nothing is currently loading this takes no action.
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
    this.nativeView('stringByEvaluatingJavaScriptFromString',$(msg))('UTF8String');
  }

  /**
   * @method execute
   * @param {string} javascript Executes the javascript (passed in as a string) in the window context of the top frame of the page.
   * @memberof WebView
   * @description This will execute the passed in javascript in the window context of the top frame of the currently loaded page.  The result is
   *              passed back.  Note that if the execution creates an error the exception will bubble up into this context.  Becareful running 
   *              arbitrary code without properly using try/catch blocks to prevent errors from bubbling up into Tint's context.
   */
  WebView.prototype.execute = function(e) {
    return this.nativeView('stringByEvaluatingJavaScriptFromString',$(e.toString()))('UTF8String').toString();
  }


/*
  -- if a specific property is allowed in js?
+ (BOOL)isKeyExcludedFromWebScript:(const char *)property {}
  -- converts the selector to the JS name.


TODO:
  Object.defineProperty(WebView.prototype, 'defaultFontSize') //setDefaultFontSize
  Object.defineProperty(WebView.prototype, 'defaultFixedFontSize') //setDefaultFixedFontSize
  Object.defineProperty(WebView.prototype, 'defaultFontSizeMinimum') //setMinimumFontSize
  Object.defineProperty(WebView.prototype, 'allowImages') //setLoadsImagesAutomatically
  Object.defineProperty(WebView.prototype, 'userstylesheet') //setUserStyleSheetLocation && setUserStyleSheetEnabled
  Object.defineProperty(WebView.prototype, 'cache') //setUsesPageCache
  Object.defineProperty(WebView.prototype, 'media') //setMediaStyle
  Object.defineProperty(WebView.prototype, 'icon') //mainFrameIcon. read only.

  WebView.prototype.elementAt() // elementAtPoint:
  WebView.prototype.find() // searchFor:direction:caseSensitive:wrap:
  WebView.prototype.exception() // WebScriptObject setException:

  WebFrames!
  https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/DisplayWebContent/Concepts/WebKitDesign.html#//apple_ref/doc/uid/20002024-114390
*/
  /**
   * @member icon
   * @type {string}
   * @memberof WebView
   * @description Gets the URL of the icon resource for the HTML page.  Note if this is not available an error will occur.
   *              Listen to the 'icon' event to know when an icon is available and its safe to access.
   */
  Object.defineProperty(WebView.prototype, 'icon', {
    get:function() {
      var ico = this.nativeView('mainFrameIcon');
      if(ico) return utilities.makeURIFromNSImage(ico);
      return null;
    }
  })

  Object.defineProperty(WebView.prototype, 'allowAnimatedImages', {
    get:function() { return this.private.preferences('allowsAnimatedImages') == $.YES ? true : false; },
    set:function(e) { this.private.preferences('setAllowsAnimatedImages', e ? $.YES : $.NO); }
  });

  Object.defineProperty(WebView.prototype, 'allowAnimatedImagesToLoop', {
    get:function() { return this.private.preferences('allowsAnimatedImageLooping') == $.YES ? true : false; },
    set:function(e) { this.private.preferences('setAllowsAnimatedImageLooping', e ? $.YES : $.NO); }
  });

  Object.defineProperty(WebView.prototype, 'allowJava', {
    get:function() { return this.private.preferences('isJavaEnabled') == $.YES ? true : false; },
    set:function(e) { this.private.preferences('setJavaEnabled', e ? $.YES : $.NO); }
  });

  Object.defineProperty(WebView.prototype, 'allowJavascript', {
    get:function() { return this.private.preferences('isJavaScriptEnabled') == $.YES ? true : false; },
    set:function(e) { this.private.preferences('setJavaScriptEnabled', e ? $.YES : $.NO); }
  });

  Object.defineProperty(WebView.prototype, 'allowPlugins', {
    get:function() { return this.private.preferences('arePlugInsEnabled') == $.YES ? true : false; },
    set:function(e) { this.private.preferences('setPlugInsEnabled', e ? $.YES : $.NO); }
  });

  // Doesnot work on OSX, not supported on Win, commenting out.
  //Object.defineProperty(WebView.prototype, 'privateBrowsing', {
  //  get:function() { return this.private.preferences('privateBrowsingEnabled') == $.YES ? true : false; },
  //  set:function(e) { this.private.preferences('setPrivateBrowsingEnabled', (e ? $.YES : $.NO)); }
  //});

  // Returns -1 for indeterminate
  /**
   * @member progress
   * @type {number}
   * @memberof WebView
   * @description Gets the progress of loading all resources (if the page is currently loading).  Note this will return
   *              -1 when the progress is indeterminate (e.g., the page is not loading or the progress could not be determined).
   */
  Object.defineProperty(WebView.prototype, 'progress', {
    get:function() { return this.nativeView('estimatedProgress')*100; }
  });
  /**
   * @member location
   * @type {string}
   * @memberof WebView
   * @description Gets or sets the URL location of the HTML document rendered in the WebView.
   */
  Object.defineProperty(WebView.prototype, 'location', {
    get:function() { return this.nativeView('mainFrameURL')('UTF8String'); },
    set:function(url) { this.nativeView('setMainFrameURL',$(url)); }
  });
  /**
   * @member useragent
   * @type {string}
   * @memberof WebView
   * @description Gets or sets the user agent string used.
   * @important There are inconsistencies on Windows which may result in the user agent not being set; getting the value is guaranteed.
   */
  Object.defineProperty(WebView.prototype, "useragent", {
    get:function() { 
      var userAgent = this.nativeView('customUserAgent');
      if(!userAgent)
        userAgent = this.nativeView('userAgentForURL', this.nativeView('mainFrameURL'))
      return userAgent;
    },
    set:function(e) { this.nativeView('setCustomUserAgent',$(e)); }
  });

  /**
   * @member loading
   * @type {boolean}
   * @memberof WebView
   * @description Gets or sets whether the page is loading. If set to true (when false) it reloads the current page, when
   *              set to false (when true) it stops loading the current page.
   */
  Object.defineProperty(WebView.prototype, 'loading', { 
    get:function() { return this.nativeView('isLoading'); },
    set:function(e) { if(!e) this.nativeView('stopLoading',$.YES); }
  });

  //TODO: Unsupported on Windows.
  Object.defineProperty(WebView.prototype, 'transparent', {
    get:function() { return this.nativeView('drawsBackground') ? false : true; },
    set:function(e) { this.nativeView('setDrawsBackground', !e ? $.YES : $.NO ); }
  });

  // Broken on OSX not working either on Windows.
  //Object.defineProperty(WebView.prototype, 'textScale', {
  //  get:function() { return this.nativeView('textSizeMultiplier') * 100; },
  //  set:function(e) { this.nativeView('setTextSizeMultiplier', (e / 100)); }
  //});

  /**
   * @member title
   * @type {string}
   * @memberof WebView
   * @description Gets the title of the HTML document loaded in the webview.  If nothing is loaded or is in the process of loading
   *              this will throw an error.  LIsten to the 'title' event to know when the title of the HTML docuemnt is available.
   */
  Object.defineProperty(WebView.prototype, 'title', { 
    get:function() {  return this.nativeView('mainFrameTitle')('UTF8String'); }
  });

  return WebView;
})();
