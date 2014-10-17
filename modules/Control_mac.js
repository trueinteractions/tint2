module.exports = (function() {
  console.assert(typeof application !== "undefined", 'You must use require(\'Application\') prior to using any GUI components.');
  console.assert(process.bridge.objc, 'Failure to establish objective-c bridge.');
  
  var $ = process.bridge.objc;
  var utils = require('Utilities_base');

  function addTrackingArea() {
    var bounds = this.nativeView('bounds');
    var options = $.NSTrackingMouseEnteredAndExited | $.NSTrackingMouseMoved | $.NSTrackingActiveInActiveApp | $.NSTrackingInVisibleRect;
    this.private.trackingArea = $.NSTrackingArea('alloc')('initWithRect', bounds, 'options', options, 'owner', this.nativeView, 'userInfo', null);
    this.nativeView('addTrackingArea',this.private.trackingArea);
  }

  /* Control Class */
  function Control(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.delegates = options.delegates || [];
    if(!options.nonStandardEvents) {
      options.delegates = options.delegates.concat([
        ['mouseDown:','v@:@', function(self, cmd, events) {
            this.fireEvent('mousedown');
            self.super('mouseDown',events);
            if(options.mouseDownBlocks) this.fireEvent('mouseup');
        }.bind(this)],
        ['mouseUp:','v@:@', function(self, cmd, events) { this.fireEvent('mouseup'); self.super('mouseUp',events); }.bind(this)],
        ['rightMouseDown:','v@:@', function(self, cmd, events) { this.fireEvent('rightmousedown'); self.super('rightMouseDown',events); }.bind(this)],
        ['rightMouseUp:','v@:@', function(self, cmd, events) { this.fireEvent('rightmouseup'); self.super('rightMouseUp',events); }.bind(this)],
        ['keyDown:','v@:@', function(self, cmd, events) { this.fireEvent('keydown'); self.super('keyDown',events); }.bind(this)],
        ['keyUp:','v@:@', function(self, cmd, events) { this.fireEvent('keyup'); self.super('keyUp',events); }.bind(this)],
        ['mouseEntered:','v@:@', function(self, cmd, events) { this.fireEvent('mouseenter'); self.super('mouseEntered',events); }.bind(this)],
        ['mouseExited:','v@:@', function(self, cmd, events) { this.fireEvent('mouseexit'); self.super('mouseExited',events); }.bind(this)],
        ['mouseMoved:','v@:@', function(self, cmd, events) { this.fireEvent('mousemove'); self.super('mouseMoved',events); }.bind(this)]
      ]);
    }

    this.private = {
      events:{}, parent:null, trackingArea:null, needsMouseTracking:0,
      user:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
      constraints:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null }
    };

    this.nativeClass = NativeObjectClass;
    this.native = this.nativeView = null;

    this.addEventListener('parent-attached', function(p) { this.private.parent = p; }.bind(this));
    this.addEventListener('parent-dettached', function(p) { this.private.parent = null; }.bind(this));

    var nativeViewExtended = NativeViewClass.extend(NativeViewClass.getName()+Math.round(Math.random()*10000000));
    options.delegates.forEach(function(item) {
      nativeViewExtended.addMethod(item[0],item[1],item[2]);
    });
    nativeViewExtended.register();
    this.nativeViewClass = nativeViewExtended;
  }

  Object.defineProperty(Control.prototype, 'alpha', {
    configurable:true,
    get:function() { return this.nativeView('alphaValue'); },
    set:function(e) { return this.nativeView('setAlphaValue', e); }
  });

  Object.defineProperty(Control.prototype, 'visible', {
    configurable:true,
    get:function() { return !this.nativeView('isHidden'); },
    set:function(e) { return this.nativeView('setHidden', !e); }
  });

  // Helper function to convert OSX coordinate spaces to 
  // top-left.
  function convY(frame, parentFrame) {
    frame.origin.y = parentFrame.size.height - frame.origin.y - frame.size.height;
    return frame;
  }

  Object.defineProperty(Control.prototype,'boundsOnScreen', {
    get:function() {
      if(!this.nativeView('superview')) return null;
      var b = this.nativeView('window')('convertRectToScreen',this.nativeView('convertRect',this.nativeView('bounds'),'toView',null));
      var bnds = convY(b,$.NSScreen('mainScreen')('frame'));
      var offsetY = 0;
      if(!this.nativeView('isEqual',this.nativeView('window')('contentView')))
        offsetY = 1;
      return {
        x:Math.round(bnds.origin.x), 
        y:Math.round(bnds.origin.y) + offsetY, 
        width:Math.round(bnds.size.width), 
        height:Math.round(bnds.size.height)
      };
    }
  });

  Object.defineProperty(Control.prototype,'boundsOnWindow', {
    get:function() {
      if(!this.nativeView('superview')) return null;
      var bnds = convY(this.nativeView('frame'), this.nativeView('window')('frame'));
      var offsetY = 0;
      if(!this.nativeView('isEqual',this.nativeView('window')('contentView')))
        offsetY = 1;
      return {
        x:Math.round(bnds.origin.x), 
        y:Math.round(bnds.origin.y) + offsetY, 
        width:Math.round(bnds.size.width), 
        height:Math.round(bnds.size.height)
      };
    }
  });

  Object.defineProperty(Control.prototype,'bounds',{
    get:function() {
      if(!this.nativeView('superview')) return null;
      var bnds = convY(this.nativeView('frame'), this.nativeView('superview')('frame'));
      var offsetY = 0;
      if(this.nativeView('superview')('isEqual',this.nativeView('window')('contentView'))
          && bnds.origin.y == -1)
        offsetY = 1;
      return {
        x:Math.round(bnds.origin.x), 
        y:Math.round(bnds.origin.y) + offsetY, 
        width:Math.round(bnds.size.width), 
        height:Math.round(bnds.size.height)
      };
    }
  });

  Control.prototype.fireEvent = function(event, args) {
    try {
      event = event.toLowerCase();
      var returnvalue = undefined;
      if(!this.private.events[event]) this.private.events[event] = [];
      (this.private.events[event]).forEach(function(item,index,arr) { returnvalue = item.apply(null, args) || returnvalue; });
      return returnvalue;
    } catch(e) {
      console.error(e.message);
      console.error(e.stack);
      process.exit(1);
    }
  }

  Control.prototype.addEventListener = function(event, func) {
    event = event.toLowerCase();
    if(event == "mouseenter" || event == "mouseexit" || event == "mousemove") {
      this.private.needsMouseTracking++;
      if(this.private.needsMouseTracking == 1 && this.nativeView('window')) 
        addTrackingArea.apply(this,null);
      else if (this.private.needsMouseTracking == 1)
        this.addEventListener('parent-attached', addTrackingArea.bind(this));
    }
    if(!this.private.events[event]) this.private.events[event] = []; 
    this.private.events[event].push(func);
  }

  Control.prototype.removeEventListener = function(event, func) {
    event = event.toLowerCase();
    if(event == "mouseenter" ||   event == "mouseexit" || event == "mousemove") {
      this.private.needsMouseTracking--;
      if(this.private.needsMouseTracking == 0) {
        this.nativeView('removeTrackingArea',this.private.trackingArea);
        this.private.trackingArea('release');
        this.private.trackingArea = null;
      }
    }
    if(this.private.events[event] && this.private.events[event].indexOf(func) != -1) 
      this.private.events[event].splice(this.private.events[event].indexOf(func), 1);
  }

  var attributeMap = { 'left':$.NSLayoutAttributeLeft, 'right':$.NSLayoutAttributeRight, 'top':$.NSLayoutAttributeTop,
                       'bottom':$.NSLayoutAttributeBottom, 'leading':$.NSLayoutAttributeLeading, 'trailing':$.NSLayoutAttributeTrailing,
                       'width':$.NSLayoutAttributeWidth, 'height':$.NSLayoutAttributeHeight, 'center':$.NSLayoutAttributeCenterX,
                       'middle':$.NSLayoutAttributeCenterY, 'baseline':$.NSLayoutAttributeBaseline, '<':$.NSLayoutRelationLessThanOrEqual,
                       '<=':$.NSLayoutRelationLessThanOrEqual, '>':$.NSLayoutRelationGreaterThanOrEqual, 
                       '>=':$.NSLayoutRelationGreaterThanOrEqual, '=':$.NSLayoutRelationEqual, '==':$.NSLayoutRelationEqual };

  Control.prototype.addLayoutConstraint = function(layoutObject) {
    var constraint = $.NSLayoutConstraint('constraintWithItem',
                        (layoutObject.firstItem ? layoutObject.firstItem.nativeView : layoutObject.item.nativeView),
                        'attribute',(attributeMap[layoutObject.firstAttribute] || $.NSLayoutAttributeNotAnAttribute),
                        'relatedBy',(attributeMap[layoutObject.relationship] || $.NSLayoutRelationEqual),
                        'toItem',(layoutObject.secondItem ? layoutObject.secondItem.nativeView : null),
                        'attribute',(attributeMap[layoutObject.secondAttribute] || $.NSLayoutAttributeNotAnAttribute),
                        'multiplier', (layoutObject.multiplier ? layoutObject.multiplier : 0), 
                        'constant', (layoutObject.constant ? layoutObject.constant : 0));
    constraint('setPriority', 490); // NSLayoutPriorityDragThatCannotResizeWindow
    this.nativeView('setContentHuggingPriority',250,'forOrientation', 1); // NSLayoutPriorityDefaultLow
    this.nativeView('setContentHuggingPriority',250,'forOrientation', 0); // NSLayoutPriorityDefaultLow
    this.nativeView('addConstraint',constraint);
    this.nativeView('updateConstraintsForSubtreeIfNeeded');
    this.nativeView('layoutSubtreeIfNeeded');
    return constraint;
  }

  Control.prototype.removeLayoutConstraint = function(obj) {
    this.nativeView('removeConstraint',obj);
    this.nativeView('updateConstraintsForSubtreeIfNeeded');
    this.nativeView('layoutSubtreeIfNeeded');
  }
  //TODO: Figure out if these mappings are really equal to
  // the mappings on Windows
  //TODO: Figure out a way of invaliding intrinsic content size, buttons cannot have
  // explicit heights in auto layout!!
  utils.createLayoutProperty(Control.prototype, 'top', 'bottom', utils.identity, 'top', utils.identity, ['bottom','height']);
  utils.createLayoutProperty(Control.prototype, 'bottom', 'bottom', utils.identity, 'bottom', utils.identity, ['top','height']);
  utils.createLayoutProperty(Control.prototype, 'left', 'left', utils.identity, 'left', utils.identity, ['right','width']);
  utils.createLayoutProperty(Control.prototype, 'right', 'right', utils.identity, 'right', utils.identity, ['left','width']);
  utils.createLayoutProperty(Control.prototype, 'height', 'height', utils.identity, null, utils.identity, ['top','bottom']);
  utils.createLayoutProperty(Control.prototype, 'width', 'width', utils.identity, null, utils.identity, ['left','right']);
  utils.createLayoutProperty(Control.prototype, 'middle', 'middle', utils.identity, 'middle', utils.identity, null);
  utils.createLayoutProperty(Control.prototype, 'center', 'center', utils.identity, 'center', utils.identity, null);

  return Control;
})();
