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

    var addNativeEventHandlers = function() {
      if(options.nonStandardEvents) return;
      this.native.addEventListener('MouseRightButtonUp', function() { this.fireEvent('rightmouseup'); }.bind(this));
      this.native.addEventListener('MouseRightButtonDown', function() { this.fireEvent('rightmousedown'); }.bind(this));
      this.native.addEventListener('MouseLeftButtonDown', function() { this.fireEvent('leftmousedown'); }.bind(this));
      this.native.addEventListener('MouseLeftButtonUp', function() {
        this.fireEvent('leftmouseup');
      }.bind(this));
      this.native.addEventListener('PreviewMouseUp', function() {
        // State changes don't happen until after the events have processed,
        // delay until the next cycle.
        setTimeout(function() {
          this.fireEvent('mouseup');
          this.fireEvent('click');
        }.bind(this),0);
      }.bind(this));
      this.native.addEventListener('PreviewMouseDown', function() { 
        this.fireEvent('mousedown'); 
      }.bind(this));
      this.native.addEventListener('MouseMove', function() { this.fireEvent('mousemove'); }.bind(this));
      this.native.addEventListener('MouseEnter', function() { this.fireEvent('mouseenter'); }.bind(this));
      this.native.addEventListener('MouseLeave', function() { this.fireEvent('mouseexit'); }.bind(this));
      this.native.addEventListener('KeyDown', function() { this.fireEvent('keydown'); }.bind(this));
      this.native.addEventListener('KeyUp', function() { this.fireEvent('keyup'); }.bind(this));
    }.bind(this);

    addNativeEventHandlers();

    this.private = {
      events:{}, layoutConstraints:[], parent:null, trackingArea:null, needsMouseTracking:0,
      user:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
      constraints:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
      states:{}
    };

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

  Object.defineProperty(Control.prototype,'bounds',{
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
    var constraint = this.private.parent.nativeView.AddLayoutConstraint(
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

  utils.createLayoutProperty(Control.prototype, 'top', 'bottom', utils.identity, 'top', utils.identity, ['bottom','height']);
  utils.createLayoutProperty(Control.prototype, 'bottom', 'bottom', utils.negate, 'bottom', utils.negate, ['top','height']);
  utils.createLayoutProperty(Control.prototype, 'left', 'left', utils.identity, 'left', utils.identity, ['right','width']);
  utils.createLayoutProperty(Control.prototype, 'right', 'right', utils.negate, 'right', utils.negate, ['left','width']);
  utils.createLayoutProperty(Control.prototype, 'height', 'height', utils.identity, null, utils.identity, ['top','bottom']);
  utils.createLayoutProperty(Control.prototype, 'width', 'width', utils.identity, null, utils.identity, ['left','right']);
  utils.createLayoutProperty(Control.prototype, 'middle', 'middle', utils.identity, 'middle', utils.identity, null);
  utils.createLayoutProperty(Control.prototype, 'center', 'center', utils.identity, 'center', utils.identity, null);

  return Control;
})();
