module.exports = (function() {
  console.assert(typeof application !== "undefined", 'You must use require(\'Application\') prior to using any GUI components.');
  console.assert(process.bridge.dotnet, 'Failure to establish dotnet bridge, use require(\'Application\') prior to using window components.');

  if(global.__TINT.Control) {
    return global.__TINT.Control;
  }

  var $ = process.bridge.dotnet;
  var utils = require('Utilities');
  var assert = require('assert');

  function Control(options) {
    options = options || {};
    options.delegates = options.delegates || [];

    this.nativeView = new this.nativeViewClass();
    if(this.nativeClass === this.nativeViewClass) {
      this.native = this.nativeView;
    } else {
      this.native = new this.nativeClass();
    }

    Object.defineProperty(this,'private', {
      enumerable:false,
      configurable:false,
      value:{
        events:{}, layoutConstraints:[], parent:null, trackingArea:null, needsMouseTracking:0,
        user:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
        constraints:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
        states:{}, callbacks:[]
      }
    });

    var addNativeEventHandlers = function() {
      if(options.nonStandardEvents) {
        return;
      }
      //this.private.drop = this.fireEvent.bind(this,'drop');
      //this.private.dropping = this.fireEvent.bind(this,'dropping');
      this.private.dragExit = this.fireEvent.bind(this,'dragexit');
      this.private.dragEnter = this.fireEvent.bind(this,'dragenter');
      this.private.dropped = function(sender, eventArgs) {
        eventArgs = $.fromPointer(eventArgs);
        var objects = {};
        var conversions = {
          'file':$.System.Windows.DataFormats.FileDrop, 
          'url':$.System.Windows.DataFormats.SymbolicLink, 
          'image':$.System.Windows.DataFormats.Tiff, 
          'html':$.System.Windows.DataFormats.Html, 
          'text':$.System.Windows.DataFormats.UnicodeText, 
          'rtf':$.System.Windows.DataFormats.Rtf, 
          'audio':$.System.Windows.DataFormats.WaveAudio,
          'unknown':$.System.Windows.DataFormats.Serializable
        };
        var objects = [];
        for(var key in conversions) {
          var values = eventArgs.Data.GetData(conversions[key]);
          if(values && !values.Length) {
            objects.push({type:key, data:values});
          } else if(values && values.Length) {
            for(var i=0; i < values.Length; i++) {
              objects.push({type:key, data:values.GetValue(i)});
            }
          }
        }
        this.fireEvent('dropping');
        this.fireEvent('drop');
        if(this.fireEvent('dropped', [objects])) {
          eventArgs.Effects = $.System.Windows.DragDropEffects.All;
        } else {
          eventArgs.Effects = $.System.Windows.DragDropEffects.None;
        }
      }.bind(this);

      this.private.rightMouseUp = this.fireEvent.bind(this,'rightmouseup');
      this.private.rightMouseDown = this.fireEvent.bind(this,'rightmousedown');
      this.private.leftMouseDown =  this.fireEvent.bind(this, 'leftmousedown');
      this.private.leftMouseUp = this.fireEvent.bind(this,'leftmouseup');
      this.private.mouseUp = function() {
        setTimeout(function() {
          this.fireEvent('mouseup');
          this.fireEvent('click');
        }.bind(this),0);
      }.bind(this);
      this.private.mouseDown = function() { 
        this.fireEvent('private-pre-mousedown');
        this.fireEvent('mousedown'); 
      }.bind(this);
      this.private.mouseMove = this.fireEvent.bind(this,'mousemove');
      this.private.mouseEnter = this.fireEvent.bind(this, 'mouseenter');
      this.private.mouseLeave = this.fireEvent.bind(this, 'mouseexit');
      this.private.keyDown = setTimeout.bind(this, this.fireEvent.bind(this, 'keydown'), 0);
      this.private.keyUp = setTimeout.bind(this, this.fireEvent.bind(this, 'keyup'), 0);

      utils.lazyLoadEventListener(this, 'rightmouseup',
        this.native.addEventListener.bind(this.native,'MouseRightButtonUp', this.private.rightMouseUp),
        this.native.removeEventListener.bind(this.native, 'MouseRightButtonUp', this.private.rightMouseUp));

      utils.lazyLoadEventListener(this, 'rightmousedown',
        this.native.addEventListener.bind(this.native,'MouseRightButtonDown', this.private.rightMouseDown),
        this.native.removeEventListener.bind(this.native, 'MouseRightButtonDown', this.private.rightMouseDown));

      utils.lazyLoadEventListener(this, 'leftmousedown',
        this.native.addEventListener.bind(this.native,'MouseLeftButtonDown', this.private.leftMouseDown),
        this.native.removeEventListener.bind(this.native, 'MouseLeftButtonDown', this.private.leftMouseDown));

      utils.lazyLoadEventListener(this, 'leftmouseup',
        this.native.addEventListener.bind(this.native,'MouseLeftButtonUp', this.private.leftMouseUp),
        this.native.removeEventListener.bind(this.native, 'MouseLeftButtonUp', this.private.leftMouseUp));

      utils.lazyLoadEventListener(this, ['mouseup','click'],
        this.native.addEventListener.bind(this.native,'PreviewMouseUp', this.private.mouseUp),
        this.native.removeEventListener.bind(this.native, 'PreviewMouseUp', this.private.mouseUp));

      utils.lazyLoadEventListener(this, 'mousedown',
        this.native.addEventListener.bind(this.native,'PreviewMouseDown', this.private.mouseDown),
        this.native.removeEventListener.bind(this.native, 'PreviewMouseDown', this.private.mouseDown));

      utils.lazyLoadEventListener(this, 'mousemove',
        this.native.addEventListener.bind(this.native,'MouseMove', this.private.mouseMove),
        this.native.removeEventListener.bind(this.native, 'MouseMove', this.private.mouseMove));

      utils.lazyLoadEventListener(this, 'mouseenter',
        this.native.addEventListener.bind(this.native,'MouseEnter', this.private.mouseEnter),
        this.native.removeEventListener.bind(this.native, 'MouseEnter', this.private.mouseEnter));

      utils.lazyLoadEventListener(this, 'mouseexit',
        this.native.addEventListener.bind(this.native,'MouseLeave', this.private.mouseLeave),
        this.native.removeEventListener.bind(this.native, 'MouseLeave', this.private.mouseLeave));

      utils.lazyLoadEventListener(this, 'keydown',
        this.native.addEventListener.bind(this.native,'KeyDown', this.private.keyDown),
        this.native.removeEventListener.bind(this.native, 'KeyDown', this.private.keyDown));

      utils.lazyLoadEventListener(this, 'keyup',
        this.native.addEventListener.bind(this.native,'KeyUp', this.private.keyUp),
        this.native.removeEventListener.bind(this.native, 'KeyUp', this.private.keyUp));

      utils.lazyLoadEventListener(this, 'dragenter',
        this.native.addEventListener.bind(this.native,'PreviewDragEnter', this.private.dragEnter),
        this.native.removeEventListener.bind(this.native, 'PreviewDragEnter', this.private.dragEnter));

      utils.lazyLoadEventListener(this, 'dragexit',
        this.native.addEventListener.bind(this.native,'PreviewDragLeave', this.private.dragExit),
        this.native.removeEventListener.bind(this.native, 'PreviewDragLeave', this.private.dragExit));
  
      utils.lazyLoadEventListener(this, 'dropped', 
        this.native.addEventListener.bind(this.native,'PreviewDrop', this.private.dropped),
        this.native.removeEventListener.bind(this.native, 'PreviewDrop', this.private.dropped));
    }.bind(this);

    addNativeEventHandlers();

    // Incase the base native type needs to be remapped we need to re-apply all of the 
    // subsequent settings back to "normal".
    this.private.remapStates = function() {
      var keys = Object.keys(this.private.states);
      for(var i=0; i < keys.length; i++) {
        this[keys[i]] = this.private.states[keys[i]];
      }
      addNativeEventHandlers();
    }.bind(this);

    this.addEventListener('parent-attached', function(p) { this.private.parent = p; }.bind(this));
    this.addEventListener('parent-dettached', function() { this.private.parent = null; }.bind(this));
  }

  Control.prototype.animateOnSizeChange = false;
  Control.prototype.animateOnPositionChange = false;

  utils.makePropertyNumberType(Control.prototype, 'alpha', 'Opacity');

  utils.makePropertyBoolType(Control.prototype, 'visible', 'Visibility',
    $.System.Windows.Visibility.Visible,
    $.System.Windows.Visibility.Hidden);

  Object.defineProperty(Control.prototype, 'acceptsDroppedTypes', {
    get:function() { return this.private.dragTypes; },
    set:function(e) {
      assert(Array.isArray(e), 'The passed in acceptable dragged types must be an array.');
      this.private.dragTypes = e;
      this.nativeView.AllowDrop = e ? true : false;
      this.native.AllowDrop = e ? true : false;
    }
  });
  utils.def(Control.prototype, 'boundsOnScreen',
    function() {
      if(!this.native.GetType().Equals($.System.Windows.Window) && !this.private.parent) {
        return null;
      }
      var target = $.System.Windows.Window.GetWindow(this.nativeView);
      if(target === null) {
        return null;
      }
      var bounds = this.nativeView.TransformToVisual(target).TransformBounds($.System.Windows.Controls.Primitives.LayoutInformation.GetLayoutSlot(this.nativeView));
      var p = utils.wpfDeviceToLogicalPx(target,this.nativeView.PointToScreen(new $.System.Windows.Point(0,0)));
      return {x:Math.round(p.X), y:Math.round(p.Y), width:Math.round(bounds.Width), height:Math.round(bounds.Height)};
   }
  );

  utils.def(Control.prototype, 'boundsOnWindow',
    function() {
      if(!this.native.GetType().Equals($.System.Windows.Window) && !this.private.parent) {
        return null;
      }
      var target = $.System.Windows.Window.GetWindow(this.nativeView);
      if(target === null) {
        return null;
      }
      var bounds = this.nativeView.TransformToVisual(target).TransformBounds($.System.Windows.Controls.Primitives.LayoutInformation.GetLayoutSlot(this.nativeView));
      var p = utils.wpfDeviceToLogicalPx(target,this.nativeView.PointToScreen(new $.System.Windows.Point(0,0)));
      return {x:Math.round(p.X - target.Left), y:Math.round(p.Y - target.Top), width:Math.round(bounds.Width), height:Math.round(bounds.Height)};
    }
  );

  utils.def(Control.prototype, 'bounds',
    function() {
      var target = this.nativeView.Parent;
      if(this.native.GetType().Equals($.System.Windows.Window)) {
        return this.boundsOnWindow;
      } else {
        if(!this.private.parent) {
          return null;
        }
      }
      var bounds = this.nativeView.TransformToVisual(target).TransformBounds($.System.Windows.Controls.Primitives.LayoutInformation.GetLayoutSlot(this.nativeView));
      var p = this.nativeView.TransformToAncestor(target).Transform(new $.System.Windows.Point(0,0));
      return {x:Math.round(p.X), y:Math.round(p.Y), width:Math.round(bounds.Width), height:Math.round(bounds.Height)};
    }
  );


  Control.prototype.focus = function() {
    if(this.native && this.native.Focus) {  
      this.native.Focus();
    }
    if(this.nativeView && this.nativeView.Focus) {
      this.nativeView.Focus();
    }
  }

  utils.defEvents(Control.prototype);

  function getConstraintSolver() {
    // WPF has an awkward inheritence schema. If we want a border on an element we have to wrap that element
    // in a Border control (rather than border being properties on the control inherited).  This means when we
    // do layout we have to determine which is hte "actual" child that's the target we're adding to (always, almost
    // always, a AutoLayoutPanel as the target).  In addition we have to carefully determine what the items are,
    // we do this by looking for a defined "Child" attribute. "wrapping" controls such as Border use this to set
    // the single (and only) child element.  The Child will contain the panel that we need to use for our target and
    // first/second item.  This detects for it and silently returns if it doesn't find any target.
    if(this.private.parent.nativeView.Child && this.private.parent.nativeView.Child.AddLayoutConstraint) {
      return this.private.parent.nativeView.Child;
    } else if (this.private.parent.nativeView.AddLayoutConstraint) {
      return this.private.parent.nativeView;
    } else {
      return null;
    }
  }

  Control.prototype.addLayoutConstraint = function(layoutObject) {
    var target = (getConstraintSolver.bind(this))();
    if(target === null) {
      return;
    }

    var firstItem = (layoutObject.firstItem ? layoutObject.firstItem.nativeView : layoutObject.item.nativeView);
    var secondItem = (layoutObject.secondItem ? layoutObject.secondItem.nativeView : null);
    secondItem = secondItem ? (secondItem.Child ? secondItem.Child : secondItem) : null;

    var constraint = target.AddLayoutConstraint(
        firstItem,
        utils.capitalize(layoutObject.firstAttribute),
        layoutObject.relationship,
        secondItem,
        (layoutObject.secondAttribute ? utils.capitalize(layoutObject.secondAttribute) : null),
        (layoutObject.multiplier ? layoutObject.multiplier : 0), 
        (layoutObject.constant ? layoutObject.constant : 0) );
    this.private.layoutConstraints.push(layoutObject);
    return constraint;
  };

  Control.prototype.changeLayoutConstraint = function(previousConstraint, layoutObject) {
    if(previousConstraint.multiplier !== layoutObject.multiplier ||
        previousConstraint.controlSecond === null && layoutObject.secondItem !== null || 
        previousConstraint.controlSecond !== null && layoutObject.secondItem === null || 
        previousConstraint.controlFirst !== null && layoutObject.firstItem === null) 
    {
      this.removeLayoutConstraint(previousConstraint);
      return this.addLayoutConstraint(layoutObject);
    }
    var target = (getConstraintSolver.bind(this))();
    if(target === null) {
      return;
    }

    if(this.animateOnSizeChange || this.animateOnPositionChange) {
      target.AnimateConstant(previousConstraint, layoutObject.constant);
    } else {
      target.ChangeConstant(previousConstraint, layoutObject.constant);
    }
    return previousConstraint;
  };

  Control.prototype.removeLayoutConstraint = function(n) {
    this.private.parent.nativeView.RemoveLayoutConstraint(n);
    this.private.layoutConstraints.splice(this.private.layoutConstraints.indexOf(n),1);
  };

  // control, name, percentName, percentFunc, scalarName, scalarFunc, notallowed
  utils.createLayoutProperty(Control.prototype, 'top', 'bottom', utils.identity, 'top', utils.identity, ['bottom','height']);
  utils.createLayoutProperty(Control.prototype, 'bottom', 'bottom', utils.negate, 'bottom', utils.negate, ['top','height']);
  utils.createLayoutProperty(Control.prototype, 'left', 'left', utils.identity, 'left', utils.identity, ['right','width']);
  utils.createLayoutProperty(Control.prototype, 'right', 'right', utils.identity, 'right', utils.negate, ['left','width']);
  utils.createLayoutProperty(Control.prototype, 'height', 'height', utils.identity, null, utils.identity, ['top','bottom']);
  utils.createLayoutProperty(Control.prototype, 'width', 'width', utils.identity, null, utils.identity, ['left','right']);
  utils.createLayoutProperty(Control.prototype, 'middle', 'middle', utils.identity, 'middle', utils.identity, null);
  utils.createLayoutProperty(Control.prototype, 'center', 'center', utils.identity, 'center', utils.identity, null);

  global.__TINT.Control = Control;
  return Control;
})();
