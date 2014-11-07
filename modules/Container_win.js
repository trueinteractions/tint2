module.exports = (function() {
  var Control = require('Control');
  var utilities = require('Utilities');
  var $ = process.bridge.dotnet;
  var parseValue = utilities.parseUnits;

  function Container(NativeObjectClass, NativeViewClass, options) {
    options = options || {};

    if(NativeObjectClass)
      Control.call(this, NativeObjectClass, NativeViewClass, options);
    else {
      options.initViewOnly = true;
      Control.call(this, $.AutoLayout.AutoLayoutPanel, $.AutoLayout.AutoLayoutPanel, options);
    }
    this.private.children = [];
  }

  Container.prototype = Object.create(Control.prototype);
  Container.prototype.constructor = Container;

  Object.defineProperty(Container.prototype, 'children', { get:function() { return this.private.children; } });

  Container.prototype.appendChild = function(control) {
    if(Array.isArray(control))
      for(var i=0; i < control.length; i++) this.appendChild(control[i]);
    else {
      this.private.children.push(control);
      this.nativeView.InternalChildren.Add(control.native);
      control.fireEvent('parent-attached', [this]);
      this.fireEvent('child-attached', [control]);
    }
  }

  Container.prototype.removeChild = function(control) {
    this.fireEvent('remove', element);
    if(this.private.children.indexOf(control) != -1) 
      this.private.children.splice(children.indexOf(control),1);
    this.nativeView.InternalChildren.Remove(control.native);
    control.fireEvent('parent-dettached', [this]);
    this.fireEvent('child-dettached', [control]);
  }

  Container.prototype.scrollTo = function(x, y) {
    if(this.native.ScrollToVerticalOffset) {
      this.native.ScrollToVerticalOffset(y);
      this.native.ScrollToHorizontalOffset(x);
    } else if (this.private.parent && this.private.parent.native.ScrollToVerticalOffset) {
      this.private.parent.native.ScrollToVerticalOffset(y);
      this.private.parent.native.ScrollToHorizontalOffset(x);
    }
  }

  return Container;
})();