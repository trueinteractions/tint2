module.exports = (function() {
  console.assert(typeof application !== "undefined", 'You must use require(\'Application\') prior to using any GUI components.');
  console.assert(process.bridge.dotnet, 'Failure to establish dotnet bridge, use require(\'Application\') prior to using window components.');
  
  var $ = process.bridge.dotnet;
  var utilities = require('Utilities');

  function wpfDeviceToLogicalPx(w,p) {
    var t = $.System.Windows.PresentationSource.FromVisual(w).CompositionTarget.TransformFromDevice;
    return t.Transform(p);
  }

  function capitalize(s) {
    s = s.toLowerCase();
    return s[0].toUpperCase() + s.substr(1);
  }

  function createLayoutProperty(name, percentName, percentFunc, scalarName, scalarFunc, na) {
    Object.defineProperty(Control.prototype, name, {
      get: function() { return this.private.user[name]; },
      set: function(value) {
        var propertyName = name;
        var p = this.private;

        if(na && na[0] && p.user[na[0]] !== null && na[1] && p.user[na[1]] !== null)
          throw new Error('A '+propertyName+' cannot be set when the '+na[0]+' and '+na[1]+' have been set already.');

        p.user[propertyName] = value;

        if(p.constraints[propertyName] !== null && p.constraints[propertyName])
          p.parent.removeLayoutConstraint(p.constraints[propertyName]);

        if(value == null)
          return;

        this.addEventListener('parent-attached', function() {
          this[propertyName] = p.user[propertyName];
        }.bind(this));


        this.addEventListener('parent-dettached', function() {
          p.parent.removeLayoutConstraint(p.constraints[propertyName]);
        }.bind(this));

        if(!p.parent) return;

        var layoutObject = {priority:'required', firstItem:this, firstAttribute:propertyName, relationship:'=', secondItem:p.parent};

        if (value instanceof Control) {
          layoutObject.secondItem = value;
          layoutObject.multiplier = 1.0;
          layoutObject.constant = 0.0;
          if((p.parent == value || this == value.parent) 
                || propertyName == "middle" || propertyName == "center") 
          {
            layoutObject.firstAttribute = layoutObject.secondAttribute = propertyName;
          }
          else if (propertyName == "left") {
            layoutObject.firstAttribute = "left";
            layoutObject.secondAttribute = "right";
          } else if (propertyName == "right") {
            layoutObject.firstAttribute = "right";
            layoutObject.secondAttribute = "left";
          } else if (propertyName == "top") {
            layoutObject.firstAttribute = "top";
            layoutObject.secondAttribute = "bottom";
          } else if (propertyName == "bottom") {
            layoutObject.firstAttribute = "bottom";
            layoutObject.secondAttribute = "top";
          }
        } else if(value && value.indexOf && value.indexOf('%') > -1) {
          var parsedValue = utilities.parseUnits(value);
          layoutObject.multiplier = percentFunc(parsedValue);
          layoutObject.constant = 0.0;
          layoutObject.secondAttribute = percentName;
        } else {
          var parsedValue = utilities.parseUnits(value);
          layoutObject.multiplier = 1.0;
          layoutObject.constant = scalarFunc(parsedValue);
          layoutObject.secondAttribute = scalarName;
        }

        if(!layoutObject.secondAttribute) layoutObject.secondItem = null;
        p.constraints[propertyName] = p.parent.addLayoutConstraint(layoutObject);
      }
    });
  }

  function identity(v) { return v; }
  function inverse(v) { return (1-v); }
  function negate(v) { return -1*v; }

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


    if(!options.nonStandardEvents) {
      this.native.addEventListener('MouseRightButtonUp', function() { this.fireEvent('rightmouseup'); }.bind(this));
      this.native.addEventListener('MouseRightButtonDown', function() { this.fireEvent('rightmousedown'); }.bind(this));
      this.native.addEventListener('MouseLeftButtonDown', function() { this.fireEvent('mousedown'); }.bind(this));
      this.native.addEventListener('MouseLeftButtonUp', function() { this.fireEvent('mouseup'); }.bind(this));
      this.native.addEventListener('MouseMove', function() { this.fireEvent('mousemove'); }.bind(this));
      this.native.addEventListener('MouseEnter', function() { this.fireEvent('mouseenter'); }.bind(this));
      this.native.addEventListener('MouseLeave', function() { this.fireEvent('mouseexit'); }.bind(this));
      this.native.addEventListener('KeyDown', function() { this.fireEvent('keydown'); }.bind(this));
      this.native.addEventListener('KeyUp', function() { this.fireEvent('keyup'); }.bind(this));
    }

    this.private = {
      events:{}, layoutConstraints:[], parent:null, trackingArea:null, needsMouseTracking:0,
      user:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
      constraints:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null }
    };

    this.addEventListener('parent-attached', function(p) { this.private.parent = p; }.bind(this));
    this.addEventListener('parent-dettached', function(p) { this.private.parent = null; }.bind(this));
  }

  Object.defineProperty(Control.prototype, 'alpha', {
    configurable:true,
    get:function() { return this.nativeView.Opacity; },
    set:function(e) { return this.nativeView.Opacity = e; }
  });

   Object.defineProperty(Control.prototype, 'visible', {
      get:function() { return this.native.Visibility == $.System.Windows.Visibility.Visible; },
      set:function(e) {
        if(e) this.native.Visibility = $.System.Windows.Visibility.Visible;
        else this.native.Visibility = $.System.Windows.Visibility.Hidden;
      }
    });

  Object.defineProperty(Control.prototype,'boundsOnScreen', {
    get:function() {
      if(!this.private.parent) return null;
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
      if(!this.private.parent) return null;
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
      if(!this.private.parent) return null;
      var target = this.nativeView.Parent;
      var bounds = this.nativeView.TransformToVisual(target)
                    .TransformBounds($.System.Windows.Controls.Primitives.LayoutInformation.GetLayoutSlot(this.nativeView));
      var winpnt = this.nativeView.PointFromScreen(this.nativeView.PointToScreen(new $.System.Windows.Point(0,0)));
      return {x:Math.round(winpnt.X), y:Math.round(winpnt.Y), width:Math.round(bounds.Width), height:Math.round(bounds.Height)};
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
    var constraint = this.nativeView.AddLayoutConstraint(
        (layoutObject.firstItem ? layoutObject.firstItem.nativeView : layoutObject.item.nativeView),
        capitalize(layoutObject.firstAttribute),
        layoutObject.relationship,
        (layoutObject.secondItem ? layoutObject.secondItem.nativeView : null),
        (layoutObject.secondAttribute ? capitalize(layoutObject.secondAttribute) : null),
        (layoutObject.multiplier ? layoutObject.multiplier : 0), 
        (layoutObject.constant ? layoutObject.constant : 0) );
    
    return this.private.layoutConstraints.push({js:layoutObject, native:constraint}) - 1;
  }

  Control.prototype.removeLayoutConstraint = function(index) {
    if(typeof(index) == 'undefined' || index == null || !this.private.layoutConstraints[index]) return;
    var n = this.private.layoutObjcConstraints[index].native;
    this.private.layoutConstraints.splice(index, 1);
    this.private.parent.RemoveLayoutConstraint(n);
  }

  createLayoutProperty('top', 'bottom', identity, 'top', identity, ['bottom','height']);
  createLayoutProperty('bottom', 'bottom', inverse, 'bottom', negate, ['top','height']);
  createLayoutProperty('left', 'width', identity, 'left', identity, ['right','width']);
  createLayoutProperty('right', 'width', inverse, 'right', negate, ['left','width']);
  createLayoutProperty('height', 'height', identity, null, identity, ['top','bottom']);
  createLayoutProperty('width', 'width', identity, null, identity, ['left','right']);
  createLayoutProperty('middle', 'middle', identity, 'middle', identity, null);
  createLayoutProperty('center', 'center', identity, 'center', identity, null);

  return Control;
})();
