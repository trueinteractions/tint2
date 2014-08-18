module.exports = (function() {
  var utilities = require('Utilities');

  function WebView() {
    var $ = process.bridge.objc;
    // TODO: Perhaps NSMakeRect auto casts with NSValue for convenience? possible memory leak though..
    // TODO: WebView seems to crash with Adobe Flash at times.
    var $webview = $.WebView('alloc')
                            ('initWithFrame',$.NSMakeRect(0,0,500,480) 
                            ,'frameName',$('main')
                            ,'groupName',$('main'));
    var events = {};

    $webview('setAutoresizesSubviews',$.YES);
    $webview('setAutoresizingMask',$.NSViewWidthSizable | $.NSViewHeightSizable);
    $webview('setShouldCloseWithWindow',$.YES);
    $webview('setShouldUpdateWhileOffscreen',$.YES);
    Object.defineProperty(this, 'internal', { get:function() { return $webview; }});

    this.back = function() { $webview('goBack',$webview); }
    this.forward = function() { $webview('goForward',$webview); }
    this.reload = function() { $webview('reload',$webview); }
    this.postMessage = function(e) {
        var msg = "var msg=document.createEvent('MessageEvent');\n";
            msg += "msg.initMessageEvent('message',true,true,'"+e.toString().replace(/'/g,"\\'")+"');\n";
            msg += "window.dispatchEvent(msg);\n";
        return $webview('stringByEvaluatingJavaScriptFromString',$(msg))('UTF8String');
    }

    // Setting the URL is asyncronous, the loading and rendering occurs on a seperate thread,
    // many attributes will not be available until after the URL has finished loading.
    Object.defineProperty(this, 'location', {
        get:function() { return $webview('mainFrameURL')('UTF8String'); },
        set:function(url) { $webview('setMainFrameURL',$(url)); }
    });
    // Must be set before location.
    Object.defineProperty(this, "useragent", {
        get:function() { return $webview('customUserAgent')('UTF8String'); },
        set:function(e) { $webview('setCustomUserAgent',$(e)); }
    });
    Object.defineProperty(this, 'loading', { 
        get:function() { return $webview('isLoading'); },
        set:function(e) { if(e) $webview('stopLoading',true); }
    });

    Object.defineProperty(this, 'transparent', {
        get:function() { return $webview('drawsBackground') ? false : true; },
        set:function(e) { $webview('setDrawsBackground', e ? false : true ); }
    });

    // Note that a title may not be immediately available until the page has
    // loaded.
    Object.defineProperty(this, 'title', { get:function() {  return $webview('mainFrameTitle')('UTF8String'); }});


    function fireEvent(event, args) {
        if(events[event]) (events[event]).forEach(function(item,index,arr) { item.apply(null,args); });
    }

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }

    // Track and fireback all frame load events.
    var WebFrameLoadDelegate = $.NSObject.extend('WebFrameLoadDelegate'+Math.round(Math.random()*10000));
    WebFrameLoadDelegate.addMethod('init', '@@:', function(self) { return self; });
    WebFrameLoadDelegate.addMethod('webView:didCancelClientRedirectForFrame:','v@:@@', function(self,_cmd,frame) { setTimeout(function(){ fireEvent('cancel'); },100); });
    //WebFrameLoadDelegate.addMethod('webView:didClearWindowObject:forFrame:','v@:@@@', function(self,_cmd,win,frame) { });
    WebFrameLoadDelegate.addMethod('webView:didFailLoadWithError:forFrame:','v@:@@', function(self, _cmd, error, frame) { setTimeout(function(){ fireEvent('error'); },100); });
    WebFrameLoadDelegate.addMethod('webView:didFailProvisionalLoadWithError:forFrame:','v@:@@', function(self, _cmd, error, frame) { setTimeout(function(){ fireEvent('error'); },100); })
    WebFrameLoadDelegate.addMethod('webView:didReceiveServerRedirectForProvisionalLoadForFrame:','v@:@@', function(self, _cmd, title, frame) { setTimeout(function() { fireEvent('redirect'); },100); });
    WebFrameLoadDelegate.addMethod('webView:didReceiveTitle:forFrame:', 'v@:@@@', function(self, _cmd, title, frame) { setTimeout(function() { fireEvent('title'); },100); });
    WebFrameLoadDelegate.addMethod('webView:didStartProvisionalLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { setTimeout(function() { fireEvent('loading'); },100); });
    WebFrameLoadDelegate.addMethod('webView:didFinishLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { setTimeout(function() { fireEvent('load'); },100); });
    WebFrameLoadDelegate.addMethod('webView:didCommitLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { setTimeout(function() { fireEvent('request'); },100); });
    WebFrameLoadDelegate.addMethod('webView:willCloseFrame:', 'v@:@@', function(self, _cmd, frame) { setTimeout(function() { fireEvent('unload'); },100);  });
    WebFrameLoadDelegate.addMethod('webView:didChangeLocationWithinPageForFrame:', 'v@:@@', function(self, _cmd, notif) { setTimeout(function() { fireEvent('locationchange'); },100); });
    WebFrameLoadDelegate.addMethod('webView:willPerformClientRedirectToURL:delay:fireDate:forFrame:', 'v@:@@d@@', function(self, _cmd, sender,url,seconds,date,frame) { setTimeout(function() { fireEvent('locationchange'); },100); });
    WebFrameLoadDelegate.register();

    var webFrameLoadDelegateInstance = WebFrameLoadDelegate('alloc')('init');
    $webview('setFrameLoadDelegate', webFrameLoadDelegateInstance);

    // Apply sizing functions for NSView widgets
    utilities.attachSizeProperties($webview, this, fireEvent);
  }

  return WebView;
})();
