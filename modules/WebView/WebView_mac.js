module.exports = (function() {
  var $ = process.bridge.objc;
  var Container = require('Container');

  function WebView() {
    Container.call(this, $.WebView, $WebView, {isWebView:true});
    this.native = this.nativeView = this.nativeViewClass('alloc')
                            ('initWithFrame',$.NSMakeRect(0,0,500,480) 
                            ,'frameName',$('main')
                            ,'groupName',$('main'));
    this.nativeView('setShouldCloseWithWindow',$.YES);
    this.nativeView('setShouldUpdateWhileOffscreen',$.YES);

    this.back = function() { this.nativeView('goBack',this.nativeView); }
    this.forward = function() { this.nativeView('goForward',this.nativeView); }
    this.reload = function() { this.nativeView('reload',this.nativeView); }
    this.postMessage = function(e) {
        var msg = "var msg=document.createEvent('MessageEvent');\n";
            msg += "msg.initMessageEvent('message',true,true,'"+e.toString().replace(/'/g,"\\'")+"');\n";
            msg += "window.dispatchEvent(msg);\n";
        return this.nativeView('stringByEvaluatingJavaScriptFromString',$(msg))('UTF8String');
    }

    // Setting the URL is asyncronous, the loading and rendering occurs on a seperate thread,
    // many attributes will not be available until after the URL has finished loading.
    Object.defineProperty(this, 'location', {
        get:function() { return this.nativeView('mainFrameURL')('UTF8String'); },
        set:function(url) { this.nativeView('setMainFrameURL',$(url)); }
    });

    // Must be set before location.
    Object.defineProperty(this, "useragent", {
        get:function() { return this.nativeView('customUserAgent')('UTF8String'); },
        set:function(e) { this.nativeView('setCustomUserAgent',$(e)); }
    });

    Object.defineProperty(this, 'loading', { 
        get:function() { return this.nativeView('isLoading'); },
        set:function(e) { if(e) this.nativeView('stopLoading',true); }
    });

    Object.defineProperty(this, 'transparent', {
        get:function() { return this.nativeView('drawsBackground') ? false : true; },
        set:function(e) { this.nativeView('setDrawsBackground', e ? false : true ); }
    });

    // Note that a title may not be immediately available until the page has
    // loaded.
    Object.defineProperty(this, 'title', { get:function() {  return this.nativeView('mainFrameTitle')('UTF8String'); }});

    // Track and fireback all frame load events.
    var WebFrameLoadDelegate = $.NSObject.extend('WebFrameLoadDelegate'+Math.round(Math.random()*10000));
    WebFrameLoadDelegate.addMethod('init', '@@:', function(self) { return self; });
    WebFrameLoadDelegate.addMethod('webView:didCancelClientRedirectForFrame:','v@:@@', function(self,_cmd,frame) {
        try {
            this.fireEvent('cancel');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        }; 
    }.bind(this));
    WebFrameLoadDelegate.addMethod('webView:didClearWindowObject:forFrame:','v@:@@@', function(self,_cmd,win,frame) { 
        try {
        this.fireEvent('unload');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        }; 
    }.bind(this));
    WebFrameLoadDelegate.addMethod('webView:didFailLoadWithError:forFrame:','v@:@@', function(self, _cmd, error, frame) { 
        try {
            this.fireEvent('error');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        }; 
    }.bind(this));
    WebFrameLoadDelegate.addMethod('webView:didFailProvisionalLoadWithError:forFrame:','v@:@@', function(self, _cmd, error, frame) {
        try {
            this.fireEvent('error');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        };
    }.bind(this));
    WebFrameLoadDelegate.addMethod('webView:didReceiveServerRedirectForProvisionalLoadForFrame:','v@:@@', function(self, _cmd, title, frame) {
        try {
            this.fireEvent('redirect');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        };
    }.bind(this));
    WebFrameLoadDelegate.addMethod('webView:didReceiveTitle:forFrame:', 'v@:@@@', function(self, _cmd, title, frame) {
        try {
            this.fireEvent('title');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        };
    }.bind(this));
    WebFrameLoadDelegate.addMethod('webView:didStartProvisionalLoadForFrame:', 'v@:@@', function(self, _cmd, frame) {
        try {
           this.fireEvent('loading');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        };
    }.bind(this));
    WebFrameLoadDelegate.addMethod('webView:didFinishLoadForFrame:', 'v@:@@', function(self, _cmd, frame) { 
        try {
            this.fireEvent('load');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        };
    }.bind(this));
    WebFrameLoadDelegate.addMethod('webView:didCommitLoadForFrame:', 'v@:@@', function(self, _cmd, frame) {
        try {
            this.fireEvent('request');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        };
    }.bind(this));
    WebFrameLoadDelegate.addMethod('webView:willCloseFrame:', 'v@:@@', function(self, _cmd, frame) {
        this.fireEvent('close');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        };
    }.bind(this));
    WebFrameLoadDelegate.addMethod('webView:didChangeLocationWithinPageForFrame:', 'v@:@@', function(self, _cmd, notif) {
        try {
            this.fireEvent('locationchange');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        };
    }.bind(this));
    WebFrameLoadDelegate.addMethod('webView:willPerformClientRedirectToURL:delay:fireDate:forFrame:', 'v@:@@d@@', function(self, _cmd, sender,url,seconds,date,frame) {
        try {
            this.fireEvent('redirect');
        } catch(e) { 
            console.log(e.message);
            console.log(e.stack);
            process.exit(1);
        };
    }.bind(this));
    WebFrameLoadDelegate.register();
    var webFrameLoadDelegateInstance = WebFrameLoadDelegate('alloc')('init');
    this.nativeView('setFrameLoadDelegate', webFrameLoadDelegateInstance);
  }
  WebView.prototype = Object.create(Container.prototype);
  WebView.prototype.constructor = Container;

  return WebView;
})();
