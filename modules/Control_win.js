module.exports = (function() {
  console.assert(typeof application !== "undefined", 'You must use require(\'Application\') prior to using any GUI components.');
  console.assert(process.bridge.dotnet, 'Failure to establish dotnet bridge, use require(\'Application\') prior to using window components.');
  
  var $ = process.bridge.dotnet;
  var utils = require('Utilities_base');

  function wpfDeviceToLogicalPx(w,p) {
    var t = $.System.Windows.PresentationSource.FromVisual(w).CompositionTarget.TransformFromDevice;
    return t.Transform(p);
  }

  /* Control Class */
  function Control(NativeObjectClass, NativeViewClass, options) {
    options = options || {};
    options.delegates = options.delegates || [];

    this.nativeClassView = NativeViewClass;
    this.nativeClass = NativeObjectClass;
  
    this.nativeView = new NativeViewClass();
    if(options.initViewOnly)
      this.native = this.nativeView;
    else
      this.native = new NativeObjectClass();

    this.private = {
      events:{}, layoutConstraints:[], parent:null, trackingArea:null, needsMouseTracking:0,
      user:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
      constraints:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
      states:{}, callbacks:[]
    };

    var addNativeEventHandlers = function() {
      if(options.nonStandardEvents) return;
      var rightMouseUp = function() { this.fireEvent('rightmouseup'); }.bind(this);
      var rightMouseDown = function() { this.fireEvent('rightmousedown'); }.bind(this);
      var leftMouseDown =  function() { this.fireEvent('leftmousedown'); }.bind(this);
      var leftMouseUp = function() { this.fireEvent('leftmouseup'); }.bind(this);
      var mouseUp = function() {
        setTimeout(function() {
          this.fireEvent('mouseup');
          this.fireEvent('click');
        }.bind(this),0);
      }.bind(this);
      var mouseDown = function() { 
        this.fireEvent('private-pre-mousedown');
        this.fireEvent('mousedown'); 
      }.bind(this);
      var mouseMove = function() { this.fireEvent('mousemove'); }.bind(this);
      var mouseEnter = function() { this.fireEvent('mouseenter'); }.bind(this);
      var mouseLeave = function() { this.fireEvent('mouseexit'); }.bind(this);
      var keyDown = function() { 
        setTimeout(function() { this.fireEvent('keydown'); }.bind(this),0);
      }.bind(this);
      var keyUp = function() { 
        setTimeout(function() { this.fireEvent('keyup'); }.bind(this),0);
      }.bind(this);

      this.native.addEventListener('MouseRightButtonUp', rightMouseUp);
      this.native.addEventListener('MouseRightButtonDown', rightMouseDown);
      this.native.addEventListener('MouseLeftButtonDown', leftMouseDown);
      this.native.addEventListener('MouseLeftButtonUp', leftMouseUp);
      this.native.addEventListener('PreviewMouseUp', mouseUp);
      this.native.addEventListener('PreviewMouseDown', mouseDown);
      this.native.addEventListener('MouseMove', mouseMove);
      this.native.addEventListener('MouseEnter', mouseEnter);
      this.native.addEventListener('MouseLeave', mouseLeave);
      this.native.addEventListener('KeyDown', keyDown);
      this.native.addEventListener('KeyUp', keyUp);

      this.private.callbacks.push(rightMouseUp);
      this.private.callbacks.push(rightMouseDown);
      this.private.callbacks.push(leftMouseDown);
      this.private.callbacks.push(leftMouseUp);
      this.private.callbacks.push(mouseUp);
      this.private.callbacks.push(mouseDown);
      this.private.callbacks.push(mouseMove);
      this.private.callbacks.push(mouseEnter);
      this.private.callbacks.push(mouseLeave);
      this.private.callbacks.push(keyDown);
      this.private.callbacks.push(keyUp);
    }.bind(this);

    addNativeEventHandlers();

    // Incase the base native type needs to be remapped we need to re-apply all of the 
    // subsequent settings back to "normal".
    this.private.remapStates = function(oldNative) {
      var keys = Object.keys(this.private.states);
      for(var i=0; i < keys.length; i++)
        this[keys[i]] = this.private.states[keys[i]];
      addNativeEventHandlers();
    }.bind(this);

    this.addEventListener('parent-attached', function(p) { this.private.parent = p; }.bind(this));
    this.addEventListener('parent-dettached', function(p) { this.private.parent = null; }.bind(this));
  }

  Object.defineProperty(Control.prototype, 'alpha', {
    configurable:true,
    get:function() { return this.nativeView.Opacity; },
    set:function(e) { 
      this.private.states['alpha'] = e;
      return this.nativeView.Opacity = e; 
    }
  });

   Object.defineProperty(Control.prototype, 'visible', {
      get:function() { return this.native.Visibility == $.System.Windows.Visibility.Visible; },
      set:function(e) {
        this.private.states['visible'] = e;
        if(e) this.native.Visibility = $.System.Windows.Visibility.Visible;
        else this.native.Visibility = $.System.Windows.Visibility.Hidden;
      }
    });

  Object.defineProperty(Control.prototype,'boundsOnScreen', {
    get:function() {
      if(!this.native.GetType().Equals($.System.Windows.Window) 
        && !this.private.parent) return null;
      var target = $.System.Windows.Window.GetWindow(this.nativeView);
      if(target == null) return null;
      var bounds = this.nativeView.TransformToVisual(target)
                    .TransformBounds($.System.Windows.Controls.Primitives.LayoutInformation.GetLayoutSlot(this.nativeView));
      var p = wpfDeviceToLogicalPx(target,this.nativeView.PointToScreen(new $.System.Windows.Point(0,0)));
      return {x:Math.round(p.X), y:Math.round(p.Y), width:Math.round(bounds.Width), height:Math.round(bounds.Height)};
   }
  });

  Object.defineProperty(Control.prototype,'boundsOnWindow', {
    get:function() {
      if(this.native.GetType().Equals($.System.Windows.Window)) {
        target = this.native;
      } else {
        if(!this.private.parent) return null;
      }
      var target = $.System.Windows.Window.GetWindow(this.nativeView);
      if(target == null) return null;
      var bounds = this.nativeView.TransformToVisual(target)
                    .TransformBounds($.System.Windows.Controls.Primitives.LayoutInformation.GetLayoutSlot(this.nativeView));
      var p = wpfDeviceToLogicalPx(target,this.nativeView.PointToScreen(new $.System.Windows.Point(0,0)));
      return {x:Math.round(p.X - target.Left), y:Math.round(p.Y - target.Top), width:Math.round(bounds.Width), height:Math.round(bounds.Height)};
    }
  });

  Object.defineProperty(Control.prototype,'bounds', {
    get:function() {
      var target = this.nativeView.Parent;
      if(this.native.GetType().Equals($.System.Windows.Window)) {
        return this.boundsOnWindow;
      } else {
        if(!this.private.parent) return null;
      }
      var bounds = this.nativeView.TransformToVisual(target)
                    .TransformBounds($.System.Windows.Controls.Primitives.LayoutInformation.GetLayoutSlot(this.nativeView));
      var p = this.nativeView.TransformToAncestor(target).Transform(new $.System.Windows.Point(0,0));
      return {x:Math.round(p.X), y:Math.round(p.Y), width:Math.round(bounds.Width), height:Math.round(bounds.Height)};
    }
  });

  Control.prototype.fireEvent = function(event, args) {
    try {
      event = event.toLowerCase();
      var returnvalue = undefined;
      if(!this.private.events[event]) this.private.events[event] = [];
      (this.private.events[event]).forEach(function(item,index,arr) { 
        returnvalue = item.apply(null, args) || returnvalue; 
      });
      return returnvalue;
    } catch(e) {
      console.error(e.message);
      console.error(e.stack);
      process.exit(1);
    }
  }

  Control.prototype.addEventListener = function(event, func) {
    event = event.toLowerCase();
    if(!this.private.events[event])
      this.private.events[event] = []; 
    this.private.events[event].push(func);
  }

  Control.prototype.removeEventListener = function(event, func) {
    event = event.toLowerCase();
    if(this.private.events[event] && 
        this.private.events[event].indexOf(func) != -1) 
      this.private.events[event].splice(this.private.events[event].indexOf(func), 1);
  }

  Control.prototype.addLayoutConstraint = function(layoutObject) {
    // incase we're added to a panel that isn't auto-layout, go ahead and ignore.
    var target = null;
    if(this.private.parent.nativeView.Child && this.private.parent.nativeView.Child.AddLayoutConstraint) {
      target = this.private.parent.nativeView.Child;
    } else if (this.private.parent.nativeView.AddLayoutConstraint) {
      target = this.private.parent.nativeView;
    } else
      return;

    var constraint = target.AddLayoutConstraint(
        (layoutObject.firstItem ? layoutObject.firstItem.nativeView : layoutObject.item.nativeView),
        utils.capitalize(layoutObject.firstAttribute),
        layoutObject.relationship,
        (layoutObject.secondItem ? layoutObject.secondItem.nativeView : null),
        (layoutObject.secondAttribute ? utils.capitalize(layoutObject.secondAttribute) : null),
        (layoutObject.multiplier ? layoutObject.multiplier : 0), 
        (layoutObject.constant ? layoutObject.constant : 0) );
    this.private.layoutConstraints.push(layoutObject);
    return constraint;
  }

  Control.prototype.removeLayoutConstraint = function(n) {
    this.private.parent.nativeView.RemoveLayoutConstraint(n);
    this.private.layoutConstraints.splice(this.private.layoutConstraints.indexOf(n),1);
  }

  // control, name, percentName, percentFunc, scalarName, scalarFunc, notallowed
  utils.createLayoutProperty(Control.prototype, 'top', 'bottom', utils.identity, 'top', utils.identity, ['bottom','height']);
  utils.createLayoutProperty(Control.prototype, 'bottom', 'bottom', utils.negate, 'bottom', utils.negate, ['top','height']);
  utils.createLayoutProperty(Control.prototype, 'left', 'left', utils.identity, 'left', utils.identity, ['right','width']);
  utils.createLayoutProperty(Control.prototype, 'right', 'right', utils.identity, 'right', utils.negate, ['left','width']);
  utils.createLayoutProperty(Control.prototype, 'height', 'height', utils.identity, null, utils.identity, ['top','bottom']);
  utils.createLayoutProperty(Control.prototype, 'width', 'width', utils.identity, null, utils.identity, ['left','right']);
  utils.createLayoutProperty(Control.prototype, 'middle', 'middle', utils.identity, 'middle', utils.identity, null);
  utils.createLayoutProperty(Control.prototype, 'center', 'center', utils.identity, 'center', utils.identity, null);

  return Control;
})();
