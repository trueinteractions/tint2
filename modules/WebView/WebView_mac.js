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
    TintWebKitResponseDelegate.addMethod('postMessage','v@:@',
        utilities.errorwrap(function(self, cmd, message) { self.callback.fireEvent('message', [message.toString()]); }));
    TintWebKitResponseDelegate.register();

  }

  function WebView(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.delegates = options.delegates || [];
    options.nonStandardEvents = true;
    options.delegates = options.delegates.concat([
      ['webView:didCancelClientRedirectForFrame:','v@:@@', function(self,_cmd,frame) { this.fireEvent('cancel'); }.bind(this)],
      ['webView:didClearWindowObject:forFrame:','v@:@@@', function(self,_cmd,win,frame) { this.fireEvent('unload'); }.bind(this)],
      ['webView:didFailLoadWithError:forFrame:','v@:@@', function(self, _cmd, error, frame) { this.fireEvent('error'); }.bind(this)],
      ['webView:didFailProvisionalLoadWithError:forFrame:','v@:@@', function(self, _cmd, error, frame) { this.fireEvent('error'); }.bind(this)],
      ['webView:didReceiveServerRedirectForProvisionalLoadForFrame:','v@:@@', function(self, _cmd, title, frame) { this.fireEvent('redirect'); }.bind(this)],
      ['webView:didReceiveTitle:forFrame:', 'v@:@@@', function(self, _cmd, title, frame) { this.fireEvent('title'); }.bind(this)],
      ['webView:didReceiveIcon:forFrame:', 'v@:@@@', function(self, _cmd, icon, frame) { this.fireEvent('icon'); }.bind(this)],
      ['webView:didStartProvisionalLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { this.fireEvent('loading'); }.bind(this)],
      ['webView:didFinishLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { 
        try {
          // Create the comm delegate and assign it to window.TintMessages, then override window.postMessage.
          var frameWinObj = this.nativeView('windowScriptObject');
          if(frameWinObj) {
            frameWinObj('setValue',this.private.commDelegate,'forKey',$('TintMessages'));
            this.nativeView('stringByEvaluatingJavaScriptFromString', $("window.postMessage = function(e) { window.TintMessages.postMessage(e); }"));
          }
          this.fireEvent('load');
        } catch(e) {
          console.error(e.message);
          console.error(e.stack);
          process.exit(1);
        }
      }.bind(this)],
      ['webView:didCommitLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { this.fireEvent('request'); }.bind(this)],
      ['webView:willCloseFrame:', 'v@:@@', function(self, _cmd, frame) { this.fireEvent('close'); }.bind(this)],
      ['webView:didChangeLocationWithinPageForFrame:', 'v@:@@', function(self, _cmd, notif) { this.fireEvent('locationchange'); }.bind(this)],
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

  WebView.prototype.back = function() { this.nativeView('goBack',this.nativeView); }
  WebView.prototype.forward = function() { this.nativeView('goForward',this.nativeView); }
  WebView.prototype.reload = function() { this.nativeView('reload',this.nativeView); }
  WebView.prototype.stop = function() { this.loading = false; }

  WebView.prototype.postMessage = function(e) {
    var msg = "var msg=document.createEvent('MessageEvent');\n";
    msg += "msg.initMessageEvent('message',true,true,'"+e.toString().replace(/'/g,"\\'")+"');\n";
    msg += "window.dispatchEvent(msg);\n";
    this.nativeView('stringByEvaluatingJavaScriptFromString',$(msg))('UTF8String');
  }

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

  Object.defineProperty(WebView.prototype, 'privateBrowsing', {
    get:function() { return this.private.preferences('privateBrowsingEnabled') == $.YES ? true : false; },
    set:function(e) { this.private.preferences('setPrivateBrowsingEnabled', (e ? $.YES : $.NO)); }
  });

  Object.defineProperty(WebView.prototype, 'progress', {
    get:function() { return this.nativeView('estimatedProgress')*100; }
  });

  Object.defineProperty(WebView.prototype, 'location', {
    get:function() { return this.nativeView('mainFrameURL')('UTF8String'); },
    set:function(url) { this.nativeView('setMainFrameURL',$(url)); }
  });

  Object.defineProperty(WebView.prototype, "useragent", {
    get:function() { return this.nativeView('customUserAgent')('UTF8String'); },
    set:function(e) { this.nativeView('setCustomUserAgent',$(e)); }
  });

  Object.defineProperty(WebView.prototype, 'loading', { 
    get:function() { return this.nativeView('isLoading'); },
    set:function(e) { if(!e) this.nativeView('stopLoading',$.YES); }
  });

  Object.defineProperty(WebView.prototype, 'transparent', {
    get:function() { return this.nativeView('drawsBackground') ? false : true; },
    set:function(e) { this.nativeView('setDrawsBackground', !e ? $.YES : $.NO ); }
  });

  Object.defineProperty(WebView.prototype, 'textScale', {
    get:function() { return this.nativeView('textSizeMultiplier') * 100; },
    set:function(e) { this.nativeView('setTextSizeMultiplier', (e / 100)); }
  });

  Object.defineProperty(WebView.prototype, 'title', { 
    get:function() {  return this.nativeView('mainFrameTitle')('UTF8String'); }
  });

  return WebView;
})();
