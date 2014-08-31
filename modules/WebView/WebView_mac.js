module.exports = (function() {
  var $ = process.bridge.objc;
  var utilities = require('Utilities');
  var Container = require('Container');

  if(!$.TintWebViewDelegate) {
    var TintWebViewDelegate = $.NSObject.extend('TintWebViewDelegate');

    TintWebViewDelegate.addMethod('initWithJavascriptObject:', ['@',[TintWebViewDelegate,$.selector,'@']], 
      utilities.errorwrap(function(self, cmd, id) {
        self.callback = application.private.delegateMap[id.toString()];
        application.private.delegateMap[id.toString()] = null;
        return self;
    }));

    TintWebViewDelegate.addMethod('webView:didCancelClientRedirectForFrame:','v@:@@', 
      utilities.errorwrap(function(self,_cmd,frame) { self.callback.fireEvent('cancel'); }));

    TintWebViewDelegate.addMethod('webView:didClearWindowObject:forFrame:','v@:@@@', 
      utilities.errorwrap(function(self,_cmd,win,frame) { self.callback.fireEvent('unload'); }));

    TintWebViewDelegate.addMethod('webView:didFailLoadWithError:forFrame:','v@:@@', 
      utilities.errorwrap(function(self, _cmd, error, frame) { self.callback.fireEvent('error'); }));

    TintWebViewDelegate.addMethod('webView:didFailProvisionalLoadWithError:forFrame:','v@:@@', 
      utilities.errorwrap(function(self, _cmd, error, frame) { self.callback.fireEvent('error'); }));

    TintWebViewDelegate.addMethod('webView:didReceiveServerRedirectForProvisionalLoadForFrame:','v@:@@', 
      utilities.errorwrap(function(self, _cmd, title, frame) { self.callback.fireEvent('redirect'); }));

    TintWebViewDelegate.addMethod('webView:didReceiveTitle:forFrame:', 'v@:@@@', 
      utilities.errorwrap(function(self, _cmd, title, frame) { self.callback.fireEvent('title'); }));

    TintWebViewDelegate.addMethod('webView:didStartProvisionalLoadForFrame:', 'v@:@@', 
      utilities.errorwrap(function(self, _cmd, frame) { self.callback.fireEvent('loading'); }));

    TintWebViewDelegate.addMethod('webView:didFinishLoadForFrame:', 'v@:@@', 
      utilities.errorwrap(function(self, _cmd, frame) { self.callback.fireEvent('load'); }));

    TintWebViewDelegate.addMethod('webView:didCommitLoadForFrame:', 'v@:@@', 
      utilities.errorwrap(function(self, _cmd, frame) { self.callback.fireEvent('request'); }));

    TintWebViewDelegate.addMethod('webView:willCloseFrame:', 'v@:@@', 
      utilities.errorwrap(function(self, _cmd, frame) { self.callback.fireEvent('close'); }));

    TintWebViewDelegate.addMethod('webView:didChangeLocationWithinPageForFrame:', 'v@:@@', 
      utilities.errorwrap(function(self, _cmd, notif) { self.callback.fireEvent('locationchange'); }));

    TintWebViewDelegate.addMethod('webView:willPerformClientRedirectToURL:delay:fireDate:forFrame:', 'v@:@@d@@', 
      utilities.errorwrap(function(self, _cmd, sender,url,seconds,date,frame) { self.callback.fireEvent('redirect'); }));

    TintWebViewDelegate.register();
  }

  function WebView() {
    Container.call(this, $.WebView, $.WebView, {isWebView:true});
    this.native = this.nativeView = this.nativeViewClass('alloc')('initWithFrame',$.NSMakeRect(0,0,500,480),'frameName',$('main'),'groupName',$('main'));
    this.nativeView('setShouldCloseWithWindow',$.YES);
    this.nativeView('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    this.nativeView('setShouldUpdateWhileOffscreen',$.YES);

    var id = (Math.random()*100000).toString();
    application.private.delegateMap[id] = this;
    var webViewDelegate = $.TintWebViewDelegate('alloc')('initWithJavascriptObject', $(id));
    this.nativeView('setFrameLoadDelegate', webViewDelegate);
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
