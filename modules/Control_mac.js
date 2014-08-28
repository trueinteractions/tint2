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

  function Control(NativeObjectClass, NativeViewClass, options) {
    var events = {}, native, nativeView, needsMouseTracking = 0, 
        trackingArea = null, intrinsicSize = null, layoutContraints = [],
        topControl = null, bottomControl = null, leftControl = null, rightControl = null, 
        top = null, left = null, right = null, bottom = null,
        width = null, height = null;
        //topMultiplier = null, bottomMultiplier = null, 
        //rightMultiplier = null, leftMultiplier = null, 
        //topConstant = 0, bottomConstant = 0,
        //leftConstant = 0, rightConstant = 0;

/*
    function performLayout() {
      intrinsicSize = this.nativeView('intrinsicSize');
      width = width || intrinsicSize.width || null;
      height = height || intrinsicSize.height || null;

      if(top && bottom && height) height = null;
      if(right && left && width) width = null;

      if(top && bottom) {
        height = null;
        parent.addLayoutConstraint(parseUnit(top, marginTop, this, topControl, '=', 'top');
        parent.addLayoutConstraint(parseUnit(bottom, marginBottom, this, bottomControl, '=', 'bottom'));
      } else if (top && height) {
        parent.addLayoutConstraint(parseUnit(top, marginTop, this, topControl, '=', 'top');
        parent.addLayoutConstraint(parseUnit(height, marginBottom, this, null, '=', 'height'));
      } else if (top && !height) {
        parent.addLayoutConstraint(parseUnit(top, marginTop, this, topControl, '=', 'top');
      } else if (bottom && height) {

      } else if (bottom && !height) {
      
      } else {

      }

      if(left && right) { 
        width = null;
      } else if (left && width) {

      } else if (left && !width) {

      } else if (right && width) {

      } else if (right && !width) {

      } else {

      }

    }

    this.addEventListener('parent-attached', function(parent) {
      topControl = parent, bottomControl = parent, leftControl = parent, rightControl = parent;
    }.bind(this));

    this.addEventListener('parent-dettached', function(parent) {
      topControl = null, bottomControl = null, leftControl = null, rightControl = null;
      top = left = bottom = right = width = height = null;
    }.bind(this));

      //top = null, left = null, right = null, bottom = null;
      //width = intrinsicSize.width || null;
      //height = intrinsicSize.height || null;

    // top, bottom, !height
    // left, right, !width
    // top, !topsibling
    // bottom, !bottomsibling
    // left, !leftsibling
    // right, !rightsibling

    // note left and right are automatically swapped when locale setting specify r-to-l



 
    // top, left, bottom, right
    // width, height
    // maxwidth, maxheight, minwidth, minheight
    // ?? mintop, maxtop, minleft, maxleft, minbottom, maxbottom, minright, maxright

    // Outstanding issues:
    //    // HORIZONTAL
    //    If left && right && width && (calculated(right) - calculated(left)) != calculated(width) { do we error? }
    //    If ((!left && !right) && parent[horizontal-layout]=right-to-left) {
    //      does left append to parents[left]=0 || previousSibling[right]=1.0? || whicheverSiblingIsMostLeft[right]=1.0? 
    //    }
    //    If ((!left || !right) && !width && parent[horizontal-layout]==right-to-left && intrinsicSize.width == -1) { do we just go width = 100%? }
    //
    //    // VERTICAL
    //    If top && bottom && height && (calculated(bottom) - calculated(top)) != calculated(height) { do we error? }
    //    If ((!top && !bottom) && parent[vertical-layout]=top-to-bottom { 
    //      does this.top = parents[top]=0 || previousSiblings[right]=1.0? || whicheverSiblingIsMostBottom[right]=1.0? 
    //    }
    //    If ((!top || !bottom) && !height && parent[vertical-layout]=top-to-bottom && intrinsicSize.height == -1) { 
    //      do we just go with height = 100%? 
    //     }

    // left
    // top
    // right
    // bottom

*/


    this.fireEvent = function(event,args) {
      var returnvalue = undefined;
      if(events[event]) {
        (events[event]).forEach(function(item,index,arr) { 
          var tmp = item(args);
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

/*nativeViewExt.addMethod('mouseDown:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
      self.super('mouseDown',events);
      try { 
        this.fireEvent('mousedown');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    //TODO: Does not work.
    nativeViewExt.addMethod('rightMouseUp:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
      self.super('rightMouseUp',events);
      try { 
        this.fireEvent('rightMouseUp');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    nativeViewExt.addMethod('rightMouseDown:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
      self.super('rightMouseDown',events);
      try { 
        this.fireEvent('rightmousedown');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    //TODO: Does not work.
    nativeViewExt.addMethod('mouseUp:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
      self.super('mouseUp',events);
      try { 
        this.fireEvent('mouseup');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    //TODO: Does not work.
    nativeViewExt.addMethod('keyUp:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
      self.super('keyUp',events);
      try { 
        this.fireEvent('keyup');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    //TODO: Does not work.
    nativeViewExt.addMethod('keyDown:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
      self.super('keyDown',events);
      try { 
        this.fireEvent('keydown');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    //TODO: Does not work.
    nativeViewExt.addMethod('mouseEntered:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
      self.super('mouseEntered',events);
      try {
        this.fireEvent('mouseenter');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    //TODO: Does not work.
    nativeViewExt.addMethod('mouseExited:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
      self.super('mouseExited',events);
      try { 
        this.fireEvent('mouseexit');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));
    //TODO: Does not work.
    nativeViewExt.addMethod('mouseMoved:',[$.void,['@',$.selector,'@']], function(self, cmd, events) {
      self.super('mouseMoved',events);
      try {
        this.fireEvent('mousemove');
      } catch(e) { 
        console.log(e.message);
        console.log(e.stack);
        process.exit(1);
      }
    }.bind(this));*/