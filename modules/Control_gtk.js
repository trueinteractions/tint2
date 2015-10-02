module.exports = (function() {
  console.assert(typeof application !== "undefined", 'You must use require(\'Application\') prior to using any GUI components.');
  console.assert(process.bridge.gobj, 'Failure to establish gtk bridge.');

  if(global.__TINT.Control) {
    return global.__TINT.Control;
  }

  var $ = process.bridge.gobj.Gtk;
  var util = require('Utilities');
  var System = require('System');
  var assert = require('assert');

  function addTrackingArea() {
    //var bounds = this.nativeView('bounds');
    //var options = $.NSTrackingMouseEnteredAndExited | $.NSTrackingMouseMoved | $.NSTrackingActiveInActiveApp | $.NSTrackingInVisibleRect;
    //this.private.trackingArea = $.NSTrackingArea('alloc')('initWithRect', bounds, 'options', options, 'owner', this.nativeView, 'userInfo', null);
    //this.nativeView('addTrackingArea',this.private.trackingArea);
  }

  function mouseDown(self, cmd, events) {
    //this.fireEvent('mousedown');
    //util.callSuperForEvent.apply(this,['mouseDown', self, cmd, events]);
    //if(this.private.options.mouseDownBlocks) {
    //  this.fireEvent('mouseup');
    //  this.fireEvent('click');
    //}
  }
  function mouseUp(self, cmd, events) { 
    //this.fireEvent('mouseup'); 
    //this.fireEvent('click');
    //util.callSuperForEvent.apply(this,['mouseUp', self, cmd, events]);
  }
  function rightMouseDown(self, cmd, events) { 
    //this.fireEvent('rightmousedown');
    //util.callSuperForEvent.apply(this,['rightMouseDown', self, cmd, events]);
  }
  function rightMouseUp(self, cmd, events) {
    //this.fireEvent('rightmouseup');
    //util.callSuperForEvent.apply(this,['rightMouseUp', self, cmd, events]);
  }
  function keyDown(self, cmd, events) { 
    //this.fireEvent('keydown');
    //util.callSuperForEvent.apply(this,['keyDown', self, cmd, events]);
  }
  function keyUp(self, cmd, events) {
    //this.fireEvent('keyup');
    //util.callSuperForEvent.apply(this,['keyUp', self, cmd, events]);
  }
  function mouseEntered(self, cmd, events) { 
    //this.fireEvent('mouseenter');
    //util.callSuperForEvent.apply(this,['mouseEntered', self, cmd, events]);
  }
  function mouseExited(self, cmd, events) { 
    //this.fireEvent('mouseexit');
    //util.callSuperForEvent.apply(this,['mouseExited', self, cmd, events]);
  }
  function mouseMoved(self, cmd, events) { 
    //this.fireEvent('mousemove');
    //util.callSuperForEvent.apply(this,['mouseMoved', self, cmd, events]);
  }
  function draggingEntered(self, cmd, sender) {
    //this.fireEvent('dragenter');
    //return $.NSDragOperationCopy;
  }
  function draggingExited(self, cmd, sender) {
    //this.fireEvent('dragexit');
    //return $.NSDragOperationCopy;
  }
  function draggingEnded(self, cmd, sender) {
    //this.fireEvent('dropping');
    //return $.NSDragOperationCopy;
  }
  function prepareForDragOperation(self, cmd, sender) {
    //this.fireEvent('drop');
    //return $.YES;
  }
  function performDragOperation(self, cmd, sender) {
    /*var types = sender('draggingPasteboard')('pasteboardItems');
    var num = types('count');
    var objects = [];
    for(var i=0; i < num; i++) {
      var item = types('objectAtIndex', i);
      var nTypes = util.nsArrayToArray(item('types'));
      var ourType = util.convertUTITypesBack(nTypes);
      var data = item('dataForType', util.findSuggestedUTIType(nTypes));
      objects.push({type:ourType, data:process.bridge.reinterpret(data('bytes'),data('length'),0)});
    }
    return this.fireEvent('dropped', [objects]) ? $.YES : $.NO;*/
  }

  function Control(options) {
    options = options || {};
    options.delegates = options.delegates || [];

    Object.defineProperty(this, 'private', {
      configurable:false,
      enumerable:false,
      dragTypes:[],
      value:{
        events:{}, parent:null, trackingArea:null, needsMouseTracking:0,
        user:{width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
        constraints:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
        states:{}, options:options,
        borderRadius:[0,0,0,0]
      }
    });
/*
    if(!options.nonStandardEvents) {
      options.delegates = options.delegates.concat([
        ['draggingEntered:', 'Q@:@', draggingEntered.bind(this)],
        ['draggingExited:', 'v@:@', draggingExited.bind(this)],
        ['draggingEnded:', 'v@:@', draggingEnded.bind(this)],
        ['performDragOperation:', 'B@:@', performDragOperation.bind(this)],
        ['prepareForDragOperation:', 'B@:@', prepareForDragOperation.bind(this)],
        ['mouseDown:','v@:@', mouseDown.bind(this)],
        ['mouseUp:','v@:@', mouseUp.bind(this)],
        ['rightMouseDown:','v@:@', rightMouseDown.bind(this)],
        ['rightMouseUp:','v@:@', rightMouseUp.bind(this)],
        ['keyDown:','v@:@', keyDown.bind(this)],
        ['keyUp:','v@:@', keyUp.bind(this)],
        ['mouseEntered:','v@:@', mouseEntered.bind(this)],
        ['mouseExited:','v@:@', mouseExited.bind(this)],
        ['mouseMoved:','v@:@', mouseMoved.bind(this)],
      ]);
    }
*/
    //var nativeViewExtended = this.nativeViewClass.extend(this.nativeViewClass.getName()+Math.round(Math.random()*10000000));
    //options.delegates.forEach(function(item) { nativeViewExtended.addMethod(item[0],item[1],item[2]); });
    //nativeViewExtended.register();

    if(!options.doNotInitialize) {
      //this.nativeView = nativeViewExtended('alloc')('init');
      //this.native = (this.nativeClass === this.nativeViewClass) ? this.nativeView : this.nativeClass('alloc')('init');
      //this.nativeView('setTranslatesAutoresizingMaskIntoConstraints',$.NO);
    }

    this.nativeViewClass = nativeViewExtended;
    this.addEventListener('parent-attached', function(p) { this.private.parent = p; }.bind(this));
    this.addEventListener('parent-dettached', function() { this.private.parent = null; }.bind(this));

    this.addEventListener('event-listener-added', function(event) {
      if(event === "mouseenter" || event === "mouseexit" || event === "mousemove") {
        this.private.needsMouseTracking++;
        if(this.private.needsMouseTracking === 1 && this.nativeView('window')) {
          addTrackingArea.apply(this,null);
        } else if (this.private.needsMouseTracking === 1) {
          this.addEventListener('parent-attached', addTrackingArea.bind(this));
        }
      }
    }.bind(this));

    this.addEventListener('event-listener-removed', function(event) {
      if(event === "mouseenter" || event === "mouseexit" || event === "mousemove") {
        this.private.needsMouseTracking--;
        if(this.private.needsMouseTracking === 0) {
          //this.nativeView('removeTrackingArea',this.private.trackingArea);
          //this.private.trackingArea('release');
          this.private.trackingArea = null;
        }
      }
    }.bind(this));
  }

  Control.prototype.moveAbove = function(control) {
    assert(this.private.parent, 'The control is not currently placed on a container.');
    //this.nativeView('removeFromSuperviewWithoutNeedingDisplay');
    //this.private.parent.nativeView('addSubview', this.nativeView, 'positioned', $.NSWindowAbove, 'relativeTo', control.nativeView);
    reapplyConstraints.apply(this);
  }

  Control.prototype.moveBelow = function(control) {
    assert(this.private.parent, 'The control is not currently placed on a container.');
    //this.nativeView('removeFromSuperviewWithoutNeedingDisplay');
    //this.private.parent.nativeView('addSubview', this.nativeView, 'positioned', $.NSWindowBelow, 'relativeTo', control.nativeView);
    reapplyConstraints.apply(this);
  }

  Object.defineProperty(Control.prototype, 'acceptsDroppedTypes', {
    get:function() { return this.private.dragTypes; },
    set:function(e) {
      assert(Array.isArray(e), 'The passed in acceptable dragged types must be an array.');
      this.private.dragTypes = e;
      var arr = null;
      var convertedTypes = this.private.dragTypes.forEach(function(item) {
        if(arr === null) {
          arr = util.convertDraggedTypes(item);
        } else {
          arr = util.mergeNSArray(arr, util.convertDraggedTypes(item));
        }
      });
      if(arr === null) {
        //this.nativeView('unregisterForDraggedTypes');
      } else {
        //this.nativeView('registerForDraggedTypes', arr);
      }
    }
  });

  Control.prototype.animateOnSizeChange = false;
 
  Control.prototype.animateOnPositionChange = false;

  util.makePropertyNumberType(Control.prototype, 'alpha', 'alphaValue','setAlphaValue');

  util.makePropertyBoolType(Control.prototype, 'visible', 'isHidden', 'setHidden', {inverse:true});

  function convY(frame, parentFrame) {
    frame.origin.y = parentFrame.size.height - frame.origin.y - frame.size.height;
    return frame;
  }

  util.def(Control.prototype, 'boundsOnScreen',
    function() {
      //if(!this.nativeView('superview')) {
      //  return null;
      //}
      //var b = this.nativeView('window')('convertRectToScreen',this.nativeView('convertRect',this.nativeView('bounds'),'toView',null));
      //var bnds = convY(b,$.NSScreen('mainScreen')('frame'));
      var offsetY = 0;
      //if(!this.nativeView('isEqual',this.nativeView('window')('contentView'))) {
      //  offsetY = 1;
      //}
      return {
        x:Math.round(bnds.origin.x), 
        y:Math.round(bnds.origin.y) + offsetY, 
        width:Math.round(bnds.size.width), 
        height:Math.round(bnds.size.height)
      };
    }
  );

  util.def(Control.prototype, 'boundsOnWindow',
    function() {
      //if(!this.nativeView('superview')) {
      //  return null;
      //}
      //var bnds = convY(this.nativeView('frame'), this.nativeView('window')('frame'));
      var offsetY = 0;
      //if(!this.nativeView('isEqual',this.nativeView('window')('contentView'))) {
      //  offsetY = 1;
      //}
      return {
        x:Math.round(bnds.origin.x), 
        y:Math.round(bnds.origin.y) + offsetY, 
        width:Math.round(bnds.size.width), 
        height:Math.round(bnds.size.height)
      };
    }
  );

  util.def(Control.prototype, 'borderRadius',
    function() { return this.private.borderRadius.join(' '); },
    function(e) {
      if(typeof(e) !== 'string' && typeof(e) !== 'number') {
        return;
      }
      if(typeof(e) === 'number') {
        e = e.toString();
      }
      e = e.replace(/px/g, '');
      while(e.indexOf('  ') > -1) {
        e = e.replace(/  /g, ' ');
      }
      e = e.split(' ');
      e.forEach(function(item, ndx) {
        try {
          e[ndx] = parseInt(item);
        } catch (e) {
          e[ndx] = 0;
        }
      });
      if(e.length === 1) {
        this.private.borderRadius = [e[0],e[0],e[0],e[0]];
      } else if (e.length === 2) {
        this.private.borderRadius = [e[0],e[1],e[0],e[1]];
      } else if (e.length === 3) {
        this.private.borderRadius = [e[0],e[1],e[2],e[0]];
      } else if (e.length >= 4) {
        this.private.borderRadius = [e[0],e[1],e[2],e[3]];
      }
      //if(this.nativeView('layer') === null) {
      //  this.nativeView('setWantsLayer', $.YES);
      //}
      //this.nativeView('layer')('setCornerRadius', e[0]);
      //this.nativeView('setNeedsDisplay', $.YES);
    }
  )

  util.def(Control.prototype, 'bounds',
    function() {
      //if(!this.nativeView('superview')) {
      //  return null;
      //}
      //var bnds = convY(this.nativeView('frame'), this.nativeView('superview')('frame'));
      var offsetY = 0;
      //if(this.nativeView('superview')('isEqual',this.nativeView('window')('contentView')) && bnds.origin.y === -1) {
      //  offsetY = 1;
      //}
      return {
        x:Math.round(bnds.origin.x), 
        y:Math.round(bnds.origin.y) + offsetY, 
        width:Math.round(bnds.size.width), 
        height:Math.round(bnds.size.height)
      };
    }
  );

  util.defEvents(Control.prototype);
/*
  var attributeMap = { 
    'left':$.NSLayoutAttributeLeft,
    'right':$.NSLayoutAttributeRight,
    'top':$.NSLayoutAttributeTop,
    'bottom':$.NSLayoutAttributeBottom,
    'leading':$.NSLayoutAttributeLeading,
    'trailing':$.NSLayoutAttributeTrailing,
    'width':$.NSLayoutAttributeWidth,
    'height':$.NSLayoutAttributeHeight,
    'center':$.NSLayoutAttributeCenterX,
    'middle':$.NSLayoutAttributeCenterY,
    'baseline':$.NSLayoutAttributeBaseline,
    '<':$.NSLayoutRelationLessThanOrEqual,
    '<=':$.NSLayoutRelationLessThanOrEqual,
    '>':$.NSLayoutRelationGreaterThanOrEqual, 
    '>=':$.NSLayoutRelationGreaterThanOrEqual,
    '=':$.NSLayoutRelationEqual,
    '==':$.NSLayoutRelationEqual
  };
*/
  function reapplyConstraints() {
    for(var key in this.private.constraints) {
      if(this.private.constraints[key]) {
        this.private.constraints[key] =  null;
        this[key] = this[key];
      }
    }
  }

  Control.prototype.addLayoutConstraint = function(layoutObject) {
    if(this.private.parent !== null && 
        this.private.parent.private.ignoreConstraints)
    {
      return null;
    }
    /*
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
    this.nativeView('setContentCompressionResistancePriority',250,'forOrientation',1);
    this.nativeView('setContentCompressionResistancePriority',250,'forOrientation',0);
    this.private.parent.nativeView('addConstraint', constraint);
    this.private.parent.nativeView('updateConstraintsForSubtreeIfNeeded');
    this.private.parent.nativeView('layoutSubtreeIfNeeded');
    */
    return constraint;
  };

  Control.prototype.changeLayoutConstraint = function(previousConstraint, layoutObject) {
    if(this.private.parent !== null && 
        this.private.parent.private.ignoreConstraints) 
    {
      return null;
    }
    //if(previousConstraint('multiplier') !== layoutObject.multiplier  ||
    //    previousConstraint('secondItem') === null && layoutObject.secondItem !== null || 
    //    previousConstraint('secondItem') !== null && layoutObject.secondItem === null || 
    //    previousConstraint('firstItem') !== null && layoutObject.firstItem === null ) 
    //{
      this.removeLayoutConstraint(previousConstraint);
      return this.addLayoutConstraint(layoutObject);
    //}
    if(this.animateOnSizeChange || this.animateOnPositionChange) {
      //previousConstraint('animator')('setConstant', layoutObject.constant);
    } else {
      //previousConstraint('setConstant', layoutObject.constant);
    }
    return previousConstraint;
  };

  Control.prototype.removeLayoutConstraint = function(obj) {
    if(this.private.parent !== null && 
        this.private.parent.private.ignoreConstraints) 
    {
      return;
    } else if(this.private.parent !== null) {
      //this.private.parent.nativeView('removeConstraint',obj);
      //this.private.parent.nativeView('updateConstraintsForSubtreeIfNeeded');
      //this.private.parent.nativeView('layoutSubtreeIfNeeded');
    }
  };

  Control.prototype.focus = function() {
    //if(this.native('respondsToSelector', 'window')) {
      //if(this.native('window')) {
        //this.native('window')('makeFirstResponder', this.native);
      //}
    //}
  }

  util.createLayoutProperty(Control.prototype, 'top', 'top', util.identity, 'top', util.identity, ['bottom','height']);

  util.createLayoutProperty(Control.prototype, 'bottom', 'bottom', util.negate, 'bottom', util.negate, ['top','height']);

  util.createLayoutProperty(Control.prototype, 'left', 'left', util.identity, 'left', util.identity, ['right','width']);

  util.createLayoutProperty(Control.prototype, 'right', 'right', util.identity, 'right', util.negate, ['left','width']);

  util.createLayoutProperty(Control.prototype, 'height', 'height', util.identity, null, util.identity, ['top','bottom']);

  util.createLayoutProperty(Control.prototype, 'width', 'width', util.identity, null, util.identity, ['left','right']);

  util.createLayoutProperty(Control.prototype, 'middle', 'middle', util.identity, 'middle', util.identity, null);
 
  util.createLayoutProperty(Control.prototype, 'center', 'center', util.identity, 'center', util.identity, null);

  global.__TINT.Control = Control;
  return Control;
})();
