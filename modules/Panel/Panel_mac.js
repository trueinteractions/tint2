module.exports = (function() {
  var utilities = require('Utilities');
  var Window = require('Window');
  var $ = process.bridge.objc;

  function Panel(NativeObjectClass, NativeViewClass, options) {
    if(!NativeObjectClass || NativeObjectClass.type != '#') {
      Window.call(this, $.NSPanel, $.NSView, {isWindow:true});
      this.native = this.nativeClass('alloc')('initWithContentRect', $.NSMakeRect(0,0,250,400), 
                            'styleMask', $.NSHUDWindowMask | $.NSTitledWindowMask | $.NSUtilityWindowMask | $.NSClosableWindowMask | $.NSResizableWindowMask, 
                            'backing', $.NSBackingStoreBuffered, 
                            'defer', $.NO);
      this.nativeView = this.nativeViewClass('alloc')('initWithFrame', $.NSMakeRect(0,0,250,400));
      this.native('setContentView',this.nativeView);
      this.native('setExcludedFromWindowsMenu', $.NO);
      this.native('contentView')('setAutoresizingMask', $.NSViewWidthSizable | $.NSViewHeightSizable | 
                                                        $.NSViewMinXMargin | $.NSViewMaxXMargin | 
                                                        $.NSViewMinYMargin | $.NSViewMaxYMargin );
      this.native('setFrame', $.NSMakeRect(0,0,250,400), 'display', $.YES, 'animate', $.YES);
      this.native('makeKeyAndOrderFront', this.native);
      this.native('setReleasedWhenClosed', $.YES);
      this.native('setFloatingPanel', $.YES);
      this.native('cascadeTopLeftFromPoint', $.NSMakePoint(20,20));
      this.private.styleMask = $.NSHUDWindowMask | $.NSTitledWindowMask | $.NSClosableWindowMask | $.NSResizableWindowMask;

      var id = Math.random().toString();
      $.WindowDelegate.IDMap[id] = this;
      var windowDelegateInstance = $.WindowDelegate('alloc')('initWithJavascriptObject', $(id));
      this.native('setDelegate', windowDelegateInstance);
    } else
      Window.call(this, NativeObjectClass, NativeViewClass, options);
  }

  Panel.prototype = Object.create(Window.prototype);
  Panel.prototype.constructor = Panel;

  Object.defineProperty(Panel.prototype, 'style', {
    get:function() { 
      var mask = this.native('styleMask');
      if(($.NSHUDWindowMask & mask) == $.NSHUDWindowMask) return "inspector";
      else if(($.NSUtilityWindowMask & mask) == $.NSUtilityWindowMask) return "utility";
      else return "window";
    },
    set:function(e) {
      var mask = this.native('styleMask');
      if(e == "utility") this.native('setStyleMask', (mask & ~$.NSHUDWindowMask) | $.NSMiniaturizableWindowMask );
      else if(e == "inspector") this.native('setStyleMask', (mask & ~$.NSMiniaturizableWindowMask) | $.NSHUDWindowMask);
    }
  });

  Object.defineProperty(Panel.prototype, 'floating', {
    get:function() { return this.native('isFloatingPanel') == $.YES ? true : false; },
    set:function(e) { this.native('setFloatingPanel', e ? $.YES : $.NO); }
  });

  Object.defineProperty(Panel.prototype, 'toolbar', {
    get:function() { return undefined; },
    set:function(e) { }
  });

  return Panel;
})();