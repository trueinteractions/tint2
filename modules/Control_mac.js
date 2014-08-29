module.exports = (function() {
  console.assert(typeof application !== "undefined", 'You must use require(\'Application\') prior to using any GUI components.');
  console.assert(process.bridge.objc, 'Failure to establish objective-c bridge.');
  var $ = process.bridge.objc;

  function addMethodOverride(view, bindPoint, selector, event, blocks, eventAfter) {
    view.addMethod(selector,[$.void,['@',$.selector,'@']], function(self, cmd, events) {
      try {
        bindPoint.fireEvent(event);
        self.super(selector.replace(':',''),events);
        if(blocks && eventAfter) bindPoint.fireEvent(eventAfter);
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(bindPoint));
  }
/*
TODO: Add colors:
+ alternateSelectedControlColor
+ alternateSelectedControlTextColor
+ colorForControlTint:
+ controlBackgroundColor
+ controlColor
+ controlAlternatingRowBackgroundColors
+ controlHighlightColor
+ controlLightHighlightColor
+ controlShadowColor
+ controlDarkShadowColor
+ controlTextColor
+ currentControlTint
+ disabledControlTextColor
+ gridColor
+ headerColor
+ headerTextColor
+ highlightColor
+ keyboardFocusIndicatorColor
+ knobColor
+ scrollBarColor
+ secondarySelectedControlColor
+ selectedControlColor
+ selectedControlTextColor
+ selectedMenuItemColor
+ selectedMenuItemTextColor
+ selectedTextBackgroundColor
+ selectedTextColor
+ selectedKnobColor
+ shadowColor
+ textBackgroundColor
+ textColor
+ windowBackgroundColor
+ windowFrameColor
+ windowFrameTextColor
+ underPageBackgroundColor
*/
  function Control(NativeObjectClass, NativeViewClass, options) {
    var events = {}, native, nativeView, needsMouseTracking = 0, 
        trackingArea = null, intrinsicSize = null, layoutContraints = [];

    this.fireEvent = function(event,args) {
      var returnvalue = undefined;
      if(events[event]) {
        (events[event]).forEach(function(item,index,arr) { 
          var tmp = item.apply(null, args);
          if(tmp) returnvalue = tmp;
        });
      }
      return returnvalue;
    }


    function addTrackingArea() {
      var bounds = this.nativeView('bounds');
      var options = $.NSTrackingMouseEnteredAndExited | $.NSTrackingMouseMoved | $.NSTrackingActiveInActiveApp | $.NSTrackingInVisibleRect;
      trackingArea = $.NSTrackingArea('alloc')(
        'initWithRect', bounds, 
        'options', options,
        'owner', this.nativeView,
        'userInfo', null);
      this.nativeView('addTrackingArea',trackingArea);
    }

    this.addEventListener = function(event, func) {
      event = event.toLowerCase();
      if(event == "mouseenter" || event == "mouseexit" || event == "mousemove") {
        needsMouseTracking++;
        if(needsMouseTracking == 1 && this.nativeView('window'))
          addTrackingArea.apply(this,null);
        else if (needsMouseTracking == 1)
          this.addEventListener('parent-attached', addTrackingArea.bind(this));
      }
      if(!events[event]) 
        events[event] = []; 
      events[event].push(func);
    }.bind(this);

    this.removeEventListener = function(event, func) {
      event = event.toLowerCase();
      if(event == "mouseenter" ||   event == "mouseexit" || event == "mousemove") {
        needsMouseTracking--;
        if(needsMouseTracking == 0) {
          this.nativeView('removeTrackingArea',trackingArea);
          trackingArea('release');
          trackingArea = null;
        }
      }
      if(events[event] && events[event].indexOf(func) != -1) 
        events[event].splice(events[event].indexOf(func), 1);
    }.bind(this);

    var nativeViewExt = NativeViewClass.extend('NSView'+Math.round(Math.random()*10000));
    //nativeViewExt.addMethod('acceptsFirstResponder','B@:',function(self,cmd) { return $.YES; });
    addMethodOverride(nativeViewExt, this, 'mouseDown:', 'mousedown', options.mouseDownBlocks ? true : false, 'mouseup');
    if(!options.mouseDownBlocks) addMethodOverride(nativeViewExt, this, 'mouseUp:', 'mouseup');
    addMethodOverride(nativeViewExt, this, 'rightMouseDown:', 'rightmousedown');
    addMethodOverride(nativeViewExt, this, 'rightMouseUp:', 'rightmouseup');
    addMethodOverride(nativeViewExt, this, 'keyDown:', 'keydown');
    addMethodOverride(nativeViewExt, this, 'keyUp:', 'keyup');
    addMethodOverride(nativeViewExt, this, 'mouseEntered:', 'mouseenter');
    addMethodOverride(nativeViewExt, this, 'mouseExited:', 'mouseexit');
    addMethodOverride(nativeViewExt, this, 'mouseMoved:', 'mousemove');
    nativeViewExt.register();

    Object.defineProperty(this,'boundsOnScreen', {
      get:function() {
        var scnBounds = $.NSScreen('mainScreen')('frame');
        var vwBounds = this.nativeView('bounds');
        var winBounds = this.nativeView('convertRect', vwBounds, 'toView', null);
        var bounds = this.nativeView('window')('convertRectToScreen',winBounds);
        return {
          x:bounds.origin.x,
          y:(scnBounds.size.height - bounds.origin.y) - vwBounds.size.height,
          width:bounds.size.width,
          height:bounds.size.height
        };
      }
    });

    Object.defineProperty(this,'boundsOnWindow', {
      get:function() {
        var vwBounds = this.nativeView('bounds');
        var bounds = this.nativeView('convertRect', vwBounds, 'toView', null);
        return {
          x:bounds.origin.x, 
          y:bounds.origin.y - vwBounds.size.height, 
          width:bounds.size.width, 
          height:bounds.size.height
        };
      }
    });

    Object.defineProperty(this,'bounds',{
      get:function() {
        var bounds = this.nativeView('bounds');
        return {x:bounds.origin.x, y:bounds.origin.y, width:bounds.size.width, height:bounds.size.height};
      }
    });

    Object.defineProperty(this, 'nativeClass', { get:function() { return NativeObjectClass; } });
    Object.defineProperty(this, 'nativeViewClass', { get:function() { return nativeViewExt; } });

    Object.defineProperty(this, 'native', {
      get:function() { return native; },
      set:function(e) { native = e; }
    });

    Object.defineProperty(this, 'nativeView', {
      get:function() { return nativeView; },
      set:function(e) { nativeView = e; }
    });

    Object.defineProperty(this, 'visible', {
      configurable:true,
      get:function() { return !this.nativeView('isHidden'); },
      set:function(e) { return this.nativeView('setHidden',!e); }
    });


 }
 return Control;
})();