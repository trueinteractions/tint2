module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  var Container = require('Container');

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
      ['webView:didStartProvisionalLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { this.fireEvent('loading'); }.bind(this)],
      ['webView:didFinishLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { this.fireEvent('load'); }.bind(this)],
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

  WebView.prototype.postMessage = function(e) {
    var msg = "var msg=document.createEvent('MessageEvent');\n";
    msg += "msg.initMessageEvent('message',true,true,'"+e.toString().replace(/'/g,"\\'")+"');\n";
    msg += "window.dispatchEvent(msg);\n";
    return this.nativeView('stringByEvaluatingJavaScriptFromString',$(msg))('UTF8String');
  }

/*
  -- if the selector is allowed to be used.
+ (BOOL)isSelectorExcludedFromWebScript:(SEL)selector {}
  -- if a specific property is allowed in js?
+ (BOOL)isKeyExcludedFromWebScript:(const char *)property {}
  -- converts the selector to the JS name.
+ (NSString *) webScriptNameForSelector:(SEL)sel {}


TODO:
  Object.defineProperty(WebView.prototype, 'allowAnimatedImages') //setAllowsAnimatedImages
  Object.defineProperty(WebView.prototype, 'allowAnimatedImagesToLoop') //setAllowsAnimatedImageLooping
  Object.defineProperty(WebView.prototype, 'defaultFontSize') //setDefaultFontSize
  Object.defineProperty(WebView.prototype, 'defaultFixedFontSize') //setDefaultFixedFontSize
  Object.defineProperty(WebView.prototype, 'defaultFontSizeMinimum') //setMinimumFontSize
  Object.defineProperty(WebView.prototype, 'allowJava') //setJavaEnabled
  Object.defineProperty(WebView.prototype, 'allowJavascript') //setJavaScriptEnabled
  Object.defineProperty(WebView.prototype, 'allowImages') //setLoadsImagesAutomatically
  Object.defineProperty(WebView.prototype, 'allowPlugins') //setPlugInsEnabled
  Object.defineProperty(WebView.prototype, 'private') //setPrivateBrowsingEnabled
  Object.defineProperty(WebView.prototype, 'userstylesheet') //setUserStyleSheetLocation && setUserStyleSheetEnabled
  Object.defineProperty(WebView.prototype, 'cache') //setUsesPageCache
  Object.defineProperty(WebView.prototype, 'media') //setMediaStyle

  Object.defineProperty(WebView.prototype, 'icon') //mainFrameIcon. read only.

  WebView.prototype.elementAt() // elementAtPoint:
  WebView.prototype.find() // searchFor:direction:caseSensitive:wrap:
  WebView.prototype.execute() // stringByEvaluatingJavaScriptFromString
  WebView.prototype.exception() // WebScriptObject setException:

  WebFrames!
  https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/DisplayWebContent/Concepts/WebKitDesign.html#//apple_ref/doc/uid/20002024-114390
*/

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
    set:function(e) { if(e) this.nativeView('stopLoading',true); }
  });

  Object.defineProperty(WebView.prototype, 'transparent', {
    get:function() { return this.nativeView('drawsBackground') ? false : true; },
    set:function(e) { this.nativeView('setDrawsBackground', e ? false : true ); }
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
